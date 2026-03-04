# Kaufladen: Geld lernen

Client-side Webapp fuer den Einstieg in das Thema Geld in der Grundschule. Die App erzeugt Einkaufsaufgaben mit Differenzierung ueber Zahlenraum (bis 10/20/100), Preisformat (nur Euro oder Euro+Cent) und Rueckgeldlogik.

## Start

1. Ordner lokal oeffnen.
2. `index.html` im Browser starten (Doppelklick reicht).
   - `index.html` nutzt den modularen Einstieg `src/app.js` (empfohlen fuer die gemeinsame Basis).
   - `index-legacy.html` startet die bisherige Root-Datei `app.js` (Bestandsstand / Vergleich).
3. Optional mit lokalem Server (falls gewuenscht):
   - `python3 -m http.server`
   - dann `http://localhost:8000` aufrufen.

Optionaler Logiktest:

```bash
node tests/basic.test.mjs
```

## Bedienung

1. Im Setup auswaehlen:
   - Zahlenraum: bis 10 / bis 20 / bis 100
   - Preisformat: nur Euro / Euro+Cent
   - Cent-Schwierigkeit: sehr leicht / leicht / frei
   - Modus: Passend zahlen oder Rueckgeld
2. `Los geht's` startet 10 Aufgaben.
3. In der Aufgabe Geld per Tap/Klick (oder Drag&Drop) in die Zone legen.
4. `Pruefen` gibt direktes Feedback.
5. Bei korrekter Loesung erscheint `Naechste Aufgabe`.
6. Nach 10 Aufgaben erscheint die Ergebnisansicht.

## Didaktik

- **Zahlenraum-gesteuert**: Zahlenraum steuert Preisbereiche, Geldtablett und Rueckgeldfaelle.
- **Cent-Staffelung**:
  - sehr leicht: 00/50
  - leicht: 00/10/20/.../90
  - frei: 00-99
- **Rückgeldmodus**:
  - Zahlung ist vorgegeben (z. B. 10 EUR / 20 EUR / 50 EUR).
  - Kinder legen danach das korrekte Rueckgeld.
- **Sicheres Rechnen in Cent**: intern immer Integer-Cent, keine Float-Fehler.

## Architektur

- `index.html`: Einstieg
- `styles.css`: responsives UI
- `app.js`: standalone Laufzeitdatei (ohne Build-Schritt, direkt im Browser)
- `src/config.js`: Enums, Defaults, Katalog
- `src/money.js`: Geldlogik, Formatierung, Summen, Loesbarkeit
- `src/generator.js`: TaskFactory
- `src/state.js`: Zustandsautomat + Persistenz
- `src/ui.js`: Rendering + DOM-Events
- `tests/basic.test.mjs`: einfache Unit-Tests

## Anpassung

- Produkte anpassen: `src/config.js` -> `PRODUCT_CATALOG`
- Anzahl Aufgaben: `src/config.js` -> `TASKS_PER_SESSION`
- Geldsorten je Zahlenraum: `src/money.js` -> `getAvailableDenominations`
- Preisregeln/Cent-Endungen: `src/money.js` -> `makePriceCents` und `CENT_ENDINGS` in `src/config.js`
- Rueckgeld-Zahlungsvorgaben: `src/generator.js` -> `makeSuggestedPayment`

## Persistenz

- Einstellungen werden in `localStorage` gespeichert.
- Session-Stats (richtig/falsch/Versuche) werden ebenfalls lokal gespeichert.
- Keine personenbezogenen Daten.
