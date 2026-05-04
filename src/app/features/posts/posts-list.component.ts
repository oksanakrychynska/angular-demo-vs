import {ChangeDetectionStrategy, Component, computed, inject, output, viewChild} from '@angular/core';
import { AppStore } from '../../core/store/app.store';
import { DataService } from '../../core/data/data.service';
import { Post } from '../../shared/models/models';

import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {VirtualScrollComponent, VsItemDirective} from '../../shared/virtual-scroll/virtual-scroll';
import {VirtualElement} from '../../shared/models/virtualElement';


@Component({
    selector: 'app-posts-list',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [VirtualScrollComponent, VsItemDirective, FormsModule, DecimalPipe],
    template: `
    <app-virtual-scroll
      #vs
      [items]="posts()"
      [estimatedItemHeight]="120"
      [headerTemplate]="headerTpl"
      (itemActivated)="onItemActivated($event)"
    >
      <ng-template vsItem let-post let-index="index">
        <button
          class="post-item"
          (click)="postOpened.emit(post)"
          [attr.aria-label]="'Open post: ' + post['title']"
        >
          <div class="post-user-dot" [style.background]="getUserColor(post['userId'])"></div>
          <div class="post-content">
            <div class="post-header">
              <span class="post-user-name">{{ getUserName(post['userId']) }}</span>
              <span class="post-date">{{ formatDate(post['createdAt']) }}</span>
            </div>
            <h3 class="post-title">{{ post['title'] }}</h3>
            <p class="post-body">{{ post['body'] }}</p>
          </div>
        </button>
      </ng-template>
    </app-virtual-scroll>

    <ng-template #headerTpl>
      <div class="posts-header">
        <div class="posts-header__top">
          <span class="posts-header__count">
            <strong>{{ store.filteredPostCount() | number }}</strong>
            of {{ store.totalPostCount() | number }} posts
          </span>
          <div class="sort-toggle" role="group" aria-label="Sort posts">
            <button
              class="sort-btn"
              [class.sort-btn--active]="store.sort() === 'recent'"
              (click)="store.sort.set('recent')"
            >Recent</button>
            <button
              class="sort-btn"
              [class.sort-btn--active]="store.sort() === 'title'"
              (click)="store.sort.set('title')"
            >A–Z</button>
          </div>
        </div>
        <div class="search-wrap">
          <span class="search-icon" aria-hidden="true">⌕</span>
          <input
            #searchInput
            type="search"
            class="search-input"
            placeholder="Search posts…"
            [value]="store.postSearch()"
            (input)="onSearchInput($event)"
            aria-label="Search posts"
            autocomplete="off"
          />
          @if (store.postSearch()) {
            <button class="search-clear" (click)="clearSearch()" aria-label="Clear search">✕</button>
          }
        </div>
      </div>
    </ng-template>
  `,
    styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .posts-header {
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      padding: 10px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      backdrop-filter: blur(8px);
    }

    .posts-header__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .posts-header__count {
      font-size: 12px;
      color: var(--color-text-dim);

      strong {
        color: var(--color-accent);
        font-weight: 700;
      }
    }

    .sort-toggle {
      display: flex;
      gap: 2px;
      background: var(--color-bg);
      border-radius: 6px;
      padding: 2px;
    }

    .sort-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      color: var(--color-text-dim);
      transition: all 0.15s;
    }

    .sort-btn--active {
      background: var(--color-accent);
      color: #fff;
    }

    .sort-btn:not(.sort-btn--active):hover {
      color: var(--color-text);
      background: var(--color-hover);
    }

    .search-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 10px;
      font-size: 16px;
      color: var(--color-text-dim);
      pointer-events: none;
      line-height: 1;
    }

    .search-input {
      width: 100%;
      padding: 7px 32px 7px 32px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text);
      font-size: 13px;
      font-family: var(--font-body);
      outline: none;
      transition: border-color 0.15s;

      &:focus {
        border-color: var(--color-accent);
      }

      &::placeholder {
        color: var(--color-text-dim);
      }

      &::-webkit-search-cancel-button {
        display: none;
      }
    }

    .search-clear {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 11px;
      color: var(--color-text-dim);
      padding: 4px;
      border-radius: 4px;

      &:hover {
        color: var(--color-text);
        background: var(--color-hover);
      }
    }

    .post-item {
      display: flex;
      align-items: flex-start;
      width: 100%;
      gap: 12px;
      padding: 14px 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      border-bottom: 1px solid var(--color-border-subtle);
      transition: background 0.12s;
      color: var(--color-text);

      &:hover {
        background: var(--color-hover);

        .post-title {
          color: var(--color-accent);
        }
      }
    }

    .post-user-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 6px;
    }

    .post-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      flex: 1;
    }

    .post-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .post-user-name {
      font-size: 11px;
      font-weight: 700;
      color: var(--color-text-dim);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .post-date {
      font-size: 11px;
      color: var(--color-text-dim);
      opacity: 0.7;
    }

    .post-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text);
      line-height: 1.4;
      margin: 0;
      transition: color 0.12s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .post-body {
      font-size: 12px;
      color: var(--color-text-dim);
      line-height: 1.5;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `],
})
export class PostsListComponent {
    protected readonly store = inject(AppStore);
    private readonly data = inject(DataService);

    readonly postOpened = output<Post>();

    readonly vs = viewChild<VirtualScrollComponent>('vs');

    readonly posts = computed(() => this.store.filteredPosts() as unknown as VirtualElement[]);

    onSearchInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.store.postSearch.set(value);
    }

    clearSearch(): void {
        this.store.postSearch.set('');
    }

    onItemActivated(event: { item: VirtualElement; index: number }): void {
        this.postOpened.emit(event.item as unknown as Post);
    }

    getUserName(userId: number): string {
        return this.data.getUser(userId)?.name ?? 'Unknown';
    }

    getUserColor(userId: number): string {
        return this.data.getUser(userId)?.avatar ?? '#888';
    }

    formatDate(ts: number): string {
        const d = new Date(ts);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}
