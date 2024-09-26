import { HttpInterceptorFn, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { Constants } from '../consts/constants';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const httpClient = inject(HttpClient);

  const getToken = (): string | null => {
    return localStorage.getItem('auth_token');
  };

  const setToken = (token: string): void => {
    localStorage.setItem('auth_token', token);
  };

  const authenticate = (): Observable<string> => {
    return httpClient.post<{ token: string }>(
      Constants.apiUrl + '/api/login',
      {}
    ).pipe(
      switchMap(response => {
        setToken(response.token);
        return from(Promise.resolve(response.token));
      })
    );
  };

  const addToken = (request: any, token: string) => {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  };

  const token = getToken();

  if (req.url.endsWith('/login')) {
    return next(req);
  }

  if (token) {
    return next(addToken(req, token));
  } else {
    return authenticate().pipe(
      switchMap(newToken => {
        return next(addToken(req, newToken));
      })
    );
  }
};
