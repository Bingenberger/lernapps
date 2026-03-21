#!/usr/bin/env python3
"""Convert txt files to MP3 using Google Cloud Gemini TTS."""

from __future__ import annotations

import argparse
import base64
import json
import pathlib
import time
import urllib.error
import urllib.parse
import urllib.request

import jwt


SCOPE = "https://www.googleapis.com/auth/cloud-platform"
TOKEN_LIFETIME_SECONDS = 3600
DEFAULT_MODEL = "gemini-2.5-pro-tts"
DEFAULT_VOICE = "Achernar"
DEFAULT_LANGUAGE_CODE = "de-DE"
DEFAULT_ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize"
MAX_TEXT_BYTES = 4000
MAX_INPUT_BYTES = 8000


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate MP3 files from txt/ using Google Cloud Gemini TTS."
    )
    parser.add_argument(
        "--input-dir",
        type=pathlib.Path,
        default=pathlib.Path("txt"),
        help="Directory containing .txt files"
    )
    parser.add_argument(
        "--output-dir",
        type=pathlib.Path,
        default=pathlib.Path("audio"),
        help="Directory where .mp3 files should be written"
    )
    parser.add_argument(
        "--key-file",
        type=pathlib.Path,
        default=pathlib.Path("key_gem.json"),
        help="Service account JSON key file"
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help="Gemini TTS model name"
    )
    parser.add_argument(
        "--voice",
        default=DEFAULT_VOICE,
        help="Voice name"
    )
    parser.add_argument(
        "--language-code",
        default=DEFAULT_LANGUAGE_CODE,
        help="BCP-47 language code, for example de-DE"
    )
    parser.add_argument(
        "--prompt",
        default="Lies langsam und deutlich, so dass Kinder gut mitlesen koennen.",
        help="Optional style prompt for Gemini TTS"
    )
    return parser.parse_args()


def load_service_account(path: pathlib.Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    required = ["client_email", "private_key", "token_uri", "project_id"]
    missing = [key for key in required if key not in data]
    if missing:
        raise RuntimeError(f"Schluesseldatei unvollstaendig. Es fehlen: {', '.join(missing)}")
    return data


def fetch_access_token(service_account: dict) -> str:
    now = int(time.time())
    payload = {
        "iss": service_account["client_email"],
        "scope": SCOPE,
        "aud": service_account["token_uri"],
        "iat": now,
        "exp": now + TOKEN_LIFETIME_SECONDS
    }

    assertion = jwt.encode(
        payload,
        service_account["private_key"],
        algorithm="RS256"
    )

    body = urllib.parse.urlencode({
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": assertion
    }).encode("utf-8")

    request = urllib.request.Request(
        service_account["token_uri"],
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(request) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OAuth-Token konnte nicht geholt werden: {detail}") from exc

    access_token = data.get("access_token")
    if not access_token:
        raise RuntimeError("Google OAuth Antwort enthaelt kein access_token.")
    return access_token


def synthesize_mp3(
    *,
    access_token: str,
    project_id: str,
    text: str,
    model: str,
    voice: str,
    language_code: str,
    prompt: str,
    endpoint: str = DEFAULT_ENDPOINT
) -> bytes:
    payload = {
        "input": {
            "text": text
        },
        "voice": {
            "languageCode": language_code,
            "name": voice,
            "modelName": model
        },
        "audioConfig": {
            "audioEncoding": "MP3"
        }
    }

    if prompt.strip():
        payload["input"]["prompt"] = prompt.strip()

    request = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "x-goog-user-project": project_id
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(request) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"TTS-Request fehlgeschlagen: {detail}") from exc

    audio_content = data.get("audioContent")
    if not audio_content:
        raise RuntimeError("TTS-Antwort enthaelt kein audioContent.")

    return base64.b64decode(audio_content)


def validate_input_sizes(text: str, prompt: str) -> None:
    text_bytes = len(text.encode("utf-8"))
    prompt_bytes = len(prompt.encode("utf-8"))
    if text_bytes > MAX_TEXT_BYTES:
        raise RuntimeError(
            f"Text ist zu lang fuer einen einzelnen Gemini-TTS-Request ({text_bytes} Bytes > {MAX_TEXT_BYTES})."
        )
    if text_bytes + prompt_bytes > MAX_INPUT_BYTES:
        raise RuntimeError(
            f"Text plus Prompt sind zu lang ({text_bytes + prompt_bytes} Bytes > {MAX_INPUT_BYTES})."
        )


def iter_text_files(input_dir: pathlib.Path) -> list[pathlib.Path]:
    return sorted(path for path in input_dir.glob("*.txt") if path.is_file())


def main() -> int:
    args = parse_args()
    service_account = load_service_account(args.key_file)
    text_files = iter_text_files(args.input_dir)

    if not text_files:
        raise SystemExit(f"Keine .txt-Dateien in {args.input_dir} gefunden.")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    access_token = fetch_access_token(service_account)

    for text_file in text_files:
        text = text_file.read_text(encoding="utf-8").strip()
        if not text:
            print(f"Uebersprungen (leer): {text_file}")
            continue

        output_path = args.output_dir / f"{text_file.stem}.mp3"
        if output_path.exists():
            print(f"Uebersprungen (existiert bereits): {output_path}")
            continue

        validate_input_sizes(text, args.prompt)
        audio_bytes = synthesize_mp3(
            access_token=access_token,
            project_id=service_account["project_id"],
            text=text,
            model=args.model,
            voice=args.voice,
            language_code=args.language_code,
            prompt=args.prompt
        )
        output_path.write_bytes(audio_bytes)
        print(f"Geschrieben: {output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
