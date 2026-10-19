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
  getRangoTrimestre 
} from '../models/asistencia.model';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async getFechasRegistradas(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('registros_domingo')
      .select('fecha')
      .order('fecha', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => item.fecha);
  }

  async getReportePorFecha(fecha?: string): Promise<RegistroDomingo | null> {
    let query = this.supabase
      .from('registros_domingo')
      .select('*, detalle_barrios(*)');

    if (fecha) {
      query = query.eq('fecha', fecha);
    } else {
      query = query.order('fecha', { ascending: false }).limit(1);
    }

    const { data, error } = await query.single();
    if (error) return null;
    return data as RegistroDomingo;
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
        trimestre,
        anio,
        semanas_registradas: 0,
        asistencia_promedio_estaca: 0,
        asistencia_trimestre_anterior_estaca: 0,
        diferencia_promedio_estaca: 0,
        promedios_mensuales: [],
        asistencias_semanales: [],
        detalles_barrios: []
      };
    }

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
      mesesMap.set(mesIndex, {
        suma: actual.suma + (r.asistencia_total || 0),
        count: actual.count + 1
      });
    });

    const promediosMensuales: PromedioMensual[] = Array.from(mesesMap.entries()).map(([mesIndex, val]) => ({
      mesNombre: nombresMeses[mesIndex],
      semanasActivas: val.count,
      promedioAsistencia: Math.round(val.suma / val.count)
    }));

    const barriosNombres = ['Barrio Anaco', 'Barrio Cantaura', 'Barrio Pariaguán', 'Barrio Tigrito', 'Barrio Tigre'];

    const asistenciasSemanales: AsistenciaSemanalBarrio[] = registros.map(r => {
      const fObj = new Date(r.fecha + 'T00:00:00');
      const dia = String(fObj.getDate()).padStart(2, '0');
      const mes = String(fObj.getMonth() + 1).padStart(2, '0');
      const mesNombre = nombresMeses[fObj.getMonth()];

      const mapaBarrios: { [key: string]: number } = {};
      const detallesSemana = (detalles || []).filter(d => d.registro_domingo_id === r.id);

      barriosNombres.forEach(bNombre => {
        const item = detallesSemana.find(d => d.barrio_nombre === bNombre);
        mapaBarrios[bNombre] = item ? (item.asistencia_hoy || 0) : 0;
      });

      return {
        fecha: r.fecha,
        semanaEtiqueta: `${dia}/${mes}`,
        mesNombre: mesNombre,
        asistenciasPorBarrio: mapaBarrios,
        totalEstaca: r.asistencia_total || 0
      };
    });

    const detallesBarrios: ResumenBarrioTrimestral[] = barriosNombres.map(bNombre => {
      const itemsBarrio = (detalles || []).filter(d => d.barrio_nombre === bNombre);
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
        barrio_nombre: bNombre,
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
      trimestre,
      anio,
      semanas_registradas: semanasCount,
      asistencia_promedio_estaca: promedioEstaca,
      asistencia_trimestre_anterior_estaca: trimestreAnteriorEstaca,
      diferencia_promedio_estaca: promedioEstaca - trimestreAnteriorEstaca,
      promedios_mensuales: promediosMensuales,
      asistencias_semanales: asistenciasSemanales,
      detalles_barrios: detallesBarrios
    };
  }

  async guardarReporteDominical(registro: RegistroDomingo, detalles: DetalleBarrio[]): Promise<boolean> {
    const { data: reg, error: errReg } = await this.supabase
      .from('registros_domingo')
      .upsert([registro], { onConflict: 'fecha' })
      .select();

    if (errReg) throw errReg;

    const registroId = reg && reg[0] ? reg[0].id : null;
    if (!registroId) throw new Error('No se pudo obtener el ID del registro.');

    const detallesConId = detalles.map(d => ({
      ...d,
      registro_domingo_id: registroId
    }));

    await this.supabase.from('detalle_barrios').delete().eq('registro_domingo_id', registroId);

    const { error: errDet } = await this.supabase
      .from('detalle_barrios')
      .insert(detallesConId);

    if (errDet) throw errDet;
    return true;
  }
}