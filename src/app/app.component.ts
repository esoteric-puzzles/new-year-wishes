import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DataLoaderService } from './services/data-loader.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  actionButtonClicked = false;
  dataLoaded = false;

  data: any = null;

  generatedWish: any = {
    title: "",
    text: "",
    image: "",
  };

  constructor(private dataLoaderService: DataLoaderService) {
  }

  ngOnInit(): void {
    this.dataLoaderService.startLoading().subscribe(data => {
      this.data = data;
      this.dataLoaded = true;
      console.log(data);
    });
  }

  generateWish() {
    console.log(this.data.Wishes.wishText.length);

    const numberOfWishes = this.data.Wishes.wishText.length;
    const wishNumber = this.getRandomInt(numberOfWishes);
    const wishes = this.data.Wishes;

    this.actionButtonClicked = true;
    this.generatedWish = {
      title: wishes.wishTitle[wishNumber],
      text: wishes.wishText[wishNumber],
      image: wishes.wishImage[wishNumber]
    }

  }

  getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
}
