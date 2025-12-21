import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, inject, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { WishService } from './services/wish.service';
import { IntroComponent } from './components/intro/intro.component';
import { WishResultComponent } from './components/wish-result/wish-result.component';
import { IFRAME_MESSAGES, MODES, DOM_EVENTS, IFRAME_TARGET_ORIGIN, ANIMATION_TIMINGS } from './shared/constants';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, IntroComponent, WishResultComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate(ANIMATION_TIMINGS.FADE_IN, style({ opacity: 1 }))
      ])
    ])
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  wishService = inject(WishService);

  private lastHeight = 0;
  private resizeObserver: ResizeObserver | null = null;

  private messageHandler = (event: MessageEvent) => {
    this.handleParentMessage(event);
  };

  constructor(
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit(): void {
    window.addEventListener(DOM_EVENTS.MESSAGE, this.messageHandler);
    this.initResizeObserver();
  }

  ngOnDestroy(): void {
    window.removeEventListener(DOM_EVENTS.MESSAGE, this.messageHandler);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  onModeSelected(mode: typeof MODES.ORACLE | typeof MODES.MAX_FREI) {
    this.wishService.selectMode(mode);
  }

  reset() {
    this.wishService.reset();
  }

  reload() {
    window.location.reload();
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

  sendHeight(): void {
    const height = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );

    if (height !== this.lastHeight && height > 0) {
      this.lastHeight = height;
      if (this.document.defaultView?.parent) {
        this.document.defaultView.parent.postMessage({ iframeHeight: height }, IFRAME_TARGET_ORIGIN);
      }
    }
  }

  private handleParentMessage(event: MessageEvent): void {
    if (!event.data || !event.data.type) {
      return;
    }

    if (event.data.type === IFRAME_MESSAGES.SCROLL_TO_TOP) {
    }

    if (event.data.type === IFRAME_MESSAGES.SET_WISH) {
      const rawWish = event.data.wish;
      const rawImg = event.data.img;

      const wishIndex = parseInt(String(rawWish), 10);
      const imgIndex = rawImg !== undefined && rawImg !== null
        ? parseInt(String(rawImg), 10)
        : undefined;

      if (!isNaN(wishIndex)) {
        this.wishService.generateSpecificWish(wishIndex, imgIndex);
      }
    }
  }
}
