import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EntrevistaReporteService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // 1. Obtener catálogo de unidades
  async getUnidades() {
    const { data, error } = await this.supabase
      .from('estaca_unidades')
      .select('*')
      .order('id');
    if (error) throw error;
    return data;
  }

  // 2. Cargar registros manuales de la hoja de seguimiento para un año y unidad
  async getMatrizMensual(unidadId: number, anio: number) {
    const { data, error } = await this.supabase
      .from('seguimiento_obispos')
      .select('*')
      .eq('unidad_id', unidadId)
      .eq('anio', anio);
    if (error) throw error;
    return data;
  }

  // 3. Obtener asistencias dominicales del año para calcular el promedio mensual (Item 1 automático)
  async getAsistenciaAutomatica(unidadId: number, anio: number) {
    const fechaInicio = `${anio}-01-01`;
    const fechaFin = `${anio}-12-31`;

    const { data, error } = await this.supabase
      .from('detalle_barrios')
      .select(`
        asistencia_hoy,
        registros_domingo!inner ( fecha )
      `)
      .eq('unidad_id', unidadId)
      .gte('registros_domingo.fecha', fechaInicio)
      .lte('registros_domingo.fecha', fechaFin);
    if (error) throw error;
    return data;
  }
  // 5. Guardar/Actualizar la matriz completa (Upsert masivo)
  async guardarMatriz(registros: any[]) {
    // Filtrar solo los meses que tienen nombre_obispo definido o algún dato modificado
    const registrosAInsertar = registros.filter(r => r.nombre_obispo);
    
    if (registrosAInsertar.length === 0) return;

    const { error } = await this.supabase
      .from('seguimiento_obispos')
      .upsert(registrosAInsertar, { onConflict: 'unidad_id,anio,mes' });
    
    if (error) throw error;
  }

  // 4. Obtener conversos activos de la unidad para calcular el porcentaje global de la ruta del convenio (Item 5)
  async getConversosAutomatico(unidadId: number) {
    const { data, error } = await this.supabase
      .from('seguimiento_miembros')
      .select('*')
      .eq('unidad_id', unidadId)
      .eq('activo', true); // Solo miembros activos
    if (error) throw error;
    return data;
  }
}