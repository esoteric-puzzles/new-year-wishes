import { Component, Input, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { decode } from 'blurhash';

@Component({
  selector: 'app-blurhash-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="blurhash-container">
      <canvas #blurhashCanvas 
              *ngIf="!imageLoaded" 
              class="blurhash-canvas"
              [width]="width"
              [height]="height">
      </canvas>
      <img [src]="src" 
           [alt]="alt"
           [class.loaded]="imageLoaded"
           (load)="onImageLoad()"
           class="blurhash-image">
    </div>
  `,
  styles: [`
    .blurhash-container {
      position: relative;
      width: 100%;
      display: block;
    }

    .blurhash-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 5px;
      object-fit: cover;
    }

    .blurhash-image {
      width: 100%;
      height: auto;
      display: block;
      border-radius: 5px;
      opacity: 0;
      transition: opacity 0.4s ease-in-out;
    }

    .blurhash-image.loaded {
      opacity: 1;
    }
  `]
})
export class BlurhashImageComponent implements OnInit {
  @Input() src!: string;
  @Input() alt: string = '';
  @Input() blurhash!: string;
  @Input() width: number = 32;
  @Input() height: number = 32;

  @ViewChild('blurhashCanvas', { static: false }) canvas?: ElementRef<HTMLCanvasElement>;

  imageLoaded = false;

  ngOnInit() {
    if (this.blurhash) {
      // Decode blurhash on next tick to ensure canvas is rendered
      setTimeout(() => this.drawBlurhash(), 0);
    }
  }

  drawBlurhash() {
    if (!this.canvas || !this.blurhash) return;

    try {
      const pixels = decode(this.blurhash, this.width, this.height);
      const ctx = this.canvas.nativeElement.getContext('2d');
      
      if (ctx) {
        const imageData = ctx.createImageData(this.width, this.height);
        imageData.data.set(pixels);
        ctx.putImageData(imageData, 0, 0);
      }
    } catch (error) {
      console.error('Error decoding blurhash:', error);
    }
  }

  onImageLoad() {
    this.imageLoaded = false;
  }
}

