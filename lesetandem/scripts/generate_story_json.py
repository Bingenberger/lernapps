#!/usr/bin/env python3
"""Generate story JSON with Whisper/OpenAI word timestamps."""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import unicodedata

HYPHENATION_PATHS = [
    pathlib.Path("/usr/share/hyphen/hyph_de_DE.dic"),
    pathlib.Path("/usr/share/hyphen/hyph_de.dic")
]

HYPHEN_TREE: dict | None = None
LEFT_HYPHEN_MIN = 2
RIGHT_HYPHEN_MIN = 2


def read_story_text(text_path: pathlib.Path) -> tuple[str, list[dict]]:
    raw_lines = text_path.read_text(encoding="utf-8").splitlines()
    stripped_lines = [line.strip() for line in raw_lines]
    non_empty = [line for line in stripped_lines if line]
    if not non_empty:
        return text_path.stem, []

    title = non_empty[0]
    entries: list[dict] = []
    content_lines = []
    line_index = 0

    while line_index < len(raw_lines):
        line = raw_lines[line_index].strip()
        if not line:
            line_index += 1
            continue

        breaks_after = 0
        next_index = line_index + 1
        while next_index < len(raw_lines) and not raw_lines[next_index].strip():
            breaks_after += 1
            next_index += 1

        if next_index < len(raw_lines):
            breaks_after += 1

        content_lines.append({
            "text": line,
            "breaksAfter": breaks_after,
            "isTitle": len(content_lines) == 0,
            "sourceLine": line_index + 1
        })
        line_index = next_index

    for content_line in content_lines:
        tokens = re.findall(r"\S+", content_line["text"])
        for token_index, token in enumerate(tokens):
            entries.append({
                "w": token,
                "lineBreaksAfter": 0,
                "isTitle": content_line["isTitle"],
                "sourceLine": content_line["sourceLine"],
                "lineText": content_line["text"],
                "wordIndexInLine": token_index + 1
            })

            if token_index == len(tokens) - 1:
                entries[-1]["lineBreaksAfter"] = content_line["breaksAfter"]

    return title, entries


def normalize_token(token: str) -> str:
    normalized = unicodedata.normalize("NFKD", token.casefold())
    normalized = "".join(char for char in normalized if not unicodedata.combining(char))
    return re.sub(r"[^\w]+", "", normalized)


def parse_hyphen_pattern(pattern: str) -> tuple[str, list[int]]:
    letters: list[str] = []
    values = [0]

    for char in pattern:
        if char.isdigit():
            values[-1] = int(char)
        else:
            letters.append(char)
            values.append(0)

    return "".join(letters), values


def insert_pattern(tree: dict, pattern: str, values: list[int]) -> None:
    node = tree
    for char in pattern:
        node = node.setdefault(char, {})
    node["_values"] = values


def load_hyphenation_tree() -> dict:
    global HYPHEN_TREE, LEFT_HYPHEN_MIN, RIGHT_HYPHEN_MIN

    if HYPHEN_TREE is not None:
        return HYPHEN_TREE

    dictionary_path = next((path for path in HYPHENATION_PATHS if path.is_file()), None)
    if dictionary_path is None:
        raise RuntimeError("Kein deutsches Trennwoerterbuch gefunden.")

    raw_lines = dictionary_path.read_text(encoding="latin-1").splitlines()
    tree: dict = {}

    for line in raw_lines:
        entry = line.strip()
        if not entry or entry.startswith("#"):
            continue
        if entry.upper() == "ISO8859-1":
            continue
        if entry.startswith("LEFTHYPHENMIN"):
            LEFT_HYPHEN_MIN = int(entry.split()[-1])
            continue
        if entry.startswith("RIGHTHYPHENMIN"):
            RIGHT_HYPHEN_MIN = int(entry.split()[-1])
            continue
        if entry.startswith("COMPOUNDLEFTHYPHENMIN") or entry.startswith("COMPOUNDRIGHTHYPHENMIN"):
            continue

        pattern, values = parse_hyphen_pattern(entry)
        if pattern:
            insert_pattern(tree, pattern.casefold(), values)

    HYPHEN_TREE = tree
    return HYPHEN_TREE


def split_word_parts(word: str) -> tuple[str, str, str]:
    match = re.match(r"^([^A-Za-zÄÖÜäöüß]*)([A-Za-zÄÖÜäöüß]+(?:-[A-Za-zÄÖÜäöüß]+)*)([^A-Za-zÄÖÜäöüß]*)$", word)
    if not match:
        return "", word, ""
    return match.group(1), match.group(2), match.group(3)


def hyphenate_core_word(word: str) -> list[str]:
    if len(word) <= 3:
        return [word]

    tree = load_hyphenation_tree()
    prepared = f".{word.casefold()}."
    points = [0] * (len(prepared) + 1)

    for start_index in range(len(prepared)):
        node = tree
        cursor = start_index

        while cursor < len(prepared) and prepared[cursor] in node:
            node = node[prepared[cursor]]
            cursor += 1
            values = node.get("_values")
            if not values:
                continue

            for offset, value in enumerate(values):
                point_index = start_index + offset
                if point_index < len(points):
                    points[point_index] = max(points[point_index], value)

    breakpoints = [
        index
        for index in range(1, len(word))
        if points[index + 1] % 2 == 1
        and index >= LEFT_HYPHEN_MIN
        and len(word) - index >= RIGHT_HYPHEN_MIN
    ]

    if not breakpoints:
        return [word]

    parts = []
    start = 0
    for breakpoint in breakpoints:
        parts.append(word[start:breakpoint])
        start = breakpoint
    parts.append(word[start:])
    return parts


def german_syllables(word: str) -> list[str]:
    prefix, core, suffix = split_word_parts(word.strip())
    if not core:
        return [word.strip()]

    pieces: list[str] = []
    for segment in core.split("-"):
        pieces.extend(hyphenate_core_word(segment))

    if prefix:
        pieces[0] = prefix + pieces[0]
    if suffix:
        pieces[-1] = pieces[-1] + suffix

    return pieces if pieces else [word.strip()]


def load_api_key(explicit_key_file: pathlib.Path | None = None) -> str:
    env_key = os.getenv("OPENAI_API_KEY")
    if env_key:
        return env_key

    candidate_paths = []
    if explicit_key_file is not None:
        candidate_paths.append(explicit_key_file)

    script_dir = pathlib.Path(__file__).resolve().parent
    project_root = script_dir.parent
    candidate_paths.extend([
        project_root / "key.json",
        script_dir / "key.json"
    ])

    for path in candidate_paths:
        if not path.is_file():
            continue

        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            api_key = data.get("openai_api_key") or data.get("OPENAI_API_KEY")
            if isinstance(api_key, str) and api_key.strip():
                return api_key.strip()

    raise RuntimeError(
        "Kein OpenAI API-Key gefunden. Nutze OPENAI_API_KEY oder eine key.json mit 'openai_api_key'."
    )


def create_padded_mp3(audio_path: pathlib.Path, padding_seconds: float = 2.0) -> tempfile.NamedTemporaryFile:
    temp_file = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
    temp_file.close()

    command = [
        "ffmpeg",
        "-y",
        "-i",
        audio_path.as_posix(),
        "-f",
        "lavfi",
        "-t",
        str(padding_seconds),
        "-i",
        "anullsrc=r=44100:cl=mono",
        "-filter_complex",
        "[0:a][1:a]concat=n=2:v=0:a=1[a]",
        "-map",
        "[a]",
        "-codec:a",
        "libmp3lame",
        "-q:a",
        "2",
        temp_file.name
    ]

    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
    except FileNotFoundError as exc:
        raise RuntimeError("ffmpeg wurde nicht gefunden. Bitte ffmpeg installieren.") from exc
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(
            "Die MP3 konnte nicht mit Stille gepolstert werden.\n"
            f"ffmpeg-Ausgabe:\n{exc.stderr.strip()}"
        ) from exc

    return temp_file


def get_audio_duration(audio_path: pathlib.Path) -> float:
    command = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        audio_path.as_posix()
    ]

    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
    except FileNotFoundError as exc:
        raise RuntimeError("ffprobe wurde nicht gefunden. Bitte ffmpeg installieren.") from exc
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(
            "Die Dauer der MP3 konnte nicht gelesen werden.\n"
            f"ffprobe-Ausgabe:\n{exc.stderr.strip()}"
        ) from exc

    try:
        return round(float(result.stdout.strip()), 2)
    except ValueError as exc:
        raise RuntimeError("ffprobe hat keine gueltige Audiodauer geliefert.") from exc


def transcribe_audio(
    audio_path: pathlib.Path,
    model: str,
    language: str | None,
    prompt: str | None,
    key_file: pathlib.Path | None
    ) -> list[dict]:
    if audio_path.suffix.casefold() != ".mp3":
        raise RuntimeError("Das Whisper-Skript verarbeitet nur MP3-Dateien.")

    if model != "whisper-1":
        raise RuntimeError(
            "Fuer Wort-Timestamps muss das Modell 'whisper-1' verwendet werden."
        )

    api_key = load_api_key(key_file)

    try:
        from openai import OpenAI
    except ImportError as exc:
        raise RuntimeError(
            "Das Python-Paket 'openai' fehlt. Installiere es mit 'pip install openai'."
        ) from exc

    client = OpenAI(api_key=api_key)
    padded_file = create_padded_mp3(audio_path)

    try:
        with pathlib.Path(padded_file.name).open("rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model=model,
                file=audio_file,
                language=language,
                prompt=prompt,
                response_format="verbose_json",
                timestamp_granularities=["word"]
            )
    finally:
        pathlib.Path(padded_file.name).unlink(missing_ok=True)

    raw_words = getattr(transcription, "words", None) or []
    words = []

    for item in raw_words:
        word_text = getattr(item, "word", None)
        start = getattr(item, "start", None)
        end = getattr(item, "end", None)
        if word_text is None or start is None or end is None:
            continue

        words.append({
            "word": word_text.strip(),
            "start": round(float(start), 2),
            "end": round(float(end), 2)
        })

    if not words:
        raise RuntimeError("Whisper hat keine Wort-Timestamps geliefert.")

    return words


def find_best_transcript_start(
    target_tokens: list[dict],
    transcript_words: list[dict],
    probe_count: int = 8
) -> int:
    if not target_tokens or not transcript_words:
        return 0

    normalized_target = [normalize_token(token["w"]) for token in target_tokens]
    normalized_transcript = [normalize_token(item["word"]) for item in transcript_words]
    first_word = normalized_target[0]
    prefix = normalized_target[:min(probe_count, len(normalized_target))]
    best_score: tuple[int, int, int] | None = None
    best_start = 0

    for start_index, transcript_token in enumerate(normalized_transcript):
        if transcript_token != first_word:
            continue

        cursor = start_index
        matched = 0
        skipped = 0
        last_match = start_index

        for prefix_token in prefix:
            while cursor < len(normalized_transcript) and normalized_transcript[cursor] != prefix_token:
                cursor += 1
                skipped += 1

            if cursor >= len(normalized_transcript):
                break

            matched += 1
            last_match = cursor
            cursor += 1

        span = last_match - start_index
        score = (matched, -skipped, -span)
        if best_score is None or score > best_score:
            best_score = score
            best_start = start_index

    return best_start


def build_aligned_entry(target_token: dict, start: float, end: float) -> dict:
    return {
        "w": target_token["w"],
        "s": round(float(start), 2),
        "e": round(float(end), 2),
        "syllables": german_syllables(target_token["w"]),
        "lineBreaksAfter": target_token["lineBreaksAfter"],
        "isTitle": target_token["isTitle"]
    }


def can_apply_last_word_fallback(aligned: list[dict], target_tokens: list[dict]) -> bool:
    if len(aligned) != len(target_tokens) - 1 or not aligned:
        return False

    for index, aligned_entry in enumerate(aligned):
        if normalize_token(aligned_entry["w"]) != normalize_token(target_tokens[index]["w"]):
            return False

    return True


def find_single_missing_target_index(aligned: list[dict], target_tokens: list[dict]) -> int | None:
    if len(aligned) != len(target_tokens) - 1:
        return None

    aligned_index = 0
    missing_index: int | None = None

    for target_index, target_token in enumerate(target_tokens):
        if aligned_index >= len(aligned):
            if missing_index is not None:
                return None
            missing_index = target_index
            continue

        if normalize_token(aligned[aligned_index]["w"]) == normalize_token(target_token["w"]):
            aligned_index += 1
            continue

        if missing_index is not None:
            return None
        missing_index = target_index

    return missing_index


def apply_single_missing_word_fallback(
    aligned: list[dict],
    target_tokens: list[dict],
    audio_duration: float
) -> list[dict] | None:
    missing_index = find_single_missing_target_index(aligned, target_tokens)
    if missing_index is None:
        return None

    recovered = list(aligned)
    previous_entry = recovered[missing_index - 1] if missing_index > 0 else None
    next_entry = recovered[missing_index] if missing_index < len(recovered) else None

    if previous_entry and next_entry:
        fallback_start = previous_entry["e"]
        fallback_end = max(fallback_start + 0.01, next_entry["s"])
    elif previous_entry:
        fallback_start = previous_entry["e"]
        fallback_end = max(fallback_start + 0.01, audio_duration)
    elif next_entry:
        fallback_end = next_entry["s"]
        fallback_start = max(0.0, fallback_end - 0.35)
    else:
        fallback_start = 0.0
        fallback_end = max(0.35, audio_duration)

    recovered.insert(
        missing_index,
        build_aligned_entry(target_tokens[missing_index], fallback_start, fallback_end)
    )
    return recovered


def align_words(target_tokens: list[dict], transcript_words: list[dict], audio_duration: float | None = None) -> list[dict]:
    if not target_tokens:
        return []

    start_index = find_best_transcript_start(target_tokens, transcript_words)
    transcript_words = transcript_words[start_index:]

    normalized_target = [normalize_token(token["w"]) for token in target_tokens]
    normalized_transcript = [normalize_token(item["word"]) for item in transcript_words]

    target_len = len(target_tokens)
    transcript_len = len(transcript_words)
    best = [[0] * (transcript_len + 1) for _ in range(target_len + 1)]

    for target_index in range(target_len - 1, -1, -1):
        for transcript_index in range(transcript_len - 1, -1, -1):
            same_word = (
                normalized_target[target_index]
                and normalized_target[target_index] == normalized_transcript[transcript_index]
            )
            if same_word:
                best[target_index][transcript_index] = 1 + best[target_index + 1][transcript_index + 1]
            else:
                best[target_index][transcript_index] = max(
                    best[target_index + 1][transcript_index],
                    best[target_index][transcript_index + 1]
                )

    aligned = []
    target_index = 0
    transcript_index = 0

    while target_index < target_len and transcript_index < transcript_len:
        if (
            normalized_target[target_index]
            and normalized_target[target_index] == normalized_transcript[transcript_index]
        ):
            aligned.append(
                build_aligned_entry(
                    target_tokens[target_index],
                    transcript_words[transcript_index]["start"],
                    transcript_words[transcript_index]["end"]
                )
            )
            target_index += 1
            transcript_index += 1
            continue

        # Prefer skipping transcript noise over dropping a target word when both
        # paths are equally good. This helps preserve trailing text words.
        if best[target_index + 1][transcript_index] > best[target_index][transcript_index + 1]:
            target_index += 1
        else:
            transcript_index += 1

    if audio_duration is not None and can_apply_last_word_fallback(aligned, target_tokens):
        previous_end = aligned[-1]["e"]
        fallback_start = round(previous_end, 2)
        fallback_end = round(max(previous_end + 0.01, audio_duration), 2)
        aligned.append(build_aligned_entry(target_tokens[-1], fallback_start, fallback_end))
        return aligned

    if audio_duration is not None and len(aligned) == target_len - 1:
        recovered = apply_single_missing_word_fallback(aligned, target_tokens, audio_duration)
        if recovered is not None:
            return recovered

    if len(aligned) != target_len:
        missing = target_len - len(aligned)
        missing_tokens = target_tokens[len(aligned):]
        first_missing = missing_tokens[0] if missing_tokens else None
        if first_missing is not None:
            context_words = re.findall(r"\S+", first_missing["lineText"])
            context = " ".join(context_words)
            raise RuntimeError(
                "Nicht alle Textwoerter konnten zugeordnet werden. "
                f"Es fehlen {missing} Woerter. "
                f"Erstes fehlendes Wort: '{first_missing['w']}' "
                f"(Zeile {first_missing['sourceLine']}, "
                f"Wort {first_missing['wordIndexInLine']}). "
                f"Zeileninhalt: \"{context}\""
            )
        raise RuntimeError(
            f"Nicht alle Textwoerter konnten zugeordnet werden. Es fehlen {missing} Woerter."
        )

    return aligned


def build_story(
    text_path: pathlib.Path,
    audio_path: pathlib.Path,
    model: str,
    language: str | None,
    key_file: pathlib.Path | None
) -> dict:
    if audio_path.suffix.casefold() != ".mp3":
        raise RuntimeError("Bitte eine MP3-Datei uebergeben.")

    title, target_tokens = read_story_text(text_path)
    transcript_words = transcribe_audio(
        audio_path,
        model=model,
        language=language,
        prompt=None,
        key_file=key_file
    )
    audio_duration = get_audio_duration(audio_path)
    aligned_words = align_words(target_tokens, transcript_words, audio_duration=audio_duration)

    return {
        "title": title,
        "audioSrc": audio_path.as_posix(),
        "words": aligned_words
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate story JSON using OpenAI Whisper word timestamps."
    )
    parser.add_argument("text", type=pathlib.Path, help="Pfad zur Textdatei")
    parser.add_argument("audio", type=pathlib.Path, help="Pfad zur Audio-Datei")
    parser.add_argument(
        "-o",
        "--output",
        type=pathlib.Path,
        default=pathlib.Path("story.json"),
        help="Zielpfad fuer die JSON-Datei"
    )
    parser.add_argument(
        "--model",
        default="whisper-1",
        help="OpenAI Transkriptionsmodell, zum Beispiel whisper-1"
    )
    parser.add_argument(
        "--language",
        default="de",
        help="Sprachcode fuer die Transkription, z. B. de"
    )
    parser.add_argument(
        "--key-file",
        type=pathlib.Path,
        default=None,
        help="Optionaler Pfad zu einer JSON-Datei mit 'openai_api_key'"
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        story = build_story(
            text_path=args.text,
            audio_path=args.audio,
            model=args.model,
            language=args.language,
            key_file=args.key_file
        )
    except Exception as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        return 1

    args.output.write_text(
        json.dumps(story, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )
    print(f"JSON geschrieben: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
