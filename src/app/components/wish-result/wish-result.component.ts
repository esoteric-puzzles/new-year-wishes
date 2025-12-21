import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlurhashImageComponent } from '../../blurhash-image/blurhash-image.component';
import { Wish, WishService } from '../../services/wish.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { FOLDERS, ASSETS, ANIMATION_TIMINGS } from '../../shared/constants';

@Component({
    selector: 'app-wish-result',
    standalone: true,
    imports: [CommonModule, BlurhashImageComponent],
    template: `
    <div class="wish-result" *ngIf="wish" [@slideInUp]>
      <div class="wish-title" [class.max-frei]="wish.imageFolder === FOLDERS.MAX_FREU">
        {{ wish.title }}
      </div>
      
      <div class="wish-text" [class.max-frei]="wish.imageFolder === FOLDERS.MAX_FREU">
         <ng-container *ngFor="let line of getTextAsArray(wish.text)">
             <p *ngIf="line.trim(); else addBr">{{ line }}</p>
             <ng-template #addBr>
                 <p class="break"> </p>
             </ng-template>
         </ng-container>
      </div>

      <div class="wish-picture">
         <app-blurhash-image
            [src]="getImageUrl()"
            alt="Wish Picture" 
            [blurhash]="getBlurhash()" 
            [imageWidth]="getImageDims()?.width"
            [imageHeight]="getImageDims()?.height" 
            [width]="32" [height]="32">
         </app-blurhash-image>
      </div>
    </div>
  `,
    styles: [`
    .wish-result {
        text-align: center;
        margin-bottom: 30px;
        max-width: 550px;
        margin-left: auto;
        margin-right: auto;
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

    .wish-title.max-frei {
        font-family: 'Barkentina', cursive;
    }

    .wish-text {
        margin-top: 40px;
        max-width: 620px;
        font-family: 'Belepotan', sans-serif;
        margin-bottom: 60px;
        margin-left: auto;
        margin-right: auto;
        
        p {
            margin: 0px;
            margin-top: 5px;
        }

        p.break {
            margin: 22px;
        }
    }

    .wish-text.max-frei {
        font-family: 'Barkentina', cursive;
    }

    .wish-picture {
        margin-top: 10px;
        width: 100%;
        display: flex;
        justify-content: center;
    }

    ::ng-deep .wish-picture img {
         max-width: 100%;
         height: auto;
    }

    @media (max-width: 480px) {
        .wish-title {
            font-size: 28px !important;
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
export class WishResultComponent {
    @Input({ required: true }) wish!: Wish;

    FOLDERS = FOLDERS;
    private wishService = inject(WishService);

    getTextAsArray(text: string | string[]): string[] {
        return Array.isArray(text) ? text : [text];
    }

    getImageUrl(): string {
        return `${ASSETS.BASE_PATH}${this.wish.imageFolder}/webp/${this.wish.image}.webp`;
    }

    getBlurhash(): string {
        if (this.wish.imageFolder === FOLDERS.WISHES) {
            return this.wishService.getBlurhash(String(this.wish.image));
        }

        if (this.wish.imageFolder === FOLDERS.MAX_FREU) {
            return this.wishService.getBlurhash(`${FOLDERS.MAX_FREU}/${this.wish.image}`);
        }
        return this.wishService.getBlurhash(String(this.wish.image));
    }

    getImageDims() {
        let key = String(this.wish.image);
        if (this.wish.imageFolder === FOLDERS.MAX_FREU) {
            key = `${FOLDERS.MAX_FREU}/${this.wish.image}`;
        }
        return this.wishService.getImageDimensions(key);
    }
}
