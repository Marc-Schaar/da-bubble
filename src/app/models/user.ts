export class User {
  fullname: string;
  email: string;
  password: string;
  profilephoto: string;
  messages: string[];
  online: boolean;

  constructor(obj?: any) {
    this.fullname = obj ? obj.fullname : '';
    this.email = obj ? obj.email : '';
    this.password = obj ? obj.password : '';
    this.profilephoto = obj ? obj.profilephoto : '';
    this.messages = obj ? obj.messages : [];
    this.online = obj ? obj.online : false;
  }
}
