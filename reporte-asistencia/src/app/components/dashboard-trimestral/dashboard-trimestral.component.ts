import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { AsistenciaService } from '../../services/asistencia.service';
import { ReporteTrimestral } from '../../models/asistencia.model';
import html2canvas from 'html2canvas';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-trimestral',
  templateUrl: './dashboard-trimestral.component.html',
  styleUrls: ['./dashboard-trimestral.component.css']
})
export class DashboardTrimestralComponent implements OnInit {
  @ViewChild('chartEstacaCanvas') chartEstacaCanvas!: ElementRef<HTMLCanvasElement>;

  reporte: ReporteTrimestral | null = null;
  charts: { [key: string]: Chart } = {};

  anioSeleccionado: number = new Date().getFullYear();
  trimestreSeleccionado: number = 4;
  cargando: boolean = true;
  exportando: boolean = false;

  aniosDisponibles: number[] = [2025, 2026, 2027];
  trimestres = [
    { num: 1, label: 'T1 (Ene - Mar)' },
    { num: 2, label: 'T2 (Abr - Jun)' },
    { num: 3, label: 'T3 (Jul - Sep)' },
    { num: 4, label: 'T4 (Oct - Dic)' }
  ];

  barriosInfo = [
    { key: 'Barrio Anaco', label: 'Barrio Anaco', color: '#3b82f6' },
    { key: 'Barrio Cantaura', label: 'Barrio Cantaura', color: '#10b981' },
    { key: 'Barrio Pariaguán', label: 'Barrio Pariaguán', color: '#f59e0b' },
    { key: 'Barrio Tigrito', label: 'Barrio Tigrito', color: '#ef4444' },
    { key: 'Barrio Tigre', label: 'Barrio Tigre', color: '#8b5cf6' }
  ];

  constructor(private asistenciaService: AsistenciaService) { }

  async ngOnInit() {
    await this.cargarReporteTrimestral();
  }

  async cargarReporteTrimestral() {
    this.cargando = true;
    this.reporte = null;
    this.destruirGraficas();

    try {
      this.reporte = await this.asistenciaService.getReporteTrimestral(
        Number(this.anioSeleccionado),
        Number(this.trimestreSeleccionado)
      );

      setTimeout(() => {
        this.renderizarGraficas();
      }, 150);
    } catch (e) {
      console.error('Error al cargar reporte trimestral:', e);
    } finally {
      this.cargando = false;
    }
  }

  destruirGraficas() {
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key].destroy();
      }
    });
    this.charts = {};
  }

  renderizarGraficas() {
    if (!this.reporte || !this.reporte.asistencias_semanales || this.reporte.asistencias_semanales.length === 0) return;

    const semanas = this.reporte.asistencias_semanales;
    const labels = semanas.map(s => `${s.semanaEtiqueta}`);

    // 1. Gráfica Principal de la Estaca
    // 1. Gráfica Principal de la Estaca (Escala fija de 0 a 500 sin decimales)
    if (this.chartEstacaCanvas) {
      const dataEstaca = semanas.map(s => s.totalEstaca);
      this.charts['estaca'] = new Chart(this.chartEstacaCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Asistencia Total Estaca',
            data: dataEstaca,
            borderColor: '#00838f',
            backgroundColor: 'rgba(0, 131, 143, 0.12)',
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#00838f',
            fill: true,
            tension: 0.25
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true },
            title: { display: true, text: 'Tendencia General de la Estaca', font: { size: 16, weight: 'bold' } }
          },
          scales: {
            y: {
              beginAtZero: true,
              min: 0,
              max: 500, // Límite máximo para la Estaca
              ticks: {
                precision: 0,
                stepSize: 100 // Intervalos limpios: 0, 100, 200, 300, 400, 500
              },
              grid: { color: '#f1f5f9' }
            },
            x: { grid: { color: '#f1f5f9' } }
          }
        }
      });
    }

    // 2. Gráficas individuales por Barrio (Escala fija de 0 a 150 sin decimales)
    this.barriosInfo.forEach(barrio => {
      const canvas = document.getElementById(`chart-${barrio.key}`) as HTMLCanvasElement;
      if (canvas) {
        const dataBarrio = semanas.map(s => s.asistenciasPorBarrio[barrio.key] || 0);
        this.charts[barrio.key] = new Chart(canvas, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: barrio.label,
              data: dataBarrio,
              borderColor: barrio.color,
              backgroundColor: `${barrio.color}1e`,
              borderWidth: 2.5,
              pointRadius: 4,
              pointBackgroundColor: barrio.color,
              fill: true,
              tension: 0.25
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: true, text: barrio.label, font: { size: 14, weight: 'bold' } }
            },
            scales: {
              y: {
                beginAtZero: true,
                min: 0,
                max: 150,
                ticks: {
                  precision: 0,
                  stepSize: 30
                },
                grid: { color: '#f1f5f9' }
              },
              x: { grid: { color: '#f1f5f9' } }
            }
          }
        });
      }
    });
  }

  async exportarAImagen() {
    const elemento = document.getElementById('dashboard-trimestral-export');
    if (!elemento) return;

    this.exportando = true;
    try {
      const canvas = await html2canvas(elemento, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `Reporte_Trimestral_T${this.trimestreSeleccionado}_${this.anioSeleccionado}.png`;
      link.click();
    } finally {
      this.exportando = false;
    }
  }
}