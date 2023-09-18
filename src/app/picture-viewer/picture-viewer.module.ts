import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxImageZoomModule } from 'ngx-image-zoom';
import { PictureViewerRoutingModule } from './picture-viewer-routing.module';
import { PictureViewerComponent } from './picture-viewer.component';


@NgModule({
  declarations: [
    PictureViewerComponent
  ],
  imports: [
    CommonModule,
    PictureViewerRoutingModule,
    NgxImageZoomModule
  ]
})
export class PictureViewerModule { }
