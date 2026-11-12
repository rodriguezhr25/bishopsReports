import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeguimientoService } from '../../services/seguimiento.service';
import { MiembroSeguimiento, EstadisticaBarrio, EstadisticaEstaca, UnidadEstaca } from '../../models/seguimiento.model';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-dashboard-seguimiento',
  templateUrl: './dashboard-seguimiento.component.html',
  styleUrls: ['./dashboard-seguimiento.component.css']
})
export class DashboardSeguimientoComponent implements OnInit {
  cargando: boolean = true;
  anioActual: number = new Date().getFullYear();
  nombresBarrios: string[] = [];

  estadisticasBarrios: EstadisticaBarrio[] = [];

  estacaStats: EstadisticaEstaca = {
    totalMiembros: 0, hitosPosibles: 0, hitosCumplidos: 0, porcentaje: 0, miembrosEnRiesgo: 0,
    desglose: this.crearDesgloseVacio()
  };
  exportando: boolean = false;
  unidades: UnidadEstaca[] = [];

  constructor(private seguimientoService: SeguimientoService) { }

  async ngOnInit() {
    this.unidades = await this.seguimientoService.getUnidades();
    this.generarEstadisticas();
  }

  async generarEstadisticas() {
    this.cargando = true;
    try {
      const todosLosMiembros = await this.seguimientoService.getTodosLosMiembros();
      
      // Mapa indexado por el ID numérico de la unidad
      const mapaBarrios = new Map<number, EstadisticaBarrio>();
      this.unidades.forEach(u => {
        mapaBarrios.set(u.id, { 
          nombre: u.nombre, 
          totalMiembros: 0, 
          hitosPosibles: 0, 
          hitosCumplidos: 0, 
          porcentaje: 0,
          miembrosEnRiesgo: 0,
          desglose: this.crearDesgloseVacio()
        });
      });

      this.estacaStats = { 
        totalMiembros: 0, hitosPosibles: 0, hitosCumplidos: 0, porcentaje: 0, 
        miembrosEnRiesgo: 0, desglose: this.crearDesgloseVacio() 
      };

      todosLosMiembros.forEach(miembro => {
        const ev = this.evaluarMiembro(miembro);
        // Buscamos directamente por unidad_id (cero fallos por texto)
        const barrioStat = mapaBarrios.get(miembro.unidad_id);
        const enRiesgo = ev.totalCumplidos <= 2 ? 1 : 0;

        if (barrioStat) {
          barrioStat.totalMiembros++;
          barrioStat.hitosPosibles += ev.totalPosibles;
          barrioStat.hitosCumplidos += ev.totalCumplidos;
          barrioStat.miembrosEnRiesgo += enRiesgo;
          this.sumarHitos(barrioStat.desglose, ev);
        }

        this.estacaStats.totalMiembros++;
        this.estacaStats.hitosPosibles += ev.totalPosibles;
        this.estacaStats.hitosCumplidos += ev.totalCumplidos;
        this.estacaStats.miembrosEnRiesgo += enRiesgo;
        this.sumarHitos(this.estacaStats.desglose, ev);
      });

      this.estadisticasBarrios = Array.from(mapaBarrios.values()).map(b => {
        b.porcentaje = this.calcPorcentaje(b.hitosCumplidos, b.hitosPosibles);
        this.calcularPorcentajesDesglose(b.desglose);
        return b;
      });

      this.estacaStats.porcentaje = this.calcPorcentaje(this.estacaStats.hitosCumplidos, this.estacaStats.hitosPosibles);
      this.calcularPorcentajesDesglose(this.estacaStats.desglose);

    } catch (error) {
      console.error(error);
    } finally {
      this.cargando = false;
    }
  }

  // Helper para inicializar desgloses en 0
  private crearDesgloseVacio() {
    return {
      postBautismal: { posibles: 0, cumplidos: 0, porcentaje: 0 },
      entrevista: { posibles: 0, cumplidos: 0, porcentaje: 0 },
      recomendacion: { posibles: 0, cumplidos: 0, porcentaje: 0 },
      aaronico: { posibles: 0, cumplidos: 0, porcentaje: 0 },
      llamamiento: { posibles: 0, cumplidos: 0, porcentaje: 0 },
      melquisedec: { posibles: 0, cumplidos: 0, porcentaje: 0 },
      nombresTemplo: { posibles: 0, cumplidos: 0, porcentaje: 0 }
    };
  }

  // Helper matemático
  private calcPorcentaje(cumplidos: number, posibles: number): number {
    return posibles > 0 ? Math.round((cumplidos / posibles) * 100) : 0;
  }  

  private sumarHitos(destino: any, evaluacion: any) {
    destino.postBautismal.posibles += evaluacion.postBautismal.posibles;
    destino.postBautismal.cumplidos += evaluacion.postBautismal.cumplidos;
    destino.entrevista.posibles += evaluacion.entrevista.posibles;
    destino.entrevista.cumplidos += evaluacion.entrevista.cumplidos;
    destino.recomendacion.posibles += evaluacion.recomendacion.posibles;
    destino.recomendacion.cumplidos += evaluacion.recomendacion.cumplidos;
    destino.aaronico.posibles += evaluacion.aaronico.posibles;
    destino.aaronico.cumplidos += evaluacion.aaronico.cumplidos;
    destino.llamamiento.posibles += evaluacion.llamamiento.posibles;
    destino.llamamiento.cumplidos += evaluacion.llamamiento.cumplidos;
    destino.melquisedec.posibles += evaluacion.melquisedec.posibles;
    destino.melquisedec.cumplidos += evaluacion.melquisedec.cumplidos;
    destino.nombresTemplo.posibles += evaluacion.nombresTemplo.posibles;
    destino.nombresTemplo.cumplidos += evaluacion.nombresTemplo.cumplidos;
  }

  private calcularPorcentajesDesglose(desglose: any) {
    Object.keys(desglose).forEach(key => {
      desglose[key].porcentaje = this.calcPorcentaje(desglose[key].cumplidos, desglose[key].posibles);
    });
  }

  private evaluarMiembro(miembro: MiembroSeguimiento) {
    const edad = this.anioActual - miembro.anio_nacimiento;
    const esHombre = miembro.genero === 'M';

    const postBautismal = { posibles: 1, cumplidos: miembro.hito_post_bautismal ? 1 : 0 };
    const nombresTemplo = { posibles: 1, cumplidos: miembro.hito_nombres_templo ? 1 : 0 };

    const entrevista = { posibles: edad >= 12 ? 1 : 0, cumplidos: (edad >= 12 && miembro.hito_entrevista_templo) ? 1 : 0 };
    const recomendacion = { posibles: edad >= 12 ? 1 : 0, cumplidos: (edad >= 12 && miembro.hito_recomendacion) ? 1 : 0 };
    const llamamiento = { posibles: edad >= 12 ? 1 : 0, cumplidos: (edad >= 12 && miembro.hito_llamamiento) ? 1 : 0 };

    const aaronico = { posibles: (edad >= 12 && esHombre) ? 1 : 0, cumplidos: (edad >= 12 && esHombre && miembro.hito_aaronico) ? 1 : 0 };
    const melquisedec = { posibles: (edad >= 18 && esHombre) ? 1 : 0, cumplidos: (edad >= 18 && esHombre && miembro.hito_melquisedec) ? 1 : 0 };

    const totalPosibles = postBautismal.posibles + nombresTemplo.posibles + entrevista.posibles + recomendacion.posibles + llamamiento.posibles + aaronico.posibles + melquisedec.posibles;
    const totalCumplidos = postBautismal.cumplidos + nombresTemplo.cumplidos + entrevista.cumplidos + recomendacion.cumplidos + llamamiento.cumplidos + aaronico.cumplidos + melquisedec.cumplidos;

    return { postBautismal, entrevista, recomendacion, llamamiento, aaronico, melquisedec, nombresTemplo, totalPosibles, totalCumplidos };
  }

  // Función para definir colores del porcentaje
  getPctClass(posibles: number, pct: number): string {
    // Si no hay hitos posibles (0/0), se considera 100% de cumplimiento (Verde)
    if (posibles === 0) return 'pct-full';
    if (pct >= 75) return 'pct-full';
    if (pct >= 40) return 'pct-medium';
    return 'pct-low';
  }



  async exportarAImagen() {
    this.exportando = true;
    const elemento = document.getElementById('dashboard-to-export');

    if (elemento) {
      try {
        const canvas = await html2canvas(elemento, { scale: 2, backgroundColor: '#f8fafc' });
        const enlace = document.createElement('a');
        enlace.href = canvas.toDataURL('image/png');
        enlace.download = `Estadisticas-Senda-Convenios.png`;
        enlace.click();
      } catch (error) {
        console.error('Error al exportar:', error);
      }
    }
    this.exportando = false;
  }
}