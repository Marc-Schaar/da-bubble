import { serverTimestamp } from '@angular/fire/firestore';
export class Message {
  name: string;
  message: string;
  date: string;
  timestamp: any;
  newDay: boolean;
  avatar: string;
  reaction: string[];

  constructor(obj?: any) {
    this.name = obj ? obj.name : '';
    this.message = obj ? obj.message : '';
    this.date = obj ? obj.date : '';
    this.timestamp = obj ? obj.timestamp : serverTimestamp();
    this.newDay = obj ? obj.newDay : false;
    this.avatar = obj ? obj.avatar : '';
    this.reaction = obj ? obj.reaction : [];
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      date: this.date,
      timestamp: this.timestamp,
      newDay: this.newDay,
      avatar: this.avatar,
      reaction: this.reaction,
    };
  }
}
