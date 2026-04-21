import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SwagService } from '../../core/services/swag.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { SwagItem } from '../../core/models/swag.model';

@Component({
  selector: 'app-swag-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <h1 class="page-title"><i class="ph-bold ph-gift"></i> {{ t().swag.title }}</h1>
        @if (!isAnonymous()) {
          <a routerLink="/swag/create" class="btn-fab" [attr.aria-label]="t().swag.addAriaLabel">
            <i class="ph-bold ph-plus"></i>
          </a>
        }
      </header>

      @if (isAnonymous()) {
        <div class="guest-banner" role="note">
          <i class="ph ph-eye"></i>
          <span>{{ t().swag.guestBanner }}</span>
          <a routerLink="/login" class="guest-signin-link">{{ t().swag.guestSignIn }}</a>
        </div>
      }

      <div class="filter-bar">
        <button
          class="filter-chip"
          [class.active]="filter() === 'all'"
          (click)="filter.set('all')"
          type="button"
        >{{ t().swag.filterAll }}</button>
        <button
          class="filter-chip"
          [class.active]="filter() === 'available'"
          (click)="filter.set('available')"
          type="button"
        >{{ t().swag.filterAvailable }}</button>
        <button
          class="filter-chip"
          [class.active]="filter() === 'claimed'"
          (click)="filter.set('claimed')"
          type="button"
        >{{ t().swag.filterClaimed }}</button>
      </div>

      @if (swagList() === null) {
        <div class="loading-state">
          <div class="spinner" [attr.aria-label]="t().swag.loadingAriaLabel"></div>
        </div>
      } @else if (filteredList().length === 0) {
        <div class="empty-state">
          <i class="ph ph-mask-sad empty-icon"></i>
          <p class="empty-text">{{ t().swag.empty }}</p>
          @if (!isAnonymous()) {
            <a routerLink="/swag/create" class="btn-primary">{{ t().swag.addButton }}</a>
          }
        </div>
      } @else {
        @defer (on viewport; prefetch on idle) {
          <ul class="swag-grid" role="list">
            @for (item of filteredList(); track item.id) {
              <li class="swag-card" [class.claimed]="item.claimed" [class.expired]="item.expired">
                <div class="swag-image-wrap">
                  <img
                    [src]="item.imageUrl"
                    [alt]="item.title"
                    class="swag-image"
                    loading="lazy"
                  />
                  @if (item.expired) {
                    <span class="expired-badge">{{ t().swag.expiredBadge }}</span>
                  } @else if (item.claimed) {
                    <span class="claimed-badge">{{ t().swag.claimedBadge }}</span>
                  }
                </div>
                <div class="swag-body">
                  <div class="swag-header">
                    <h2 class="swag-title">{{ item.title }}</h2>
                    <p class="swag-location"><i class="ph ph-map-pin"></i> {{ item.location }}</p>
                  </div>
                  <p class="swag-desc">{{ item.description }}</p>

                  @if (item.claims.length > 0) {
                    <div class="claim-stats">
                      <i class="ph ph-users" aria-hidden="true"></i>
                      <span>{{ item.claims.length }} {{ t().swag.peopleClaimed }}</span>
                      @if (item.lastClaimedAt) {
                        <span class="last-claim-time">· {{ t().swag.lastClaimed }} {{ timeAgo(item.lastClaimedAt) }}</span>
                      }
                    </div>
                  }

                  @if (claimWarning()?.id === item.id) {
                    <div
                      class="claim-warning"
                      [class.warn-yours]="claimWarning()?.reason === 'already_yours'"
                      [class.warn-unavailable]="claimWarning()?.reason === 'unavailable'"
                      role="alert"
                    >
                      <i class="ph-bold ph-warning"></i>
                      {{ claimWarning()?.reason === 'already_yours' ? t().swag.warnAlreadyYours : t().swag.warnUnavailable }}
                    </div>
                  }

                  <div class="swag-footer">
                    @if (item.expired) {
                      <span class="expired-label">{{ t().swag.expiredBadge }}</span>
                    } @else if (isAnonymous()) {
                      <a routerLink="/login" class="btn-claim-guest" [attr.aria-label]="t().swag.signInToClaim">
                        {{ t().swag.signInToClaim }}
                      </a>
                    } @else if (hasUserClaimed(item)) {
                      <span class="you-claimed">
                        <i class="ph-bold ph-check-circle"></i> {{ t().swag.youClaimed }}
                      </span>
                    } @else {
                      <button
                        class="btn-claim"
                        (click)="claim(item)"
                        [disabled]="claiming() === item.id"
                        type="button"
                      >
                        {{ claiming() === item.id ? t().swag.claiming : t().swag.claimNow }}
                      </button>
                    }

                    @if (!isAnonymous() && !item.expired) {
                      <button
                        class="btn-expire"
                        (click)="expire(item)"
                        type="button"
                        [attr.aria-label]="t().swag.markUnavailable"
                      >
                        <i class="ph-bold ph-calendar-x"></i>
                      </button>
                    }
                  </div>
                </div>
              </li>
            }
          </ul>
        } @placeholder {
          <div class="placeholder-grid">
            @for (i of [1, 2, 3]; track i) {
              <div class="card-skeleton"></div>
            }
          </div>
        } @loading (after 100ms; minimum 500ms) {
          <div class="loading-state">
            <div class="spinner"></div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      --primary: #6366f1;
      --primary-dark: #4f46e5;
      --accent: #f43f5e;
      --glass: rgba(255, 255, 255, 0.95);
      --glass-border: #e2e8f0;
    }
    .page { padding: 1.5rem; max-width: 800px; margin: 0 auto; min-height: 100vh; }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
    }
    .page-title {
      font-size: 2rem;
      font-weight: 800;
      margin: 0;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .btn-fab {
      width: 3.5rem; height: 3.5rem;
      border-radius: 1.25rem;
      background-color: var(--primary);
      color: white;
      font-size: 1.5rem;
      display: flex; align-items: center; justify-content: center;
      text-decoration: none;
      box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-fab:hover { transform: translateY(-2px); background-color: var(--primary-dark); }
    .btn-fab:active { transform: translateY(0); }

    .filter-bar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 2rem;
      overflow-x: auto;
      padding: 0.25rem;
      scrollbar-width: none;
    }
    .filter-chip {
      padding: 0.5rem 1.25rem;
      border-radius: 1rem;
      border: 1px solid var(--glass-border);
      background: white;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      color: #64748b;
      transition: all 0.2s;
    }
    .filter-chip.active {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem 2rem;
      background: white;
      border-radius: 2rem;
      border: 1px solid #e2e8f0;
      text-align: center;
    }
    .empty-icon { font-size: 4rem; color: #94a3b8; margin-bottom: 1rem; }
    .empty-text { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 1.5rem; }

    .placeholder-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
    .card-skeleton {
      height: 380px;
      background-color: #f1f5f9;
      border-radius: 1.5rem;
      position: relative;
      overflow: hidden;
    }
    .card-skeleton::after {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .swag-grid {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
    .swag-card {
      border-radius: 1.5rem;
      overflow: hidden;
      background: white;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
    }
    .swag-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.08);
    }
    .swag-card.claimed { opacity: 0.8; }
    .swag-card.expired { opacity: 0.6; filter: grayscale(0.4); }

    .swag-image-wrap { position: relative; overflow: hidden; background-color: #f1f5f9; }
    .swag-image {
      width: 100%;
      aspect-ratio: 16/10;
      object-fit: cover;
      display: block;
    }

    .claimed-badge, .expired-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      color: white;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.4rem 0.8rem;
      border-radius: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .claimed-badge { background-color: #10b981; }
    .expired-badge { background-color: #64748b; }

    .swag-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      flex: 1;
    }
    .swag-title { font-size: 1.25rem; font-weight: 800; margin: 0; color: #1e293b; }
    .swag-location {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 600;
      margin-top: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    .swag-desc { font-size: 0.9375rem; color: #475569; margin: 0; line-height: 1.5; }

    .claim-stats {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #64748b;
      margin-top: 0.25rem;
    }
    .last-claim-time { color: #94a3b8; }
    .you-claimed {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: #10b981;
    }

    .claim-warning {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.625rem 0.875rem;
      border-radius: 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 0.25rem;
      animation: fadeIn 0.2s ease;
    }
    .claim-warning i { flex-shrink: 0; margin-top: 0.0625rem; }
    .warn-yours { background: #fef3c7; color: #92400e; }
    .warn-unavailable { background: #f1f5f9; color: #475569; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

    .swag-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 0.5rem;
    }
    .expired-label { font-size: 0.875rem; color: #94a3b8; font-weight: 700; }

    .btn-claim {
      flex: 1;
      padding: 0.75rem;
      background-color: var(--primary);
      color: white;
      border: none;
      border-radius: 1rem;
      font-weight: 700;
      cursor: pointer;
      font-size: 0.9375rem;
      transition: background-color 0.15s;
    }
    .btn-claim:hover:not(:disabled) { background-color: var(--primary-dark); }
    .btn-claim:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-expire {
      padding: 0.75rem;
      background-color: #fffbeb;
      color: #92400e;
      border: 1px solid #fcd34d;
      border-radius: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s;
    }
    .btn-expire:hover { background-color: #fef3c7; }

    .btn-primary {
      padding: 0.75rem 2rem;
      background-color: var(--primary);
      color: white;
      border-radius: 1rem;
      text-decoration: none;
      font-weight: 700;
      transition: all 0.15s;
    }
    .btn-primary:hover { background-color: var(--primary-dark); }

    .guest-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      background-color: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 0.875rem;
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
      color: #92400e;
      margin-bottom: 1.25rem;
    }
    .guest-signin-link {
      font-weight: 700;
      color: var(--primary);
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .btn-claim-guest {
      flex: 1;
      padding: 0.75rem;
      background-color: transparent;
      border: 2px solid var(--primary);
      color: var(--primary);
      border-radius: 1rem;
      font-weight: 700;
      font-size: 0.9375rem;
      text-align: center;
      text-decoration: none;
      display: block;
      transition: all 0.15s;
    }
    .btn-claim-guest:hover { background-color: #eef2ff; }

    .spinner {
      width: 2.5rem; height: 2.5rem;
      border: 3px solid #f1f5f9;
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class SwagListComponent implements OnInit {
  private readonly swagService = inject(SwagService);
  private readonly auth = inject(AuthService);
  readonly t = inject(I18nService).t;

  readonly uid = this.auth.uid;
  readonly isAnonymous = this.auth.isAnonymous;
  readonly filter = signal<'all' | 'available' | 'claimed'>('all');
  readonly claiming = signal<string | null>(null);
  readonly swagList = signal<SwagItem[] | null>(null);
  readonly claimWarning = signal<{ id: string; reason: 'already_yours' | 'unavailable' } | null>(null);

  readonly filteredList = computed(() => {
    const list = this.swagList();
    if (!list) return [];
    if (this.filter() === 'available') return list.filter((s) => !s.claimed && !s.expired);
    if (this.filter() === 'claimed') return list.filter((s) => s.claimed);
    return list;
  });

  hasUserClaimed(item: import('../../core/models/swag.model').SwagItem): boolean {
    const uid = this.uid();
    return uid ? item.claims.some((c) => c.uid === uid) : false;
  }

  timeAgo(date: Date | null): string {
    if (!date) return '';
    const sec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  }

  ngOnInit(): void {
    this.swagService.getSwagList().subscribe((items) => this.swagList.set(items));
  }

  async claim(item: SwagItem): Promise<void> {
    if (this.claiming()) return;
    this.claiming.set(item.id);
    this.claimWarning.set(null);
    try {
      const result = await this.swagService.claimSwag(item.id);
      if (result !== 'ok') {
        this.claimWarning.set({ id: item.id, reason: result as 'already_yours' | 'unavailable' });
        setTimeout(() => this.claimWarning.set(null), 4000);
      }
    } finally {
      this.claiming.set(null);
    }
  }

  async expire(item: SwagItem): Promise<void> {
    await this.swagService.expireSwag(item.id);
  }
}
