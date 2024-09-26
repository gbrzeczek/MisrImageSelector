import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ImageViewComponent } from './image-view/image-view.component';
import { SliderComponent } from './slider/slider.component';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Constants } from './consts/constants';
import { AlreadyVotedService } from './services/already-voted.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ImageViewComponent, SliderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly _httpClient = inject(HttpClient);
  private readonly _alreadyVotedService = inject(AlreadyVotedService);

  title = 'misr-image-selector-ui';
  backgroundPosition$: Subject<string> = new Subject<string>();
  mouseOff$: Subject<void> = new Subject<void>();
  resetSlider$: Observable<void>;

  private _leftType!: 'cpsnr' | 'dynamic';
  private _scoreValue: number = 50;
  private _currentImageIndex: number | null = null;
  private _areControlsDisabled = false;
  private _resetSlider$ = new Subject<void>();

  constructor() {
    this.setupNextImage();

    this.resetSlider$ = this._resetSlider$.asObservable();
  }

  public get leftImageSrc(): string {
    return `images/${this._leftType}/${this._currentImageIndex}.png`;
  }

  public get rightImageSrc(): string {
    const rightType = this._leftType === 'cpsnr' ? 'dynamic' : 'cpsnr';
    return `images/${rightType}/${this._currentImageIndex}.png`;
  }

  public get centerImageSrc(): string {
    return `images/original/${this._currentImageIndex}.png`;
  }

  public get areControlsDisabled(): boolean {
    return this._areControlsDisabled;
  }

  public get currentImageIndex(): number | null {
    return this._currentImageIndex;
  }

  public updateScoreValue(value: number) {
    this._scoreValue = value;
  }

  public send() {
    const decimalScore = this._scoreValue / 100;

    const lpipsScore =
      this._leftType === 'dynamic' ? 1 - decimalScore : decimalScore;

    const body = {
      imageId: this._currentImageIndex,
      lpipsScore: lpipsScore,
    };

    this._areControlsDisabled = true;

    this._httpClient
      .post<void>(Constants.apiUrl + '/api/vote', body, {
        withCredentials: true,
      })
      .subscribe({
        next: () => {
          this._areControlsDisabled = false;
          this.setupNextImage();
        },
        error: (err) => {
          this._areControlsDisabled = false;
          console.error(err);
        },
      });
  }

  private setupNextImage() {
    this._currentImageIndex = this.setupNextImageIndex();

    this._leftType = Math.random() > 0.5 ? 'cpsnr' : 'dynamic';
    this._scoreValue = 50;
    this._areControlsDisabled = false;

    this._resetSlider$.next();

    console.log('Left picture type:', this._leftType);
  }

  private setupNextImageIndex(): number | null {
    if (this._currentImageIndex !== null) {
      this._alreadyVotedService.addVote(this._currentImageIndex);
    }

    const voted = this._alreadyVotedService.getVotes();

    if (voted.length >= Constants.totalImages) {
      return null;
    }

    let nextImageIndex = Math.floor(Math.random() * Constants.totalImages) + 1;

    while (voted.includes(nextImageIndex)) {
      nextImageIndex = Math.floor(Math.random() * Constants.totalImages) + 1;
    }

    return nextImageIndex;
  }
}
