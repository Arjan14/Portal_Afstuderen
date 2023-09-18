import { Component, OnInit } from '@angular/core';
import { FireService } from '../shared/fire.service';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  
  username: string = "";
  password: string = "";
  
  constructor(public fireService: FireService, private router: Router) { }

  ngOnInit(): void {
   if(this.fireService.auth.currentUser!=null)  {
    this.router.navigate(['/dashboard']);
   }
  }



}
