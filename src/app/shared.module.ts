import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';


const directives = [
]

@NgModule({
  declarations: [
    directives,
  ],
  imports: [HttpClientModule],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    directives,
  ]
})
export class SharedModule { }
