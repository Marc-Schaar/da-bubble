import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
})
export class IntroComponent implements OnInit {
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
