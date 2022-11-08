import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { debounceTime, fromEvent, Subject, takeUntil } from 'rxjs';
import { ThemeSelectorComponent } from './theme-selector/theme-selector.component';

@Component({
  selector: 'headlessui-angular-header',
  standalone: true,
  imports: [CommonModule, ThemeSelectorComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnDestroy {
  isScrolled = false;

  private _windowRef: Window | null = inject(DOCUMENT).defaultView;
  private _onDestroy = new Subject<unknown>();
  private _onDestroy$ = this._onDestroy.asObservable();

  constructor() {
    if (this._windowRef) {
      fromEvent(this._windowRef, 'scroll')
        .pipe(debounceTime(500), takeUntil(this._onDestroy$))
        .subscribe(() => (this.isScrolled = window.scrollY > 0));
    }
  }

  ngOnDestroy(): void {
    this._onDestroy.next(null);
    this._onDestroy.complete();
  }
}
