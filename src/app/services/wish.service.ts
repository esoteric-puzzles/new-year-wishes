import { Injectable, Inject, inject, signal, computed, WritableSignal, DestroyRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { DataLoaderService } from './data-loader.service';
import seedrandom from 'seedrandom';
import { v4 as uuidv4 } from 'uuid';
import imageCounts from '../../assets/image-data.json';
import blurhashData from '../../assets/blurhash.json';

export interface Wish {
    title?: string;
    text: string | string[];
    image: string | number;
    imageFolder: 'wishes' | 'max-freu';
}

export interface UiData {
    wishHeader?: string;
    wishMainText?: string[];
    generatedWishTitle?: string;
    dataLoadingIssue?: string;
    [key: string]: any;
}

@Injectable({
    providedIn: 'root'
})
export class WishService {
    private _uiData = signal<UiData | null>(null);
    private _generatedWish = signal<Wish | null>(null);
    private _loading = signal<boolean>(false);
    private _error = signal<boolean>(false);
    private _mode = signal<'Oracle' | 'MaxFrei'>('Oracle');

    readonly uiData = this._uiData.asReadonly();
    readonly generatedWish = this._generatedWish.asReadonly();
    readonly loading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();
    readonly mode = this._mode.asReadonly();

    readonly hasWish = computed(() => !!this._generatedWish());

    private oracleImages: string[] = imageCounts.wishes;
    private maxFreiImages: string[] = imageCounts["max-freu"];
    private blurhashes: any = blurhashData;

    private dataLoader = inject(DataLoaderService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private document = inject(DOCUMENT);
    private destroyRef = inject(DestroyRef);

    constructor() {
        this.loadUiData();
    }

    loadUiData() {
        this._loading.set(true);
        this.dataLoader.startLoading("UI")
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    this._uiData.set(data?.['UI']);
                    this._loading.set(false);
                },
                error: (err) => {
                    console.error("Failed to load UI data", err);
                    this._error.set(true);
                    this._loading.set(false);
                }
            });
    }

    selectMode(mode: 'Oracle' | 'MaxFrei') {
        this._mode.set(mode);
        this.generateWish();
    }

    generateWish() {
        const currentMode = this._mode();
        const sheetName = currentMode;
        this._loading.set(true);
        this._error.set(false);

        this.dataLoader.startLoading(sheetName)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    const rawWishes = data[sheetName];
                    const wishesArray = this.normalizeWishes(rawWishes);

                    if (!wishesArray.length) {
                        this._error.set(true);
                        this._loading.set(false);
                        return;
                    }

                    const randomIndex = this.getRandomInt(wishesArray.length);
                    const imagesPool = currentMode === 'MaxFrei' ? this.maxFreiImages : this.oracleImages;
                    const randomImageIndex = this.getRandomInt(imagesPool.length);
                    const imageId = imagesPool[randomImageIndex];
                    const imageFolder = currentMode === 'MaxFrei' ? 'max-freu' : 'wishes';

                    const newWish: Wish = {
                        title: this._uiData()?.generatedWishTitle,
                        text: wishesArray[randomIndex],
                        image: imageId,
                        imageFolder: imageFolder as 'wishes' | 'max-freu'
                    };

                    this._generatedWish.set(newWish);
                    this._loading.set(false);
                },
                error: (err) => {
                    console.error('[WishService] Error generating wish', err);
                    this._error.set(true);
                    this._loading.set(false);
                }
            });
    }

    generateSpecificWish(wishIndex: number, imageIndex?: number) {
        const currentMode = this._mode();
        const sheetName = currentMode;
        this._loading.set(true);

        this.dataLoader.startLoading(sheetName)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    const rawWishes = data[sheetName];
                    const wishesArray = this.normalizeWishes(rawWishes);

                    if (!wishesArray.length) {
                        this._error.set(true);
                        this._loading.set(false);
                        return;
                    }

                    const index = Math.min(Math.max(0, wishIndex - 1), wishesArray.length - 1);
                    const imgIdx = imageIndex ?? wishIndex;

                    const imageFolder = currentMode === 'MaxFrei' ? 'max-freu' : 'wishes';

                    const newWish: Wish = {
                        title: this._uiData()?.generatedWishTitle,
                        text: wishesArray[index],
                        image: imgIdx,
                        imageFolder: imageFolder as 'wishes' | 'max-freu'
                    };

                    this._generatedWish.set(newWish);
                    this._loading.set(false);
                },
                error: (err) => {
                    console.error('[WishService] Error loading specific wish', err);
                    this._error.set(true);
                    this._loading.set(false);
                }
            });
    }

    reset() {
        this._generatedWish.set(null);
        this._error.set(false);
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { wish: null, img: null },
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
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

    private getRandomInt(max: number) {
        let random = Math.floor(Math.random() * max);
        try {
            if (this.isCryptoSupported()) {
                random = this.getCryptoRandomInt(max);
            } else {
                random = this.getRandomSeedInt(max);
            }
        } catch (e) {
            console.error('Fallback to Math.random()', e);
        }
        return random;
    }

    private getRandomSeedInt(max: number): number {
        const uuid = uuidv4();
        const timestamp = new Date().getTime();
        const combinedSeed = `${uuid}-${timestamp}`;
        const rng = seedrandom(combinedSeed);
        return Math.floor(rng() * max);
    }

    private getCryptoRandomInt(max: number): number {
        const randomArray = new Uint32Array(1);
        const range = Math.floor(0xFFFFFFFF / max) * max;
        let randomValue;
        do {
            this.document.defaultView?.crypto.getRandomValues(randomArray);
            randomValue = randomArray[0];
        } while (randomValue >= range);
        return randomValue % max;
    }

    private isCryptoSupported(): boolean {
        try {
            const testArray = new Uint8Array(1);
            this.document.defaultView?.crypto.getRandomValues(testArray);
            return true;
        } catch (e) {
            return false;
        }
    }
}
