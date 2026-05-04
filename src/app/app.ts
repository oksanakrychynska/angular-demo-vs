import { Component, signal } from '@angular/core';
import { PostsList } from './features/posts/posts-list';
import { UsersList } from './features/users/users-list';
import { PostDialogComponent } from './features/post-dialog/post-dialog.component';
import { Post } from './shared/models/models';

@Component({
  selector: 'app-root',
  imports: [UsersList, PostsList, PostDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('scrolling-demo-app');
  protected readonly selectedPost = signal<Post | null>(null);

  protected openPost(post: Post): void {
    this.selectedPost.set(post);
  }

  protected closePost(): void {
    this.selectedPost.set(null);
  }
}
