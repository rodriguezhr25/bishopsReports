import { Component, OnInit } from '@angular/core';
import { EntrevistaReporteService } from '../../services/entrevista-reporte.service';

@Component({
  selector: 'app-entrevista-obispo',
  templateUrl: './entrevista-obispo.component.html',
  styleUrls: ['./entrevista-obispo.component.css']
})
export class EntrevistaObispoComponent implements OnInit {
  unidades: any[] = [];
  unidadSeleccionada: number = 0;
  anioSeleccionado: number = new Date().getFullYear();
  nombreObispo: string = '';
  cargando: boolean = false;
  guardando: boolean = false;
  mesActual = new Date().getMonth() + 1;
  anioActual = new Date().getFullYear();

  // Variables para el Modal de Notificación
  mostrarModalMensaje: boolean = false;
  modalTipo: 'exito' | 'error' = 'exito';
  modalTitulo: string = '';
  modalMensaje: string = '';

  meses = [
    { num: 1, nombre: 'Ene' }, { num: 2, nombre: 'Feb' }, { num: 3, nombre: 'Mar' },
    { num: 4, nombre: 'Abr' }, { num: 5, nombre: 'May' }, { num: 6, nombre: 'Jun' },
    { num: 7, nombre: 'Jul' }, { num: 8, nombre: 'Ago' }, { num: 9, nombre: 'Sep' },
    { num: 10, nombre: 'Oct' }, { num: 11, nombre: 'Nov' }, { num: 12, nombre: 'Dic' }
  ];

  // Matriz principal donde la clave es el número de mes (1 al 12)
  matriz: { [mes: number]: any } = {};

  constructor(private entrevistaService: EntrevistaReporteService) { }

  async ngOnInit() {
    this.cargando = true;
    try {
      this.unidades = await this.entrevistaService.getUnidades();
      if (this.unidades.length > 0) {
        this.unidadSeleccionada = this.unidades[0].id;
        await this.cargarMatriz();
      }
    } catch (e) {
      console.error('Error al cargar unidades', e);
    } finally {
      this.cargando = false;
    }
  }

  inicializarMatriz() {
    this.matriz = {};
    for (let i = 1; i <= 12; i++) {
      this.matriz[i] = {
        unidad_id: this.unidadSeleccionada,
        anio: this.anioSeleccionado,
        mes: i,
        nombre_obispo: this.nombreObispo,
        rs_jovenes_asistencia: 0,
        consejos_barrio: 0,
        consejos_juventud: 0,
        sem_inscritos: 0, sem_asistencia: 0,
        inst_inscritos: 0, inst_asistencia: 0,
        pm_inscritos: 0, pm_asistencia: 0,
        misional_papeles: 0, misional_entrevistas: 0,
        min_jovenes_entrevistados: 0,
        melquisedec_entrevistas: 0,
        // Campos autocalculados de solo lectura
        rs_asistencia_auto: 0,
        conv_seguimiento_pct_auto: 0
      };
    }
  }

  async cargarMatriz() {
    if (!this.unidadSeleccionada) return;
    this.cargando = true;
    this.inicializarMatriz();

    try {
      // 1. Cargar datos manuales guardados previamente
      const datosGuardados = await this.entrevistaService.getMatrizMensual(this.unidadSeleccionada, this.anioSeleccionado);
      if (datosGuardados && datosGuardados.length > 0) {
        this.nombreObispo = datosGuardados[0].nombre_obispo || ''; // Tomar el nombre del primer mes registrado
        datosGuardados.forEach((reg: any) => {
          this.matriz[reg.mes] = { ...this.matriz[reg.mes], ...reg };
        });
      } else {
        this.nombreObispo = '';
      }

      // 2. Calcular Item 1 (Promedio Mensual Asistencia) Automático
      const datosAsistencia = await this.entrevistaService.getAsistenciaAutomatica(this.unidadSeleccionada, this.anioSeleccionado);
      const asisPorMes: { [mes: number]: { total: number, count: number } } = {};

      datosAsistencia.forEach((d: any) => {
        const fecha = new Date(d.registros_domingo.fecha);
        const mes = fecha.getUTCMonth() + 1; // 1 a 12
        if (!asisPorMes[mes]) asisPorMes[mes] = { total: 0, count: 0 };
        asisPorMes[mes].total += d.asistencia_hoy;
        asisPorMes[mes].count += 1;
      });

      for (let m = 1; m <= 12; m++) {
        if (asisPorMes[m] && asisPorMes[m].count > 0) {
          this.matriz[m].rs_asistencia_auto = Math.round(asisPorMes[m].total / asisPorMes[m].count);
        }
      }

 // 3. Calcular Item 5 (Retención Conversos) Automático para el mes actual
      const conversos = await this.entrevistaService.getConversosAutomatico(this.unidadSeleccionada);
      
      let totalesPosiblesGlobal = 0;
      let logradosGlobal = 0;

      conversos.forEach((c: any) => {
        const edad = new Date().getFullYear() - c.anio_nacimiento;
        const esVaron = c.genero === 'M';

        totalesPosiblesGlobal++; if (c.hito_post_bautismal) logradosGlobal++;
        
        if (edad >= 11) { totalesPosiblesGlobal++; if (c.hito_entrevista_templo) logradosGlobal++; }
        if (edad >= 11) { totalesPosiblesGlobal++; if (c.hito_recomendacion) logradosGlobal++; }
        if (esVaron && edad >= 11) { totalesPosiblesGlobal++; if (c.hito_aaronico) logradosGlobal++; }
        if (edad >= 11) { totalesPosiblesGlobal++; if (c.hito_llamamiento) logradosGlobal++; }
        if (esVaron && edad >= 18) { totalesPosiblesGlobal++; if (c.hito_melquisedec) logradosGlobal++; }
        
        totalesPosiblesGlobal++; if (c.hito_nombres_templo) logradosGlobal++;
      });

      let pctSeguimiento = 0;
      if (totalesPosiblesGlobal > 0) {
        pctSeguimiento = Math.round((logradosGlobal / totalesPosiblesGlobal) * 100);
      }

      // LÓGICA DE CIERRE (SNAPSHOT):
      // Si estamos viendo el año actual, autocompletamos el mes en curso con el cálculo en vivo.
      // Los meses anteriores mantendrán el valor que trajeron de la base de datos (o 0 si no se guardó).
      if (this.anioSeleccionado === this.anioActual) {
        this.matriz[this.mesActual].conv_seguimiento_pct = pctSeguimiento;
      }

    } catch (e) {
      console.error('Error al cargar datos de la matriz', e);
    } finally {
      this.cargando = false;
    }
  }

  cerrarModalMensaje() {
    this.mostrarModalMensaje = false;
  }

async guardarCambios() {
    this.guardando = true;
    try {
      const registros = this.meses.map(m => {
        const reg = this.matriz[m.num];
        const { rs_asistencia_auto, conv_seguimiento_pct_auto, id, ...resto } = reg;

        // Construimos un objeto con estructura fija para que los 12 meses tengan las mismas llaves
        const dbRecord: any = {
          ...resto,
          unidad_id: Number(reg.unidad_id),
          nombre_obispo: this.nombreObispo,
          conv_seguimiento_pct: reg.conv_seguimiento_pct ?? 0
        };

        // Solo incluimos 'id' si todos los registros ya existen en BD (edición);
        // si es una unidad nueva, ninguno lleva 'id' y todas las llaves coinciden.
        if (id) {
          dbRecord.id = id;
        }

        return dbRecord;
      });

      await this.entrevistaService.guardarMatriz(registros);

      this.modalTipo = 'exito';
      this.modalTitulo = '¡Reporte Guardado!';
      this.modalMensaje = 'Los datos de liderazgo del obispo se han actualizado correctamente.';
      this.mostrarModalMensaje = true;
    } catch (e) {
      console.error('Error al guardar', e);
      this.modalTipo = 'error';
      this.modalTitulo = 'Error al Guardar';
      this.modalMensaje = 'Ocurrió un problema al guardar el reporte. Verifica tu conexión e intenta nuevamente.';
      this.mostrarModalMensaje = true;
    } finally {
      this.guardando = false;
    }
  }
}