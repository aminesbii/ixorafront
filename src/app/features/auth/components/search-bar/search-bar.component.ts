import { Component, Output, EventEmitter, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css'],
  standalone: false
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Output() search = new EventEmitter<string>();

  query = '';
  private searchSubject = new Subject<string>();
  private sub?: Subscription;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.sub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(value => {
      this.search.emit(value);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onInput(value: string): void {
    this.searchSubject.next(value);
  }

  clear(): void {
    this.query = '';
    this.searchSubject.next('');
  }
}
