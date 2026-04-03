import { serverTimestamp } from '@angular/fire/firestore';

export abstract class BaseMessage {
  id: string;
  name: string;
  photoUrl: string;
  message: string;
  timestamp: any;
  newDay: boolean;

  constructor(obj?: any) {
    this.id = obj?.id || '';
    this.name = obj?.name || obj?.username || '';
    this.photoUrl = obj?.photoUrl || '';
    this.message = obj?.message || '';
    this.timestamp = obj?.timestamp || serverTimestamp();
    this.newDay = obj?.newDay || false;
  }

  get asDate(): Date {
    // 1. Prüfen, ob der Timestamp überhaupt existiert
    if (!this.timestamp) return new Date();

    // 2. Prüfen, ob es ein Firebase-Timestamp mit .toDate() ist
    if (typeof this.timestamp.toDate === 'function') {
      return this.timestamp.toDate();
    }

    // 3. Prüfen, ob es ein serverTimestamp-Platzhalter ist
    // (Diese haben oft eine 'method'-Eigenschaft oder sind interne Firebase-Objekte)
    if (this.timestamp && typeof this.timestamp === 'object' && !('seconds' in this.timestamp)) {
      return new Date(); // Fallback für lokale "fliegende" Nachrichten
    }

    // 4. Fallback für ISO-Strings oder Millisekunden
    const date = new Date(this.timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  protected getBaseJSON() {
    return {
      name: this.name,
      photoUrl: this.photoUrl,
      message: this.message,
      timestamp: this.timestamp,
      newDay: this.newDay,
    };
  }
}
