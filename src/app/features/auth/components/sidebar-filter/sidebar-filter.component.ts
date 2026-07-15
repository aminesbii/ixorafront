import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CategoryService } from '../../../../core/services/category.service';
import { CategoryTree } from '../../../../core/models/category.model';

export interface FilterState {
  category_ids: string[];
  sort: string;
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
  @Output() hideSidebar = new EventEmitter<void>();
  @Input() set initialCategoryIds(value: string[]) {
    if (value?.length && this.filters) {
      this.filters.category_ids = [...value];
    }
  }

  sortOpen = false;

  categories: CategoryTree[] = [];

  filters: FilterState = {
    category_ids: [],
    sort: 'sort_order',
  };

  sortOptions = [
    { value: 'sort_order', label: 'Recommended' },
    { value: '-createdAt', label: 'Newest First' },
    { value: 'createdAt', label: 'Oldest First' },
  ];

  get activeSortLabel(): string {
    return this.sortOptions.find(o => o.value === this.filters.sort)?.label || 'Sort By';
  }

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.tree().subscribe({
      next: (cats) => { this.categories = cats; },
      error: () => { this.categories = []; }
    });
  }

  toggleCategory(id: string): void {
    const idx = this.filters.category_ids.indexOf(id);
    if (idx === -1) {
      this.filters.category_ids.push(id);
    } else {
      this.filters.category_ids.splice(idx, 1);
    }
    this.emitChange();
  }

  isCategorySelected(id: string): boolean {
    return this.filters.category_ids.includes(id);
  }

  removeCategory(id: string): void {
    this.filters.category_ids = this.filters.category_ids.filter(c => c !== id);
    this.emitChange();
  }

  getCategoryName(id: string): string {
    for (const cat of this.categories) {
      if (cat.id === id || cat._id === id) return cat.name;
      if (cat.children) {
        const sub = cat.children.find(c => c.id === id || c._id === id);
        if (sub) return sub.name;
      }
    }
    return id;
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
    setTimeout(() => { this.sortOpen = false; }, 150);
  }

  clearAll(): void {
    this.filters = { category_ids: [], sort: 'sort_order' };
    this.emitChange();
  }

  hasActiveFilters(): boolean {
    return this.filters.category_ids.length > 0;
  }

  private emitChange(): void {
    this.filterChange.emit({ ...this.filters, category_ids: [...this.filters.category_ids] });
  }
}
