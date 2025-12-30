import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlurhashImageComponent } from '../../blurhash-image/blurhash-image.component';
import { UiData } from '../../services/wish.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { MODES, ASSETS, BLURHASHES, ANIMATION_TIMINGS } from '../../shared/constants';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [CommonModule, BlurhashImageComponent],
  template: `
      <div class="wish-intro" [@slideInUp]>
      <div class="wish-title">
        {{ uiData?.wishHeader }}
      </div>

      <div class="wish-explanation">
        <p *ngFor="let text of getTextAsArray(uiData?.wishMainText)">{{ text }}</p>
      </div>

      <div class="wish-modes">
        <div class="wish-mode-card" (click)="selectMode(MODES.ORACLE)">
          <div class="wish-mode-image">
            <app-blurhash-image [src]="ASSETS.ORACLE_INTRO_IMG" alt="Oracle mode"
                                [blurhash]="BLURHASHES.ORACLE_INTRO" 
                                [imageWidth]="300"
                                [imageHeight]="300"
                                [width]="32" [height]="32">
            </app-blurhash-image>
          </div>
          <button class="wish-mode-label">
            {{ uiData?.oraculActionButtonText}}
          </button>
        </div>

        <div class="wish-mode-card" (click)="selectMode(MODES.MAX_FREI)">
          <div class="wish-mode-image">
            <app-blurhash-image [src]="ASSETS.MAX_FREI_INTRO_IMG" alt="Max Frei mode"
                                [blurhash]="BLURHASHES.MAX_FREI_INTRO"
                                [imageWidth]="300"
                                [imageHeight]="300"
                                [width]="32" [height]="32">
            </app-blurhash-image>
          </div>
          <button class="wish-mode-label">
             {{ uiData?.maxFreiActionButtonText}}
          </button>
        </div>
      </div>

      <div class="wish-explanation">
        <p *ngFor="let text of getTextAsArray(uiData?.wishMainTextSecondary)">{{ text }}</p>
      </div>
    </div>
  `,
  styles: [`
    .wish-intro {
      max-width: 550px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .wish-title {
      text-align: center;
      font-weight: bold;
      font-style: normal;
      font-size: 2em !important;
      font-family: 'Hanzi', sans-serif;
      font-optical-sizing: auto;
      font-variation-settings: "wdth" 100;
      color: #295182;
      margin-bottom: 8px;
    }

    .wish-explanation {
        margin-top: 40px;
        margin-bottom: 20px;
        max-width: 620px;
        font-family: 'Belepotan', sans-serif;
        text-align: center;
        line-height: 1.5;
        
        p {
            margin: 0 0 8px;
            &:last-child { margin-bottom: 0; }
        }
    }

    .wish-modes {
        display: flex;
        justify-content: center;
        gap: 32px;
        margin-top: 32px;
        flex-wrap: wrap;
        margin-bottom: 10px;
    }

    .wish-mode-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 240px;
        cursor: pointer;
    }

    .wish-mode-image {
        width: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 12px;

        ::ng-deep img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
    }

    .wish-mode-label {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px 18px;
        border-radius: 4px;
        border: none;
        background-color: #295182;
        color: #ffffff;
        font-family: 'Hanzi', sans-serif;
        font-size: 13px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        cursor: pointer;
    }

    @media (max-width: 600px) {
        .wish-modes {
            flex-direction: column;
            align-items: stretch;
            gap: 24px;
        }

        .wish-mode-card {
            width: 100%;
        }

        .wish-mode-label {
            width: 100%;
            height: 45px;
            font-size: 18px;
        }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideInUp', [
      transition(':enter', [
        style({ transform: 'translateY(30px)', opacity: 0 }),
        animate(ANIMATION_TIMINGS.SLIDE_IN_UP, style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class IntroComponent {
  @Input() uiData: UiData | null | undefined = null;
  @Output() modeSelected = new EventEmitter<'Oracle' | 'MaxFrei'>();

  MODES = MODES;
  ASSETS = ASSETS;
  BLURHASHES = BLURHASHES;

  selectMode(mode: 'Oracle' | 'MaxFrei') {
    this.modeSelected.emit(mode);
  }

  getTextAsArray(text: string | string[] | undefined | null): string[] {
    if (!text) return [];
    return Array.isArray(text) ? text : [text];
  }
}
