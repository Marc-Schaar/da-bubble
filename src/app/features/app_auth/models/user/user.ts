export class User {
  fullname: string;
  email: string;
  password: string;
  profilephoto: string;
  online: boolean;
  id: string;

  /**
   * @constructor
   * Initializes a new instance of the User class.
   * @param obj Optional object to initialize the User properties.
   */
  constructor(obj?: any) {
    this.fullname = obj ? obj.fullname : '';
    this.email = obj ? obj.email : '';
    this.password = obj ? obj.password : '';
    this.profilephoto = obj ? obj.profilephoto : '';
    this.online = obj ? obj.online : false;
    this.id = obj ? obj.id : '';
  }
}
