export class Channel {
  name: string;
  member: string[];
  description: string;
  creator: string;

  /**
   * @constructor
   * Initializes a new instance of the Channel class.
   * @param obj Optional object to initialize the Channel properties.
   */
  constructor(obj?: any) {
    this.name = obj ? obj.name : '';
    this.member = obj ? obj.member : [];
    this.description = obj ? obj.description : '';
    this.creator = obj ? obj.creator : '';
  }
}
