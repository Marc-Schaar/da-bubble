import { serverTimestamp } from '@angular/fire/firestore';
import { toDateSafe } from '../../../../shared/utils/timestamp.util';

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
    return toDateSafe(this.timestamp);
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
