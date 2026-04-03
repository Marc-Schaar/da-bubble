import { serverTimestamp } from '@angular/fire/firestore';

export abstract class BaseMessage {
  id: string;
  name: string;
  photoUrl: string;
  message: string;
  date: string;
  timestamp: any;
  newDay: boolean;

  constructor(obj?: any) {
    this.id = obj?.id || '';
    this.name = obj?.name || obj?.username || '';
    this.photoUrl = obj?.photoUrl || '';
    this.message = obj?.message || '';
    this.date = obj?.date || '';
    this.timestamp = obj?.timestamp || serverTimestamp();
    this.newDay = obj?.newDay || false;
  }

  get asDate(): Date | null {
    if (!this.timestamp) return null;
    return typeof this.timestamp.toDate === 'function' ? this.timestamp.toDate() : new Date(this.timestamp);
  }

  protected getBaseJSON() {
    return {
      name: this.name,
      photoUrl: this.photoUrl,
      message: this.message,
      date: this.date,
      timestamp: this.timestamp,
      newDay: this.newDay,
    };
  }
}
