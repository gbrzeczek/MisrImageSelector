import { Component, DestroyRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ImageViewComponent } from './image-view/image-view.component';
import { SliderComponent } from './slider/slider.component';
import { interval, Observable, Subject, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Constants } from './consts/constants';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { VotedImagesService } from './services/voted-images.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ImageViewComponent, SliderComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly _httpClient = inject(HttpClient);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _votedImagesService = inject(VotedImagesService);

  title = 'misr-image-selector-ui';
  backgroundPosition$: Subject<string> = new Subject<string>();
  mouseOff$: Subject<void> = new Subject<void>();
  resetSlider$: Observable<void>;
  loadingDots$: Observable<string>;
  isLoading = true;

  private _leftType!: 'cpsnr' | 'dynamic';
  private _scoreValue: number = 50;
  private _currentImageIndex: number | null = null;
  private _areControlsDisabled = false;
  private _resetSlider$ = new Subject<void>();

  constructor() {
    this.resetSlider$ = this._resetSlider$.asObservable();
    this.loadingDots$ = interval(500).pipe(
        map((value) => {
            return '.'.repeat((value % 3) + 1);
        }),
        takeUntilDestroyed(this._destroyRef)
    );

    this._votedImagesService.nextImageId$.pipe(
      takeUntilDestroyed(this._destroyRef)
    ).subscribe((imageId) => {
      this._currentImageIndex = imageId;
      this.resetState();
      this.isLoading = false;
    });
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
    if (this._currentImageIndex === null) {
      console.error('No image to vote on');
      return;
    }

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
          this._votedImagesService.vote(this._currentImageIndex!);
        },
        error: (err) => {
          this._areControlsDisabled = false;
          console.error(err);
        },
      });
  }

  private resetState() {
    this._leftType = Math.random() > 0.5 ? 'cpsnr' : 'dynamic';
    this._scoreValue = 50;
    this._resetSlider$.next();

    // unlock the vote button after 3 seconds
    // the user has to get familiar with the images
    setTimeout(() => {
      this._areControlsDisabled = false;
    }, 3000);
  }
}
