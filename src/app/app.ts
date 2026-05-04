import { Component, signal } from '@angular/core';
import { PostsListComponent } from './features/posts/posts-list.component';
import { UsersListComponent } from './features/users/users-list.component';
import { PostDialogComponent } from './features/post-dialog/post-dialog.component';
import { Post } from './shared/models/models';

@Component({
  selector: 'app-root',
  imports: [UsersListComponent, PostsListComponent, PostDialogComponent],
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
