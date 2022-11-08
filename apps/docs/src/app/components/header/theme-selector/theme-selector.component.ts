import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ListboxModule } from 'headlessui-angular';

interface ITheme {
  name: string;
  value: string;
  icon?: string;
}

@Component({
  selector: 'headlessui-angular-theme-selector',
  standalone: true,
  imports: [CommonModule, ListboxModule],
  templateUrl: './theme-selector.component.html',
})
export class ThemeSelectorComponent implements OnInit {
  themes: Array<ITheme> = [
    { name: 'Light', value: 'light', icon: 'LightIcon' },
    { name: 'Dark', value: 'dark', icon: 'DarkIcon' },
    { name: 'System', value: 'system', icon: 'SystemIcon' },
  ];
  selectedTheme: ITheme | null = this.themes[0];

  private _document: Document = inject(DOCUMENT);

  setSelectedTheme(theme: ITheme | null) {
    this.selectedTheme = theme;
    if (this.selectedTheme) {
      this._document.documentElement.setAttribute(
        'data-theme',
        this.selectedTheme.value
      );
    }
  }

  ngOnInit(): void {
    if (!this.selectedTheme) {
      this.setSelectedTheme(
        this.themes.find(
          (theme) =>
            theme.value ===
            this._document.documentElement.getAttribute('data-theme')
        ) ?? null
      );
    }
  }
}
