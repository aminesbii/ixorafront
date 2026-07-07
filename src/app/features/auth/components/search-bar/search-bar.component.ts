import { Component, Output, EventEmitter, OnInit, OnDestroy, Input, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { ProductService, Suggestion } from '../../../../core/services/product.service';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css'],
  standalone: false
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Output() search = new EventEmitter<string>();
  @Input() navigateOnSearch = false;

  query = '';
  suggestions: Suggestion[] = [];
  showDropdown = false;
  private searchSubject = new Subject<string>();
  private sub?: Subscription;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (value.trim().length < 2) {
          this.suggestions = [];
          this.showDropdown = false;
          return [];
        }
        return this.productService.suggestions(value, 5);
      })
    ).subscribe(results => {
      if (Array.isArray(results)) {
        this.suggestions = results;
        this.showDropdown = results.length > 0;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onInput(value: string): void {
    this.searchSubject.next(value);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.showDropdown = false;
      if (this.navigateOnSearch && this.query.trim()) {
        this.router.navigate(['/products'], { queryParams: { search: this.query.trim() } });
      } else {
        this.search.emit(this.query);
      }
    }
    if (event.key === 'Escape') {
      this.showDropdown = false;
    }
  }

  selectSuggestion(s: Suggestion): void {
    this.query = s.name;
    this.showDropdown = false;
    this.router.navigate(['/products', s.slug]);
  }

  onBlur(): void {
    setTimeout(() => this.showDropdown = false, 200);
  }

  clear(): void {
    this.query = '';
    this.suggestions = [];
    this.showDropdown = false;
    this.searchSubject.next('');
  }
}
