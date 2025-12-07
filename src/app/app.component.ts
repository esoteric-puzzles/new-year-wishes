import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataLoaderService } from './services/data-loader.service';
import { FormsModule } from '@angular/forms';
import seedrandom from 'seedrandom';
import { v4 as uuidv4 } from 'uuid';
import { BlurhashImageComponent } from './blurhash-image/blurhash-image.component';
import blurhashData from '../assets/blurhash.json';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, BlurhashImageComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideInUp', [
      transition(':enter', [
        style({ 
          opacity: 0, 
          transform: 'translateY(30px)' 
        }),
        animate('600ms ease-out', style({ 
          opacity: 1, 
          transform: 'translateY(0)' 
        }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('400ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class AppComponent implements OnInit, AfterViewChecked {
  actionButtonClicked = false;

  uiDataLoaded = false;
  uiData: any = null;


  wishesDataLoading = false;
  generatedWish: any = null;

  wishImagesCount = 50;

  loadingError = false;

  private lastHeight = 0;

  imageLoaded = false;
  introImageLoaded = false;

  blurhashes: any = blurhashData;

  // To be able to reconstruct a prophecy via URL
  currentWishIndex: number | null = null;   // 1-based
  currentImageIndex: number | null = null;  // 1-based
  linkCopied = false;

  // Deep-link params (start directly with a specific wish)
  startWithWish = false;
  private pendingWishIndex: number | null = null;
  private pendingImageIndex: number | null = null;

  constructor(private dataLoaderService: DataLoaderService) {
  }

  ngOnInit(): void {
    this.loadUiData();
    this.checkUrlParameters();
  }

  ngAfterViewChecked(): void {
    this.sendHeight();
  }

  onIntroImageLoad(): void {
    this.introImageLoaded = true;
    setTimeout(() => this.sendHeight(), 100);
  }

  onWishImageLoad(): void {
    this.imageLoaded = true;
    setTimeout(() => this.sendHeight(), 100);
  }

  sendHeight(): void {
    setTimeout(() => {
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );
      
      if (height !== this.lastHeight && height > 0) {
        this.lastHeight = height;
        if (window.parent) {
          window.parent.postMessage({ iframeHeight: height }, '*');
        }
      }
    }, 0);
  }

  checkUrlParameters(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const wishOverride = urlParams.get('wish');
    const imgOverride = urlParams.get('img');
    
    if (wishOverride && !isNaN(parseInt(wishOverride))) {
      const wishIndex = parseInt(wishOverride);
      const imgIndex = imgOverride && !isNaN(parseInt(imgOverride))
        ? parseInt(imgOverride)
        : undefined;

      this.startWithWish = true;
      this.pendingWishIndex = wishIndex;
      this.pendingImageIndex = imgIndex ?? null;
    }
  }

  generateSpecificWish(wishIndex: number, imageIndex?: number): void {
    this.wishesDataLoading = true;
    this.dataLoaderService.startLoading("Wishes").subscribe({
      next: data => {
        this.wishesDataLoading = false;
        const wishes = data.Wishes;
        const numberOfWishes = Object.keys(data.Wishes)?.length;
        
        // Use specific wish index (1-based to 0-based)
        const index = Math.min(Math.max(0, wishIndex - 1), numberOfWishes - 1);

        const imgIdx = imageIndex ?? wishIndex;

        this.currentWishIndex = wishIndex;
        this.currentImageIndex = imgIdx;

        this.actionButtonClicked = true;
        this.generatedWish = {
          title: this.uiData?.generatedWishTitle,
          text: Object.values(wishes)[index] as string[],
          image: imgIdx
        }
        
        console.log('Testing wish:', wishIndex, 'Text length:', this.generatedWish.text.join('').length);
        setTimeout(() => this.sendHeight(), 500);
        setTimeout(() => this.sendHeight(), 1000);
      },
      error: (error) => {
        this.loadingError = true;
      }
    });
  }

  loadUiData() {
    this.dataLoaderService.startLoading("UI").subscribe({
      next: data => {
        this.uiData = data?.UI;
        this.uiDataLoaded = true;

        // If we have deep-link params, start with that wish immediately
        if (this.pendingWishIndex != null) {
          this.generateSpecificWish(
            this.pendingWishIndex,
            this.pendingImageIndex ?? undefined
          );
        } else {
          setTimeout(() => this.sendHeight(), 500);
        }
      },
      error: (error) => {
        this.loadingError = true;
      }
    });
  }

  generateWish() {
    this.wishesDataLoading = true;
    this.dataLoaderService.startLoading("Wishes").subscribe({
      next: data => {
        this.wishesDataLoading = false;

        const wishes = data.Wishes;
        const numberOfWishes = Object.keys(data.Wishes)?.length;

        this.actionButtonClicked = true;

        const randomIndex = this.getRandomInt(numberOfWishes);  // 0-based text index
        const imageIndex = this.getRandomInt(this.wishImagesCount) + 1; // 1-based image index

        this.imageLoaded = false; // Reset image loaded state

        this.currentWishIndex = randomIndex + 1; // store as 1-based for URL
        this.currentImageIndex = imageIndex;

        this.generatedWish = {
          title: this.uiData?.generatedWishTitle,
          text: Object.values(wishes)[randomIndex] as string[],
          image: imageIndex
        }

        setTimeout(() => this.sendHeight(), 500);
        setTimeout(() => this.sendHeight(), 1000);
      },
      error: (error) => {
        this.loadingError = true;
      }
    });
  }

  copyProphecyLink() {
    if (!this.currentWishIndex) {
      return;
    }

    // Base URL — current address (for standalone mode)
    let url = new URL(window.location.href);

    // If the app is embedded in sphinx.vision, use the parent page URL
    try {
      if (document.referrer) {
        const refUrl = new URL(document.referrer);
        // Check that the domain is sphinx.vision (or another allowed production domain)
        if (refUrl.hostname.includes('sphinx.vision')) {
          url = refUrl;
        }
      }
    } catch (e) {
      // Ignore referrer parsing errors and fall back to the current URL
      console.warn('Failed to use document.referrer, fallback to current URL', e);
    }
    url.searchParams.set('wish', String(this.currentWishIndex));

    if (this.currentImageIndex) {
      url.searchParams.set('img', String(this.currentImageIndex));
    } else {
      url.searchParams.delete('img');
    }

    const link = url.toString();

    const onSuccess = () => {
      this.linkCopied = true;
      setTimeout(() => (this.linkCopied = false), 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(onSuccess).catch(() => {
        window.prompt('Скопируйте ссылку на пророчество:', link);
      });
    } else {
      window.prompt('Скопируйте ссылку на пророчество:', link);
    }
  }

  resetToStart() {
    this.actionButtonClicked = false;
    this.generatedWish = null;
    this.currentWishIndex = null;
    this.currentImageIndex = null;
    this.linkCopied = false;
    this.startWithWish = false;
    this.pendingWishIndex = null;
    this.pendingImageIndex = null;

    // Clear wish/img parameters in the URL without reloading the page
    const url = new URL(window.location.href);
    url.searchParams.delete('wish');
    url.searchParams.delete('img');
    window.history.replaceState(null, '', url.toString());

    // Scroll the page back to the top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // Recalculate height for the iframe
    setTimeout(() => this.sendHeight(), 0);
  }

  getBlurhash(imageName: string): string {
    const data = this.blurhashes[imageName];
    return data?.hash || data || '';
  }

  getImageDimensions(imageName: string): { width: number, height: number } | null {
    const data = this.blurhashes[imageName];
    if (data?.width && data?.height) {
      return { width: data.width, height: data.height };
    }
    return null;
  }

  getRandomInt(max: number) {
    let random = Math.floor(Math.random() * max);
    try {
      if (this.isCryptoSupported()) {
        random = this.getCryptoRandomInt(max);
      } else {
        random = this.getRandomSeedInt(max);
      }
    } catch (e) {
      console.error('Fallback to Math.random() due to error in crypto or seedrandom:', e);
    }
    return random;
  }

  getRandomSeedInt(max: number): number {
    const uuid = uuidv4();

    const timestamp = new Date().getTime();
    const combinedSeed = `${uuid}-${timestamp}`;

    const rng = seedrandom(combinedSeed);

    return Math.floor(rng() * max);
  }

  getCryptoRandomInt(max: number): number {
    const randomArray = new Uint32Array(1);
    const range = Math.floor(0xFFFFFFFF / max) * max; // Largest multiple of max
    
    // Rejection sampling to avoid modulo bias
    let randomValue;
    do {
      window.crypto.getRandomValues(randomArray);
      randomValue = randomArray[0];
    } while (randomValue >= range);
    
    return randomValue % max;
  }

  isCryptoSupported(): boolean {
    try {
      const testArray = new Uint8Array(1);
      window.crypto.getRandomValues(testArray); // This should not throw an error if supported
      return true;
    } catch (e) {
      return false;
    }
  }
}
