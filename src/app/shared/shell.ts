import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { I18nService } from '../core/services/i18n.service';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <main class="shell-main">
        <router-outlet />
      </main>

      <nav class="bottom-nav" aria-label="Main navigation">
        <a
          routerLink="/swag"
          routerLinkActive="active"
          class="nav-item"
          [attr.aria-label]="t().nav.swagAriaLabel"
        >
          <span class="nav-icon" aria-hidden="true"><i class="ph ph-gift"></i></span>
          <span class="nav-label">{{ t().nav.swag }}</span>
        </a>
        <a
          routerLink="/leaderboard"
          routerLinkActive="active"
          class="nav-item"
          [attr.aria-label]="t().nav.leaderboardAriaLabel"
        >
          <span class="nav-icon" aria-hidden="true"><i class="ph ph-trophy"></i></span>
          <span class="nav-label">{{ t().nav.scores }}</span>
        </a>
        <button
          class="nav-item nav-lang"
          (click)="i18n.toggle()"
          type="button"
          aria-label="Switch language"
        >
          <span class="nav-icon" aria-hidden="true"><i class="ph ph-globe"></i></span>
          <span class="nav-label">{{ i18n.lang() === 'en' ? 'ES' : 'EN' }}</span>
        </button>
        @if (isAnonymous()) {
          <a routerLink="/login" class="nav-item" [attr.aria-label]="t().nav.signInAriaLabel">
            <span class="nav-icon" aria-hidden="true"><i class="ph ph-key"></i></span>
            <span class="nav-label">{{ t().nav.signIn }}</span>
          </a>
        } @else {
          <button
            class="nav-item nav-signout"
            (click)="signOut()"
            type="button"
            [attr.aria-label]="t().nav.signOutAriaLabel"
          >
            <span class="nav-icon" aria-hidden="true"><i class="ph ph-user"></i></span>
            <span class="nav-label">{{ name() }}</span>
          </button>
        }
      </nav>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
      background-color: #f8fafc;
    }
    .shell-main {
      flex: 1;
      overflow-y: auto;
      padding-bottom: 5.5rem;
    }
    .bottom-nav {
      position: fixed;
      bottom: 1.5rem;
      left: 1.5rem;
      right: 1.5rem;
      height: 4rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 1.5rem;
      display: flex;
      align-items: stretch;
      z-index: 100;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.125rem;
      text-decoration: none;
      color: #94a3b8;
      font-size: 0.75rem;
      font-weight: 700;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      font-family: inherit;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }
    .nav-item::after {
      content: '';
      position: absolute;
      bottom: 0.5rem;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #6366f1;
      opacity: 0;
      transform: scale(0);
      transition: all 0.2s;
    }
    .nav-item.active { color: #6366f1; }
    .nav-item.active::after { opacity: 1; transform: scale(1); }
    .nav-icon { font-size: 1.5rem; line-height: 1; }
    .nav-label {
      max-width: 4.5rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .nav-lang:hover { color: #6366f1; }
    .nav-signout { color: #94a3b8; }
    .nav-signout:hover { color: #f43f5e; }
  `],
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);
  readonly t = this.i18n.t;
  readonly name = this.auth.displayName;
  readonly isAnonymous = this.auth.isAnonymous;

  signOut(): void {
    this.auth.signOut();
  }
}
