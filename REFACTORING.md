# Refactoring-Roadmap DA-Bubble

Stand: 2026-08-16 · **Phasen 0–9 vollständig umgesetzt** (PRs #11, #13–#19 + Phase-8-PR + Phase-9-Nachträge). Die zwei zuvor verschobenen Punkte sind nachgezogen: FireService ist intern in `UsersApiService`/`ChannelsApiService`/`MessagesApiService` gegliedert (Fassade `FireServiceService` unverändert für alle Consumer), SearchService ist in `SearchUiStateService` (UI-Zustand), `SearchQueryService` (reine Suchlogik) und `SearchService` (Orchestrator-Fassade) getrennt. Phase 9 (Code-Review-Nachträge) hat 4 Funktionsbugs behoben und die verbliebenen strukturellen Duplikate aus dem Split bereinigt. **Phase 10.1–10.4 sind umgesetzt** — Button und Input waren beide zunächst als Direktive (`[appButton]`/`[appInput]`) umgesetzt und sind auf expliziten Wunsch beide zu echten Komponenten (`<app-button>`/`<app-input>`) umgebaut, um die projektweit verstreuten Pill-/Icon-Button-Style-Duplikate zu eliminieren (siehe Begründung unten); Card-Komponente bewusst nicht gebaut. Lazy Loading ist auf allen Feature-Routen aktiv (`eff62ba`), der CSS-Sweep (dead styles, `div:nth-child`-Selektoren raus zugunsten echter Klassen, semantische HTML-Elemente) und der Figma-Abgleich sind ebenfalls durchgelaufen. **10.4 ist komplett** (AuthGuard-Erweiterung, Lazy Loading, Performance inkl. nachgeholter Bundle-Analyse). Offen ist nur noch **10.5** (echte Unit-Tests, README-Architekturüberblick) — siehe unten.

Diese Roadmap ist die Arbeitsgrundlage für die kommenden Refactoring-Sessions. Jede Phase ist einzeln committbar und über die Smoke-Test-Checkliste (unten) manuell verifizierbar — es gibt kein Test-Sicherheitsnetz (alle `.spec.ts` sind ungepflegte CLI-Scaffolds).

---

## Kern-Befunde der Analyse

1. **Kaputte Funktionalität durch unfertigen Refactor**
   - No-op-Stubs in `src/app/shared/services/navigation/navigation.service.ts`: `setUrl()` loggt nur `'test'` (Z.121), `goToThread()` loggt nur die ID (Z.51), `showChannel()`/`toggleThread()` leer (Z.125–127) → **Thread- und Mention-Navigation sind faktisch funktionslos**
   - `chat-new.component.ts` Z.13–16: Komponente hat `@Injectable({providedIn:'root'})` **und** `@Component` — Bug
   - `search.service.ts` Z.190: `this.resetList;` ohne `()` — wird nie ausgeführt
   - Feld-Mismatch: Queries auf `displayName`/`user.key`, obwohl das User-Model `displayName`/`id` hat (message-template Z.225–227, 268, 326, 341 + chat-thread) → Reaktionsnamen bleiben leer, Mention-Lookup defekt
2. **Memory Leaks**
   - `route.queryParams.subscribe` ohne Cleanup (chat-thread Z.63), `route.paramMap.subscribe` (chat-direct Z.56)
   - `onSnapshot` in chat-thread Z.125 wird nie dem deklarierten `unsubMessages` zugewiesen
   - auth.service Z.220/226: `onAuthStateChanged` + verschachteltes `onSnapshot` werden nie abgemeldet (Re-Subscribe-Leak bei jedem Auth-Wechsel)
   - chat-channel Z.133–144: `getThread()` erstellt Listener mit komplett auskommentiertem Callback, wird nie abgemeldet
3. **Mehrere Sources of Truth für den aktiven Channel**: Route-Param vs. `ChannelService.currentChannel` vs. lokales `onSnapshot` in `chat-channel.component.ts` Z.116
4. **Layering gebrochen**: direkte Firestore-Zugriffe (`inject(Firestore)`, `query`, `onSnapshot`) in message-template, chat-thread und chat-channel statt über den FireService; Zirkularität FireService↔AuthService via `Injector.get()` (fire-service Z.72)
5. **Duplizierung**: Mention-Handling (`onMentionClick`/`showProfileOrChannel`/`caseUser`/`caseChannel`) wortgleich in message-template Z.285–346 und chat-thread Z.147–208; Magic String `DEFAULT_CHANNEL_ID = 'KqvcY68R1jP2UsQkv6Nz'` doppelt (auth.service Z.111, fire-service Z.75); doppelte avatar-selection-Komponente (app_auth + dialogs)
6. **Qualität**: 83× `any` in 25 Dateien (Hotspots: message-template 16×, fire-service 8×, search.service 7×); nirgends `OnPush` trotz Signals; Mix aus `@Input()` und `input()`; `console.log` bei jedem User-Snapshot (fire-service Z.63); README = CLI-Default

---

## Phase 0 — Baseline

**Ziel:** Referenzzustand festhalten, gegen den jede Phase verglichen wird.

- [x] `ng build` ausführen → Ergebnis siehe [Baseline-Status](#baseline-status)
- [ ] Smoke-Test-Checkliste (unten) einmal komplett durchspielen und den **Ist-Zustand notieren** — was jetzt schon kaputt ist (z. B. Thread-Öffnen, Mention-Klick), darf später nicht dem Refactor zugeschrieben werden

**Risiko:** keins (kein Code-Change).

## Phase 1 — Quick-Fixes (isolierte Bugs, je 1 Commit)

**Ziel:** Punktuelle, unabhängige Fehler beseitigen, bevor am Fundament gearbeitet wird.

0. **Build-Fehler fixen (blockiert alles):** `add-member.component.html` Z.39 — `channelService.currentChannel().name` schlägt fehl, weil `currentChannel()` `null` sein kann. Fix: `currentChannel()?.name` oder `@if`-Guard
1. `@Injectable`-Decorator aus `src/app/features/app_chat/components/chat-new-message/chat-new.component.ts` (Z.13–15) entfernen
2. `this.resetList;` → `this.resetList();` in `search.service.ts` Z.190
3. Feld-Mismatch `displayName`/`key` → `displayName`/`id` in message-template + chat-thread (vorher per Grep prüfen, ob Firestore-Dokumente noch `displayName` enthalten — das User-Model ist die Wahrheit)
4. Toten `getThread()`-Listener in `chat-channel.component.ts` Z.133–144 samt Aufrufer löschen
5. Hartcodierte E-Mail in `messages.service.ts` Z.14 entfernen; `console.log` in fire-service Z.63 und navigation.service Z.106 entfernen
6. Leeren Stub `UserService.showFeedback()` klären: delegieren oder Aufrufer entfernen

**Risiko:** niedrig. **Verifikation:** nach jedem Commit `ng build`; nach Fix 3: Reaktion setzen → Hover zeigt Namen; Mention klicken → Profil öffnet.

## Phase 2 — Chat-Navigation-Refactor abschließen (Zweck dieses Branches)

**Ziel:** No-op-Stubs im NavigationService durch echte Implementierungen ersetzen → Thread- und Mention-Navigation funktionieren wieder → Branch ist mergefähig.

- `navigation.service.ts`:
  - Signal `isThreadOpen = signal(false)` einführen
  - `goToThread(messageId)` → `router.navigate([], { queryParams: {...}, queryParamsHandling: 'merge' })` + `isThreadOpen.set(true)`
  - `toggleThread('close')` → Signal zurücksetzen + `messageId`-QueryParam entfernen
  - `setUrl(type, id)` typisieren (`'channel' | 'direct'`) und auf `selectChannel`/`selectDirectMessageRecipient` delegieren — oder Aufrufer direkt umstellen und `setUrl` löschen
  - `showChannel()` implementieren (Mobile: Thread-Drawer schließen) oder löschen
- `main-chat.component.html` Z.26: `mat-drawer` an `isThreadOpen` binden (via Effect, da MatDrawer imperativ ist)
- Aufrufer anpassen: `message-template.component.ts` Z.129, 344–345; `chat-thread.component.ts` Z.136, 206–207; `search-result.component.ts` Z.69–70

**Risiko:** mittel (QueryParam-/Drawer-Timing). **Verifikation:** Thread öffnen → antworten → schließen; Channel wechseln bei offenem Thread; `#channel`- und `@user`-Mention klicken; Suchergebnis klicken — **Desktop UND Mobile (<1024px)**.

➡️ **Danach: Branch in `main` mergen. Alle Folgephasen auf neuen Branches.**

## Phase 3 — Memory Leaks & Subscription-Hygiene

**Ziel:** Alle Subscriptions und Firestore-Listener deterministisch aufräumen — muss VOR dem State-Refactor passieren, sonst debuggt man in Phase 4 Geisterdaten verwaister Listener.

- `takeUntilDestroyed` für `route.queryParams` (chat-thread Z.63) und `route.paramMap` (chat-direct Z.56)
- chat-thread: `onSnapshot`-Rückgabe dem deklarierten `unsubMessages` zuweisen; alten Listener vor jedem Re-Subscribe abmelden (Muster wie `chat-channel.component.ts` Z.117)
- auth.service: verschachteltes `onSnapshot` vor jedem Neu-Abonnieren abmelden (Re-Subscribe-Leak bei Logout→Login)
- channel.service: verlorenes Unsubscribe von `fireService.subAllUsers()` im Konstruktor aufheben; prüfen, ob FireService denselben Listener schon hält
- Projektweiter Grep-Sweep: jedes `subscribe(` / `onSnapshot(` auf besitzenden Unsub prüfen

**Risiko:** niedrig–mittel. **Verifikation:** 10× Channel-Wechsel, Thread mehrfach öffnen/schließen, Logout/Login → gesendete Nachricht erscheint genau 1× (doppeltes Rendern = verwaister Listener).

## Phase 4 — Single Source of Truth „aktiver Channel" + DI-Zyklus auflösen

**Ziel:** Genau eine Wahrheit für den aktiven Channel: der Route-Param. Services leiten ab, Komponenten konsumieren nur.
**Invasivster Schritt der Roadmap — strikt in Reihenfolge 1→4, je 1 Commit + Smoke-Test.**

1. `DEFAULT_CHANNEL_ID` nach `src/app/shared/constants.ts` (neu) extrahieren (auth.service Z.111, fire-service Z.75)
2. `ChannelService.setActiveChannel(id)`: der Service hält das EINE `onSnapshot` aufs Channel-Dokument und exponiert `currentChannel` als Signal; das komponenten-eigene Snapshot in `chat-channel.component.ts` Z.116–127 entfällt
3. Alle `currentChannel`-Leser (chat-header, edit.channel, add-member, textarea) per Grep finden und auf das Service-Signal umstellen
4. Zyklus FireService↔AuthService auflösen: User-Persistenz aus AuthService in neuen `UserStore` ziehen, von dem beide abhängen; `Injector.get(AuthService)` in fire-service Z.72 entfällt

**Risiko:** hoch. **Verifikation:** Channel-Wechsel → Header/Nachrichtenliste/Edit-Dialog/Member-Liste zeigen konsistent denselben Channel; Channel-Name im Edit-Dialog ändern → Header aktualisiert live; Deep-Link-Reload auf `/main/channel/:id`.

## Phase 5 — Firestore raus aus den Komponenten

**Ziel:** Komponenten sprechen nur noch mit Services; `inject(Firestore)`, `query`, `onSnapshot` verschwinden aus der Komponentenschicht.

- `findUserByDisplayName(name)` / `findChannelByName(name)` in UserStore bzw. ChannelService (ersetzt die query/where-Duplikate in message-template Z.266–346, chat-thread Z.80–207)
- Thread-Datenzugriff in MessagesService: `subscribeThread(channelId, messageId)`, `getParentMessage(...)` → Firestore-Inject in chat-thread entfällt
- Reactions-Zugriffe (message-template Z.34, 266–275) in MessagesService oder neuen ReactionsService
- [x] FireService intern in `UsersApi`/`ChannelsApi`/`MessagesApi` gliedern (Fassade behalten, kein Big Bang); `myChannels`-Guest-Logik in ChannelService

**Risiko:** mittel (viele Aufrufstellen, aber reine Verschiebung). **Verifikation:** kompletter Smoke-Test; gezielt: Mention auf User UND Channel, Reaktion hinzufügen/entfernen, Thread mit >2 Antworten.

## Phase 6 — Duplizierung entfernen & Service-SRP

**Ziel:** Jede Logik existiert genau einmal.

- `MentionService` extrahieren (`src/app/shared/services/mention/`): wortgleicher Code aus message-template + chat-thread; nach Phase 5 nur noch Dispatch-Logik
- Doppelte avatar-selection konsolidieren: `app_auth/components/avatar-selection` (geroutet) vs. `dialogs/avatar-selection/avatar-selection` (nur von user-profile genutzt) → eine Komponente mit Kontext-Input
- AuthService-SRP: FormBuilder-Factories (`createLoginForm`, `createRegisterForm`) in die Auth-Komponenten verschieben
- [x] SearchService trennen: UI-State (welche Liste offen) von der Suchlogik

**Risiko:** niedrig–mittel. **Verifikation:** Mentions in Channel-Nachricht UND Thread-Antwort; Avatar-Auswahl bei Registrierung und im Profil; Login/Registrierung/Passwort-Reset; Suche öffnen/schließen.

## Phase 7 — Komponenten zerlegen & Typisierung

**Ziel:** message-template (347 Z., 16× `any`) & Co. unter die Projektlimits bringen; `any` eliminieren; einheitliche Reaktivität.

- message-template aufteilen: `message-reactions.component`, `message-edit.component`, schlanker Parent
- Message-Typ-Diskriminierung vereinheitlichen: `instanceof ChannelMessage` ODER Discriminator-Feld im Model — nicht beide Muster (`'reaction' in data` vs. `instanceof`) parallel
- `any`-Abbau nach Hotspots (message-template 16×, fire-service 8×, search.service 7×); Models aus `app_chat/models` und `app_auth/models/user` konsequent als Typen verwenden
- Danach: `@Input()` → `input()`, `ChangeDetectionStrategy.OnPush` — als letzter, eigener Commit pro Komponentengruppe (deckt Zone-Abhängigkeiten auf)

**Risiko:** mittel. **Verifikation:** voller Smoke-Test; Live-Updates mit zweitem Browserfenster (neue Nachricht, Reaktion, Edit eines zweiten Users).

## Phase 8 — Struktur, Naming, Doku (bewusst zuletzt)

Reine Moves/Renames erzeugen riesige Diffs und würden die Reviews der inhaltlichen Phasen verschmutzen.

- Renames: `edit.channel` → `edit-channel`; `reciver`/`reciever` → `receiver` (inkl. Query-Params aus Phase 2 synchron umbenennen!); `app_auth`/`app_chat`/`app_channel` → `auth`/`chat`/`channel` (ein Commit, `git mv` + Import-Fixes)
- `features/pipes` → `shared/pipes`; `features/dialogs` auflösen (user-profile/user-menu/dialog-reciver zu ihren Features)
- README ersetzen (Projektbeschreibung, Setup, Firebase-Hinweis); tote `.spec.ts`-Scaffolds löschen oder mit minimalen Smoke-Tests füllen

**Risiko:** niedrig (Compiler fängt Importe; SCSS-Pfade und `templateUrl`s manuell prüfen). **Verifikation:** `ng build` + einmal kompletter Smoke-Test.

---

## Reihenfolge-Begründung

| Phase | Warum an dieser Stelle                                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Ohne Baseline keine Regression erkennbar (keine Tests vorhanden)                                                                       |
| 1     | Isolierte Bugs zuerst: billig, risikoarm, entstören alle späteren Tests                                                                |
| 2     | Branch-Zweck abschließen, bevor Neues beginnt; funktionierende Navigation ist Voraussetzung, um alles Weitere manuell testen zu können |
| 3     | Leaks vor State-Refactor, sonst Geisterdaten-Debugging in Phase 4                                                                      |
| 4     | Fundament (eine Channel-Wahrheit, kein DI-Zyklus) muss stehen, bevor Datenzugriffe verschoben werden                                   |
| 5     | Firestore aus den Komponenten ziehen macht Phase 6/7 erst möglich                                                                      |
| 6     | Dedup vor Zerlegung: sonst wird Dupliziertes mit-zerlegt                                                                               |
| 7     | Komponenten-Split/OnPush zuletzt der inhaltlichen Phasen — höchstes Regressionsrisiko, profitiert von allem davor                      |
| 8     | Reine Moves ganz am Ende, um die Diffs der inhaltlichen Phasen sauber zu halten                                                        |

---

## Smoke-Test-Checkliste

Nach jeder Phase (mindestens nach jedem Merge) einmal komplett durchspielen — Desktop **und** Mobile-Viewport (<1024px):

- [ ] Login mit E-Mail/Passwort; Login als Gast; Google-Login
- [ ] Registrierung inkl. Avatar-Auswahl
- [ ] Channel in der Sidebar öffnen → Nachrichten laden
- [ ] Nachricht senden → erscheint genau 1×
- [ ] Nachricht bearbeiten
- [ ] Reaktion (Emoji) hinzufügen → Hover zeigt Namen der Reagierenden; Reaktion wieder entfernen
- [ ] Thread öffnen („Antworten") → Parent-Nachricht korrekt; Antwort senden; Thread schließen
- [ ] Channel wechseln bei offenem Thread → kein veralteter Thread-Inhalt
- [ ] `@user`-Mention klicken → Profil-Dialog öffnet
- [ ] `#channel`-Mention klicken → Navigation zum Channel
- [ ] Suche (Header): User/Channel suchen und Ergebnis anklicken → Navigation
- [ ] Direct Message öffnen, Nachricht senden; Profil des Empfängers öffnen
- [ ] Neuer Chat („Neue Nachricht"): Empfänger via Suche wählen, senden
- [ ] Channel bearbeiten: Name/Beschreibung ändern → Header aktualisiert live
- [ ] Member zum Channel hinzufügen
- [ ] Channel erstellen
- [ ] Deep-Link: Browser-Reload direkt auf `/main/channel/:id`
- [ ] Logout → Login-Seite; erneuter Login funktioniert

### Bekannte Defekte VOR dem Refactoring (Ist-Zustand, nicht dem Refactor zuschreiben)

- Thread-Navigation über `goToThread()` ist funktionslos (No-op-Stub)
- Channel-Mention-Navigation über `setUrl()`/`showChannel()` ist funktionslos (No-op-Stubs)
- Reaktions-Hover zeigt vermutlich keine Namen (Feld-Mismatch `displayName`/`key` vs. `displayName`/`id`)

---

## Baseline-Status

- Datum: 2026-07-12, Branch `refactor-chat-navigation`, Commit `f43c006`
- `ng build`: ❌ **schlägt fehl** — `NG1: Object is possibly 'null'` in `src/app/features/app_channel/components/add-member/add-member.component.html:39` (`channelService.currentChannel().name`, `currentChannel()` kann `null` sein). → Fix ist Schritt 0 von Phase 1; erst danach ist der Build als Verifikations-Werkzeug nutzbar.

---

## Phase 9 — Nachträge aus Code-Review (2026-07-25)

**Ziel:** Nach Abschluss der Phasen 0–8 hat eine erneute Review (3 parallele Explore-Agents über `features/chat`, `shared/services` und `features/auth|channel` + `shared/components`) vier verbliebene Funktionsbugs sowie Restduplikate gefunden, die vom Strukturrefactor nicht abgedeckt waren. Reihenfolge: 9.1 (Bugs) → 9.2 (Duplikate) → 9.3 (mittel) → 9.4 (Cleanup); jeder Punkt einzeln committbar.

### 9.1 Bugs (hohe Priorität)

- [x] **reset-password fertig implementieren** — Reactive Form mit `PASSWORD_PATTERN`/dem `createXForm`-Muster aus `auth-forms.ts`, Validierung + Fehleranzeige aktivieren (aktuell auskommentiert), Firebase-Reset-Aufruf über `AuthService` kapseln statt direkt `getAuth`/`confirmPasswordReset` in der Komponente.
  Dateien: `features/auth/components/reset-password/reset-password.component.ts`, `.html`, `features/auth/forms/auth-forms.ts`, `features/auth/services/auth/auth.service.ts`
- [x] **Duplicate-User-Bug in add-member/edit-channel beheben** — lokale `addUserToSelection`/`onSearchInput` (1:1 kopiert, ohne Duplikat-Schutz) entfernen, stattdessen `channelService.addUserToSelection(user)` / `channelService.updateSearchQuery(value)` direkt binden.
  Dateien: `features/channel/components/add-member/add-member.component.ts` (+`.html`), `edit-channel/edit-channel.component.ts` (+`.html`)
- [x] **Auto-Scroll in chat-direct und chat-thread ergänzen** — Scroll-Logik aus `chat-channel` (`handleScroll()` + `effect()` auf `messagesService.messages()`) extrahieren, in allen drei Komponenten nutzen (chat-direct/chat-thread deklarieren `@ViewChild('chat')` bereits, rufen aber nie `scrollToBottom` auf).
  Dateien: `chat-channel/chat-channel.component.ts`, `chat-direct/chat-direct.component.ts`, `chat-thread/chat-thread.component.ts`
- [x] **hideList() in chat-direct verdrahten** — `SearchService` injizieren, `resetList()` aufrufen (analog `MainChatComponent.closeAll()`). Hinweis: `main-chat.component.html:1` bindet `(click)="closeAll()"` bereits auf `<main>`, das `chat-direct` umschließt — die lokale Bindung ist strenggenommen bereits redundant durch Event-Bubbling, wird aber trotzdem sinnvoll implementiert statt entfernt, für Konsistenz mit dem Klick-Handler-Namen und Robustheit gegen künftige `stopPropagation()`-Aufrufe.
  Datei: `chat-direct/chat-direct.component.ts` (+`.html:5`)

### 9.2 Strukturelle Duplikate

- [x] **AuthService auf den Firestore-Split umstellen** — direkte `Firestore`-Injection/`doc`/`setDoc`/`updateDoc`/`onSnapshot`-Aufrufe entfernen; `addInDefaultChannel()` durch `fireService.addChannelMembers(...)` ersetzen (ist 1:1 `ChannelsApiService.addChannelMembers`); fehlende Schreibmethode (`createUser`) in `UsersApiService` ergänzen, `addInUserCollection`/`setCurrentUser`-Snapshot darüber laufen lassen.
  Dateien: `features/auth/services/auth/auth.service.ts`, `shared/services/firebase/users-api.service.ts`, `channels-api.service.ts`
- [x] **Reaction-Quick-Picker konsolidieren** — identischen `reactionContext()`/`context()`-Builder und Emoji-Grid (TS + HTML + SCSS dupliziert) aus `message-template` und `message-reactions` zusammenführen.
  Dateien: `features/chat/components/message/message-template.component.ts` (+`.html`/`.scss`), `message/message-reactions/message-reactions.component.ts` (+`.html`/`.scss`)
- [x] **Message-Ref-Auflösung zentralisieren** — identischer Thread-vs-Channel-Ternary in `MessagesService.updateMessageText` und `ReactionsService.getMessageRef` → eine Methode auf `MessagesApiService` (z. B. `getMessageRefForContext`).
  Dateien: `features/chat/services/messages/messages.service.ts`, `services/reactions/reactions.service.ts`
- [x] **Doc→Entity-Mapping vereinheitlichen** — generischer `toEntity<T>(id, data)`-Helper (id **nach** dem Spread, da 4 von 5 Stellen `id` davor spreaden und ein gleichnamiges Datenfeld die echte Doc-ID überschreiben würde).
  Dateien: `channels-api.service.ts`, `users-api.service.ts`, `features/channel/services/channel/channel.service.ts` (`setActiveChannel`, `findChannelByName`), `shared/services/user/user-store.ts`
- [x] **Conversation-ID-Aufbau zentralisieren** — `[a,b].sort()` + Template-String kommt zweimal in `MessagesService` vor (`subToConversationMessages`, `sendDirectMessage`) → ein `getConversationId(userA, userB)`-Helper.
  Datei: `features/chat/services/messages/messages.service.ts`
- [x] **Message/Thread-Pfade zentralisieren** — `MessagesApiService` um `getMessagesCollectionRef`/`getThreadCollectionRef` ergänzen, `MessagesService` nutzt diese statt Pfad-Strings selbst zu bauen und über den generischen `fireService.getCollectionRef` zu gehen.
  Dateien: `shared/services/firebase/messages-api.service.ts`, `features/chat/services/messages/messages.service.ts`
- [x] **checkChannelNameExists/findChannelByName zusammenführen** — gleiche Query zweimal (einmal korrekt in `ChannelsApiService`, einmal über den `getCollectionRef`-Escape-Hatch in `ChannelService`) → eine Implementierung in `ChannelsApiService`.
  Dateien: `shared/services/firebase/channels-api.service.ts`, `features/channel/services/channel/channel.service.ts`
- [x] **Error-Handling in den API-Services vereinheitlichen** — `channels-api.service.ts` fängt+rethrowt, `messages-api.service.ts` fängt gar nicht, `auth.service.ts` fängt ohne rethrow → kleiner `runWrite`-Helper für konsistentes Verhalten.
  Dateien: `shared/services/firebase/*.ts`

### 9.3 Mittel

- [x] Formular-Fehleranzeige vereinheitlichen: Passwort-Regel-Diskrepanz behoben (register-Fehlertext sagte fälschlich "8 Zeichen" statt 6); `forgot-password` von `NgForm`/eigenem E-Mail-Regex auf Reactive Forms + `Validators.email` (neue `createForgotPasswordForm` in `auth-forms.ts`) migriert. Bewusst **kein** generischer `getFieldError`-Helper für login/register — die Fehlermeldungen sind pro Feld unterschiedlich, eine Abstraktion hätte hier nur Indirektion ohne echten Gewinn gebracht.
- [x] Divider-Template-Logik (Datums-Trenner) in chat-thread ergänzt (`ChatService.isNewDay` gegen `parentMessageData` bzw. den vorherigen Reply verglichen), jetzt konsistent mit chat-channel/chat-direct.
- [x] Dialog-API vereinheitlicht: `user-menu`/`user-profile` nutzen jetzt `MatDialogRef` statt CDK `DialogRef`.
- [x] Timestamp→Date-Normalisierung zentralisiert in `shared/utils/timestamp.util.ts` (`toDateSafe`), genutzt von `relative-date.pipe.ts` und `base-message.ts`.
- [x] `fire-service.service.ts`: `getDocRef`/`getCollectionRef`-Escape-Hatches durch die oben zentralisierten Methoden ersetzen, sodass Consumer keine Domänen-Pfade mehr selbst bauen. (Beide generischen Methoden konnten komplett entfernt werden — letzter Aufrufer war `channel.service.ts`, jetzt über `ChannelsApiService.subChannelDoc` gelöst.)

**Risiko 9.1–9.3:** niedrig–mittel (isolierte, meist additive Änderungen). **Verifikation:** nach jedem Punkt `ng build`; gezielt Passwort-Reset-Flow, Mitglieder zu Channel hinzufügen (kein Duplikat in der Liste), Scroll-Verhalten in Direct/Thread bei neuer Nachricht, Reaktion setzen in Channel-Nachricht UND Thread-Antwort, Registrierung (Standardkanal-Beitritt).

### 9.4 Cleanup (Dead Code / Imports)

- [x] `chat-channel.component.ts`: unbenutzte `fireService`-Injection, `isMobile`, `showBackground`, `channels`, `channelInfo`, `addMemberInfoWindow`, `userId`, `currentUser`, `addMemberWindow` entfernt (inkl. des jetzt parameterlosen `openMemberWindow()`).
- [x] `contactbar.component.ts`: unbenutzte `currentUser`, `currentlist`, `currentArray`, `currentLink`, `addChannelWindow` entfernt; unbenutzte `dialogRef`-Variable in `openAddChannel()` entfernt.
- [x] Unbenutzte Imports: `computed` in `edit-channel.component.ts`, separater `NgClass`-Import in `add-channel.component.ts` entfernt.
- [x] Auskommentierte Markup-Reste entfernt: `avatar-selection.component.html` (auth), `reset-password.component.html` (entfiel automatisch mit der Neuimplementierung).
- [ ] Duplizierten `onMentionClick`-Wrapper (`message-template.component.ts`/`chat-thread.component.ts`) bewusst nicht extrahiert — zwei 3-zeilige Pass-through-Methoden in unterschiedlichem Kontext rechtfertigen keine eigene Direktive.

**Risiko:** keins (reine Löschungen ohne Verhaltensänderung). **Verifikation:** `ng build` + kompletter Smoke-Test (siehe oben).

---

## Phase 10 — Nachträge aus der manuellen To-Do-Liste (to-do.md, Stand 2026-07-25)

**Ziel:** Die 22 handschriftlichen Punkte aus `to-do.md` sind gesichtet, den jeweiligen Codestellen zugeordnet und in committierbare Gruppen sortiert. Reihenfolge wie schon in Phase 9: erst isolierte Bugs (10.1), dann UI-Konsolidierung inkl. Barrierefreiheit (10.2 — Buttons/Inputs/Cards müssen VOR dem a11y-Durchgang stehen, sonst werden a11y-Fixes mehrfach in jeder Kopie gepflegt), dann Struktur-/Code-Qualität (10.3), dann Infrastruktur/Performance (10.4), zuletzt Doku/Tests/Design-Abgleich (10.5), da diese von den vorherigen Schritten profitieren.

### 10.1 Bugs (hohe Priorität)

- [x] **Header-Menü öffnet sich nicht (eingeloggt, Desktop)** — `[matMenuTriggerFor]="!navigationService.isMobile ? beforeMenu : null"` referenziert `isMobile` ohne Aufruf `()`, der Ausdruck ist ein Funktionsverweis (immer truthy) statt eines Booleans → `matMenuTriggerFor` ist praktisch immer `null`. `onOpenMenu()` ruft bei Desktop zusätzlich direkt `showProfile()` auf, sodass nur das Profil aufgeht.
  Dateien: `shared/components/header/header.component.html:34`, `header.component.ts:65-67`
- [x] **Thread-Antwortzähler wird nicht angezeigt** — `sendThreadMessage()` schreibt neue Antworten nur in die Firestore-Subcollection und aktualisiert nie das `thread`-Feld auf dem Parent-Dokument, das das Template per `$any(message()).thread?.length` ausliest.
  Dateien: `features/chat/services/messages/messages.service.ts:143-154`, `features/chat/components/message/message-template.component.html:67-71`, `features/chat/models/channel-message/channel-message.ts:10,15`
- [x] **Actions-Menü in message-template schließt nicht sauber** — Schließen hängt nur an `(mouseleave)` auf dem äußeren `.message`-Div; kein Klick-außerhalb-Listener. Bei Touch oder Mausbewegung über die Lücke zum absolut positionierten Menü bleibt es offen bzw. schließt nie. Fix: `HostListener('document:click')` oder CDK-Overlay mit `outsidePointerEvents`.
  Dateien: `features/chat/components/message/message-template.component.ts/.html/.scss`
- [x] **Contactbar scrollt zu spät / Margin-Left fehlt beim Ausblenden** — `toogleContactbar()` liest `drawerContactbar.opened` synchron direkt nach `toggle()`, obwohl `MatDrawer.toggle()` animiert/asynchron ist → `barOpen` hinkt dem echten Zustand hinterher. Das Layout verlässt sich komplett auf `mat-drawer-container autosize` ohne manuelles `margin-left` in `main-chat.component.scss`, wirkt dadurch bei jedem Umschalten verzögert. Fix: auf `(openedChange)`-Event statt synchronem Read umstellen.
  Dateien: `features/chat/main-chat/main-chat.component.ts:47-52`, `.html`, `.scss`
- [x] **Zurück-Pfeil in Impressum/Datenschutz ohne Funktion** — Buttons ohne `(click)`-Handler; `imprint.component.ts` injiziert `NavigationService` bereits, nutzt sie aber nirgends im Template; `data-protection.component.ts` injiziert sie gar nicht.
  Dateien: `features/legal/imprint/imprint.component.html/.ts`, `features/legal/data-protection/data-protection.component.html/.ts`

**Risiko:** niedrig. **Verifikation:** Header-Menü bei eingeloggtem Desktop-User öffnen; Thread mit mehreren Antworten → Zähler korrekt; Actions-Menü per Touch/Klick außerhalb schließen; Contactbar mehrfach ein-/ausblenden auf Desktop und Mobile; Impressum/Datenschutz über den Pfeil verlassen.

### 10.2 UI-Konsolidierung & Barrierefreiheit

- [x] **Button-Komponente extrahieren** — ursprünglich als `[appButton]`-Direktive auf dem nativen `<button>` umgesetzt (Begründung damals: Wrapper hätte Layout gebrochen, siehe Input-Punkt unten für dieselbe Abwägung). Auf denselben expliziten Wunsch wie beim Input wieder umgekehrt: **echte Komponente** (`<app-button>`), da die vielen fast-identischen, aber pro Komponente leicht abweichenden Pill-/Icon-Button-Styles (`.hover-to-dark-purple`, `.btn-secundary` × mehrere Kopien, `.submit-btn` × 3, `.submitbutton` × 2, `.exit-btn`, `.save-btn` u. a.) projektweit dupliziert waren, ohne dass eine Kopie exakt der anderen entsprach. Varianten `primary`/`secondary`/`icon`/`plain` (`outline` in `secondary` umbenannt, um dem Designsystem-Screenshot zu entsprechen), Default `type="button"`; `ariaLabel`/`ariaPressed`/`form`/`disabled` werden als Inputs auf das interne `<button>` durchgereicht (nötig, weil sonst z. B. Screenreader-Label auf dem nicht-interaktiven Host-Element landen würden statt auf dem echten Button). Alle ~50 Buttons projektweit migriert (Material-Menüs im Header bewusst ausgenommen); dabei sind alle bisherigen Duplikat-Klassen aus den Komponenten-SCSS-Dateien sowie die globalen `.btn`/`.btn-primary`/`.btn-outline`/`.hover-to-dark-purple`/`button[appButton]`-Regeln in `styles.scss` entfernt worden. Layout-Abweichungen (z. B. Icon+Text-Reihenlayout über spezifische Gap-Werte pro Aufrufstelle) wurden wie beim Input bewusst in Kauf genommen.
  Dateien: `shared/components/button/button.component.ts/.html/.scss`
- [x] **Input-Komponente extrahieren** — ursprünglich als Direktive (`[appInput]`) umgesetzt (Begründung damals: Wrapper hätte Layout gebrochen). Auf expliziten Wunsch wieder umgekehrt: **echte Komponente** (`<app-input>`), da eine einzelne Stelle mit eigenem SCSS die massive Duplikation der Pill-Styles (Border-Radius, Border/Hover/Focus-Farben, Padding — vorher separat in ~8 Komponenten-SCSS-Dateien) tatsächlich eliminiert, was hier höher priorisiert wurde als Layout-Detailtreue. `AppInputComponent` implementiert `ControlValueAccessor` (funktioniert direkt mit `formControlName`/`[(ngModel)]` auf dem Tag selbst), rendert optional Icon-Prefix, literalen Text-Prefix (z. B. `#` für Channelnamen), Textarea-Modus (`multiline`) und die Fehlermeldung (`invalid`/`errorMessage`) inline — die separate `<app-field-error>`-Komponente entfällt dadurch vollständig. Layout-Abweichungen zwischen den vorher leicht unterschiedlichen Pill-Stilen wurden bewusst in Kauf genommen, kein Pixel-Abgleich in diesem Schritt.
  Dateien: `shared/components/input/input.component.ts/.html/.scss`
- [x] **Card-Header/Main/Footer-Komponente** — bewusst **nicht** gebaut: Nur `chat-channel` hat die vollständige 3-Teil-Form, und ihr `.card-header` (Tooltip-Positionierung, SVG-Hover-States, Mobile-Breakpoints) ist komplett bildschirmspezifisch, keine wiederverwendbare Gestaltung. Eine Wrapper-Komponente hätte entweder die gesamte bespoke-CSS mit hineinziehen müssen (keine echte Abstraktion) oder wäre am selben View-Encapsulation-Problem wie oben gescheitert. Die einzige tatsächliche Duplizierung — `.card-footer { padding: 25px; }`, identisch in `chat-channel`/`chat-thread`/`chat-direct`/`chat-new-message` — wurde stattdessen als eine globale Regel in `styles.scss` zusammengeführt.
- [x] **Barrierefreiheit** — `aria-label` auf allen zuvor unbeschrifteten Icon-Buttons und Suchfeldern ergänzt; Escape schließt jetzt die beiden handgebauten Popups (`message-template`-Aktionsmenü, `message-reactions`-Quick-Picker) — Material-Komponenten (`mat-menu`, `MatDialog`, `MatBottomSheet`) bringen Fokus-Trap und Escape bereits über CDK mit, dort war nichts zu tun. Farbkontrast nicht vertieft geprüft (bestehende Farbpalette unverändert, Figma-Abgleich ist 10.5 vorbehalten).
- [x] **Datenschutz-Container „Blocksatz"** — `max-width: 800px` + `text-align: left` auf dem Inhalts-Container gesetzt statt unbegrenzter Zeilenlänge.
  Datei: `features/legal/data-protection/data-protection.component.scss`

**Risiko:** niedrig–mittel (viele Aufrufstellen, aber mechanisch). **Verifikation:** visueller Vergleich aller Seiten mit Buttons/Inputs (Login, Register, Dialoge, Chat), Tab-Navigation durch die App, Screenreader-Stichprobe beim Öffnen/Schließen eines Dialogs.

### 10.3 Code-Qualität & Struktur

- [x] **HTML-Attribute anpassen** — Grep-Sweep über alle Templates abgeschlossen: `alt=""` dort belassen, wo ein sichtbarer Text (Name/Label/Überschrift) direkt daneben dieselbe Information trägt (Avatare neben Displaynamen, Mail-/Account-Icons neben Feldlabels, Logo neben „DABubble"-Schriftzug); echten Alt-Text ergänzt, wo das Bild der einzige Inhalt eines interaktiven Elements ohne sonstigen Namen war (`register`-Zurückpfeil, Header-Logo-Link, Entfernen-Icon in `add-member`). `type="button"` auf den beiden rohen `<button mat-menu-item>` im Header ergänzt. Inkonsistente `aria-label`-Texte vereinheitlicht (`data-protection` „Go back" → „Zurück"). Echten a11y-Bug behoben: `<a (click)>` als Schließen-Icon in `avatar-selection` (kein href → nicht fokussierbar) durch `<app-button ariaLabel="Schließen">` ersetzt, dabei zwei durch die Button-Migration bereits tot gewordene SCSS-Regeln in derselben Datei entfernt. Checkbox-Label-Bug in `register` behoben: Zustimmungstext stand als Sibling-`<span>` neben statt in `<label>`, Checkbox hatte dadurch keinen Accessible Name.
  Dateien: `header.component.html`, `register.component.html`, `data-protection.component.html`, `add-member.component.html`, `avatar-selection.component.html/.scss`. Verifiziert mit `ng build`.
- [x] **Legals-Struktur anpassen** — gemeinsames `shared/components/legal-header` extrahiert (Zurück-Button + `<h1>`, kapselt `Location.back()` selbst statt es in beiden Seiten zu duplizieren); vereinheitlicht dabei den bisherigen Icon-Mix (Imprint nutzte `img/arrow_back.png`, Datenschutz `mat-icon`) auf `mat-icon`. Auf expliziten Design-Wunsch bewusst **keine** gemeinsame Card-Struktur: Impressum bleibt eine Card, jetzt aber horizontal **zentriert** (`clamp(300px, 100%, 800px)` statt edge-to-edge) statt gestreckt; Datenschutz verliert die Card komplett und sitzt direkt auf dem globalen (lila) `--bg-color`-Seitenhintergrund, mit `h1`/`h4` in `var(--dark-purple)` (Übergabe der Farbe an die gekapselte `h1` im `legal-header` via CSS-Custom-Property `--legal-header-title-color`, da Emulated Encapsulation eine direkte `h1`-Selektor-Regel aus der Seiten-Komponente nicht erreicht).
  Stolperstein dabei gefunden und gefixt: der Input hieß zunächst `title` — kollidiert mit dem nativen `title`-Tooltip-Attribut, wodurch Angular den String nicht an den Component-Input weiterreicht (leere Überschrift). Umbenannt zu `heading`. Nebenbei einen weiteren, unabhängigen Bug beim manuellen Testen gefunden und gefixt: `header.component.html` griff mit `authService.currentUser()!.online` non-null auf den State zu, was beim Aufruf der Legal-Seiten im ausgeloggten Zustand (kein aktiver User) zur Laufzeit crashte — auf `?.online ?? false` umgestellt, analog zu den zwei Zeilen direkt daneben, die bereits `?.` nutzen.
  Dateien: `shared/components/legal-header/*` (neu), `imprint.component.ts/.html/.scss`, `data-protection.component.ts/.html/.scss`, `header.component.html`. Verifiziert mit `ng build` + Playwright-Screenshots beider Seiten im Dev-Server.
- [x] **Decorators (`private`/`public`/`readonly`)** — geklärt: gemeint waren die nativen TS-Modifier, kein eigenes Decorator-System (`shared/decorators/` wird nicht gebaut). Grep-Sweep über alle `= inject(...)`-Felder ohne Modifier (der Rest der Codebase nutzt bereits konsequent `private/public readonly`): auf `private` gesetzt, was nur klasseninternen genutzt wird (`ChatContentComponent.userService/dialog/route`, `SearchResultComponent.navigationService`), auf `public readonly` bzw. `readonly` ergänzt, was im Template gebunden und nie neu zugewiesen wird (`ChatContentComponent.channelService/navigationService/messagesService/chatService/currentChannelId`, `SearchResultComponent.searchService/mentionService`, `LoginComponent.authService/loginForm`, `MainComponentComponent.isOverlayActive`). Dabei drei tote, nie referenzierte injizierte Felder gefunden und entfernt: `LoginComponent.disabled`/`navigationService`, `MainComponentComponent.shareddata`. Model-/Interface-Dateien (`app_chat/models`, `app_auth/models`) bewusst ausgenommen — das sind Firestore-POJOs mit durchgehend mutierbaren Feldern, kein Modifier-Mix zu bereinigen.
  Dateien: `login.component.ts`, `main-component.component.ts`, `chat-channel.component.ts`, `search-result.component.ts`. Verifiziert mit `ng build`.
- [x] **CSS aufräumen** — finaler projektweiter Sweep nach 10.2 abgeschlossen: verbleibende dead/duplizierte Styles entfernt, `div:nth-child`-Selektoren zugunsten echter CSS-Klassen ersetzt (`d73c40d`), mehrere Komponenten (u. a. `intro`, `user-profile`) auf semantische HTML-Elemente umgestellt, tote Button-/Contactbar-Styles bereinigt (`23ad9d1`, `e7f166b`, `f785f26`).

**Risiko:** niedrig. **Verifikation:** `ng build`, kompletter Smoke-Test.

### 10.4 Infrastruktur & Performance

- [x] **NotificationService einführen, `isOverlayActive` ablösen** — `NotificationService` (Signal-basierter Toast-Store, `providedIn: 'root'`) eingeführt, gerendert über `ToastContainerComponent` einmalig im App-Root (`app.component.html`). Toasts für Registrierung, Login (inkl. Gast-Login), Passwort-vergessen/-geändert und Profil-Update verdrahtet. `isOverlayActive`-Bild-Overlay in `forgot-password`/`reset-password` ersatzlos entfernt (`Versendet.png`/`Anmeldung.png` gelöscht) — Ladezustand läuft jetzt über ein lokales `isSubmitting`-Flag pro Komponente, das an das bestehende `[loading]`-Input von `app-button` gebunden ist, kein eigener Overlay-Komponente nötig.
  Dateien: `shared/services/notification/`, `shared/components/toast-container/`, `features/auth/components/reset-password/`, `forgot-password/`
- [x] **AuthGuard erweitern** — inverser `noAuthGuard` (`src/core/no-auth.guard.ts`, `5d5d6bb`) ergänzt und an den Auth-Routen (`app.routes.ts`, Pfad `''`) als `canActivate` verdrahtet; bereits eingeloggte User werden von Login/Register/Passwort-Flows auf `/main` umgeleitet.
- [x] **Lazy Loading** — alle Feature-Routen (`auth`, `chat`, `legal`) in `app.routes.ts` auf `loadComponent` umgestellt (`eff62ba`); kein eager `component:` mehr im Routenbaum.
- [x] **Performance** — `OnPush` auf 45 von 46 Komponenten (einzige Ausnahme: `app.component.ts`, reine Root-Shell mit nur `<router-outlet>`/Toast-Container, unkritisch); `*ngFor` vollständig durch `@for` ersetzt (0 Vorkommen mehr), die neue Kontrollfluss-Syntax erzwingt einen `track`-Ausdruck, der alte Zweifelspunkt "fehlende trackBy" existiert also nicht mehr. Bundle-Analyse nachgeholt (`ng build --configuration production --stats-json`, 2026-08-16): Initial-Bundle 748 kB raw / 196 kB geschätzter Transfer — deutlich unter dem konfigurierten Budget (Warnung ab 1,6 MB, Fehler ab 2 MB, `angular.json`). Größte Lazy-Chunks sind Firebase/Vendor-Anteile (306 kB / 123 kB roh), sauber vom Initial-Bundle getrennt dank Lazy Loading.

**Risiko:** mittel (Lazy Loading kann Routing-/Guard-Timing beeinflussen). **Verifikation:** `ng build`, alle Routen inkl. Deep-Links, Bundle-Größe vorher/nachher vergleichen.

### 10.5 Doku, Tests, Design-Abgleich

- [ ] **Tests implementieren** — die in Phase 8 als tote `.spec.ts`-Scaffolds identifizierten Dateien mit echten Unit-Tests füllen; Startpunkt: Services mit wenig UI-Abhängigkeit (`MentionService`, `ReactionsService`, API-Services).
- [ ] **Dokumentation erweitern** — README (Phase 8 hat es nur ersetzt) um Architekturüberblick, Setup-Schritte und Firebase-Konfiguration ergänzen.
- [x] **Mit Figma abgleichen** — nach 10.2 durchgeführt; Abweichungen direkt als eigene Refactor-Commits behoben statt gesammelt (u. a. Header-Umbau mit `ng-content`-Slots, Sign-up-Box im Header, Contactbar-Layout, Button-Varianten-Umbenennung `outline` → `secondary`).

**Risiko:** keins. **Verifikation:** `ng test` läuft grün und deckt die neuen Tests ab; README von einer Person ohne Vorwissen gegenlesen lassen.
