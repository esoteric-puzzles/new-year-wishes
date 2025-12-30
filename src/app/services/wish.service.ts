import { Injectable, Inject, inject, signal, computed, WritableSignal, DestroyRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { DataLoaderService } from './data-loader.service';
import seedrandom from 'seedrandom';
import { v4 as uuidv4 } from 'uuid';
import imageCounts from '../../assets/image-data.json';
import blurhashData from '../../assets/blurhash.json';
import { MODES, FOLDERS, UI, URL_PARAMS, LOG_MESSAGES } from '../shared/constants';

export interface Wish {
    title?: string;
    text: string | string[];
    image: string | number;
    imageFolder: typeof FOLDERS.WISHES | typeof FOLDERS.MAX_FREU;
}

export interface UiData {
    wishHeader?: string;
    wishMainText?: string | string[];
    wishMainTextSecondary?: string | string[];
    oraculActionButtonText?: string;
    maxFreiActionButtonText?: string;
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
    private _mode = signal<typeof MODES.ORACLE | typeof MODES.MAX_FREI>(MODES.ORACLE);

    readonly uiData = this._uiData.asReadonly();
    readonly generatedWish = this._generatedWish.asReadonly();
    readonly loading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();
    readonly mode = this._mode.asReadonly();

    readonly hasWish = computed(() => !!this._generatedWish());

    private oracleImages: string[] = imageCounts[FOLDERS.WISHES];
    private maxFreiImages: string[] = imageCounts[FOLDERS.MAX_FREU];
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
        this.dataLoader.startLoading(UI.SHEET_NAME)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    this._uiData.set(data?.[UI.SHEET_NAME]);
                    this._loading.set(false);
                },
                error: (err) => {
                    console.error(LOG_MESSAGES.UI_DATA_LOAD_ERROR, err);
                    this._error.set(true);
                    this._loading.set(false);
                }
            });
    }

    selectMode(mode: typeof MODES.ORACLE | typeof MODES.MAX_FREI) {
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
                    const imagesPool = currentMode === MODES.MAX_FREI ? this.maxFreiImages : this.oracleImages;
                    const randomImageIndex = this.getRandomInt(imagesPool.length);
                    const imageId = imagesPool[randomImageIndex];
                    const imageFolder = currentMode === MODES.MAX_FREI ? FOLDERS.MAX_FREU : FOLDERS.WISHES;

                    const newWish: Wish = {
                        title: this._uiData()?.generatedWishTitle,
                        text: wishesArray[randomIndex],
                        image: imageId,
                        imageFolder: imageFolder
                    };

                    this._generatedWish.set(newWish);
                    this._loading.set(false);
                },
                error: (err) => {
                    console.error(LOG_MESSAGES.GENERATE_WISH_ERROR, err);
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

                    const imageFolder = currentMode === MODES.MAX_FREI ? FOLDERS.MAX_FREU : FOLDERS.WISHES;

                    const newWish: Wish = {
                        title: this._uiData()?.generatedWishTitle,
                        text: wishesArray[index],
                        image: imgIdx,
                        imageFolder: imageFolder
                    };

                    this._generatedWish.set(newWish);
                    this._loading.set(false);
                },
                error: (err) => {
                    console.error(LOG_MESSAGES.LOAD_SPECIFIC_WISH_ERROR, err);
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
            queryParams: { [URL_PARAMS.WISH]: null, [URL_PARAMS.IMG]: null },
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
            console.error(LOG_MESSAGES.MATH_RANDOM_FALLBACK, e);
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
