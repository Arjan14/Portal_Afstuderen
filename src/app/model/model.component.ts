import {Component, OnInit, Input, Inject} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {setTheme} from "ngx-bootstrap/utils";
import { DOCUMENT } from '@angular/common';
import {FireService} from "../shared/fire.service";
import { Router } from '@angular/router';

@Component({
  selector: 'app-model',
  templateUrl: './model.component.html',
  styleUrls: ['./model.component.scss']
})
export class ModelComponent implements OnInit {
  @Input() item = '';
  contentForm!: FormGroup;
  assetId: number = -1;
  tempAsset: number;
  tempUrl: string;

  constructor(private formBuilder: FormBuilder, @Inject(DOCUMENT) private document: Document, public fireService: FireService, private router: Router) {
    setTheme('bs5');
    
    // Config voor test/deploy

    //Lokaal
    this.tempAsset = +(this.document.location.href).slice(37);

    //Firebase 
    // this.tempAsset = +(this.document.location.href).slice(39);
  }

  ngOnInit(): void {
    this.contentForm = this.formBuilder.group({
      assetId: [this.tempAsset, [Validators.required]],
    });
    // @ts-ignore
    this.loadAsset();
        
    //Check of user wel ingelogd is.
    if(this.fireService.auth.currentUser == null) {
      this.router.navigate(['/login']);
    }
  }

  //Asset ingeladen
  loadAsset(): void {
    //Dit is de asset van de content form, hiervoor is het id -1
    this.assetId = this.contentForm.get('assetId')?.value;
  }

}
