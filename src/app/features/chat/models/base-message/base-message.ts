import { serverTimestamp } from '@angular/fire/firestore';

export abstract class BaseMessage {
  id: string;
  name: string;
  photoUrl: string;
  message: string;
  timestamp: any;

  constructor(obj?: any) {
    this.id = obj?.id || '';
    this.name = obj?.name || obj?.username || '';
    this.photoUrl = obj?.photoUrl || '';
    this.message = obj?.message || '';
    this.timestamp = obj?.timestamp || serverTimestamp();
  }

  get asDate(): Date {
    if (!this.timestamp) return new Date();

    if (typeof this.timestamp.toDate === 'function') {
      return this.timestamp.toDate();
    }

    if (this.timestamp && typeof this.timestamp === 'object' && !('seconds' in this.timestamp)) {
      return new Date();
    }

    const date = new Date(this.timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  protected getBaseJSON() {
    return {
      name: this.name,
      photoUrl: this.photoUrl,
      message: this.message,
      timestamp: this.timestamp,
    };
  }
}
