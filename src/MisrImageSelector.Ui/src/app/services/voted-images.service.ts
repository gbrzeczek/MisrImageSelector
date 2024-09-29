import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { Constants } from '../consts/constants';

@Injectable({
  providedIn: 'root'
})
export class VotedImagesService {
  readonly nextImageId$: Observable<number | null>;

  private readonly _httpClient = inject(HttpClient);
  private readonly _nextImageId$ = new ReplaySubject<number | null>(1);
  private _voteableImages: number[] = [];

  constructor() {
    this._voteableImages = Array.from(
      { length: Constants.totalImages },
      (_, i) => i + 1);

    this.nextImageId$ = this._nextImageId$.asObservable();

    this._httpClient.get<number[]>(Constants.apiUrl + '/api/vote/current-user/images')
      .subscribe((votedImages) => {
        this._voteableImages = this._voteableImages.filter((imageId) => !votedImages.includes(imageId));
        this._nextImageId$.next(this.getNextImageId());
      });
  }

  public vote(imageId: number): void {
    this._voteableImages = this._voteableImages.filter((id) => id !== imageId);
    this._nextImageId$.next(this.getNextImageId());
  }

  private getNextImageId(): number | null {
    if (this._voteableImages.length === 0) {
      return null;
    }

    return this._voteableImages[Math.floor(Math.random() * this._voteableImages.length)];
  }
}
