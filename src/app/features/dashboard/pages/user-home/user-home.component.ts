import { Component, OnInit } from '@angular/core';

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: string;
  colorClass: string;
}

interface ActivityLog {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

@Component({
  selector: 'app-user-home',
  templateUrl: './user-home.component.html',
  styleUrls: ['./user-home.component.css'],
  standalone: false
})
export class UserHomeComponent implements OnInit {
  greetingMessage = 'Welcome back';
  userName = 'Amine Sbii';
  isDiagnosticRunning = false;
  diagnosticStatus = '';

  stats: StatCard[] = [
    {
      title: 'Total Projects',
      value: 8,
      change: '+2 this month',
      isPositive: true,
      icon: 'folder',
      colorClass: 'from-violet-500/20 to-indigo-500/10 text-violet-400 border-violet-500/20'
    },
    {
      title: 'Active Nodes',
      value: 12,
      change: '100% uptime',
      isPositive: true,
      icon: 'dns',
      colorClass: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      title: 'Monthly Queries',
      value: '142.8k',
      change: '+14.2% vs last month',
      isPositive: true,
      icon: 'query_stats',
      colorClass: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/20'
    },
    {
      title: 'Resource Usage',
      value: '64%',
      change: 'Normal limits',
      isPositive: true,
      icon: 'memory',
      colorClass: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/20'
    }
  ];

  activities: ActivityLog[] = [
    {
      id: '1',
      action: 'Project deployed',
      target: 'ixora-Web-App v1.0.3',
      timestamp: '10 minutes ago',
      status: 'success'
    },
    {
      id: '2',
      action: 'Database Backup',
      target: 'Automatic Nightly Save',
      timestamp: '4 hours ago',
      status: 'success'
    },
    {
      id: '3',
      action: 'API Warning',
      target: 'High response latency on /v1/auth',
      timestamp: '6 hours ago',
      status: 'warning'
    },
    {
      id: '4',
      action: 'Domain linked',
      target: 'console.ixora.io',
      timestamp: 'Yesterday at 18:34',
      status: 'info'
    }
  ];

  ngOnInit(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greetingMessage = 'Good morning';
    } else if (hour < 18) {
      this.greetingMessage = 'Good afternoon';
    } else {
      this.greetingMessage = 'Good evening';
    }
  }

  runDiagnostics() {
    if (this.isDiagnosticRunning) return;

    this.isDiagnosticRunning = true;
    this.diagnosticStatus = 'Checking network interfaces...';

    setTimeout(() => {
      this.diagnosticStatus = 'Validating database connections...';
    }, 1000);

    setTimeout(() => {
      this.diagnosticStatus = 'Analyzing load distribution...';
    }, 2000);

    setTimeout(() => {
      this.isDiagnosticRunning = false;
      this.diagnosticStatus = 'All systems healthy. No issues detected.';
    }, 3500);
  }
}
