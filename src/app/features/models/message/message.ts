import { serverTimestamp } from '@angular/fire/firestore';
export class Message {
  name: string;
  avatar: string;
  message: string;
  date: string;
  timestamp: any;
  newDay: boolean;
  reaction: string[];

  /**
   * @constructor
   * Initializes a new instance of the Message class.
   * @param obj Optional object to initialize the Message properties.
   */
  constructor(obj?: any) {
    this.name = obj ? obj.name : '';
    this.message = obj ? obj.message : '';
    this.date = obj ? obj.date : '';
    this.timestamp = obj ? obj.timestamp : serverTimestamp();
    this.newDay = obj ? obj.newDay : false;
    this.avatar = obj ? obj.avatar : '';
    this.reaction = obj ? obj.reaction : [];
  }

  /**
   * Converts the Message instance to a JSON object.
   * @returns A JSON representation of the Message instance.
   */
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
