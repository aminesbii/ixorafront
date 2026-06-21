import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CategoryService } from '../../../../core/services/category.service';
import { CategoryTree } from '../../../../core/models/category.model';

export interface FilterState {
  category_id: string | null;
  sort: string;
  priceRange: [number | null, number | null];
  brand_name: string | null;
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
    priceRange: [null, null],
    brand_name: null
  };

  sortOptions = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'createdAt', label: 'Oldest First' },
  ];

  get activeSortLabel(): string {
    return this.sortOptions.find(o => o.value === this.filters.sort)?.label || 'Sort By';
  }

  priceRanges = [
    { label: 'Under 20 TND', min: null, max: 20 },
    { label: '20 - 50 TND', min: 20, max: 50 },
    { label: '50 - 100 TND', min: 50, max: 100 },
    { label: '100+ TND', min: 100, max: null },
  ];

  selectedPriceLabel = '';

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.tree().subscribe({
      next: (cats) => { this.categories = cats; },
      error: () => { this.categories = []; }
    });
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

  setPriceRange(min: number | null, max: number | null, label: string): void {
    if (this.filters.priceRange[0] === min && this.filters.priceRange[1] === max) {
      this.filters.priceRange = [null, null];
      this.selectedPriceLabel = '';
    } else {
      this.filters.priceRange = [min, max];
      this.selectedPriceLabel = label;
    }
    this.emitChange();
  }

  clearAll(): void {
    this.filters = { category_id: null, sort: '-createdAt', priceRange: [null, null], brand_name: null };
    this.selectedPriceLabel = '';
    this.emitChange();
  }

  hasActiveFilters(): boolean {
    return !!this.filters.category_id || this.filters.priceRange[0] !== null || this.filters.priceRange[1] !== null;
  }

  private emitChange(): void {
    this.filterChange.emit({ ...this.filters });
  }
}
