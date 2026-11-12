import { Component, OnInit } from '@angular/core';
import { SeguimientoService } from '../../services/seguimiento.service';
import { MiembroSeguimiento } from '../../models/seguimiento.model';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-seguimiento',
  templateUrl: './seguimiento.component.html',
  styleUrls: ['./seguimiento.component.css']
})
export class SeguimientoComponent implements OnInit {
  barrios: string[] = ['Barrio Anaco', 'Barrio Cantaura', 'Barrio Pariaguán', 'Barrio Tigrito', 'Barrio Tigre'];
  barrioSeleccionado: string = 'Barrio Anaco';
  miembros: MiembroSeguimiento[] = [];
  cargando: boolean = false;
  exportando: boolean = false;

  // Usamos el año actual dinámicamente para el cálculo de la edad calendario
  anioActual: number = new Date().getFullYear();

  constructor(private seguimientoService: SeguimientoService) { }

  ngOnInit(): void {
    this.cargarMiembros();
  }

  async cargarMiembros() {
    this.cargando = true;
    try {
      this.miembros = await this.seguimientoService.getMiembrosPorBarrio(this.barrioSeleccionado);
    } catch (error) {
      alert('Hubo un error al cargar la lista de miembros.');
    } finally {
      this.cargando = false;
    }
  }

  // Regla de Negocio: Calcular edad en el año calendario
  calcularEdadCalendario(anioNacimiento: number): number {
    return this.anioActual - anioNacimiento;
  }

  // Regla de Negocio: Determinar si un checkbox aplica o se muestra un "-"
  aplicaHito(miembro: MiembroSeguimiento, hito: string): boolean {
    const edad = this.calcularEdadCalendario(miembro.anio_nacimiento);
    const genero = miembro.genero;

    switch (hito) {
      case 'hito_post_bautismal':
      case 'hito_nombres_templo':
        return true; // Para todos

      case 'hito_entrevista_templo':
      case 'hito_recomendacion':
      case 'hito_llamamiento':
        return edad >= 12; // 12 años en adelante, todos los géneros

      case 'hito_aaronico':
        return edad >= 12 && genero === 'M'; // 12+ Hombres

      case 'hito_melquisedec':
        return edad >= 18 && genero === 'M'; // 18+ Hombres

      default:
        return false;
    }
  }

  // Autoguardado universal (para checkboxes, input de año y fecha)
  async actualizarCampo(miembro: MiembroSeguimiento, campo: keyof MiembroSeguimiento) {
    const nuevoValor = miembro[campo];
    try {
      if (miembro.id) {
        await this.seguimientoService.actualizarDatoMiembro(miembro.id, campo, nuevoValor);
      }
    } catch (error) {
      alert(`Error de conexión al guardar el campo. Por favor, intenta de nuevo.`);
    }
  }

  async exportarAImagen() {
    this.exportando = true;
    const elemento = document.getElementById('lista-to-export');
    const tablaContenedor = document.querySelector('.table-responsive') as HTMLElement;

    if (elemento && tablaContenedor) {
      // 1. Guardar estilos originales del scroll
      const originalMaxHeight = tablaContenedor.style.maxHeight;
      const originalOverflow = tablaContenedor.style.overflow;

      // 2. Expandir la tabla al 100% para que salga completa en la foto
      tablaContenedor.style.maxHeight = 'none';
      tablaContenedor.style.overflow = 'visible';

      try {
        // 3. Tomar la foto
        const canvas = await html2canvas(elemento, { scale: 2, backgroundColor: '#ffffff' });
        const enlace = document.createElement('a');
        enlace.href = canvas.toDataURL('image/png');
        // Nombra el archivo dinámicamente según el barrio seleccionado
        enlace.download = `Listado-Conversos-${this.barrioSeleccionado.replace(/\s+/g, '')}.png`;
        enlace.click();
      } catch (error) {
        console.error('Error al exportar:', error);
      } finally {
        // 4. Devolver la tabla a su tamaño normal con scroll
        tablaContenedor.style.maxHeight = originalMaxHeight;
        tablaContenedor.style.overflow = originalOverflow;
      }
    }
    this.exportando = false;
  }
}