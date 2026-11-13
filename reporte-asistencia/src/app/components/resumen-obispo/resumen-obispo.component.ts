import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { EntrevistaReporteService } from '../../services/entrevista-reporte.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-resumen-obispo',
  templateUrl: './resumen-obispo.component.html',
  styleUrls: ['./resumen-obispo.component.css']
})
export class ResumenObispoComponent implements OnInit {
  @ViewChild('asistenciaCanvas') asistenciaCanvas!: ElementRef<HTMLCanvasElement>;
  chartAsistencia: Chart | null = null;

  unidades: any[] = [];
  unidadSeleccionada: number = 0;
  anioSeleccionado: number = new Date().getFullYear();
  cargando: boolean = false;

  // Variables de Resumen Anual (YTD)
  nombreObispo: string = '';
  promedioAsistenciaGeneral: number = 0;
  promedioAsistenciaJovenes: number = 0;
  totalConsejosBarrio: number = 0;
  totalConsejosJuventud: number = 0;
  totalPapelesMisionales: number = 0;
  totalJovenesEntrevistados: number = 0;
  totalMinJovenes: number = 0;
  totalMelquisedec: number = 0;
  retencionActualConversos: number = 0; // Del mes actual o último registrado

  // Variables acumuladas Item 3 (YTD)
  totalSemInscritos: number = 0;
  totalSemAsistencia: number = 0;
  totalInstInscritos: number = 0;
  totalInstAsistencia: number = 0;
  totalPmInscritos: number = 0;
  totalPmAsistencia: number = 0;

  constructor(private entrevistaService: EntrevistaReporteService) { }

  async ngOnInit() {
    this.cargando = true;
    try {
      this.unidades = await this.entrevistaService.getUnidades();
      if (this.unidades.length > 0) {
        this.unidadSeleccionada = this.unidades[0].id;
        await this.cargarResumen();
      }
    } catch (e) {
      console.error('Error', e);
    } finally {
      this.cargando = false;
    }
  }

  async cargarResumen() {
    if (!this.unidadSeleccionada) return;
    this.cargando = true;
    this.limpiarTotales();

    try {
      // 1. Cargar matriz manual
      const datosManuales = await this.entrevistaService.getMatrizMensual(this.unidadSeleccionada, this.anioSeleccionado);

      // 2. Cargar datos automáticos (Item 1 y 5)
      const datosAsistenciaAuto = await this.entrevistaService.getAsistenciaAutomatica(this.unidadSeleccionada, this.anioSeleccionado);
      const conversosAuto = await this.entrevistaService.getConversosAutomatico(this.unidadSeleccionada);

      this.procesarDatos(datosManuales, datosAsistenciaAuto, conversosAuto);

      setTimeout(() => this.renderizarGrafica(), 100);

    } catch (e) {
      console.error('Error al cargar el resumen', e);
    } finally {
      this.cargando = false;
    }
  }
  limpiarTotales() {
    this.nombreObispo = '';
    this.promedioAsistenciaGeneral = 0;
    this.promedioAsistenciaJovenes = 0;
    this.totalConsejosBarrio = 0;
    this.totalConsejosJuventud = 0;
    this.totalSemInscritos = 0;
    this.totalSemAsistencia = 0;
    this.totalInstInscritos = 0;
    this.totalInstAsistencia = 0;
    this.totalPmInscritos = 0;
    this.totalPmAsistencia = 0;
    this.totalPapelesMisionales = 0;
    this.totalJovenesEntrevistados = 0;
    this.totalMinJovenes = 0;
    this.totalMelquisedec = 0;
    this.retencionActualConversos = 0;
    if (this.chartAsistencia) this.chartAsistencia.destroy();
  }

  // Arrays para la gráfica
  mesesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  asistenciaGralData: number[] = new Array(12).fill(0);
  asistenciaJovenesData: number[] = new Array(12).fill(0);

  procesarDatos(manuales: any[], asistenciaAuto: any[], conversos: any[]) {
    // Procesar Asistencia Automática (Item 1)
    const asisPorMes: { [mes: number]: { total: number, count: number } } = {};
    asistenciaAuto.forEach((d: any) => {
      const mes = new Date(d.registros_domingo.fecha).getUTCMonth() + 1;
      if (!asisPorMes[mes]) asisPorMes[mes] = { total: 0, count: 0 };
      asisPorMes[mes].total += d.asistencia_hoy;
      asisPorMes[mes].count += 1;
    });

    let sumaGral = 0, countGral = 0;
    for (let m = 1; m <= 12; m++) {
      if (asisPorMes[m] && asisPorMes[m].count > 0) {
        const prom = Math.round(asisPorMes[m].total / asisPorMes[m].count);
        this.asistenciaGralData[m - 1] = prom;
        sumaGral += prom;
        countGral++;
      } else {
        this.asistenciaGralData[m - 1] = 0;
      }
    }
    this.promedioAsistenciaGeneral = countGral > 0 ? Math.round(sumaGral / countGral) : 0;

    // Procesar Datos Manuales (Items 2 al 7)
    let sumaJovenes = 0, countJovenes = 0;
    if (manuales && manuales.length > 0) {
      this.nombreObispo = manuales.find(m => m.nombre_obispo)?.nombre_obispo || '';

      manuales.forEach(reg => {
        const mIndex = reg.mes - 1;
        this.asistenciaJovenesData[mIndex] = reg.rs_jovenes_asistencia || 0;

        if (reg.rs_jovenes_asistencia > 0) {
          sumaJovenes += reg.rs_jovenes_asistencia;
          countJovenes++;
        }

        this.totalConsejosBarrio += (reg.consejos_barrio || 0);
        this.totalConsejosJuventud += (reg.consejos_juventud || 0);

        // Acumular Item 3
        this.totalSemInscritos += (reg.sem_inscritos || 0);
        this.totalSemAsistencia += (reg.sem_asistencia || 0);
        this.totalInstInscritos += (reg.inst_inscritos || 0);
        this.totalInstAsistencia += (reg.inst_asistencia || 0);
        this.totalPmInscritos += (reg.pm_inscritos || 0);
        this.totalPmAsistencia += (reg.pm_asistencia || 0);

        this.totalPapelesMisionales += (reg.misional_papeles || 0);
        this.totalJovenesEntrevistados += (reg.misional_entrevistas || 0);
        this.totalMinJovenes += (reg.min_jovenes_entrevistados || 0);
        this.totalMelquisedec += (reg.melquisedec_entrevistas || 0);
      });
    }
    this.promedioAsistenciaJovenes = countJovenes > 0 ? Math.round(sumaJovenes / countJovenes) : 0;

    // Procesar Conversos (Item 5) - Fotografía del momento actual
    let posibles = 0, logrados = 0;
    conversos.forEach((c: any) => {
      const edad = new Date().getFullYear() - c.anio_nacimiento;
      const esVaron = c.genero === 'M';
      posibles++; if (c.hito_post_bautismal) logrados++;
      if (edad >= 11) { posibles++; if (c.hito_entrevista_templo) logrados++; }
      if (edad >= 11) { posibles++; if (c.hito_recomendacion) logrados++; }
      if (esVaron && edad >= 11) { posibles++; if (c.hito_aaronico) logrados++; }
      if (edad >= 11) { posibles++; if (c.hito_llamamiento) logrados++; }
      if (esVaron && edad >= 18) { posibles++; if (c.hito_melquisedec) logrados++; }
      posibles++; if (c.hito_nombres_templo) logrados++;
    });
    this.retencionActualConversos = posibles > 0 ? Math.round((logrados / posibles) * 100) : 0;
  }

  renderizarGrafica() {
    if (!this.asistenciaCanvas) return;
    this.chartAsistencia = new Chart(this.asistenciaCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: this.mesesLabels,
        datasets: [
          {
            label: 'Asistencia Gral.',
            data: this.asistenciaGralData,
            borderColor: '#00838f',
            backgroundColor: 'rgba(0, 131, 143, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          },
          {
            label: 'Asistencia Jóvenes',
            data: this.asistenciaJovenesData,
            borderColor: '#f59e0b',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}