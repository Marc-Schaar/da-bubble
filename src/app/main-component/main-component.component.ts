import { Component, inject, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SignInComponent } from '../sign-in/sign-in.component';
import { UserService } from '../shared.service';
import { IntroComponent } from '../intro/intro.component';

@Component({
  selector: 'app-main-component',
  imports: [HeaderComponent, FooterComponent, SignInComponent, IntroComponent],
  templateUrl: './main-component.component.html',
  styleUrl: './main-component.component.scss',
})
export class MainComponentComponent implements OnInit {
  shareddata = inject(UserService);
  ngOnInit(): void {
    this.shareddata.dashboard = false;
    this.shareddata.login = true;
  }
}
