import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import {
  RegistroDomingo,
  DetalleBarrio,
  ReporteTrimestral,
  PromedioMensual,
  AsistenciaSemanalBarrio,
  ResumenBarrioTrimestral,
  getRangoTrimestre,
  UnidadEstaca
} from '../models/asistencia.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private supabase: SupabaseClient;
  // Bóveda en memoria que Angular nunca olvidará al navegar
  private currentUser = new BehaviorSubject<any>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    // 1. Al inicializar la app, leemos la sesión de Supabase y la guardamos en la bóveda
    const session = this.supabase.auth.session();
    this.currentUser.next(session ? session.user : null);

    // 2. Si Supabase hace algo en segundo plano, actualizamos la bóveda
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.next(session ? session.user : null);
    });
  }

  // 1. NUEVO MÉTODO: Obtener catálogo de unidades
  async getUnidades(): Promise<UnidadEstaca[]> {
    const { data, error } = await this.supabase
      .from('estaca_unidades')
      .select('id, nombre')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error cargando unidades:', error);
      return [];
    }
    return data || [];
  }

  // 2. ACTUALIZAR: Traer el nombre de la unidad mediante relación (join)
  async getReportePorFecha(fecha?: string): Promise<RegistroDomingo | null> {
    let query = this.supabase
      .from('registros_domingo')
      .select('*, detalle_barrios(*, estaca_unidades(nombre))');

    if (fecha) {
      query = query.eq('fecha', fecha);
    } else {
      query = query.order('fecha', { ascending: false }).limit(1);
    }

    const { data, error } = await query.single();
    if (error || !data) return null;

    // Mapeamos estaca_unidades.nombre a barrio_nombre para que el HTML del dashboard funcione sin cambios
    if (data.detalle_barrios) {
      data.detalle_barrios = data.detalle_barrios
        .map((d: any) => ({
          ...d,
          barrio_nombre: d.estaca_unidades?.nombre || d.barrio_nombre || 'Sin unidad'
        }))
        .sort((a: any, b: any) => a.barrio_nombre.localeCompare(b.barrio_nombre));
    }

    return data as RegistroDomingo;
  }

  // 3. ACTUALIZAR: Reporte Trimestral dinámico por unidad_id
  async getReporteTrimestral(anio: number, trimestre: number): Promise<ReporteTrimestral> {
    let inicio = `${anio}-01-01`;
    let fin = `${anio}-03-31`;
    if (trimestre === 2) { inicio = `${anio}-04-01`; fin = `${anio}-06-30`; }
    if (trimestre === 3) { inicio = `${anio}-07-01`; fin = `${anio}-09-30`; }
    if (trimestre === 4) { inicio = `${anio}-10-01`; fin = `${anio}-12-31`; }

    const { data: registros, error: errReg } = await this.supabase
      .from('registros_domingo')
      .select('id, fecha, asistencia_total, asistencia_trimestre_anterior, es_semana_activa')
      .gte('fecha', inicio)
      .lte('fecha', fin)
      .eq('es_semana_activa', true)
      .order('fecha', { ascending: true });

    if (errReg || !registros || registros.length === 0) {
      return {
        trimestre, anio, semanas_registradas: 0, asistencia_promedio_estaca: 0,
        asistencia_trimestre_anterior_estaca: 0, diferencia_promedio_estaca: 0,
        promedios_mensuales: [], asistencias_semanales: [], detalles_barrios: []
      };
    }

    // Obtenemos las unidades dinámicamente desde la BD
    const unidades = await this.getUnidades();
    const idsRegistros = registros.map(r => r.id);

    const { data: detalles } = await this.supabase
      .from('detalle_barrios')
      .select('*')
      .in('registro_domingo_id', idsRegistros);

    const semanasCount = registros.length;
    const sumaAsistenciaEstaca = registros.reduce((acc, r) => acc + (r.asistencia_total || 0), 0);
    const promedioEstaca = Math.round(sumaAsistenciaEstaca / semanasCount);

    const { data: ultimoRegPrevio } = await this.supabase
      .from('registros_domingo')
      .select('asistencia_trimestre_anterior')
      .lt('fecha', inicio)
      .order('fecha', { ascending: false })
      .limit(1)
      .single();

    const trimestreAnteriorEstaca = ultimoRegPrevio?.asistencia_trimestre_anterior || registros[0]?.asistencia_trimestre_anterior || 0;

    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesesMap = new Map<number, { suma: number; count: number }>();

    registros.forEach(r => {
      const mesIndex = new Date(r.fecha + 'T00:00:00').getMonth();
      const actual = mesesMap.get(mesIndex) || { suma: 0, count: 0 };
      mesesMap.set(mesIndex, { suma: actual.suma + (r.asistencia_total || 0), count: actual.count + 1 });
    });

    const promediosMensuales: PromedioMensual[] = Array.from(mesesMap.entries()).map(([mesIndex, val]) => ({
      mesNombre: nombresMeses[mesIndex],
      semanasActivas: val.count,
      promedioAsistencia: Math.round(val.suma / val.count)
    }));

    // Mapeo semanal cruzando por unidad_id
    const asistenciasSemanales: AsistenciaSemanalBarrio[] = registros.map(r => {
      const fObj = new Date(r.fecha + 'T00:00:00');
      const dia = String(fObj.getDate()).padStart(2, '0');
      const mes = String(fObj.getMonth() + 1).padStart(2, '0');
      const mesNombre = nombresMeses[fObj.getMonth()];

      const mapaBarrios: { [key: string]: number } = {};
      const detallesSemana = (detalles || []).filter(d => d.registro_domingo_id === r.id);

      unidades.forEach(u => {
        const item = detallesSemana.find(d => d.unidad_id === u.id);
        mapaBarrios[u.nombre] = item ? (item.asistencia_hoy || 0) : 0;
      });

      return {
        fecha: r.fecha,
        semanaEtiqueta: `${dia}/${mes}`,
        mesNombre: mesNombre,
        asistenciasPorBarrio: mapaBarrios,
        totalEstaca: r.asistencia_total || 0
      };
    });

    // Resumen por barrio cruzando por unidad_id
    const detallesBarrios: ResumenBarrioTrimestral[] = unidades.map(u => {
      const itemsBarrio = (detalles || []).filter(d => d.unidad_id === u.id);
      const sumaHoy = itemsBarrio.reduce((acc, item) => acc + (item.asistencia_hoy || 0), 0);
      const promHoy = itemsBarrio.length > 0 ? Math.round(sumaHoy / itemsBarrio.length) : 0;
      const trimAnt = itemsBarrio[0]?.asistencia_trimestre_anterior || 0;

      const diaconosCount = itemsBarrio.filter(i => i.diaconos).length;
      const maestrosCount = itemsBarrio.filter(i => i.maestros).length;
      const presbiterosCount = itemsBarrio.filter(i => i.presbiteros).length;
      const actHhjjCount = itemsBarrio.filter(i => i.act_hhjj).length;
      const actMmjjCount = itemsBarrio.filter(i => i.act_mmjj).length;
      const reuClasCount = itemsBarrio.filter(i => i.reu_clas_mmjj).length;

      const totalCumplidas = diaconosCount + maestrosCount + presbiterosCount + actHhjjCount + actMmjjCount + reuClasCount;
      const totalPosibles = itemsBarrio.length * 6;
      const pctCumplimiento = totalPosibles > 0 ? Math.round((totalCumplidas / totalPosibles) * 100) : 0;

      return {
        barrio_nombre: u.nombre,
        total_asistencia: sumaHoy,
        promedio_asistencia: promHoy,
        asistencia_trimestre_anterior: trimAnt,
        incremento_promedio: promHoy - trimAnt,
        diaconos_cumplimiento: diaconosCount,
        maestros_cumplimiento: maestrosCount,
        presbiteros_cumplimiento: presbiterosCount,
        act_hhjj_cumplimiento: actHhjjCount,
        act_mmjj_cumplimiento: actMmjjCount,
        reu_clas_mmjj_cumplimiento: reuClasCount,
        total_actividades_cumplidas: totalCumplidas,
        total_actividades_posibles: totalPosibles,
        porcentaje_cumplimiento_actividades: pctCumplimiento
      };
    });

    return {
      trimestre, anio, semanas_registradas: semanasCount,
      asistencia_promedio_estaca: promedioEstaca,
      asistencia_trimestre_anterior_estaca: trimestreAnteriorEstaca,
      diferencia_promedio_estaca: promedioEstaca - trimestreAnteriorEstaca,
      promedios_mensuales: promediosMensuales,
      asistencias_semanales: asistenciasSemanales,
      detalles_barrios: detallesBarrios
    };
  }

  // 4. ACTUALIZAR: Limpiar campos visuales antes de insertar en detalle_barrios
  async guardarReporteDominical(registro: RegistroDomingo, detalles: DetalleBarrio[]): Promise<boolean> {
    const { data: reg, error: errReg } = await this.supabase
      .from('registros_domingo')
      .upsert([registro], { onConflict: 'fecha' })
      .select();

    if (errReg) throw errReg;

    const registroId = reg && reg[0] ? reg[0].id : null;
    if (!registroId) throw new Error('No se pudo obtener el ID del registro.');

    // Excluimos barrio_nombre y estaca_unidades para insertar solo columnas reales de la tabla
    const detallesConId = detalles.map(({ barrio_nombre, estaca_unidades, ...resto }) => ({
      ...resto,
      registro_domingo_id: registroId
    }));

    await this.supabase.from('detalle_barrios').delete().eq('registro_domingo_id', registroId);

    const { error: errDet } = await this.supabase
      .from('detalle_barrios')
      .insert(detallesConId);

    if (errDet) throw errDet;
    return true;
  }

  // Ahora el Guard leerá instantáneamente de la bóveda, sin esperar a Supabase
  async getUsuarioActual(): Promise<any> {
    return this.currentUser.value;
  }

  async login(email: string, password: string) {
    const { user, session, error } = await this.supabase.auth.signIn({
      email,
      password
    });
    if (error) throw error;

    // Al hacer login, forzamos la actualización de la bóveda
    this.currentUser.next(user);
    return { user, session };
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.currentUser.next(null); // Vaciamos la bóveda al salir
  }

  async getFechasRegistradas(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('registros_domingo')
      .select('fecha')
      .order('fecha', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => item.fecha);
  }
 

  async getPromedioTrimestreActual(fechaSeleccionada: string): Promise<{ promedioTotal: number, totalSemanasActivas: number }> {
    const { inicio, fin } = getRangoTrimestre(fechaSeleccionada);

    const { data, error } = await this.supabase
      .from('registros_domingo')
      .select('asistencia_total, es_semana_activa')
      .gte('fecha', inicio)
      .lte('fecha', fin)
      .eq('es_semana_activa', true);

    if (error || !data || data.length === 0) {
      return { promedioTotal: 0, totalSemanasActivas: 0 };
    }

    const sumaTotales = data.reduce((acc, curr) => acc + (curr.asistencia_total || 0), 0);
    const promedioTotal = Math.round(sumaTotales / data.length);

    return { promedioTotal, totalSemanasActivas: data.length };
  }
}