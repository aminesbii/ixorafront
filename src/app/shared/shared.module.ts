import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParallaxDirective } from './directives/parallax.directive';
import { ImageViewerComponent } from './components/image-viewer/image-viewer.component';

@NgModule({
  declarations: [
    ParallaxDirective,
    ImageViewerComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ParallaxDirective,
    ImageViewerComponent
  ]
})
export class SharedModule { }
