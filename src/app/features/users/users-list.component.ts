
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,

} from '@angular/core';
import { AppStore } from '../../core/store/app.store';
import { DataService } from '../../core/data/data.service';
import {VirtualScrollComponent, VsItemDirective} from '../../shared/virtual-scroll/virtual-scroll';
import {VirtualElement} from '../../shared/models/virtualElement';


@Component({
    selector: 'app-users-list',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [VirtualScrollComponent, VsItemDirective],
    template: `
        <app-virtual-scroll
                [items]="users()"
                [estimatedItemHeight]="72"
                [headerTemplate]="headerTpl">
            <ng-template vsItem let-user let-index="index">
                <button
                        class="user-item"
                        [class.user-item--selected]="isSelected(user.id)"
                        (click)="store.toggleUser(user.id)"
                        [attr.aria-pressed]="isSelected(user.id)"
                        [attr.aria-label]="user.name + ', ' + user.company"
                >
          <span
                  class="user-avatar"
                  [style.background]="user.avatar"
                  aria-hidden="true"
          >{{ initials(user.name) }}</span>
                    <span class="user-info">
            <span class="user-name">{{ user.name }}</span>
            <span class="user-meta">{{ user.username }} · {{ user.company }}</span>
          </span>
                    @if (isSelected(user.id)) {
                        <span class="user-check" aria-hidden="true">✓</span>
                    }
                </button>
            </ng-template>
        </app-virtual-scroll>

        <ng-template #headerTpl>
            <div class="list-header">
                <span class="list-header__title">Users</span>
                <span class="list-header__count">
          {{ store.usersSelected().size || 'All' }}
                    @if (store.usersSelected().size) {
                        <button class="clear-btn" (click)="store.clearUsers()" aria-label="Clear selection">✕</button>
                    }
        </span>
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

        .list-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            height: 48px;
            background: var(--color-surface);
            border-bottom: 1px solid var(--color-border);
            backdrop-filter: blur(8px);
        }

        .list-header__title {
            font-family: var(--font-display);
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--color-text-dim);
        }

        .list-header__count {
            font-size: 12px;
            font-weight: 600;
            color: var(--color-accent);
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .clear-btn {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--color-text-dim);
            font-size: 11px;
            padding: 2px 4px;
            border-radius: 4px;
            transition: color 0.15s, background 0.15s;

            &:hover {
                color: var(--color-text);
                background: var(--color-hover);
            }
        }

        .user-item {
            display: flex;
            align-items: center;
            width: 100%;
            gap: 12px;
            padding: 10px 16px;
            border: none;
            background: transparent;
            cursor: pointer;
            text-align: left;
            border-bottom: 1px solid var(--color-border-subtle);
            transition: background 0.12s;
            color: var(--color-text);

            &:hover {
                background: var(--color-hover);
            }
        }

        .user-item--selected {
            background: var(--color-selected);
            border-left: 3px solid var(--color-accent);
            padding-left: 13px;
        }

        .user-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 700;
            color: #fff;
            flex-shrink: 0;
            letter-spacing: 0.02em;
        }

        .user-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
            flex: 1;
        }

        .user-name {
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--color-text);
        }

        .user-meta {
            font-size: 11px;
            color: var(--color-text-dim);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .user-check {
            color: var(--color-accent);
            font-size: 14px;
            font-weight: 700;
            flex-shrink: 0;
        }
    `],
})
export class UsersListComponent {
    protected readonly store = inject(AppStore);
    private readonly data = inject(DataService);

    readonly users = computed(() => this.data.users() as unknown as VirtualElement[]);

    isSelected(id: number): boolean {
        return this.store.usersSelected().has(id);
    }

    initials(name: string): string {
        return name
            .split(' ')
            .slice(0, 2)
            .map(n => n[0])
            .join('')
            .toUpperCase();
    }
}
