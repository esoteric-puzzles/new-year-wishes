import { Component, Input, OnInit, ElementRef, ViewChild, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { decode } from 'blurhash';

@Component({
  selector: 'app-blurhash-image',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blurhash-image.component.html',
  styleUrl: './blurhash-image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlurhashImageComponent implements OnInit {
  @Input() src!: string;
  @Input() alt: string = '';
  @Input() blurhash!: string;
  @Input() imageWidth?: number;  // Real image dimensions
  @Input() imageHeight?: number; // Real image dimensions
  @Input() width: number = 32;   // Blurhash decode resolution
  @Input() height: number = 32;  // Blurhash decode resolution

  @ViewChild('blurhashCanvas', { static: false }) canvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('actualImage', { static: false }) image?: ElementRef<HTMLImageElement>;

  imageLoaded = false;

  get aspectRatio(): string {
    if (this.imageWidth && this.imageHeight) {
      return `${this.imageWidth} / ${this.imageHeight}`;
    }
    return 'auto';
  }

  constructor(private ngZone: NgZone) { }

  ngOnInit() {
    if (this.blurhash) {
      // Decode blurhash on next tick to ensure canvas is rendered
      // We do this outside Angular to avoid blocking the main UI thread with heavy work
      // causing change detection triggers
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => this.drawBlurhash(), 0);
      });
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

  onImageLoad(event: Event) {
    // We are binding this event in template, so it runs in Angular zone by default.
    this.imageLoaded = true;
  }
}

