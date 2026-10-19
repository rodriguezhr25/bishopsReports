import { Component, OnInit } from '@angular/core';
import { AsistenciaService } from '../../services/asistencia.service';
import { RegistroDomingo } from '../../models/asistencia.model';
import html2canvas from 'html2canvas';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  reporte: RegistroDomingo | null = null;
  fechasDisponibles: string[] = [];
  fechaSeleccionada: string = '';
  cargando: boolean = true;
  exportando: boolean = false;
  promedioTrimestral: number = 0;
  semanasContabilizadas: number = 0;

  constructor(private asistenciaService: AsistenciaService, private router: Router) {}

  async ngOnInit() {
    await this.cargarFechas();
    await this.cargarDatos();
  }

  async cerrarSesion() {
    try {
      await this.asistenciaService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  async cargarFechas() {
    try {
      this.fechasDisponibles = await this.asistenciaService.getFechasRegistradas();
      if (this.fechasDisponibles.length > 0) {
        this.fechaSeleccionada = this.fechasDisponibles[0];
      }
    } catch (e) {
      console.error('Error al cargar historial de fechas:', e);
    }
  }

  async cargarDatos(fecha?: string) {
    this.cargando = true;
    try {
      const f = fecha || this.fechaSeleccionada;
      this.reporte = await this.asistenciaService.getReportePorFecha(f);

      const resProm = await this.asistenciaService.getPromedioTrimestreActual(f);
      this.promedioTrimestral = resProm.promedioTotal;
      this.semanasContabilizadas = resProm.totalSemanasActivas;
    } catch (e) {
      console.error('Error al cargar reporte:', e);
    } finally {
      this.cargando = false;
    }
  }

  onFechaChange(event: any) {
    this.fechaSeleccionada = event.target.value;
    this.cargarDatos(this.fechaSeleccionada);
  }

  getBarrioCumplimiento(barrio: any): number {
    let count = 0;
    if (barrio?.diaconos) count++;
    if (barrio?.maestros) count++;
    if (barrio?.presbiteros) count++;
    if (barrio?.act_hhjj) count++;
    if (barrio?.act_mmjj) count++;
    if (barrio?.reu_clas_mmjj) count++;
    return count;
  }

  async exportarAImagen() {
    const elemento = document.getElementById('dashboard-to-export');
    if (!elemento) return;

    this.exportando = true;
    try {
      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imagenData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imagenData;
      link.download = `Reporte_Estaca_${this.fechaSeleccionada}.png`;
      link.click();
    } catch (error) {
      console.error('Error al exportar a imagen:', error);
      alert('Ocurrió un error al generar la imagen.');
    } finally {
      this.exportando = false;
    }
  }
}