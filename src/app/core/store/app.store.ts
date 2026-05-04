
import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataService } from '../data/data.service';
import { SortOrder } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class AppStore {
    private readonly data = inject(DataService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    // --- State signals ---
    readonly usersSelected = signal<Set<number>>(new Set<number>());
    readonly postSearch = signal('');
    readonly sort = signal<SortOrder>('recent');

    // --- Derived state ---
    readonly filteredPosts = computed(() => {
        const sel = this.usersSelected();
        const q = this.postSearch().toLowerCase().trim();
        const sortOrder = this.sort();
        const allPosts = this.data.posts();

        let posts = sel.size
            ? allPosts.filter(p => sel.has(p.userId))
            : allPosts;

        if (q) {
            posts = posts.filter(
                p => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q)
            );
        }

        if (sortOrder === 'title') {
            posts = [...posts].sort((a, b) => a.title.localeCompare(b.title));
        }

        return posts;
    });

    readonly filteredPostCount = computed(() => this.filteredPosts().length);
    readonly totalPostCount = computed(() => this.data.posts().length);
    readonly loading = computed(() => this.data.loading());

    constructor() {
        // Restore state from URL on init
        this.route.queryParams.pipe(takeUntilDestroyed()).subscribe(params => {
            const userIds = (params['users'] ?? '')
                .split(',')
                .map(Number)
                .filter((n: number) => n > 0);
            this.usersSelected.set(new Set<number>(userIds));
            this.postSearch.set(params['search'] ?? '');
            const s = params['sort'];
            this.sort.set(s === 'title' ? 'title' : 'recent');
        });

        // Sync store → URL (debounced for search)
        toObservable(this.postSearch)
            .pipe(debounceTime(200), distinctUntilChanged(), skip(1), takeUntilDestroyed())
            .subscribe(() => this.syncUrl());

        toObservable(this.usersSelected)
            .pipe(skip(1), takeUntilDestroyed())
            .subscribe(() => this.syncUrl());

        toObservable(this.sort)
            .pipe(skip(1), takeUntilDestroyed())
            .subscribe(() => this.syncUrl());
    }

    toggleUser(id: number): void {
        const next = new Set<number>(this.usersSelected());
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        this.usersSelected.set(next);
    }

    clearUsers(): void {
        this.usersSelected.set(new Set<number>());
    }

    private syncUrl(): void {
        const sel = this.usersSelected();
        const search = this.postSearch();
        const sort = this.sort();

        const queryParams: Record<string, string | null> = {
            users: sel.size ? [...sel].join(',') : null,
            search: search || null,
            sort: sort !== 'recent' ? sort : null,
        };

        this.router.navigate([], {
            queryParams,
            queryParamsHandling: 'merge',
            replaceUrl: true,
        });
    }
}
