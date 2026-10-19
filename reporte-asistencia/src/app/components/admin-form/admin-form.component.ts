import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AsistenciaService } from '../../services/asistencia.service';

@Component({
  selector: 'app-admin-form',
  templateUrl: './admin-form.component.html',
  styleUrls: ['./admin-form.component.css']
})
export class AdminFormComponent implements OnInit {
  form: FormGroup;
  barriosPredeterminados = ['Barrio Anaco', 'Barrio Cantaura', 'Barrio Pariaguán', 'Barrio Tigrito', 'Barrio Tigre'];
  guardando: boolean = false;
  esEdicion: boolean = false;

  constructor(
    private fb: FormBuilder,
    private asistenciaService: AsistenciaService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      fecha: [this.getFechaHoyLocal(), Validators.required],
      es_semana_activa: [true],
      asistencia_total: [0, [Validators.required, Validators.min(0)]],
      asistencia_trimestre_anterior: [0, Validators.required],
      asistencia_semana_pasada: [0, Validators.required],
      diferencia: [0, Validators.required],
      detalles: this.fb.array([])
    });
  }

  async ngOnInit() {
    this.inicializarBarrios();

    // 1. Obtener la fecha inicial desde la URL o la fecha de hoy
    const fechaParam = this.route.snapshot.queryParamMap.get('fecha');
    let fechaInicial = this.getFechaHoyLocal();

    if (fechaParam) {
      // Formatear a YYYY-MM-DD para evitar diferencias de zona horaria o ISO String
      fechaInicial = fechaParam.substring(0, 10);
    }

    // 2. Establecer la fecha en el formulario sin disparar eventos automáticos
    this.form.patchValue({ fecha: fechaInicial }, { emitEvent: false });

    // 3. Cargar el registro desde Supabase para esa fecha
    await this.cargarRegistroPorFecha(fechaInicial);

    // 4. Suscribirse a cambios manuales del usuario en el selector de fecha
    this.form.get('fecha')?.valueChanges.subscribe(async (nuevaFecha) => {
      if (nuevaFecha) {
        await this.cargarRegistroPorFecha(nuevaFecha.substring(0, 10));
      }
    });

    // 5. Suscribirse a cambios del toggle de semana activa
    this.form.get('es_semana_activa')?.valueChanges.subscribe((activa) => {
      if (!activa) {
        this.detallesFormArray.controls.forEach(group => {
          group.patchValue({
            asistencia_hoy: 0,
            diaconos: false,
            maestros: false,
            presbiteros: false,
            act_hhjj: false,
            act_mmjj: false,
            reu_clas_mmjj: false
          }, { emitEvent: false });
        });
        this.recalcularCalculosBarriosYEstaca();
      }
    });

    // 6. Recalcular incrementos y totales cuando cambie cualquier valor
    this.detallesFormArray.valueChanges.subscribe(() => {
      this.recalcularCalculosBarriosYEstaca();
    });
  }

  get detallesFormArray(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  getFechaHoyLocal(): string {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  inicializarBarrios() {
    this.detallesFormArray.clear();
    this.barriosPredeterminados.forEach(barrio => {
      this.detallesFormArray.push(this.fb.group({
        barrio_nombre: [barrio],
        porcentaje: [0],
        promedio: [0],
        asistencia_hoy: [0, Validators.required],
        asistencia_trimestre_anterior: [0, Validators.required],
        incremento: [0],
        diaconos: [false],
        maestros: [false],
        presbiteros: [false],
        act_hhjj: [false],
        act_mmjj: [false],
        reu_clas_mmjj: [false]
      }));
    });
  }

  async cargarRegistroPorFecha(fecha: string) {
    try {
      const registroExistente = await this.asistenciaService.getReportePorFecha(fecha);

      if (registroExistente) {
        this.esEdicion = true;
        this.form.patchValue({
          fecha: registroExistente.fecha,
          es_semana_activa: registroExistente.es_semana_activa ?? true,
          asistencia_total: registroExistente.asistencia_total,
          asistencia_trimestre_anterior: registroExistente.asistencia_trimestre_anterior,
          asistencia_semana_pasada: registroExistente.asistencia_semana_pasada,
          diferencia: registroExistente.diferencia
        }, { emitEvent: false });

        const barriosExistentes = registroExistente.detalle_barrios || [];

        // Asegurar que existan los grupos de barrios cargados
        if (this.detallesFormArray.length === 0) {
          this.inicializarBarrios();
        }

        this.detallesFormArray.controls.forEach((control) => {
          const detalle = barriosExistentes.find(
            d => d.barrio_nombre === control.value.barrio_nombre
          );
          if (detalle) {
            control.patchValue({
              porcentaje: detalle.porcentaje ?? 0,
              promedio: detalle.promedio ?? 0,
              asistencia_hoy: detalle.asistencia_hoy ?? 0,
              asistencia_trimestre_anterior: detalle.asistencia_trimestre_anterior ?? 0,
              incremento: detalle.incremento ?? 0,
              diaconos: detalle.diaconos ?? false,
              maestros: detalle.maestros ?? false,
              presbiteros: detalle.presbiteros ?? false,
              act_hhjj: detalle.act_hhjj ?? false,
              act_mmjj: detalle.act_mmjj ?? false,
              reu_clas_mmjj: detalle.reu_clas_mmjj ?? false
            }, { emitEvent: false });
          }
        });
      } else {
        this.esEdicion = false;
        await this.cargarSugerenciasRegistroAnterior();
      }
    } catch (e) {
      console.error('Error al verificar registro existente:', e);
    }
  }

  async cargarSugerenciasRegistroAnterior() {
    if (this.detallesFormArray.length === 0) {
      this.inicializarBarrios();
    }

    const ultimoRegistro = await this.asistenciaService.getReportePorFecha();
    if (ultimoRegistro) {
      this.form.patchValue({
        asistencia_semana_pasada: ultimoRegistro.asistencia_total,
        asistencia_trimestre_anterior: ultimoRegistro.asistencia_trimestre_anterior
      }, { emitEvent: false });

      const barriosPrevios = ultimoRegistro.detalle_barrios || [];
      this.detallesFormArray.controls.forEach((control) => {
        const detallePrevio = barriosPrevios.find(
          d => d.barrio_nombre === control.value.barrio_nombre
        );
        if (detallePrevio) {
          control.patchValue({
            asistencia_trimestre_anterior: detallePrevio.asistencia_trimestre_anterior,
            asistencia_hoy: 0,
            porcentaje: 0,
            promedio: 0,
            incremento: 0,
            diaconos: false,
            maestros: false,
            presbiteros: false,
            act_hhjj: false,
            act_mmjj: false,
            reu_clas_mmjj: false
          }, { emitEvent: false });
        }
      });
    }
  }

  recalcularCalculosBarriosYEstaca() {
    let totalHoy = 0;
    let totalTrimestre = 0;

    this.detallesFormArray.controls.forEach((group) => {
      const hoy = Number(group.get('asistencia_hoy')?.value) || 0;
      const trimestre = Number(group.get('asistencia_trimestre_anterior')?.value) || 0;
      const incrementoBarrio = hoy - trimestre;

      group.patchValue({ incremento: incrementoBarrio }, { emitEvent: false });

      totalHoy += hoy;
      totalTrimestre += trimestre;
    });

    const diferenciaEstaca = totalHoy - totalTrimestre;

    this.form.patchValue({
      asistencia_total: totalHoy,
      asistencia_trimestre_anterior: totalTrimestre,
      diferencia: diferenciaEstaca
    }, { emitEvent: false });
  }

  async onSubmit() {
    if (this.form.invalid) return;
    this.guardando = true;

    try {
      const { detalles, ...registro } = this.form.value;
      await this.asistenciaService.guardarReporteDominical(registro, detalles);
      this.router.navigate(['/dashboard']);
    } catch (e) {
      console.error('Error al guardar:', e);
      alert('Error al guardar o actualizar el registro.');
    } finally {
      this.guardando = false;
    }
  }
}