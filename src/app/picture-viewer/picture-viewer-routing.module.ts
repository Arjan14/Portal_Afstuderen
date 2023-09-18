import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PictureViewerComponent } from './picture-viewer.component';

const routes: Routes = [{ path: '', component: PictureViewerComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PictureViewerRoutingModule { }
