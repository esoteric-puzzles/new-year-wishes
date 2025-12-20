import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ElementRef, ChangeDetectorRef, inject, DestroyRef, Inject } from '@angular/core';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { CommonModule, DOCUMENT, ViewportScroller } from '@angular/common';
import { DataLoaderService } from './services/data-loader.service';
import { FormsModule } from '@angular/forms';
import seedrandom from 'seedrandom';
import { v4 as uuidv4 } from 'uuid';
import { BlurhashImageComponent } from './blurhash-image/blurhash-image.component';
import blurhashData from '../assets/blurhash.json';
import imageCounts from '../assets/image-data.json';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, BlurhashImageComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class AppComponent implements OnInit, OnDestroy {
  actionButtonClicked = false;

  uiDataLoaded = false;
  uiData: any = null;


  wishesDataLoading = false;
  generatedWish: any = null;

  // Image pools
  // Image pools (arrays of valid image IDs)
  oracleImages: string[] = imageCounts.wishes;
  maxFreiImages: string[] = imageCounts["max-freu"];

  // Resolved folder for current result image ('wishes' or 'max-freu')
  currentImageFolder: 'wishes' | 'max-freu' = 'wishes';

  loadingError = false;

  private lastHeight = 0;
  private resizeObserver: ResizeObserver | null = null;
  private destroyRef = inject(DestroyRef);
  private viewportScroller = inject(ViewportScroller);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Current source of wishes: 'Oracle' (default) or 'MaxFrei'
  currentMode: 'Oracle' | 'MaxFrei' = 'Oracle';

  imageLoaded = false;
  introImageLoaded = false;

  blurhashes: any = blurhashData;

  // To be able to reconstruct a prophecy via URL
  currentWishIndex: number | null = null;   // 1-based
  currentImageIndex: number | null = null;  // 1-based

  // Deep-link params (start directly with a specific wish)
  startWithWish = false;
  private pendingWishIndex: number | null = null;
  private pendingImageIndex: number | null = null;

  // Listener for messages from parent page (sphinx.vision)
  private messageHandler = (event: MessageEvent) => {
    this.handleParentMessage(event);
  };

  constructor(
    private dataLoaderService: DataLoaderService,
    private el: ElementRef,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document
  ) {
  }

  ngOnInit(): void {
    window.addEventListener('message', this.messageHandler);
    this.loadUiData();
    this.checkUrlParameters();
    this.initResizeObserver();
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.messageHandler);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private initResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.sendHeight();
      });
      this.resizeObserver.observe(document.body);
      this.resizeObserver.observe(document.documentElement);
    }
  }

  onIntroImageLoad(): void {
    this.introImageLoaded = true;
    this.cdr.markForCheck(); // Ensure UI updates if needed
    // ResizeObserver will handle height update
  }

  onWishImageLoad(): void {
    this.imageLoaded = true;
    this.cdr.markForCheck();
    // ResizeObserver will handle height update
  }

  /**
   * Read URL search parameters either from the current window
   * (standalone mode) or, if empty, from the embedding page
   * on sphinx.vision via document.referrer.
   */
  private getSearchParams(): URLSearchParams {

    // Prefer own URL params when they exist
    const snapshotParams = this.route.snapshot.queryParams;
    // Map Angular params to URLSearchParams-like object for compatibility
    if (Object.keys(snapshotParams).length > 0) {
      const params = new URLSearchParams();
      Object.keys(snapshotParams).forEach(key => params.append(key, snapshotParams[key]));
      return params;
    }

    if (this.document.defaultView?.location.search && this.document.defaultView.location.search.length > 1) {
      return new URLSearchParams(this.document.defaultView.location.search);
    }

    // Fallback: try to read params from the parent article on sphinx.vision
    try {
      if (this.document.referrer) {
        const refUrl = new URL(this.document.referrer);
        if (refUrl.hostname.includes('sphinx.vision')) {
          return new URLSearchParams(refUrl.search);
        }
      }
    } catch (e) {
      console.warn('Failed to parse search params from referrer', e);
    }

    return new URLSearchParams();
  }

  sendHeight(): void {
    // We can debounce this if needed, but for now just check usually
    const height = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );

    if (height !== this.lastHeight && height > 0) {
      this.lastHeight = height;
      if (this.document.defaultView?.parent) {
        this.document.defaultView.parent.postMessage({ iframeHeight: height }, '*');
      }
    }
  }

  checkUrlParameters(): void {
    const urlParams = this.getSearchParams();
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
      this.cdr.markForCheck();
    } else {
    }
  }

  private handleParentMessage(event: MessageEvent): void {

    if (!event.data || !event.data.type) {
      return;
    }

    if (event.data.type === 'setWish') {
      const rawWish = event.data.wish;
      const rawImg = event.data.img;

      const wishIndex = parseInt(String(rawWish), 10);
      const imgIndex = rawImg !== undefined && rawImg !== null
        ? parseInt(String(rawImg), 10)
        : undefined;

      if (isNaN(wishIndex)) {
        console.warn('[PostMessage] Invalid wish value in message:', rawWish);
        return;
      }


      this.startWithWish = true;
      this.pendingWishIndex = wishIndex;
      this.pendingImageIndex = imgIndex ?? null;
      this.cdr.markForCheck();

      if (this.uiDataLoaded) {
        this.generateSpecificWish(wishIndex, imgIndex);
      } else {
      }
    }
  }

  private normalizeWishes(rawWishes: any): string[][] {
    const values = Object.values(rawWishes ?? {});
    return values.map((v: any) => {
      if (Array.isArray(v)) {
        return v.map((x: any) => String(x));
      }
      if (v == null) {
        return [];
      }
      return [String(v)];
    });
  }

  generateSpecificWish(wishIndex: number, imageIndex?: number): void {
    const sheetName = this.currentMode || 'Oracle';
    this.wishesDataLoading = true;
    this.cdr.markForCheck();

    this.dataLoaderService.startLoading(sheetName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.wishesDataLoading = false;
          const rawWishes = data[sheetName];
          const wishesArray = this.normalizeWishes(rawWishes);
          const numberOfWishes = wishesArray.length;

          if (!numberOfWishes) {
            console.error('[Wish] No wishes found for sheet', sheetName, rawWishes);
            this.loadingError = true;
            this.cdr.markForCheck();
            return;
          }

          // Use specific wish index (1-based to 0-based)
          const index = Math.min(Math.max(0, wishIndex - 1), numberOfWishes - 1);

          const imgIdx = imageIndex ?? wishIndex;

          // Ensure we have a valid image ID if it wasn't explicitly provided
          // For specific wishes, we default to wishIndex, but if that image doesn't exist, we should probably fallback or just use it.
          // Given the legacy logic was just "use the number", we'll keep using the number as the ID.
          // However, if we want to be strictly correct, we could check if it exists in the pool.

          this.currentImageFolder = (this.currentMode === 'MaxFrei') ? 'max-freu' : 'wishes';


          this.currentWishIndex = wishIndex;
          this.currentImageIndex = imgIdx;

          this.actionButtonClicked = true;
          this.generatedWish = {
            title: this.uiData?.generatedWishTitle,
            text: wishesArray[index],
            image: imgIdx,
            imageFolder: this.currentImageFolder
          }

          const joinedText = Array.isArray(this.generatedWish.text)
            ? this.generatedWish.text.join('')
            : String(this.generatedWish.text ?? '');
          this.cdr.markForCheck();
          // Allow time for DOM to update then check height (ResizeObserver will typically catch this)
        },
        error: (error) => {
          console.error('[Wish] Error while loading specific wish data', error);
          this.loadingError = true;
          this.wishesDataLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadUiData() {
    this.dataLoaderService.startLoading("UI")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.uiData = data?.['UI'];
          this.uiDataLoaded = true;
          this.cdr.markForCheck();

          // If we have deep-link params, start with that wish immediately
          if (this.pendingWishIndex != null) {
            this.generateSpecificWish(
              this.pendingWishIndex,
              this.pendingImageIndex ?? undefined
            );
          }
        },
        error: (error) => {
          this.loadingError = true;
          this.cdr.markForCheck();
        }
      });
  }

  selectModeAndGenerate(mode: 'Oracle' | 'MaxFrei') {
    this.currentMode = mode;
    this.generateWish();
    // generateWish calls markForCheck
  }

  generateWish() {
    const sheetName = this.currentMode || 'Oracle';
    this.wishesDataLoading = true;
    this.cdr.markForCheck();

    this.dataLoaderService.startLoading(sheetName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.wishesDataLoading = false;

          const rawWishes = data[sheetName];
          const wishesArray = this.normalizeWishes(rawWishes);
          const numberOfWishes = wishesArray.length;

          if (!numberOfWishes) {
            console.error('[Wish] No wishes found for sheet', sheetName, rawWishes);
            this.loadingError = true;
            this.cdr.markForCheck();
            return;
          }

          this.actionButtonClicked = true;

          const randomIndex = this.getRandomInt(numberOfWishes);  // 0-based text index

          const imagesPool = this.currentMode === 'MaxFrei'
            ? this.maxFreiImages
            : this.oracleImages;

          const randomImageIndex = this.getRandomInt(imagesPool.length);
          const imageId = imagesPool[randomImageIndex];

          this.currentImageFolder = (this.currentMode === 'MaxFrei') ? 'max-freu' : 'wishes';


          this.imageLoaded = false; // Reset image loaded state

          this.currentWishIndex = randomIndex + 1; // store as 1-based for URL
          this.currentImageIndex = parseInt(imageId, 10);

          this.generatedWish = {
            title: this.uiData?.generatedWishTitle,
            text: wishesArray[randomIndex],
            image: imageId,
            imageFolder: this.currentImageFolder
          }

          const joinedText = Array.isArray(this.generatedWish.text)
            ? this.generatedWish.text.join('')
            : String(this.generatedWish.text ?? '');

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('[Wish] Error while loading random wish data', error);
          this.loadingError = true;
          this.wishesDataLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  resetToStart() {
    this.actionButtonClicked = false;
    this.generatedWish = null;
    this.currentWishIndex = null;
    this.currentImageIndex = null;
    this.startWithWish = false;
    this.pendingWishIndex = null;
    this.pendingImageIndex = null;

    // Clear wish/img parameters in the URL without reloading the page
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { wish: null, img: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    // Scroll the page back to the top
    this.viewportScroller.scrollToPosition([0, 0]);

    // Notify parent page (if embedded in an iframe) so it can also scroll to top
    try {
      const win = this.document.defaultView;
      if (win && win.parent && win.parent !== win) {
        win.parent.postMessage({ type: 'scrollToTop' }, '*');
      }
    } catch (e) {
      console.warn('[Scroll] Failed to send scrollToTop message to parent', e);
    }

    this.cdr.markForCheck();

    // Recalculate height for the iframe
    // ResizeObserver catches DOM changes, but we verify once just in case
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
      this.document.defaultView?.crypto.getRandomValues(randomArray);
      randomValue = randomArray[0];
    } while (randomValue >= range);

    return randomValue % max;
  }

  isCryptoSupported(): boolean {
    try {
      const testArray = new Uint8Array(1);
      this.document.defaultView?.crypto.getRandomValues(testArray); // This should not throw an error if supported
      return true;
    } catch (e) {
      return false;
    }
  }
}
