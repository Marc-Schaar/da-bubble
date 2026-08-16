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

## 🏗️ Architektur

- **Feature-basierte Struktur**: `features/auth`, `features/chat`, `features/channel`, `features/legal` — jedes Feature bringt eigene Components, Services und Models mit; `shared/` enthält, was featureübergreifend gebraucht wird (Components, Services, Pipes, Directives, Utils).
- **Firestore-Zugriffsschicht**: Komponenten sprechen nie direkt mit Firestore. `shared/services/firebase/` bündelt den Zugriff in fokussierten API-Services (`UsersApiService`, `ChannelsApiService`, `MessagesApiService`, `UnreadApiService`), die über eine schlanke Fassade (`FireServiceService`) angesprochen werden — Consumer injizieren weiterhin nur einen Service, intern ist die Logik aber nach Domäne getrennt.
- **State via Signals**: Aktiver Channel, User-Session, Suchzustand etc. laufen über Angular Signals in den jeweiligen Feature-Services (z. B. `ChannelService.currentChannel`), nicht über Komponenten-lokalen State — eine Wahrheit pro fachlichem Zustand.
- **Guards**: `authGuard` schützt den `main`-Routenbaum vor nicht eingeloggten Usern, `noAuthGuard` (invers) hält bereits eingeloggte User von den Auth-Seiten fern, `mainDefaultGuard` steuert die Default-Weiterleitung beim Einstieg in `/main`.
- **Lazy Loading**: Alle Feature-Routen laden per `loadComponent`, kein eager-geladenes Feature-Modul.
- **Change Detection**: Alle Feature-Komponenten laufen mit `ChangeDetectionStrategy.OnPush` im Zusammenspiel mit Signals.

## 🚀 Lokal starten

1. Abhängigkeiten installieren:

   ```bash
   npm install
   ```

2. Firebase konfigurieren:

   ```bash
   cp src/environments/environment.example.ts src/environments/environment.ts
   cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts
   ```

   Anschließend in beiden Dateien die `firebase`-Werte aus der Firebase-Konsole eintragen (Projekteinstellungen → Web-App → SDK-Konfiguration): `projectId`, `appId`, `databaseURL`, `storageBucket`, `apiKey`, `authDomain`, `messagingSenderId`. `defaultChannelId` ist die Dokument-ID des Channels, dem neue User automatisch beitreten.

   Die beiden `environment*.ts`-Dateien sind gitignored (siehe `.gitignore`) und werden nicht committet — nur die `.example.ts`-Vorlagen liegen im Repo. Für Produktion generiert die CI (`.github/workflows/deploy.yaml`) `environment.prod.ts` aus GitHub-Secrets und deployt per SSH/SCP auf den Server.

   Firestore-Security-Rules und Hosting-Konfiguration liegen in `firebase.json`.

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

### Hilfsskripte

```bash
npm run seed          # befüllt Firestore mit Dummy-Usern/Channels für die lokale Entwicklung
npm run seed-content  # befüllt Firestore zusätzlich mit Beispielnachrichten
npm run add-me        # fügt einen bestehenden User allen Channels hinzu
```

Alle drei nutzen `scripts/lib/firebase-admin.mjs` (Firebase Admin SDK) und brauchen daher eigene Admin-Credentials, keine `environment.ts`.

## 📁 Projektstruktur

```
src/
├── core/          # Bootstrap, Routen, Guards (authGuard, noAuthGuard, mainDefaultGuard)
├── environments/  # Firebase-Konfiguration (gitignored, aus environment.example.ts kopieren)
└── app/
    ├── features/
    │   ├── auth/     # Login, Registrierung, Avatar-Auswahl, Passwort-Reset
    │   ├── chat/     # Channel-/Direct-/Thread-Chat, Nachrichten, Mentions, Reaktionen
    │   ├── channel/  # Channel erstellen/bearbeiten, Mitgliederverwaltung
    │   └── legal/    # Impressum, Datenschutz
    └── shared/
        ├── components/  # app-button, app-input, Toast-Container, u. a.
        ├── services/
        │   ├── firebase/  # Firestore-API-Layer (Users/Channels/Messages/Unread) + Fassade
        │   └── mention/ notification/ navigation/ search/ unread/ user/ ...
        ├── models/ pipes/ directives/ utils/
        └── constants.ts
```

## Roadmap & Testing

Die Refactoring-Roadmap des Projekts ist in [REFACTORING.md](REFACTORING.md) dokumentiert, inklusive manueller Smoke-Test-Checkliste (es gibt aktuell kein automatisiertes Test-Sicherheitsnetz). Ein Vergleich zwischen dem ursprünglichen Bootcamp-Stand und dem aktuellen Umbau findet sich in [refactoring-verlauf.md](refactoring-verlauf.md).

## 👤 Kontakt

**Marc Schaar**
📧 [kontakt@marc-schaar.com](mailto:kontakt@marc-schaar.com) · 🌐 [marc-schaar.com](https://marc-schaar.com) · 💻 [GitHub](https://github.com/Marc-Schaar)

Dieses Projekt entstand als Lernprojekt und Portfolio-Showcase im Rahmen einer Weiterbildung zum Frontend-Entwickler.
