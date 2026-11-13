import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { EntrevistaReporteService } from '../../services/entrevista-reporte.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export type ProgramaEducativo = 'seminario' | 'instituto' | 'pm';

interface ResumenProgramaEstaca {
  titulo: string;
  inscritos: number;
  asistencia: number;
  porcentaje: number;
  detalleUnidades: { nombre: string; inscritos: number; asistencia: number; porcentaje: number }[];
}

@Component({
  selector: 'app-resumen-obispo',
  templateUrl: './resumen-obispo.component.html',
  styleUrls: ['./resumen-obispo.component.css']
})
export class ResumenObispoComponent implements OnInit {
  @ViewChild('asistenciaCanvas') asistenciaCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('programaCanvas') programaCanvas!: ElementRef<HTMLCanvasElement>;

  chartAsistencia: Chart | null = null;
  chartPrograma: Chart | null = null;

  unidades: any[] = [];
  unidadSeleccionada: number = 0;
  anioSeleccionado: number = new Date().getFullYear();
  cargando: boolean = false;

  // Selector activo para la gráfica y el consolidado de estaca
  programaSeleccionado: ProgramaEducativo = 'seminario';

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
  retencionActualConversos: number = 0;

  // Variables de Estado Actual Item 3 (Unidad seleccionada + %)
  totalSemInscritos: number = 0;
  totalSemAsistencia: number = 0;
  porcentajeSeminarioUnidad: number = 0;

  totalInstInscritos: number = 0;
  totalInstAsistencia: number = 0;
  porcentajeInstitutoUnidad: number = 0;

  totalPmInscritos: number = 0;
  totalPmAsistencia: number = 0;
  porcentajePmUnidad: number = 0;

  // Consolidado por Estaca para los 3 programas
  consolidadoEstacaProgramas: Record<ProgramaEducativo, ResumenProgramaEstaca> = {
    seminario: { titulo: 'Seminario', inscritos: 0, asistencia: 0, porcentaje: 0, detalleUnidades: [] },
    instituto: { titulo: 'Instituto', inscritos: 0, asistencia: 0, porcentaje: 0, detalleUnidades: [] },
    pm: { titulo: 'Preparación Misional', inscritos: 0, asistencia: 0, porcentaje: 0, detalleUnidades: [] }
  };

  // Arrays mensuales para las gráficas
  mesesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  asistenciaGralData: number[] = new Array(12).fill(0);
  asistenciaJovenesData: number[] = new Array(12).fill(0);

  datosMensualesProgramas: Record<ProgramaEducativo, { inscritos: number[]; asistencia: number[] }> = {
    seminario: { inscritos: new Array(12).fill(0), asistencia: new Array(12).fill(0) },
    instituto: { inscritos: new Array(12).fill(0), asistencia: new Array(12).fill(0) },
    pm: { inscritos: new Array(12).fill(0), asistencia: new Array(12).fill(0) }
  };

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

  cambiarPrograma(prog: ProgramaEducativo) {
    this.programaSeleccionado = prog;
    this.renderizarGraficaPrograma();
  }

  async cargarResumen() {
    if (!this.unidadSeleccionada) return;
    this.cargando = true;
    this.limpiarTotales();

    try {
      const [datosManuales, datosEstacaAnual, datosAsistenciaAuto, conversosAuto] = await Promise.all([
        this.entrevistaService.getMatrizMensual(this.unidadSeleccionada, this.anioSeleccionado),
        this.entrevistaService.getMatrizAnualEstaca(this.anioSeleccionado),
        this.entrevistaService.getAsistenciaAutomatica(this.unidadSeleccionada, this.anioSeleccionado),
        this.entrevistaService.getConversosAutomatico(this.unidadSeleccionada)
      ]);

      this.procesarDatos(datosManuales, datosAsistenciaAuto, conversosAuto);
      this.procesarResumenEstacaProgramas(datosEstacaAnual);

      setTimeout(() => {
        this.renderizarGraficaSacramental();
        this.renderizarGraficaPrograma();
      }, 100);
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
    this.porcentajeSeminarioUnidad = 0;

    this.totalInstInscritos = 0;
    this.totalInstAsistencia = 0;
    this.porcentajeInstitutoUnidad = 0;

    this.totalPmInscritos = 0;
    this.totalPmAsistencia = 0;
    this.porcentajePmUnidad = 0;

    this.totalPapelesMisionales = 0;
    this.totalJovenesEntrevistados = 0;
    this.totalMinJovenes = 0;
    this.totalMelquisedec = 0;
    this.retencionActualConversos = 0;

    this.consolidadoEstacaProgramas = {
      seminario: { titulo: 'Seminario', inscritos: 0, asistencia: 0, porcentaje: 0, detalleUnidades: [] },
      instituto: { titulo: 'Instituto', inscritos: 0, asistencia: 0, porcentaje: 0, detalleUnidades: [] },
      pm: { titulo: 'Preparación Misional', inscritos: 0, asistencia: 0, porcentaje: 0, detalleUnidades: [] }
    };

    this.asistenciaGralData = new Array(12).fill(0);
    this.asistenciaJovenesData = new Array(12).fill(0);
    this.datosMensualesProgramas = {
      seminario: { inscritos: new Array(12).fill(0), asistencia: new Array(12).fill(0) },
      instituto: { inscritos: new Array(12).fill(0), asistencia: new Array(12).fill(0) },
      pm: { inscritos: new Array(12).fill(0), asistencia: new Array(12).fill(0) }
    };

    if (this.chartAsistencia) this.chartAsistencia.destroy();
    if (this.chartPrograma) this.chartPrograma.destroy();
  }

  procesarDatos(manuales: any[], asistenciaAuto: any[], conversos: any[]) {
    // 1. Asistencia Automática (Item 1)
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

    // 2. Datos Manuales (Items 2 al 7)
    let sumaJovenes = 0, countJovenes = 0;
    if (manuales && manuales.length > 0) {
      this.nombreObispo = manuales.find(m => m.nombre_obispo)?.nombre_obispo || '';

      manuales.forEach(reg => {
        const mIndex = reg.mes - 1;
        this.asistenciaJovenesData[mIndex] = reg.rs_jovenes_asistencia || 0;

        // Series mensuales para Seminario, Instituto y P.M.
        this.datosMensualesProgramas.seminario.inscritos[mIndex] = reg.sem_inscritos || 0;
        this.datosMensualesProgramas.seminario.asistencia[mIndex] = reg.sem_asistencia || 0;

        this.datosMensualesProgramas.instituto.inscritos[mIndex] = reg.inst_inscritos || 0;
        this.datosMensualesProgramas.instituto.asistencia[mIndex] = reg.inst_asistencia || 0;

        this.datosMensualesProgramas.pm.inscritos[mIndex] = reg.pm_inscritos || 0;
        this.datosMensualesProgramas.pm.asistencia[mIndex] = reg.pm_asistencia || 0;

        if (reg.rs_jovenes_asistencia > 0) {
          sumaJovenes += reg.rs_jovenes_asistencia;
          countJovenes++;
        }

        // Acumulados anuales (YTD)
        this.totalConsejosBarrio += (reg.consejos_barrio || 0);
        this.totalConsejosJuventud += (reg.consejos_juventud || 0);
        this.totalPapelesMisionales += (reg.misional_papeles || 0);
        this.totalJovenesEntrevistados += (reg.misional_entrevistas || 0);
        this.totalMinJovenes += (reg.min_jovenes_entrevistados || 0);
        this.totalMelquisedec += (reg.melquisedec_entrevistas || 0);
      });

      // Item 3: Estado actual (último mes reportado con datos > 0)
      const ordenadosDesc = [...manuales].sort((a, b) => b.mes - a.mes);

      const ultimoSem = ordenadosDesc.find(r => (r.sem_inscritos || 0) > 0 || (r.sem_asistencia || 0) > 0);
      if (ultimoSem) {
        this.totalSemInscritos = ultimoSem.sem_inscritos || 0;
        this.totalSemAsistencia = ultimoSem.sem_asistencia || 0;
        this.porcentajeSeminarioUnidad = this.totalSemInscritos > 0
          ? Math.round((this.totalSemAsistencia / this.totalSemInscritos) * 100)
          : 0;
      }

      const ultimoInst = ordenadosDesc.find(r => (r.inst_inscritos || 0) > 0 || (r.inst_asistencia || 0) > 0);
      if (ultimoInst) {
        this.totalInstInscritos = ultimoInst.inst_inscritos || 0;
        this.totalInstAsistencia = ultimoInst.inst_asistencia || 0;
        this.porcentajeInstitutoUnidad = this.totalInstInscritos > 0
          ? Math.round((this.totalInstAsistencia / this.totalInstInscritos) * 100)
          : 0;
      }

      const ultimoPm = ordenadosDesc.find(r => (r.pm_inscritos || 0) > 0 || (r.pm_asistencia || 0) > 0);
      if (ultimoPm) {
        this.totalPmInscritos = ultimoPm.pm_inscritos || 0;
        this.totalPmAsistencia = ultimoPm.pm_asistencia || 0;
        this.porcentajePmUnidad = this.totalPmInscritos > 0
          ? Math.round((this.totalPmAsistencia / this.totalPmInscritos) * 100)
          : 0;
      }
    }
    this.promedioAsistenciaJovenes = countJovenes > 0 ? Math.round(sumaJovenes / countJovenes) : 0;

    // 3. Conversos (Item 5)
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

  procesarResumenEstacaProgramas(datosEstaca: any[]) {
    const calcularPorPrograma = (
      titulo: string,
      campoInsc: string,
      campoAsis: string
    ): ResumenProgramaEstaca => {
      let sumaInsc = 0;
      let sumaAsis = 0;

      const detalleUnidades = this.unidades.map(u => {
        const registrosUnidad = datosEstaca
          .filter(r => Number(r.unidad_id) === Number(u.id))
          .sort((a, b) => b.mes - a.mes);

        const ultimo = registrosUnidad.find(r => (r[campoInsc] || 0) > 0 || (r[campoAsis] || 0) > 0);
        const inscritos = ultimo ? (ultimo[campoInsc] || 0) : 0;
        const asistencia = ultimo ? (ultimo[campoAsis] || 0) : 0;
        const porcentaje = inscritos > 0 ? Math.round((asistencia / inscritos) * 100) : 0;

        sumaInsc += inscritos;
        sumaAsis += asistencia;

        return { nombre: u.nombre, inscritos, asistencia, porcentaje };
      });

      return {
        titulo,
        inscritos: sumaInsc,
        asistencia: sumaAsis,
        porcentaje: sumaInsc > 0 ? Math.round((sumaAsis / sumaInsc) * 100) : 0,
        detalleUnidades
      };
    };

    this.consolidadoEstacaProgramas = {
      seminario: calcularPorPrograma('Seminario', 'sem_inscritos', 'sem_asistencia'),
      instituto: calcularPorPrograma('Instituto', 'inst_inscritos', 'inst_asistencia'),
      pm: calcularPorPrograma('Preparación Misional', 'pm_inscritos', 'pm_asistencia')
    };
  }

  renderizarGraficaSacramental() {
    if (!this.asistenciaCanvas) return;
    if (this.chartAsistencia) this.chartAsistencia.destroy();

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

  renderizarGraficaPrograma() {
    if (!this.programaCanvas) return;
    if (this.chartPrograma) this.chartPrograma.destroy();

    const serie = this.datosMensualesProgramas[this.programaSeleccionado];

    this.chartPrograma = new Chart(this.programaCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.mesesLabels,
        datasets: [
          {
            label: 'Inscritos',
            data: serie.inscritos,
            backgroundColor: 'rgba(59, 130, 246, 0.25)',
            borderColor: '#3b82f6',
            borderWidth: 2,
            borderRadius: 6
          },
          {
            label: 'Asistiendo',
            data: serie.asistencia,
            backgroundColor: '#00838f',
            borderColor: '#006064',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const idx = items[0].dataIndex;
                const insc = serie.inscritos[idx] || 0;
                const asis = serie.asistencia[idx] || 0;
                const pct = insc > 0 ? Math.round((asis / insc) * 100) : 0;
                return `Porcentaje de asistencia: ${pct}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });
  }
}