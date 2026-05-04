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
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [VirtualScrollComponent, VsItemDirective, FormsModule, DecimalPipe],
    templateUrl: 'posts-list.html',
    styleUrl: 'posts-list.scss',
})
export class PostsList {
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
