<p align="center">
  <img src="public/img/Logo.png" alt="DA Bubble Logo" width="120" />
</p>

<h1 align="center">DA Bubble</h1>

<p align="center">
  Ein Slack-inspirierter Team-Chat, gebaut mit <strong>Angular 19</strong> und <strong>Firebase</strong>.
</p>

<p align="center">
  <img alt="Angular" src="https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white" />
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Standalone%20Components-3178C6?logo=typescript&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-informational" />
</p>

---

## Über das Projekt

DA Bubble ist eine Full-Stack-Chat-Anwendung im Stil von Slack, die im Rahmen eines Weiterbildungsprojekts von Grund auf entwickelt wurde. Der Fokus liegt auf modernem Angular (Standalone Components, Signals), einer sauberen Feature-basierten Architektur und Echtzeit-Kommunikation über Firebase.

## Features

- 🔐 E-Mail/Passwort-, Google- und Gast-Login; Registrierung mit Avatar-Auswahl
- 💬 Channels: erstellen, bearbeiten, Mitglieder verwalten, verlassen
- ⚡ Nachrichten in Echtzeit: senden, bearbeiten, Emoji-Reaktionen mit Hover-Details
- 🧵 Threads (Antworten auf Nachrichten) im seitlichen Drawer
- ✉️ Direktnachrichten zwischen Nutzern
- 🔎 `@user`- und `#channel`-Mentions mit Navigation
- 🔍 Globale Suche über Nutzer und Channels
- 📱 Responsives Layout (Desktop und Mobile < 1024px)

## Tech-Stack

| Bereich  | Technologie                                 |
| -------- | -------------------------------------------- |
| Frontend | Angular 19 (Standalone Components, Signals)  |
| UI       | Angular Material, SCSS                       |
| Backend  | Firebase Authentication, Cloud Firestore     |
| Hosting  | Firebase Hosting                             |

## Projektstruktur

```
src/
├── core/            # Bootstrap, Routen, Guards
└── app/
    ├── features/    # Feature-Bereiche (Auth, Chat, Channel, Legal)
    └── shared/      # Gemeinsame Komponenten, Services, Konstanten
```

## Getting Started

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

### Build

```bash
npm run build
```

Das Ergebnis liegt in `dist/da-bubble`.

## Roadmap & Testing

Die Refactoring-Roadmap des Projekts ist in [REFACTORING.md](REFACTORING.md) dokumentiert, inklusive manueller Smoke-Test-Checkliste (es gibt aktuell kein automatisiertes Test-Sicherheitsnetz).

## Autor

**Marc Schaar** — [GitHub](https://github.com/Marc-Schaar)

Dieses Projekt entstand als Lernprojekt und Portfolio-Showcase im Rahmen einer Weiterbildung zum Frontend-Entwickler.
