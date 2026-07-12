import { Component, Output, EventEmitter, OnInit, OnDestroy, Input, Inject, PLATFORM_ID, ElementRef, ViewChild } from '@angular/core';
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
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get ghostText(): string {
    if (!this.query || this.suggestions.length === 0) return '';
    const q = this.query.toLowerCase();
    const match = this.suggestions.find(s => s.name.toLowerCase().startsWith(q));
    if (!match) return '';
    return match.name;
  }

  onInput(value: string): void {
    this.searchSubject.next(value);
  }

  onFocus(): void {
    this.showHint = this.suggestions.length > 0;
  }

  onBlur(): void {
    setTimeout(() => this.showHint = false, 150);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab' && this.ghostText) {
      event.preventDefault();
      this.query = this.ghostText;
      this.suggestions = [];
      this.showHint = false;
      this.searchSubject.next(this.ghostText);
    }
    if (event.key === 'Enter') {
      this.showHint = false;
      this.suggestions = [];
      if (this.navigateOnSearch && this.query.trim()) {
        this.router.navigate(['/products'], { queryParams: { search: this.query.trim() } });
      } else {
        this.search.emit(this.query);
      }
    }
    if (event.key === 'Escape') {
      this.showHint = false;
      this.suggestions = [];
    }
  }

  clear(): void {
    this.query = '';
    this.suggestions = [];
    this.showHint = false;
    this.searchSubject.next('');
  }
}
