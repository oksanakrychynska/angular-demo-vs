import { generateUsers, generatePosts } from './data-generator';

addEventListener('message', () => {
    const users = generateUsers(1000);
    const posts = generatePosts(10_000, users);
    postMessage({ users, posts });
});

