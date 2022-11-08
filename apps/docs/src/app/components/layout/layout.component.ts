import { NgClass, NgForOf, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { PageSection } from '../../interfaces/section.interface';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'headlessui-angular-layout',
  standalone: true,
  imports: [NgIf, NgForOf, NgClass, HeaderComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  tableOfContents: Array<PageSection> = [
    {
      id: '1',
      title: 'test',
    },
  ];

  isActive(section: PageSection): boolean {
    return true;
  }
}
