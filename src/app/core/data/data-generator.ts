import { Comment, Post, User } from '../../shared/models/models';
import { AVATAR_COLORS, COMPANIES, FIRST_NAMES, LAST_NAMES, LOREM_WORDS, SEED } from './constants';

export function mulberry32(seed: number): () => number {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function loremWords(rng: () => number, count: number): string {
    return Array.from({ length: count }, () =>
        LOREM_WORDS[Math.floor(rng() * LOREM_WORDS.length)]
    ).join(' ');
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateUsers(count: number): User[] {
    const rng = mulberry32(SEED);
    return Array.from({ length: count }, (_, i) => {
        const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
        const lastName  = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
        const name = `${firstName} ${lastName}`;
        return {
            id: i + 1,
            name,
            username: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(rng() * 99)}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
            company: COMPANIES[Math.floor(rng() * COMPANIES.length)],
            avatar: AVATAR_COLORS[Math.floor(rng() * AVATAR_COLORS.length)],
        };
    });
}

export function generatePosts(count: number, users: User[]): Post[] {
    const rng = mulberry32(SEED * 2);
    const now = Date.now();
    return Array.from({ length: count }, (_, i) => {
        const wordCount = 4 + Math.floor(rng() * 6);
        const bodyCount = 20 + Math.floor(rng() * 60);
        return {
            id: i + 1,
            userId: users[Math.floor(rng() * users.length)].id,
            title: capitalize(loremWords(rng, wordCount)),
            body: capitalize(loremWords(rng, bodyCount)) + '.',
            createdAt: now - Math.floor(rng() * 365 * 24 * 60 * 60 * 1000),
        };
    }).sort((a, b) => b.createdAt - a.createdAt);
}

export function generateComments(postId: number, count: number): Comment[] {
    const rng = mulberry32(postId * 31 + SEED * 3);
    return Array.from({ length: count }, (_, i) => {
        const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
        const lastName  = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
        const bodyCount = 8 + Math.floor(rng() * 30);
        return {
            id: i + 1,
            postId,
            author: `${firstName} ${lastName}`,
            body: capitalize(loremWords(rng, bodyCount)) + '.',
        };
    });
}
