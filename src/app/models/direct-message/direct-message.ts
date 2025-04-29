import { serverTimestamp } from '@angular/fire/firestore';

export class DirectMessage {
  name: string;
  avatar: string;
  message: string;
  date: string;
  timestamp: any;
  from: string;
  to: string;
  newDay: boolean;

  constructor(obj?: any) {
    this.name = obj.username ? obj.username : '';
    this.avatar = obj.photo ? obj.photo : '';
    this.message = obj.content ? obj.content : '';
    this.date = obj ? obj.date : '';
    this.timestamp = obj ? obj.timestamp : serverTimestamp();
    this.from = obj.from ? obj.from : '';
    this.to = obj.to ? obj.to : '';
    this.newDay = false;
  }

  toJSON() {
    return {
      name: this.name,
      avatar: this.avatar,
      message: this.message,
      date: this.date,
      timestamp: this.timestamp,
      from: this.from,
      to: this.to,
      newDay: this.newDay,
    };
  }
}
