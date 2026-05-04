import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
    OnChanges,
    SimpleChanges,
    signal,
    ElementRef,
    viewChild,
    AfterViewInit,
} from '@angular/core';
import {Post, Comment} from '../../shared/models/models';
import {DataService} from '../../core/data/data.service';
import {DatePipe} from '@angular/common';

@Component({
    selector: 'app-post-dialog',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [DatePipe],
    templateUrl: './post-dialog.component.html',
    styleUrl: './post-dialog.component.scss',
})
export class PostDialogComponent implements OnChanges, AfterViewInit {
    readonly post = input<Post | null>(null);
    readonly closed = output<void>();

    private readonly data = inject(DataService);
    private readonly dialogEl = viewChild<ElementRef<HTMLDialogElement>>('dialogEl');

    readonly comments = signal<Comment[]>([]);

    readonly authorName = computed(() => {
        const p = this.post();
        return p ? (this.data.getUser(p.userId)?.name ?? 'Unknown') : '';
    });

    readonly authorColor = computed(() => {
        const p = this.post();
        return p ? (this.data.getUser(p.userId)?.avatar ?? '#888') : '#888';
    });

    readonly authorInitials = computed(() => {
        const name = this.authorName();
        return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    });

    ngAfterViewInit(): void {
        this.syncDialog();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['post']) {
            this.syncDialog();
        }
    }

    private syncDialog(): void {
        const p = this.post();
        const dialog = this.dialogEl()?.nativeElement;
        if (p && dialog) {
            this.comments.set(this.data.getComments(p.id));
            if (!dialog.open) {
                dialog.showModal();
            }
        } else if (!p && dialog?.open) {
            dialog.close();
        }
    }

    onBackdropClick(event: MouseEvent): void {
        const dialog = this.dialogEl()?.nativeElement;
        if (!dialog) return;
        const rect = dialog.getBoundingClientRect();
        const inside =
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;
        if (!inside) {
            this.closed.emit();
        }
    }
}
