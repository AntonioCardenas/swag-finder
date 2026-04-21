import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { UserProfile } from '../../core/models/swag.model';

@Component({
  selector: 'app-leaderboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div class="title-group">
          <h1 class="page-title"><i class="ph-bold ph-trophy"></i> {{ t().leaderboard.title }}</h1>
          <p class="page-sub">{{ t().leaderboard.subtitle }}</p>
        </div>
      </header>

      <div class="toggle-container">
        <button
          class="toggle-btn"
          [class.active]="track() === 'claimed'"
          (click)="track.set('claimed')"
        >
          {{ t().leaderboard.mostClaimed }}
        </button>
        <button
          class="toggle-btn"
          [class.active]="track() === 'created'"
          (click)="track.set('created')"
        >
          {{ t().leaderboard.mostCreated }}
        </button>
      </div>

      @if (leaders() === null) {
        <div class="loading">
          <div class="spinner" [attr.aria-label]="t().leaderboard.loadingAriaLabel"></div>
        </div>
      } @else if (leaders()!.length === 0) {
        <div class="empty">
          <i class="ph ph-medal empty-icon"></i>
          <p class="empty-text">{{ t().leaderboard.empty }}</p>
        </div>
      } @else {
        @defer (on viewport; prefetch on idle) {
          <div class="board" role="list">
            @for (user of leaders()!; track user.uid; let i = $index) {
              <div
                class="board-item"
                [class.top-card]="i < 3"
                [class.me]="user.uid === uid()"
              >
                <div class="rank">
                  @if (i === 0) {
                    <i class="ph-fill ph-medal" style="color: #fbbf24"></i>
                  } @else if (i === 1) {
                    <i class="ph-fill ph-medal" style="color: #94a3b8"></i>
                  } @else if (i === 2) {
                    <i class="ph-fill ph-medal" style="color: #b45309"></i>
                  } @else {
                    {{ i + 1 }}
                  }
                </div>

                <div class="user-info">
                  <div class="avatar-wrap">
                    @if (user.photoURL) {
                      <img [src]="user.photoURL" [alt]="user.displayName" class="avatar" />
                    } @else {
                      <div class="avatar-fallback">
                        {{ user.displayName.charAt(0).toUpperCase() }}
                      </div>
                    }
                  </div>
                  <div class="details">
                    <span class="name">
                      {{ user.displayName }}
                      @if (user.uid === uid()) { <span class="you-badge">{{ t().leaderboard.you }}</span> }
                    </span>
                    <span class="count">
                      {{ track() === 'claimed' ? user.claimedCount : user.createdCount }}
                      {{ track() === 'claimed' ? t().leaderboard.swagClaimed : t().leaderboard.swagCreated }}
                    </span>
                  </div>
                </div>

                <div class="progress-wrap" aria-hidden="true">
                  <div
                    class="progress-bar"
                    [style.width.%]="barWidth(track() === 'claimed' ? user.claimedCount : user.createdCount)"
                  ></div>
                </div>
              </div>
            }
          </div>
        } @placeholder {
          <div class="board-skeleton">
            @for (i of [1, 2, 3, 4, 5]; track i) {
              <div class="skeleton-item shimmer"></div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      --primary: #6366f1;
      --primary-glow: rgba(99, 102, 241, 0.1);
      --glass: white;
      --glass-border: #e2e8f0;
    }
    .shimmer {
      background-color: #f1f5f9;
      position: relative;
      overflow: hidden;
    }
    .shimmer::after {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      animation: shimmer-anim 1.5s infinite;
    }
    @keyframes shimmer-anim {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .board-skeleton { display: flex; flex-direction: column; gap: 0.75rem; }
    .skeleton-item { height: 80px; border-radius: 1.25rem; }

    .page { padding: 1.5rem; max-width: 600px; margin: 0 auto; min-height: 100vh; }
    .page-header { margin-bottom: 2rem; }
    .page-title { 
      font-size: 2rem; 
      font-weight: 800; 
      margin: 0;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .page-sub { margin: 0.25rem 0 0; color: #64748b; font-weight: 600; font-size: 0.875rem; }

    .toggle-container {
      display: flex;
      background: #f1f5f9;
      padding: 0.375rem;
      border-radius: 1rem;
      gap: 0.25rem;
      margin-bottom: 1.5rem;
    }
    .toggle-btn {
      flex: 1;
      padding: 0.625rem;
      border-radius: 0.75rem;
      border: none;
      background: transparent;
      font-weight: 700;
      font-size: 0.875rem;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s;
    }
    .toggle-btn.active {
      background: white;
      color: var(--primary);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .loading { display: flex; justify-content: center; padding: 4rem; }
    .spinner {
      width: 2.5rem; height: 2.5rem;
      border: 3px solid #f1f5f9;
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty { 
      text-align: center; 
      padding: 4rem 2rem; 
      background: white;
      border-radius: 2rem;
      border: 1px solid #e2e8f0;
    }
    .empty-icon { font-size: 4rem; color: #cbd5e1; margin-bottom: 1rem; }
    .empty-text { font-weight: 700; color: #1e293b; }

    .board {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .board-item {
      display: grid;
      grid-template-columns: 3rem 1fr;
      grid-template-rows: auto auto;
      align-items: center;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 1.25rem;
      padding: 1rem;
      gap: 0 1rem;
      transition: all 0.2s ease;
    }
    .board-item:hover { transform: scale(1.01); border-color: var(--primary); }
    .board-item.top-card {
      border-left: 4px solid #cbd5e1;
    }
    .board-item:nth-child(1).top-card { border-left-color: #fbbf24; }
    .board-item:nth-child(2).top-card { border-left-color: #94a3b8; }
    .board-item:nth-child(3).top-card { border-left-color: #b45309; }

    .board-item.me {
      border: 2px solid var(--primary);
      background-color: #f5f3ff;
    }

    .rank {
      grid-row: 1 / 3;
      font-size: 1.5rem;
      font-weight: 900;
      color: #cbd5e1;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-info {
      grid-column: 2;
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .avatar-wrap { position: relative; }
    .avatar, .avatar-fallback {
      width: 2.75rem; height: 2.75rem;
      border-radius: 50%;
      object-fit: cover;
    }
    .avatar-fallback {
      background-color: #e2e8f0;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.125rem;
    }

    .details { display: flex; flex-direction: column; min-width: 0; }
    .name {
      font-weight: 800;
      font-size: 1rem;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .you-badge {
      font-size: 0.65rem;
      background-color: var(--primary);
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    .count { font-size: 0.8125rem; color: #64748b; font-weight: 600; margin-top: 0.125rem; }

    .progress-wrap {
      grid-column: 2;
      grid-row: 2;
      height: 6px;
      background-color: #f1f5f9;
      border-radius: 999px;
      margin-top: 0.75rem;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background-color: var(--primary);
      border-radius: 999px;
      transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  `],
})
export class LeaderboardComponent {
  private readonly lb = inject(LeaderboardService);
  readonly auth = inject(AuthService);
  readonly t = inject(I18nService).t;
  readonly uid = this.auth.uid;

  readonly track = signal<'claimed' | 'created'>('claimed');
  readonly leaders = signal<UserProfile[] | null>(null);

  constructor() {
    toObservable(this.track)
      .pipe(
        switchMap((t) => {
          this.leaders.set(null);
          return t === 'claimed' ? this.lb.getTopClaimers() : this.lb.getTopCreators();
        }),
        takeUntilDestroyed(),
      )
      .subscribe((users) => this.leaders.set(users));
  }

  barWidth(count: number): number {
    const list = this.leaders();
    if (!list || list.length === 0) return 0;
    const max = this.track() === 'claimed' ? list[0].claimedCount : list[0].createdCount;
    return max === 0 ? 0 : Math.round((count / max) * 100);
  }
}
