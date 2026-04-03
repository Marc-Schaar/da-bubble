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
