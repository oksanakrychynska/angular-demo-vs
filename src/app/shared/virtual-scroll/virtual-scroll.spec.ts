import { TestBed } from '@angular/core/testing';
import { VirtualScrollComponent } from './virtual-scroll';

describe('VirtualScroll', () => {
  it('should create the component', async () => {
    await TestBed.configureTestingModule({
      imports: [VirtualScrollComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(VirtualScrollComponent);
    fixture.componentRef.setInput('items', []);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
