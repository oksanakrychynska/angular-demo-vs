import { generateUsers, generatePosts } from './data-generator';

addEventListener('message', () => {
    const users = generateUsers(1000);
    let posts = generatePosts(400, users);
    postMessage({ users, posts, done: false });

    let nextId = posts.length + 1;
    const batchSize = 1200;
    const totalPosts = 10_000;

    const generateNextBatch = () => {
        const remaining = totalPosts - posts.length;
        if (remaining <= 0) {
            postMessage({ users, posts, done: true });
            return;
        }

        const batch = generatePosts(
            Math.min(batchSize, remaining),
            users,
            nextId,
            84 + nextId
        );
        nextId += batch.length;
        posts = [...posts, ...batch].sort((a, b) => b.createdAt - a.createdAt);
        postMessage({ users, posts, done: false });
        setTimeout(generateNextBatch, 0);
    };

    setTimeout(generateNextBatch, 0);
});

