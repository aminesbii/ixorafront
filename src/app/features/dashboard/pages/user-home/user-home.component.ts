import { Component } from '@angular/core';
import { AdminPrefsService } from '../../../../core/services/admin-prefs.service';

@Component({
  selector: 'app-user-home',
  templateUrl: './user-home.component.html',
  styleUrls: ['./user-home.component.css'],
  standalone: false
})
export class UserHomeComponent {
  allStats = [
    { title: 'Total Projects', value: 8, change: '+2 this month', icon: 'folder' },
    { title: 'Active Nodes', value: 12, change: '100% uptime', icon: 'dns' },
    { title: 'Monthly Queries', value: '142.8k', change: '+14.2% vs last month', icon: 'query_stats' },
    { title: 'Resource Usage', value: '64%', change: 'Normal limits', icon: 'memory' }
  ];

  constructor(public prefs: AdminPrefsService) {}

  get stats() {
    return this.allStats.filter(s => this.prefs.statCardVisible(s.title));
  }

  activities = [
    { id: '1', action: 'Project deployed', target: 'ixora-Web-App v1.0.3', timestamp: '10 minutes ago', status: 'success' as const },
    { id: '2', action: 'Database Backup', target: 'Automatic Nightly Save', timestamp: '4 hours ago', status: 'success' as const },
    { id: '3', action: 'API Warning', target: 'High response latency on /v1/auth', timestamp: '6 hours ago', status: 'warning' as const },
    { id: '4', action: 'Domain linked', target: 'console.ixora.io', timestamp: 'Yesterday at 18:34', status: 'info' as const }
  ];
}
