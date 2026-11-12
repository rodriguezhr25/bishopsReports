import { Component, OnInit } from '@angular/core';
import { SeguimientoService } from '../../services/seguimiento.service';
import { MiembroSeguimiento, UnidadEstaca } from '../../models/seguimiento.model';
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
  // Variables para el Modal
  // Variables para el Modal
  mostrarModalNuevo: boolean = false;
  guardandoNuevo: boolean = false;
  nuevoMiembro: Partial<MiembroSeguimiento> = {};
  // Variables para el Modal de Confirmación de Baja
  mostrarModalBaja: boolean = false;
  procesandoBaja: boolean = false;
  miembroSeleccionadoBaja: MiembroSeguimiento | null = null;

  // Opciones de barrios para el modal
  barriosDisponibles: string[] = [];
  unidadesDisponibles: UnidadEstaca[] = [];
  unidadSeleccionadaId: number = 0;

  constructor(private seguimientoService: SeguimientoService) { }


  // Getter útil para mostrar el nombre del barrio en el título de la tarjeta y al exportar imagen
  get nombreUnidadSeleccionada(): string {
    const unidad = this.unidadesDisponibles.find(u => u.id === Number(this.unidadSeleccionadaId));
    return unidad ? unidad.nombre : '';
  }

  async ngOnInit() {
    try {
      this.unidadesDisponibles = await this.seguimientoService.getUnidades();
      
      if (!this.unidadSeleccionadaId && this.unidadesDisponibles.length > 0) {
        this.unidadSeleccionadaId = this.unidadesDisponibles[0].id;
      }

      await this.cargarMiembros();
    } catch (error) {
      console.error("Error inicializando:", error);
    }
  }

  async cargarMiembros() {
    if (!this.unidadSeleccionadaId) return;
    this.cargando = true;
    try {
      this.miembros = await this.seguimientoService.getMiembrosPorUnidad(Number(this.unidadSeleccionadaId));
    } catch (error) {
      console.error('Error cargando miembros:', error);
    } finally {
      this.cargando = false;
    }
  }

  abrirModalNuevo() {
    this.nuevoMiembro = {
      unidad_id: Number(this.unidadSeleccionadaId), // 👈 Asigna el ID actual
      nombre_completo: '',
      genero: 'M',
      anio_nacimiento: this.anioActual - 20,
      fecha_bautismo: '',
      activo: true,
      hito_post_bautismal: false,
      hito_entrevista_templo: false,
      hito_recomendacion: false,
      hito_aaronico: false,
      hito_llamamiento: false,
      hito_melquisedec: false,
      hito_nombres_templo: false
    };
    this.mostrarModalNuevo = true;
  }

  async guardarNuevoConverso() {
    if (!this.nuevoMiembro.nombre_completo || !this.nuevoMiembro.anio_nacimiento || !this.nuevoMiembro.fecha_bautismo) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    // Aseguramos que unidad_id viaje como número entero (los <select> en HTML a veces devuelven string)
    this.nuevoMiembro.unidad_id = Number(this.nuevoMiembro.unidad_id);

    this.guardandoNuevo = true;
    try {
      await this.seguimientoService.agregarMiembro(this.nuevoMiembro);
      
      if (this.nuevoMiembro.unidad_id !== Number(this.unidadSeleccionadaId)) {
        this.unidadSeleccionadaId = this.nuevoMiembro.unidad_id;
      }
      
      await this.cargarMiembros();
      this.cerrarModalNuevo();
    } catch (error) {
      alert('Error al guardar el nuevo converso.');
    } finally {
      this.guardandoNuevo = false;
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

  // Abre el modal guardando quién será dado de baja
  abrirModalBaja(miembro: MiembroSeguimiento) {
    if (!miembro.id) return;
    this.miembroSeleccionadoBaja = miembro;
    this.mostrarModalBaja = true;
  }

  cerrarModalBaja() {
    if (this.procesandoBaja) return;
    this.mostrarModalBaja = false;
    this.miembroSeleccionadoBaja = null;
  }

  // Ejecuta la baja al confirmar en el modal
async confirmarBaja() {
    if (!this.miembroSeleccionadoBaja?.id) return;

    this.procesandoBaja = true;
    try {
      await this.seguimientoService.darDeBajaMiembro(this.miembroSeleccionadoBaja.id);
      this.miembros = this.miembros.filter(m => m.id !== this.miembroSeleccionadoBaja!.id);
      
      // Apagamos el estado de carga ANTES de cerrar el modal
      this.procesandoBaja = false;
      this.cerrarModalBaja();
    } catch (error) {
      this.procesandoBaja = false;
      alert('No se pudo dar de baja al registro. Intenta nuevamente.');
    }
  }

  // NUEVA FUNCIÓN PARA DAR DE BAJA
  async darDeBaja(miembro: MiembroSeguimiento) {
    if (!miembro.id) return;

    const confirmado = confirm(`¿Estás seguro de dar de baja a ${miembro.nombre_completo}? Dejará de mostrarse en el listado y en las estadísticas.`);
    if (!confirmado) return;

    try {
      await this.seguimientoService.darDeBajaMiembro(miembro.id);
      // Lo quitamos de la vista inmediatamente sin necesidad de recargar toda la página
      this.miembros = this.miembros.filter(m => m.id !== miembro.id);
    } catch (error) {
      alert('No se pudo dar de baja al registro. Intenta nuevamente.');
    }
  }

  cerrarModalNuevo() {
    this.mostrarModalNuevo = false;
  }
}