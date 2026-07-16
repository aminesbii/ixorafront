import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

export interface ViewerImage {
  url: string;
  alt: string;
}

@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrls: ['./image-viewer.component.css'],
  standalone: false
})
export class ImageViewerComponent {
  @Input() images: ViewerImage[] = [];
  @Input() currentIndex = 0;
  @Output() closeViewer = new EventEmitter<void>();

  imageLoaded = false;
  touchStartX = 0;
  touchStartY = 0;

  get currentImage(): ViewerImage | null {
    return this.images[this.currentIndex] || null;
  }

  prev(): void {
    this.imageLoaded = false;
    this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.images.length - 1;
  }

  next(): void {
    this.imageLoaded = false;
    this.currentIndex = this.currentIndex < this.images.length - 1 ? this.currentIndex + 1 : 0;
  }

  close(): void {
    this.closeViewer.emit();
  }

  onImageLoad(): void {
    this.imageLoaded = true;
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent): void {
    const dx = event.changedTouches[0].clientX - this.touchStartX;
    const dy = event.changedTouches[0].clientY - this.touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx > 0) this.prev();
      else this.next();
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.close();
    else if (event.key === 'ArrowLeft') this.prev();
    else if (event.key === 'ArrowRight') this.next();
  }
}
