import { inject, Injectable } from '@angular/core';
import { User } from '../models/user';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ChatServiceService {
  constructor() {}

  router: Router = inject(Router);

  login = false;
  user: any = new User();

  setUser(user: User) {
    this.user = user;
  }

  getUser(): User {
    return this.user;
  }

  redirectiontodashboard() {
    this.router.navigate(['/chat']);
  }

  redirectiontologinpage() {
    this.router.navigate(['/main']);
  }
}
