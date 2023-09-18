import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModelRoutingModule } from './model-routing.module';
import { ModelComponent } from './model.component';

import { CesiumMapModule } from '../cesium-map/cesium-map.module';
import { SharedModule } from '../shared.module';

@NgModule({
  declarations: [
    ModelComponent
  ],
  imports: [
    CommonModule,
    ModelRoutingModule,
    SharedModule,
    CesiumMapModule
  ]
})
export class ModelModule {

}
