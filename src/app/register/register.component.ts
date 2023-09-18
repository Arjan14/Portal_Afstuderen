import { Component, OnInit } from '@angular/core';
import { FireService } from '../shared/fire.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  username: string = "";
  password: string = "";

  constructor(public fireService: FireService) { }

  ngOnInit(): void {
  }

}
