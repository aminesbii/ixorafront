import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'ixora';
  installPromptEvent: any = null;
  showInstallPrompt = false;
  showAiChat = true;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    // Scroll to top on route change
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (isPlatformBrowser(this.platformId)) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // Determine deepest activated route to read data
        let route = this.activatedRoute.firstChild;
        while (route && route.firstChild) {
          route = route.firstChild;
        }
        const data = route?.snapshot.data || {};
        this.showAiChat = !data['hideAiChat'];
      });

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('beforeinstallprompt', (event: any) => {
        event.preventDefault();
        this.installPromptEvent = event;
        setTimeout(() => {
          this.showInstallPrompt = true;
        }, 10000); // Show after 10 seconds
      });
    }
  }

  installPWA() {
    if (this.installPromptEvent) {
      this.installPromptEvent.prompt();
      this.installPromptEvent.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          // User accepted
        }
        this.showInstallPrompt = false;
        this.installPromptEvent = null;
      });
    }
  }
}
