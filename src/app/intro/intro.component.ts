import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
})
export class IntroComponent implements OnInit {
  /**
   * Constructor for SomeComponent. Initializes the component with the Router service for navigation.
   *
   * @param router - Router service instance used to navigate between views or routes in the application.
   */
  constructor(private router: Router) {}

  ngOnInit(): void {
    // setTimeout(() => {
    //   this.router.navigate(['/main']);
    // }, 4000);
    // setTimeout(() => {
    //   const projectName = document.getElementById('main');
    //   if (projectName) {
    //     projectName.classList.add('d-none');
    //   }
    // }, 4000);
  }
}
