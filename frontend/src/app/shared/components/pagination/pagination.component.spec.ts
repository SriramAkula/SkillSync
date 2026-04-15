import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate totalPages correctly', () => {
    component.totalItems = 25;
    component.pageSize = 10;
    expect(component.totalPages).toBe(3);
  });

  it('should calculate startItem and endItem correctly', () => {
    component.totalItems = 25;
    component.pageSize = 10;
    component.currentPage = 1; // Second page
    
    expect(component.startItem).toBe(11);
    expect(component.endItem).toBe(20);

    component.currentPage = 2; // Last page
    expect(component.startItem).toBe(21);
    expect(component.endItem).toBe(25);
  });

  it('should emit pageChange when changePage is called with valid page', () => {
    spyOn(component.pageChange, 'emit');
    component.totalItems = 30;
    component.pageSize = 10;
    component.currentPage = 0;

    component.changePage(1);
    expect(component.pageChange.emit).toHaveBeenCalledWith(1);
  });

  it('should NOT emit pageChange when changePage is called with same page', () => {
    spyOn(component.pageChange, 'emit');
    component.totalItems = 30;
    component.pageSize = 10;
    component.currentPage = 1;

    component.changePage(1);
    expect(component.pageChange.emit).not.toHaveBeenCalled();
  });

  it('should NOT emit pageChange when page is out of bounds', () => {
    spyOn(component.pageChange, 'emit');
    component.totalItems = 30;
    component.pageSize = 10;
    component.currentPage = 0;

    expect(component.pageChange.emit).not.toHaveBeenCalled();
  });

  it('should calculate visiblePages correctly', () => {
    component.totalItems = 100;
    component.pageSize = 10; // 10 pages total
    component.currentPage = 5;
    
    const visible = component.visiblePages;
    expect(visible.length).toBeLessThanOrEqual(5);
    expect(visible).toContain(5);
  });
});
