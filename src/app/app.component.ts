import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataLoaderService } from './services/data-loader.service';
import { FormsModule } from '@angular/forms';
import seedrandom from 'seedrandom';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
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

  constructor(private dataLoaderService: DataLoaderService) {
  }

  ngOnInit(): void {
    this.loadUiData();
  }

  ngAfterViewChecked(): void {
    this.sendHeightToParent();
  }

  onImageLoad(): void {
    setTimeout(() => this.sendHeightToParent(), 100);
    setTimeout(() => this.sendHeightToParent(), 300);
    setTimeout(() => this.sendHeightToParent(), 600);
  }

  sendHeightToParent(): void {
    const height = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    
    if (height > 0) {
      this.lastHeight = height;
      // Send message to parent window
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'resize',
          height: height + 50 // Add extra padding
        }, '*');
        
        console.log('Sending height to parent:', height + 50);
      }
    }
  }

  loadUiData() {
    this.dataLoaderService.startLoading("UI").subscribe({
      next: data => {
        this.uiData = data?.UI;
        this.uiDataLoaded = true;
        setTimeout(() => this.sendHeightToParent(), 200);
        setTimeout(() => this.sendHeightToParent(), 500);
        setTimeout(() => this.sendHeightToParent(), 1000);
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

        const randomIndex = this.getRandomInt(numberOfWishes);

        this.generatedWish = {
          title: this.uiData?.generatedWishTitle,
          text: Object.values(wishes)[randomIndex] as string[],
          image: this.getRandomInt(this.wishImagesCount) + 1
        }

        // Wait for images to load before sending height - multiple attempts
        setTimeout(() => this.sendHeightToParent(), 200);
        setTimeout(() => this.sendHeightToParent(), 500);
        setTimeout(() => this.sendHeightToParent(), 1000);
        setTimeout(() => this.sendHeightToParent(), 1500);
      },
      error: (error) => {
        this.loadingError = true;
      }
    });
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
