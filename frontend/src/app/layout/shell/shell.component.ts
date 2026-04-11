import { Component, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  readonly isCollapsed = signal(false);
  readonly mobileMenuOpen = signal(false);
  private lastWidth = window.innerWidth;

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 1024 && this.lastWidth < 1024) {
      this.mobileMenuOpen.set(false);
    }
    this.lastWidth = window.innerWidth;
  }

  toggleSidebar(): void {
    if (window.innerWidth >= 1024) {
      this.isCollapsed.set(!this.isCollapsed());
    } else {
      this.mobileMenuOpen.set(!this.mobileMenuOpen());
    }
  }
}
