# Refactoring-Verlauf DA-Bubble

Vergleich zwischen dem Stand vor dem großen Umbau (Commit [`a7a52ce`](../../commit/a7a52cee9c2e0b2099f3112a8294168df873e524) „baseRef", 2025-05-22) und dem aktuellen Stand auf `main`.

**Zahlen:** 216 Commits · 372 geänderte Dateien · +10.847 / −12.142 Zeilen.

---

## Ausgangslage (Stand `a7a52ce`, Mai 2025)

Das Projekt war zu diesem Zeitpunkt eine funktionierende, aber flach organisierte Angular-App: Alle Komponenten lagen direkt unter `src/app/` (`chat-channel`, `chat-thread`, `contactbar`, `sign-in`, `header`, …), ohne Trennung nach Feature oder Verantwortlichkeit. Services lagen gebündelt unter `src/app/services/`. Es gab keine Roadmap, keine Architekturentscheidung für Standalone-Struktur, State-Ownership oder Wiederverwendung — das Ergebnis von organischem Wachstum während der ursprünglichen Projektphase.

## Zeitleiste

| Zeitraum | Was geschah |
| --- | --- |
| **2025-05** | Letzte Commits am ursprünglichen (Bootcamp-)Projektstand — 13 Commits, dann Pause. |
| **2025-12** | Merge des `portfolio-branch` — Projekt wird als Portfolio-Stück reaktiviert. |
| **2026-03** | **Start des strukturellen Umbaus:** Ordnerstruktur auf `features/` + `shared/` umgestellt (`1a751cc`, `881df4e`), Auth-Routing neu aufgesetzt, Login/Registrierung auf Reactive Forms migriert, Signup-Flow (E-Mail, Google, Gast) neu gebaut. |
| **2026-04** | Chat-Navigation grundlegend neu implementiert: aktiven Channel/Direktnachricht öffnen, Nachrichten laden, Channel bearbeiten, Mitglieder hinzufügen. |
| **2026-07** | **Hauptphase:** `REFACTORING.md` als Arbeitsgrundlage angelegt (Phase 0), danach systematisch Phasen 1–10 abgearbeitet — siehe Detailauflistung unten. Mit 154 Commits der mit Abstand größte Anteil der Arbeit. |
| **2026-08** | Nacharbeiten: Barrierefreiheit (Fokus-Traps, ARIA-Landmarks, Skip-Link), JSDoc-Kommentare, README-Überarbeitung. |

## Von der flachen Struktur zur Feature-Architektur

**Vorher** (`src/app/…`, alles auf einer Ebene):

```
src/app/
├── avatar-selection/
├── chat-channel/
├── chat-direct/
├── chat-thread/
├── contactbar/
├── dialogs/
├── models/
├── services/
│   ├── auth/
│   ├── firebase/
│   ├── messages/
│   ├── navigation/
│   ├── search/
│   └── user/
├── shared/
│   ├── chat-header/
│   ├── divider/
│   └── message/
└── sign-in/, sign-up/, header/, footer/, imprint/ …
```

**Jetzt** (nach Feature und Verantwortlichkeit getrennt):

```
src/app/
├── features/
│   ├── auth/        # Login, Registrierung, Avatar-Wahl, Formulare, AuthService
│   ├── channel/     # Channel erstellen/bearbeiten/Mitglieder, ChannelService
│   ├── chat/         # Chat-Ansicht, Nachrichten, Threads, Reaktionen, Mentions
│   └── legal/        # Impressum, Datenschutz
└── shared/
    ├── components/   # app-button, app-input, header, footer, user-profile, toasts …
    ├── services/      # Firebase-API-Split (Users/Channels/Messages), UserStore, Mention
    ├── directives/, pipes/, utils/, constants
```

Jedes Feature kapselt jetzt seine eigenen `components/`, `services/` und `models/`; global wiederverwendbare Bausteine liegen unter `shared/`.

## Was inhaltlich behoben wurde

Vor Beginn der Hauptphase (Juli 2026) wurden per Code-Analyse mehrere reale Funktionsdefekte und strukturelle Probleme im damaligen Stand festgestellt (siehe „Kern-Befunde" in [REFACTORING.md](REFACTORING.md)) und im Zuge der Phasen behoben:

- **Kaputte Navigation:** Thread- und Mention-Navigation waren No-op-Stubs — funktionslos.
- **Memory Leaks:** mehrere nie abgemeldete `onSnapshot`/`subscribe`-Listener (Auth-Wechsel, Thread-Wechsel).
- **Mehrere Wahrheiten für den aktiven Channel** (Route-Param, Service-Signal, lokaler Snapshot liefen auseinander).
- **Gebrochene Layer-Trennung:** direkte Firestore-Zugriffe in Komponenten statt über Services.
- **Duplizierter Code:** Mention-Handling, Avatar-Auswahl, Reaction-Picker doppelt gepflegt.
- **Typqualität:** ursprünglich 83× `any` in 25 Dateien (heute noch 22×, laufende Reduktion), kein `OnPush` trotz Signals.

## Ergebnis der Hauptphase (Phasen 0–10, Details in REFACTORING.md)

Die eigentliche Umbauarbeit ist in 10 aufeinander aufbauenden Phasen dokumentiert:

0. **Baseline** — Referenzzustand vor jeder Änderung festgehalten
1. **Quick-Fixes** — isolierte Bugs beseitigt
2. **Chat-Navigation** — No-op-Stubs durch echte Thread-/Mention-Navigation ersetzt
3. **Subscription-Hygiene** — alle Listener/Subscriptions deterministisch aufgeräumt
4. **Single Source of Truth** — ein Owner für den aktiven Channel, DI-Zyklus FireService↔AuthService aufgelöst
5. **Firestore raus aus Komponenten** — Datenzugriff komplett in Services verschoben
6. **Duplizierung entfernt** — MentionService extrahiert, Avatar-Auswahl konsolidiert
7. **Komponenten zerlegt & typisiert** — große Komponenten aufgeteilt, `any` reduziert
8. **Struktur, Naming, Doku** — Ordner-/Datei-Umbenennungen, README ersetzt
9. **Code-Review-Nachträge** — 4 weitere Funktionsbugs + Restduplikate behoben
10. **To-Do-Nachträge** — u. a. `app-button`/`app-input`-Komponenten eingeführt, Barrierefreiheit verbessert, NotificationService eingeführt

Noch offene Punkte (siehe REFACTORING.md, Abschnitte 10.3–10.5): finaler CSS-Cleanup, Lazy-Loading der Feature-Routen, Performance-Analyse, echte Unit-Tests (aktuell nur CLI-Scaffolds), Figma-Abgleich.

## Diesen Vergleich selbst nachvollziehen

```bash
# Kompletter Diff gegen den Ausgangsstand
git diff a7a52cee9c2e0b2099f3112a8294168df873e524 HEAD

# Nur die Commit-Liste
git log --oneline a7a52cee9c2e0b2099f3112a8294168df873e524..HEAD

# Nur geänderte Dateien
git diff --stat a7a52cee9c2e0b2099f3112a8294168df873e524 HEAD
```
