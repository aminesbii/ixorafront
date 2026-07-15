import { Component, Output, EventEmitter, OnInit, OnDestroy, Input, Inject, PLATFORM_ID, ElementRef, ViewChild, HostListener } from '@angular/core';
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
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  query = '';
  suggestions: Suggestion[] = [];
  showHint = false;
  highlightIndex = -1;
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
          this.showHint = false;
          return [];
        }
        return this.productService.suggestions(value, 5);
      })
    ).subscribe(results => {
      if (Array.isArray(results)) {
        this.suggestions = results;
        this.showHint = results.length > 0;
        this.highlightIndex = -1;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onInput(value: string): void {
    this.searchSubject.next(value);
    this.highlightIndex = -1;
  }

  onFocus(): void {
    this.showHint = this.suggestions.length > 0;
  }

  onBlur(): void {
    setTimeout(() => {
      this.showHint = false;
      this.highlightIndex = -1;
    }, 200);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-search-bar')) {
      this.showHint = false;
      this.highlightIndex = -1;
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.suggestions.length > 0) {
        this.highlightIndex = (this.highlightIndex + 1) % this.suggestions.length;
      }
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.suggestions.length > 0) {
        this.highlightIndex = (this.highlightIndex - 1 + this.suggestions.length) % this.suggestions.length;
      }
      return;
    }
    if (event.key === 'Enter') {
      if (this.highlightIndex >= 0 && this.highlightIndex < this.suggestions.length) {
        this.selectSuggestion(this.suggestions[this.highlightIndex]);
        return;
      }
      this.showHint = false;
      this.suggestions = [];
      if (this.navigateOnSearch && this.query.trim()) {
        this.router.navigate(['/products'], { queryParams: { search: this.query.trim() } });
      } else {
        this.search.emit(this.query);
      }
      return;
    }
    if (event.key === 'Escape') {
      this.showHint = false;
      this.suggestions = [];
      this.highlightIndex = -1;
      return;
    }
  }

  selectSuggestion(s: Suggestion): void {
    this.showHint = false;
    this.suggestions = [];
    this.highlightIndex = -1;
    if (this.navigateOnSearch) {
      this.router.navigate(['/products', s.slug]);
    } else {
      this.query = s.name;
      this.search.emit(s.name);
    }
  }

  clear(): void {
    this.query = '';
    this.suggestions = [];
    this.showHint = false;
    this.highlightIndex = -1;
    this.searchSubject.next('');
  }
}
