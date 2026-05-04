import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component, ContentChild, DestroyRef,
  Directive, ElementRef, inject, input,
  OnChanges,
  OnInit, output, signal, SimpleChanges,
  TemplateRef, viewChild
} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {VirtualElement} from '../models/virtualElement';

@Directive({
  selector: '[vsItem]',
})
export class VsItemDirective {
  constructor(public templateRef: TemplateRef<{ $implicit: unknown; index: number }>) {}
}

function buildPrefixSums(heights: number[]): number[] {
  const sums = new Array<number>(heights.length + 1).fill(0);
  for (let i = 0; i < heights.length; i++) {
    sums[i + 1] = sums[i] + heights[i];
  }
  return sums;
}

function binarySearch(prefixSums: number[], target: number): number {
  let lo = 0;
  let hi = prefixSums.length - 2;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (prefixSums[mid + 1] <= target) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

const OVERSCAN = 3;
const DEFAULT_ITEM_HEIGHT = 80;

@Component({
  selector: 'app-virtual-scroll',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './virtual-scroll.html',
  styleUrl: './virtual-scroll.scss',
})
export class VirtualScrollComponent implements OnInit, OnChanges, AfterViewInit {
  readonly items = input.required<VirtualElement[]>();
  readonly estimatedItemHeight = input<number>(DEFAULT_ITEM_HEIGHT);
  readonly headerTemplate = input<TemplateRef<unknown> | null>(null);
  readonly observeItemHeights = input(false);

  readonly itemActivated = output<{ item: VirtualElement; index: number }>();

  @ContentChild(VsItemDirective)
  vsItemDir?: VsItemDirective;

  get itemTemplate(): TemplateRef<unknown> | undefined {
    return this.vsItemDir?.templateRef;
  }

  private readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');
  private readonly destroyRef = inject(DestroyRef);

  private scrollTop = 0;
  private containerHeight = 0;
  private heights: number[] = [];
  private prefixSums: number[] = [];
  private resizeObserver?: ResizeObserver;
  private itemResizeObserver?: ResizeObserver;
  private renderedIndices: Map<number, HTMLElement> = new Map();

  readonly focusedIndex = signal(-1);
  readonly topPadding = signal(0);
  readonly bottomPadding = signal(0);
  readonly visibleItems = signal<Array<VirtualElement & { _origIndex: number }>>([]);

  ngOnInit(): void {
    this.initHeights();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.initHeights();
      this.focusedIndex.set(-1);
      this.updateVisibleRange();
    }
  }

  ngAfterViewInit(): void {
    const el = this.scrollContainer()?.nativeElement;
    if (!el) return;

    this.containerHeight = el.clientHeight;

    if (typeof ResizeObserver === 'undefined') {
      this.updateVisibleRange();
      return;
    }

    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        this.containerHeight = entry.contentRect.height;
        this.updateVisibleRange();
      }
    });
    this.resizeObserver.observe(el);

    if (this.observeItemHeights()) {
      this.itemResizeObserver = new ResizeObserver(entries => {
        let changed = false;
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const idx = parseInt(el.dataset['index'] ?? '-1', 10);
          if (idx < 0) continue;
          const newH = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
          if (this.heights[idx] !== newH) {
            this.heights[idx] = newH;
            changed = true;
          }
        }
        if (changed) {
          this.prefixSums = buildPrefixSums(this.heights);
          this.updateVisibleRange();
        }
      });
    }

    this.updateVisibleRange();

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.itemResizeObserver?.disconnect();
    });
  }

  private initHeights(): void {
    const items = this.items();
    const est = this.estimatedItemHeight();
    const prev = this.heights;
    this.heights = Array.from({ length: items.length }, (_, i) => prev[i] ?? est);
    this.prefixSums = buildPrefixSums(this.heights);
  }

  onScroll(event: Event): void {
    this.scrollTop = (event.target as HTMLElement).scrollTop;
    this.updateVisibleRange();
  }

  onKeyDown(event: KeyboardEvent): void {
    const items = this.items();
    const focused = this.focusedIndex();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = Math.min(focused + 1, items.length - 1);
      this.focusedIndex.set(next);
      this.scrollToIndex(next);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = Math.max(focused - 1, 0);
      this.focusedIndex.set(prev);
      this.scrollToIndex(prev);
    } else if (event.key === 'Enter' && focused >= 0) {
      event.preventDefault();
      this.itemActivated.emit({ item: items[focused], index: focused });
    }
  }

  private scrollToIndex(index: number): void {
    const el = this.scrollContainer()?.nativeElement;
    if (!el) return;
    const itemTop = this.prefixSums[index];
    const itemBottom = this.prefixSums[index + 1];
    if (itemTop < el.scrollTop) {
      el.scrollTop = itemTop;
    } else if (itemBottom > el.scrollTop + this.containerHeight) {
      el.scrollTop = itemBottom - this.containerHeight;
    }
  }

  private updateVisibleRange(): void {
    const items = this.items();
    if (!items.length) {
      this.visibleItems.set([]);
      this.topPadding.set(0);
      this.bottomPadding.set(0);
      return;
    }

    const scrollTop = this.scrollTop;
    const viewEnd = scrollTop + this.containerHeight;

    let startIdx = binarySearch(this.prefixSums, scrollTop);
    let endIdx = binarySearch(this.prefixSums, viewEnd);

    startIdx = Math.max(0, startIdx - OVERSCAN);
    endIdx = Math.min(items.length - 1, endIdx + OVERSCAN);

    const topPad = this.prefixSums[startIdx];
    const bottomPad = this.prefixSums[items.length] - this.prefixSums[endIdx + 1];

    const visible = items.slice(startIdx, endIdx + 1).map((item, i) => ({
      ...item,
      _origIndex: startIdx + i,
    }));

    this.topPadding.set(topPad);
    this.bottomPadding.set(Math.max(0, bottomPad));
    this.visibleItems.set(visible);
    const visibleSet = new Set(
      visible.map(v => v._origIndex)
    );

    this.renderedIndices.forEach((el, idx) => {
      if (!visibleSet.has(idx)) {
        this.itemResizeObserver?.unobserve(el);
        this.renderedIndices.delete(idx);
      }
    });
    requestAnimationFrame(() => {
      const container = this.scrollContainer()?.nativeElement;
      if (!container || !this.itemResizeObserver) return;
      const wrappers = container.querySelectorAll<HTMLElement>('.vs-item-wrapper[data-index]');
      wrappers.forEach(wrapper => {
        const idx = parseInt(wrapper.dataset['index'] ?? '-1', 10);
        if (!this.renderedIndices.has(idx)) {
          this.renderedIndices.set(idx, wrapper);
          this.itemResizeObserver!.observe(wrapper);
        }
      });
    });
  }
}
