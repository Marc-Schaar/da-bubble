<h1 align="left">
  <img src="public/img/Logo.png" width="36" height="36" align="left" style="margin-right: 12px;" alt="DA Bubble Logo" />
  DA Bubble
</h1>

<br clear="left" />

Ein Slack-inspirierter Team-Chat, gebaut mit **Angular 19** und **Firebase**.

![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-Standalone%20Components-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-informational)

🔗 **Live-Demo:** [da-bubble.marc-schaar.com](https://da-bubble.marc-schaar.com) · 📁 **Repository:** [github.com/Marc-Schaar/da-bubble](https://github.com/Marc-Schaar/da-bubble) · 🌐 **Portfolio:** [marc-schaar.com](https://marc-schaar.com)

---

> 🇬🇧 **English:** DA Bubble is a Slack-style team chat built with Angular 19 (standalone components, signals) and Firebase (Authentication, Firestore) for real-time messaging. Channels, threads, direct messages, `@user`/`#channel` mentions, emoji reactions, and a responsive layout for desktop and mobile. [Live demo →](https://da-bubble.marc-schaar.com)

## Über das Projekt

DA Bubble ist eine Full-Stack-Chat-Anwendung im Stil von Slack, die im Rahmen eines Weiterbildungsprojekts von Grund auf entwickelt wurde. Der Fokus liegt auf modernem Angular (Standalone Components, Signals), einer sauberen Feature-basierten Architektur und Echtzeit-Kommunikation über Firebase.

## ✨ Features

- 🔐 E-Mail/Passwort-, Google- und Gast-Login; Registrierung mit Avatar-Auswahl
- 💬 Channels: erstellen, bearbeiten, Mitglieder verwalten, verlassen
- ⚡ Nachrichten in Echtzeit: senden, bearbeiten, Emoji-Reaktionen mit Hover-Details
- 🧵 Threads (Antworten auf Nachrichten) im seitlichen Drawer
- ✉️ Direktnachrichten zwischen Nutzern
- 🔎 `@user`- und `#channel`-Mentions mit Navigation
- 🔍 Globale Suche über Nutzer und Channels
- 📱 Responsives Layout (Desktop und Mobile < 1024px)

## 🛠️ Tech-Stack

| Bereich  | Technologie                                 |
| -------- | -------------------------------------------- |
| Frontend | Angular 19 (Standalone Components, Signals)  |
| UI       | Angular Material, SCSS                       |
| Backend  | Firebase Authentication, Cloud Firestore     |
| Hosting  | Firebase Hosting                             |

## 🚀 Lokal starten

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

## 📁 Projektstruktur

```
src/
├── core/            # Bootstrap, Routen, Guards
└── app/
    ├── features/    # Feature-Bereiche (Auth, Chat, Channel, Legal)
    └── shared/      # Gemeinsame Komponenten, Services, Konstanten
```

## Roadmap & Testing

Die Refactoring-Roadmap des Projekts ist in [REFACTORING.md](REFACTORING.md) dokumentiert, inklusive manueller Smoke-Test-Checkliste (es gibt aktuell kein automatisiertes Test-Sicherheitsnetz). Ein Vergleich zwischen dem ursprünglichen Bootcamp-Stand und dem aktuellen Umbau findet sich in [refactoring-verlauf.md](refactoring-verlauf.md).

## 👤 Kontakt

**Marc Schaar**
📧 [kontakt@marc-schaar.com](mailto:kontakt@marc-schaar.com) · 🌐 [marc-schaar.com](https://marc-schaar.com) · 💻 [GitHub](https://github.com/Marc-Schaar)

Dieses Projekt entstand als Lernprojekt und Portfolio-Showcase im Rahmen einer Weiterbildung zum Frontend-Entwickler.
