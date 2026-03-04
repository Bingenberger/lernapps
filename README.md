# Schul-Apps (Vanilla Workspace)

Dieses Verzeichnis ist die gemeinsame Basis fuer die Schul-App-Sammlung.

## Struktur

- `shared/`: gemeinsame Styles und UI-Grundlagen (`school-app-theme.css`)
- `index.html` + `styles.css` + `src/`: Startseite / App-Launcher (im Hauptordner)
- `mathe/`: Schlaufuchs Mathe (Vanilla-Migration)
- `kaufladen/`: Kaufladen (modularer Stand + `index-legacy.html` zum Vergleich)
- `rechenrahmen/`: Rechenrahmen-Modul

## Startpunkte

- Portal: `vanilla/index.html`
- Mathe: `vanilla/mathe/index.html`
- Kaufladen (modular): `vanilla/kaufladen/index.html`
- Kaufladen (legacy): `vanilla/kaufladen/index-legacy.html`
- Rechenrahmen: `vanilla/rechenrahmen/index.html`

## Neue App hinzufuegen

1. Ordner anlegen: `vanilla/<app-id>/`
2. Mindestens erstellen:
   - `index.html`
   - `styles.css`
   - ggf. `app.js`
3. In `styles.css` das Shared Theme einbinden:
   - `@import "../shared/school-app-theme.css";`
4. Optional im App-Header Portal-Link setzen:
   - `href="../index.html"`
5. Portal-Eintrag in `vanilla/src/apps.js` ergaenzen:
   - `id`, `title`, `subtitle`, `description`
   - `subject`, `grades`, `status`
   - `links` (mindestens `App starten`)
   - optional `themeClass`, `tags`, `statusLabel`
6. Optional Kartenstil in `vanilla/styles.css` ergaenzen (z. B. `<app>-card`)

## Portal-Filter

Das Portal filtert nach:

- `subject` (Fach)
- `grades` (Klassenstufe)
- `status` (z. B. `beta`, `modular`, `stable`)

Pflege diese Felder pro App in `vanilla/src/apps.js`.

## Konventionen

- ASCII bevorzugen (keine Sonderzeichen im Dateinamen).
- Relative Links zwischen Modulen beibehalten (kein absoluter Pfad).
- Shared Theme nur fuer gemeinsame UI-Muster verwenden.
- App-spezifische Styles im jeweiligen App-Ordner halten.

## Hinweis zu Kaufladen

- `index.html` nutzt den modularen `src/`-Stand.
- `index-legacy.html` startet die alte Root-`app.js` nur fuer Vergleich/Abgleich.
