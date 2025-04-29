import { Component, inject, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { User } from '../models/user/user';
import { Firestore, setDoc, doc } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { UserService } from '../shared.service';

@Component({
  selector: 'app-signup',
  imports: [HeaderComponent, FooterComponent, RouterLink, FormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss',
})
export class SignupComponent implements OnInit {
  sharedservice = inject(UserService);
  Auth = inject(Auth);
  user = new User();
  checked = false;
  ngOnInit(): void {
    this.sharedservice.login = false;
  }
  constructor(public firestore: Firestore) {}

  async onSubmit(useraccount: NgForm) {
    if (useraccount.valid) {
      console.log(this.user);
      this.sharedservice.setUser(this.user);
      this.sharedservice.redirectiontoavatarselection();
      this.checked = false;
      setTimeout(() => {
        useraccount.reset();
      }, 1000);
    }
  }
}
