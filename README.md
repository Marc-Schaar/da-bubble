# DA Bubble

DA Bubble ist ein Slack-inspirierter Team-Chat auf Basis von **Angular 19** und **Firebase** (Auth + Cloud Firestore).

## Features

- E-Mail/Passwort-, Google- und Gast-Login; Registrierung mit Avatar-Auswahl
- Channels: erstellen, bearbeiten, Mitglieder verwalten, verlassen
- Nachrichten in Echtzeit: senden, bearbeiten, Emoji-Reaktionen mit Hover-Details
- Threads (Antworten auf Nachrichten) im seitlichen Drawer
- Direktnachrichten zwischen Nutzern
- `@user`- und `#channel`-Mentions mit Navigation
- Globale Suche über Nutzer und Channels
- Responsives Layout (Desktop und Mobile < 1024px)

## Tech-Stack

| Bereich   | Technologie                                     |
| --------- | ----------------------------------------------- |
| Frontend  | Angular 19 (Standalone Components, Signals)     |
| UI        | Angular Material, SCSS                          |
| Backend   | Firebase Authentication, Cloud Firestore        |
| Hosting   | Firebase Hosting                                |

## Setup

1. Abhängigkeiten installieren:

   ```bash
   npm install
   ```

2. Firebase konfigurieren: Die Firebase-Konfiguration liegt in `src/core/app.config.ts` (`initializeApp({ ... })`). Für ein eigenes Projekt die Werte aus der Firebase-Konsole (Projekteinstellungen → Web-App) eintragen.

3. Dev-Server starten:

   ```bash
   npm start
   ```

   Die App läuft anschließend unter `http://localhost:4200/`.

## Build

```bash
npm run build
```

Das Ergebnis liegt in `dist/da-bubble`.

## Projektstruktur

```
src/
├── core/            # Bootstrap, Routen, Guards
└── app/
    ├── features/    # Feature-Bereiche (Auth, Chat, Channel, Legal)
    └── shared/      # Gemeinsame Komponenten, Services, Konstanten
```

Die Refactoring-Roadmap des Projekts ist in [REFACTORING.md](REFACTORING.md) dokumentiert, inklusive manueller Smoke-Test-Checkliste (es gibt aktuell kein automatisiertes Test-Sicherheitsnetz).
