test: test implementieren
refactor card header, card main, card footer komponenten
feat: barrierefreiheit
refactor: performance
refactor: lazy loading
mit figma abgleichen
doc: docu erweitern
feat: eine car dkomponente erstellen oder container da dieses design mit den runden eck sehr oft vorkommt
refachtor: vereinfache die html struktur und nutze die richtigen html selektoren
refactor: header der card in chanel, direct und thread als eine komponente

html atribute : <!--...--> Defines a comment

<!DOCTYPE> 	Defines the document type

<a> Defines a hyperlink
<abbr> Defines an abbreviation or an acronym
<acronym> Not supported in HTML5. Use <abbr> instead.
Defines an acronym

<address>	Defines contact information for the author/owner of a document
<applet>	Not supported in HTML5. Use <embed> or <object> instead.
Defines an embedded applet
<area>	Defines an area inside an image map
<article>	Defines an article
<aside>	Defines content aside from the page content
<audio>	Defines embedded sound content
<b>	Defines bold text
<base>	Specifies the base URL/target for all relative URLs in a document
<basefont>	Not supported in HTML5. Use CSS instead.
Specifies a default color, size, and font for all text in a document
<bdi>	Isolates a part of text that might be formatted in a different direction from other text outside it
<bdo>	Overrides the current text direction
<big>	Not supported in HTML5. Use CSS instead.
Defines big text
<blockquote>	Defines a section that is quoted from another source
<body>	Defines the document's body
<br>	Defines a single line break
<button>	Defines a clickable button
<canvas>	Used to draw graphics, on the fly, via scripting (usually JavaScript)
<caption>	Defines a table caption
<center>	Not supported in HTML5. Use CSS instead.
Defines centered text
<cite>	Defines the title of a work
<code>	Defines a piece of computer code
<col>	Specifies column properties for each column within a <colgroup> element 
<colgroup>	Specifies a group of one or more columns in a table for formatting
<data>	Adds a machine-readable translation of a given content
<datalist>	Specifies a list of pre-defined options for input controls
<dd>	Defines a description/value of a term in a description list
<del>	Defines text that has been deleted from a document
<details>	Defines additional details that the user can view or hide
<dfn>	Specifies a term that is going to be defined within the content
<dialog>	Defines a dialog box or window
<dir>	Not supported in HTML5. Use <ul> instead.
Defines a directory list
<div>	Defines a section in a document
<dl>	Defines a description list
<dt>	Defines a term/name in a description list
<em>	Defines emphasized text 
<embed>	Defines a container for an external application
<fieldset>	Groups related elements in a form
<figcaption>	Defines a caption for a <figure> element
<figure>	Specifies self-contained content
<font>	Not supported in HTML5. Use CSS instead.
Defines font, color, and size for text
<footer>	Defines a footer for a document or section
<form>	Defines an HTML form for user input
<frame>	Not supported in HTML5.
Defines a window (a frame) in a frameset
<frameset>	Not supported in HTML5.
Defines a set of frames
<h1> to <h6>	Defines HTML headings
<head>	Contains metadata/information for the document
<header>	Defines a header for a document or section
<hgroup>	Defines a header and related content
<hr>	Defines a thematic change in the content
<html>	Defines the root of an HTML document
<i>	Defines a part of text in an alternate voice or mood
<iframe>	Defines an inline frame
<img>	Defines an image
<input>	Defines an input control
<ins>	Defines a text that has been inserted into a document
<kbd>	Defines keyboard input
<label>	Defines a label for an <input> element
<legend>	Defines a caption for a <fieldset> element
<li>	Defines a list item
<link>	Defines the relationship between a document and an external resource (most used to link to style sheets)
<main>	Specifies the main content of a document
<map>	Defines an image map
<mark>	Defines marked/highlighted text
<menu>	Defines an unordered list
<meta>	Defines metadata about an HTML document
<meter>	Defines a scalar measurement within a known range (a gauge)
<nav>	Defines navigation links
<noframes>	Not supported in HTML5.
Defines an alternate content for users that do not support frames
<noscript>	Defines an alternate content for users that do not support client-side scripts
<object>	Defines a container for an external application
<ol>	Defines an ordered list
<optgroup>	Defines a group of related options in a drop-down list
<option>	Defines an option in a drop-down list
<output>	Defines the result of a calculation
<p>	Defines a paragraph
<param>	Defines a parameter for an object
<picture>	Defines a container for multiple image resources
<pre>	Defines preformatted text
<progress>	Represents the progress of a task
<q>	Defines a short quotation
<rp>	Defines what to show in browsers that do not support ruby annotations
<rt>	Defines an explanation/pronunciation of characters (for East Asian typography)
<ruby>	Defines a ruby annotation (for East Asian typography)
<s>	Defines text that is no longer correct
<samp>	Defines sample output from a computer program
<script>	Defines a client-side script
<search>	Defines a search section
<section>	Defines a section in a document
<select>	Defines a drop-down list
<small>	Defines smaller text
<source>	Defines multiple media resources for media elements (<video> and <audio>)
<span>	Defines a section in a document
<strike>	Not supported in HTML5. Use <del> or <s> instead.
Defines strikethrough text
<strong>	Defines important text
<style>	Defines style information for a document
<sub>	Defines subscripted text
<summary>	Defines a visible heading for a <details> element
<sup>	Defines superscripted text
<svg>	Defines a container for SVG graphics
<table>	Defines a table
<tbody>	Groups the body content in a table
<td>	Defines a cell in a table
<template>	Defines a container for content that should be hidden when the page loads
<textarea>	Defines a multiline input control (text area)
<tfoot>	Groups the footer content in a table
<th>	Defines a header cell in a table
<thead>	Groups the header content in a table
<time>	Defines a specific time (or datetime)
<title>	Defines a title for the document
<tr>	Defines a row in a table
<track>	Defines text tracks for media elements (<video> and <audio>)
<tt>	Not supported in HTML5. Use CSS instead.
Defines teletype text
<u>	Defines some text that is unarticulated and styled differently from normal text
<ul>	Defines an unordered list
<var>	Defines a variable
<video>	Defines embedded video content
<wbr>	Defines a possible line-break

/// DONE ///
AuthGuard überprüft: wartet korrekt auf ersten onAuthStateChanged-Callback (kein Race-Condition-Risiko beim Reload), unsubscribed sauber, schützt main-Route inkl. aller Kind-Routen; keine Änderung nötig
Reverse Guard (GuestGuard) ergänzt: bereits angemeldete Nutzer werden von login/register/register-avatar/forgot-password/reset-password automatisch zu /main umgeleitet
Kontaktbar ist fertig überprüft
Header auch bis auf den Such Result-container
HTML-Attribute Sweep (alt/type/aria) fertig
Private/public/readonly Modifier-Sweep fertig (kein eigenes Decorator-System)
Legals-Struktur (Impressum zentrierte Card, Datenschutz ohne Card + lila Headings) fertig
Message-Actions/Emoji-Picker/Mention-Tag-Bugs behoben (Popup-Close, gegenseitiges Schließen, Mention-Toggle)
Mobile Thread-Zurück-Bug behoben (schließt jetzt den Thread-Drawer statt zur Kontaktbar zu navigieren)
Emoji-Preselector: bg-purple (highlighted) Button jetzt mit border-radius
Mention-Toggle: Wechsel zwischen @ und # bei offenem Dropdown wechselt jetzt statt zu schließen; Klick auf Emoji-Button schließt jetzt offenes Mention-Dropdown und öffnet Emoji-Picker
dialog-receiver und user-profile zu einer Komponente zusammengeführt (Modus über MAT_DIALOG_DATA: eigenes Profil editierbar, fremdes Profil read-only mit "Nachricht"-Button); ProfileDialogService nutzt jetzt UserProfileComponent
CSS aufgeräumt: tote globale Utility-Klassen entfernt (.position-absolute, .sr-only, .guest-btn, .column), Tippfehler-Klasse .curser-pointer zu .cursor-pointer korrigiert und mit der bisher duplizierten lokalen Regel in chat-channel konsolidiert, styles.scss in kommentierte Abschnitte strukturiert
Bugfix: "Zugang für Gäste gesperrt"-Sperre war nirgends verdrahtet – neues AuthService.isGuest (Vergleich currentUser.email === GUEST_EMAIL, gleiches Muster wie schon in channels-api.service.ts für myChannels) verdrahtet in chat-channel (Channel-Info, Mitgliederliste/-hinzufügen), contactbar (Channel hinzufügen) und user-profile (Bearbeiten); Tooltip-Hover-Selektoren einheitlich auf :has(button:disabled, .guest-locked) umgestellt. Erster Versuch nutzte User.isAnonymous, das aber nur verzögert über den Firestore-Snapshot ankommt statt sofort aus Firebase Auth – auf die bereits etablierte E-Mail-Prüfung korrigiert
NotificationService (Signal-basierter Toast-Store, eigene ToastContainerComponent im App-Root statt MatSnackBar) eingeführt mit Toasts für Registrierung/Login/Passwort-vergessen/Passwort-geändert/Profil-Update; isOverlayActive-Bild-Overlay in forgot-password/reset-password ersatzlos entfernt (Versendet.png/Anmeldung.png gelöscht), Ladezustand läuft jetzt über lokales isSubmitting-Flag + app-button [loading]-Input, totes isOverlayActive-Flag in auth-layout entfernt
Bugfix: "zweimal auf Speichern klicken" in user-profile – modifyInfos/newName/pendingPhotoUrl waren normale Felder in einer OnPush-Komponente, die nach einem await auf Firebase/Firestore (läuft oft außerhalb der Angular-Zone) mutiert wurden, daher rendert erst der nächste Klick den bereits aktuellen State nach; auf Signals umgestellt
Bugfix: Tooltip bei gesperrten Gast-Buttons (v.a. "Channel hinzufügen") erschien nicht – contactbar.component.scss hatte `display: contents` UND `position: relative` auf .tooltip-cont; display:contents erzeugt keine eigene Box, wodurch position:relative wirkungslos war und sich das absolut positionierte Tooltip relativ zum falschen Vorfahren platzierte. display:contents entfernt, jetzt wie in chat-channel/user-profile ein normaler Block
Guest-Lock-Tooltip-Markup/CSS (chat-channel, contactbar, user-profile – 3x fast identisch dupliziert) in gemeinsame GuestLockTooltipComponent extrahiert; Positionierung pro Stelle via CSS-Custom-Properties (--tooltip-\*) überschreibbar, da Angular-View-Encapsulation direkte Selektor-Regeln von außen nicht erreicht (gleiches Muster wie schon bei legal-header)
div:nth-child-Selektoren entfernt (styles.scss .menu-box, user-profile .contact-cont, sign-in, reset-password, forgot-password, chat-channel-Avatar-Stack) und durch echte CSS-Klassen ersetzt; dabei mehrere tote Regeln aufgedeckt und gelöscht, die wegen Angular-View-Encapsulation und Tag-Mismatch (app-button/app-input statt button/div) nie gegriffen hatten (button:nth-child, h1/span:nth-child, .box > div:nth-child in reset-password), sowie unnötige verschachtelte Wrapper-Divs um h1/span in reset- und forgot-password entfernt
