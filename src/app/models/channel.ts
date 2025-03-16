export class Channel {
  name: string;
  member: string[];
  description: string;
  creator: string;

  constructor(obj?: any) {
    this.name = obj ? obj.name : '';
    this.member = obj ? obj.member : '';
    this.description = obj ? obj.description : '';
    this.creator = obj ? obj.creator : '';
  }
}
