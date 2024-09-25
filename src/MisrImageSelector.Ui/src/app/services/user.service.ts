import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Constants } from '../consts/constants';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly _httpClient = inject(HttpClient);
  constructor() {}

  public authenticate(): Observable<void> {
    return this._httpClient.post<void>(
      Constants.apiUrl + '/api/login',
      {},
      { withCredentials: true }
    );
  }
}
