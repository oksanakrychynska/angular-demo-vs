import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import { AppStore } from '../../core/store/app.store';
import { DataService } from '../../core/data/data.service';
import {VirtualScrollComponent, VsItemDirective} from '../../shared/virtual-scroll/virtual-scroll';
import {VirtualElement} from '../../shared/models/virtualElement';


@Component({
    selector: 'app-users-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [VirtualScrollComponent, VsItemDirective],
    templateUrl: 'users-list.html',
    styleUrl: 'users-list.scss',
})
export class UsersList {
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
