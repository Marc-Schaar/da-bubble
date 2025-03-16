export class Message {
  name: string;
  message: string;
  date: string;
  time: string;
  newDay: boolean;
  avatar: string;

  constructor(obj?: any) {
    this.name = obj ? obj.name : '';
    this.message = obj ? obj.message : '';
    this.date = obj ? obj.date : '';
    this.time = obj ? obj.time : '';
    this.newDay = obj ? obj.newDay : false;
    this.avatar = obj ? obj.avatar : '';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      date: this.date,
      time: this.time,
      newDay: this.newDay,
      avatar: this.avatar,
    };
  }
}
