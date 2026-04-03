import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  /**
   * Vergleicht zwei Nachrichten und prüft, ob sie an unterschiedlichen Kalendertagen gesendet wurden.
   */
  public isNewDay(currentMsg: any, previousMsg: any): boolean {
    if (!previousMsg) return true;

    const current = currentMsg.asDate;
    const previous = previousMsg.asDate;

    return (
      current.getDate() !== previous.getDate() ||
      current.getMonth() !== previous.getMonth() ||
      current.getFullYear() !== previous.getFullYear()
    );
  }
}
