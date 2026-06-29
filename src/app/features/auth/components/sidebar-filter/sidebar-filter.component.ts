import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CategoryService } from '../../../../core/services/category.service';
import { CategoryTree } from '../../../../core/models/category.model';

export interface FilterState {
  category_id: string | null;
  sort: string;
  priceRange: [number | null, number | null];
}

@Component({
  selector: 'app-sidebar-filter',
  templateUrl: './sidebar-filter.component.html',
  styleUrls: ['./sidebar-filter.component.css'],
  standalone: false
})
export class SidebarFilterComponent implements OnInit {
  @Output() filterChange = new EventEmitter<FilterState>();
  @Input() mobileOpen = false;
  @Output() mobileClose = new EventEmitter<void>();
  @Input() set initialCategoryId(value: string | null) {
    if (value && this.filters) {
      this.filters.category_id = value;
    }
  }

  sortOpen = false;

  categories: CategoryTree[] = [];

  filters: FilterState = {
    category_id: null,
    sort: '-createdAt',
    priceRange: [null, null]
  };

  priceMin = 0;
  priceMax = 1000;
  maxPrice = 1000;

  sortOptions = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'createdAt', label: 'Oldest First' },
  ];

  get activeSortLabel(): string {
    return this.sortOptions.find(o => o.value === this.filters.sort)?.label || 'Sort By';
  }

  get rangeBarLeft(): number {
    return (this.priceMin / this.maxPrice) * 100;
  }

  get rangeBarWidth(): number {
    return ((this.priceMax - this.priceMin) / this.maxPrice) * 100;
  }

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.tree().subscribe({
      next: (cats) => { this.categories = cats; },
      error: () => { this.categories = []; }
    });
  }

  onSliderChange(): void {
    this.priceMin = Math.min(this.priceMin, this.priceMax);
    this.priceMax = Math.max(this.priceMax, this.priceMin);
    this.applyPriceFilter();
  }

  onInputChange(): void {
    if (this.priceMin > this.priceMax) {
      this.priceMax = this.priceMin;
    }
    this.applyPriceFilter();
  }

  private applyPriceFilter(): void {
    const min = this.priceMin > 0 ? this.priceMin : null;
    const max = this.priceMax < this.maxPrice ? this.priceMax : null;
    this.filters.priceRange = [min, max];
    this.emitChange();
  }

  setCategory(id: string | null): void {
    this.filters.category_id = this.filters.category_id === id ? null : id;
    this.emitChange();
  }

  setSort(value: string): void {
    this.filters.sort = value;
    this.sortOpen = false;
    this.emitChange();
  }

  toggleSort(): void {
    this.sortOpen = !this.sortOpen;
  }

  closeSort(): void {
    this.sortOpen = false;
  }

  clearAll(): void {
    this.filters = { category_id: null, sort: '-createdAt', priceRange: [null, null] };
    this.priceMin = 0;
    this.priceMax = this.maxPrice;
    this.emitChange();
  }

  hasActiveFilters(): boolean {
    return !!this.filters.category_id || this.filters.priceRange[0] !== null || this.filters.priceRange[1] !== null;
  }

  private emitChange(): void {
    this.filterChange.emit({ ...this.filters });
  }
}
