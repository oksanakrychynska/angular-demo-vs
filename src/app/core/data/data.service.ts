
import { Injectable, signal } from '@angular/core';
import { Comment, Post, User } from '../../shared/models/models';
import { generateComments, generatePosts, generateUsers, mulberry32 } from './data-generator';

@Injectable({ providedIn: 'root' })
export class DataService {
    // Signals so consumers react when data arrives
    readonly users   = signal<User[]>([]);
    readonly posts   = signal<Post[]>([]);
    readonly loading = signal(true);

    // Fast lookup map, populated once data arrives
    private userMap = new Map<number, User>();

    constructor() {
        this.loadInWorker();
    }

    private loadInWorker(): void {
        if (typeof Worker === 'undefined') {
            // SSR / no-worker fallback — run synchronously
            this.loadSynchronously();
            return;
        }

        const worker = new Worker(
            new URL('./data.worker', import.meta.url),
            { type: 'module' }
        );

        worker.onmessage = ({ data }: MessageEvent<{ users: User[]; posts: Post[] }>) => {
            this.setData(data.users, data.posts);
            worker.terminate();
        };

        worker.onerror = () => {
            worker.terminate();
            this.loadSynchronously();
        };

        worker.postMessage(null); // kick off generation
    }

    private loadSynchronously(): void {
        const users = generateUsers(1000);
        const posts  = generatePosts(10_000, users);
        this.setData(users, posts);
    }

    private setData(users: User[], posts: Post[]): void {
        this.userMap = new Map(users.map(u => [u.id, u]));
        this.users.set(users);
        this.posts.set(posts);
        this.loading.set(false);
    }

    getUser(id: number): User | undefined {
        return this.userMap.get(id);
    }

    getComments(postId: number): Comment[] {
        const rng   = mulberry32(postId);
        const count = 2 + Math.floor(rng() * 14);
        return generateComments(postId, count);
    }
}
