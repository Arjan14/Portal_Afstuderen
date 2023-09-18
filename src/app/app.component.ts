import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { setTheme } from 'ngx-bootstrap/utils';
import getDocumentElement from "@popperjs/core/lib/dom-utils/getDocumentElement";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }

}
