import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CesiumMapComponent } from './cesium-map.component';
import { FormsModule } from '@angular/forms'; 
import {RouterLink} from "@angular/router";


@NgModule({
  declarations: [
    CesiumMapComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
  ],
  exports: [
    CesiumMapComponent
  ],
})
export class CesiumMapModule { }
