import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DataLoaderService } from './services/data-loader.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  actionButtonClicked = false;
  dataLoaded = false;

  data: any = null;
  generatedWish: any = null;
  wishImagesCount = 17;

  constructor(private dataLoaderService: DataLoaderService) {
  }

  ngOnInit(): void {
    this.dataLoaderService.startLoading().subscribe(data => {
      this.data = data;
      this.dataLoaded = true;
      console.log("data", data);
    });
  }

  generateWish() {
    const wishes = this.data.Wishes;
    const numberOfWishes = Object.keys(this.data.Wishes)?.length;

    this.actionButtonClicked = true;

    const randomIndex = this.getRandomInt(numberOfWishes);

    this.generatedWish = {
      title: 'Предсказание',
      text: Object.values(wishes)[randomIndex] as string[],
      image: this.getRandomInt(this.wishImagesCount) + 1
    }
  }

  getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
}
