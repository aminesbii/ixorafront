import { Component } from '@angular/core';
import { AdminPrefsService } from '../../core/services/admin-prefs.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
  standalone: false
})
export class AdminLayoutComponent {
  constructor(public prefs: AdminPrefsService) {}
}
