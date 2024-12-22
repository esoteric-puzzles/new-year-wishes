import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingService } from './services/data-loader';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  showApp = false;
  actionButtonClicked = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    loadingService: LoadingService
  ) {
    //loadingService.startLoading();
  }

  ngOnInit(): void {
    const parentUrl = document.referrer;
    console.log('Parent URL:', parentUrl);
  }

  toggleAction(): void {
    this.actionButtonClicked = true;
  }
}
