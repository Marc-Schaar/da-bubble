export class User {
  // fullname: string;
  // email: string;
  // password: string;
  // profilephoto: string;
  // online: boolean;
  // id: string;

  /**
   * @constructor
   * Initializes a new instance of the User class.
   * @param obj Optional object to initialize the User properties.
   */
  constructor(obj?: any) {
    // this.id = obj ? obj.id : '';
    // this.fullname = obj ? obj.fullname : '';
    // this.email = obj ? obj.email : '';
    // this.password = obj ? obj.password : '';
    // this.profilephoto = obj ? obj.profilephoto : '';
    // this.online = obj ? obj.online : false;
  }
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  online: boolean;
  isAnonymous?: boolean;
}

export interface RegisterData extends Omit<User, 'id'> {
  password: string;
}
