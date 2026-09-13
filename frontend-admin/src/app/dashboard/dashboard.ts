import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { Menu } from '../menu/menu';
import { StatsService } from '../services/stats.service';

interface DonutSegment {
  dasharray: string;
  dashoffset: string;
  cssClass: string;
}

interface LegendItem {
  label: string;
  percentage: number;
  dotClass: string;
  legendClass: string;
}

interface BarData {
  label: string;
  height: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Menu, Header, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  totalMembres = 0;
  totalDemandes = 0;
  totalEvenements = 0;
  totalPartenaires = 0;

  bars: BarData[] = [];
  yAxisLabels: number[] = [];
  donutSegments: DonutSegment[] = [];
  distribution: LegendItem[] = [];

  private readonly CIRCUMFERENCE = 2 * Math.PI * 45;

  private readonly MOIS_COURTS: Record<string, string> = {
    'Janvier': 'Jan', 'Fevrier': 'Fév', 'Mars': 'Mar', 'Avril': 'Avr',
    'Mai': 'Mai', 'Juin': 'Jun', 'Juillet': 'Jul', 'Aout': 'Aoû',
    'Septembre': 'Sep', 'Octobre': 'Oct', 'Novembre': 'Nov', 'Decembre': 'Déc'
  };

  private readonly STATUT_CONFIG: Record<string, { label: string; segClass: string; dotClass: string; legendClass: string }> = {
    'ETUDIANT':      { label: 'Étudiant',      segClass: 'seg-dark',   dotClass: 'dot-dark',   legendClass: '' },
    'PROFESSIONNEL': { label: 'Professionnel',  segClass: 'seg-orange', dotClass: 'dot-orange', legendClass: 'legend-orange' },
    'ENSEIGNANT':    { label: 'Enseignant',     segClass: 'seg-purple', dotClass: 'dot-purple', legendClass: 'legend-purple' },
    'CHERCHEUR':     { label: 'Chercheur',      segClass: 'seg-green',  dotClass: 'dot-green',  legendClass: 'legend-green' },
  };

  constructor(private statsService: StatsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadEvolution();
    this.loadDistribution();
  }

  private loadDashboardStats(): void {
    this.statsService.getDashboardStats().subscribe(data => {
      console.log('[Stats] Dashboard:', data);
      this.totalMembres     = data['totalMembresActifs'] ?? 0;
      this.totalDemandes    = data['totalDemandes']      ?? 0;
      this.totalEvenements  = data['totalEvenements']    ?? 0;
      this.totalPartenaires = data['totalPartenaires']   ?? 0;
      this.cdr.detectChanges();
    });
  }

  private loadEvolution(): void {
    this.statsService.getMemberEvolution().subscribe(data => {
      console.log('[Stats] Evolution:', data);
      const values = Object.values(data);
      const max = Math.max(...values, 1);
      this.bars = Object.entries(data).map(([mois, count]) => ({
        label: this.MOIS_COURTS[mois] ?? mois,
        height: Math.round((count / max) * 100)
      }));
      this.yAxisLabels = [max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), 0];
      this.cdr.detectChanges();
    });
  }

  private loadDistribution(): void {
    this.statsService.getDistributionByStatut().subscribe(data => {
      console.log('[Stats] Distribution par statut:', data);
      const total = Object.values(data).reduce((sum, v) => sum + v, 0) || 1;
      const segments: DonutSegment[] = [];
      const legend: LegendItem[] = [];
      let accumulated = 0;

      Object.entries(data).forEach(([key, count]) => {
        const config = this.STATUT_CONFIG[key];
        if (!config) return;
        const pct = count / total;
        const segLen = pct * this.CIRCUMFERENCE;
        const gap = this.CIRCUMFERENCE - segLen;

        segments.push({
          dasharray: `${segLen.toFixed(1)} ${gap.toFixed(1)}`,
          dashoffset: `${(-accumulated).toFixed(1)}`,
          cssClass: config.segClass
        });
        legend.push({
          label: config.label,
          percentage: Math.round(pct * 100),
          dotClass: config.dotClass,
          legendClass: config.legendClass
        });
        accumulated += segLen;
      });

      this.donutSegments = segments;
      this.distribution = legend;
      this.cdr.detectChanges();
    });
  }
}
