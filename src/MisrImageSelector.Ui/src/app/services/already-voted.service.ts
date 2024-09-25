import { Injectable } from '@angular/core';
import { Constants } from '../consts/constants';

@Injectable({
  providedIn: 'root'
})
export class AlreadyVotedService {
  private readonly _votedLocalStorageKey = 'voted';

  constructor() { }

  public hasVotedAll(): boolean {
    return this.getVotes().length >= Constants.totalImages;
  }

  public getVotes(): number[] {
    const voted = localStorage.getItem(this._votedLocalStorageKey);

    return voted ? JSON.parse(voted) : [];
  }

  public addVote(imageIndex: number): void {
    const voted = this.getVotes();
    voted.push(imageIndex);

    localStorage.setItem(this._votedLocalStorageKey, JSON.stringify(voted));
  }
}
