import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class IdlePreloadStrategy implements PreloadingStrategy {
  private delayMs = 500;

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload'] === false) {
      return of(null);
    }

    const path = route.path ?? '';
    if (path === 'auth' || path === 'piloto' || path === 'unauthorized') {
      return of(null);
    }

    this.delayMs += 450;
    return timer(this.delayMs).pipe(mergeMap(() => load()));
  }
}
