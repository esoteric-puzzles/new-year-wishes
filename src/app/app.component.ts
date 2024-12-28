import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
export class AppComponent implements OnInit {
  actionButtonClicked = false;

  uiDataLoaded = false;
  uiData: any = null;


  wishesDataLoading = false;
  generatedWish: any = null;

  wishImagesCount = 17;

  loadingError = false;

  constructor(private dataLoaderService: DataLoaderService) {
  }

  ngOnInit(): void {
    this.loadUiData();
  }

  loadUiData() {
    this.dataLoaderService.startLoading("UI").subscribe({
      next: data => {
        this.uiData = data?.UI;
        this.uiDataLoaded = true;
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

      },
      error: (error) => {
        this.loadingError = true;
      }
    });
  }

  getRandomInt(max: number): number {
    const uuid = uuidv4();
    const rng = seedrandom(uuid);
    return Math.floor(rng() * max);
  }
}
