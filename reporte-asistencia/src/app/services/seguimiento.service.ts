import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { MiembroSeguimiento } from '../models/seguimiento.model';

@Injectable({
  providedIn: 'root'
})
export class SeguimientoService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // Obtener la lista de miembros de un barrio específico (Ordenados por fecha de bautismo)
  async getMiembrosPorBarrio(barrio: string): Promise<MiembroSeguimiento[]> {
    const { data, error } = await this.supabase
      .from('seguimiento_miembros')
      .select('*')
      .eq('barrio', barrio)
      .order('fecha_bautismo', { ascending: false }) // 👈 1. Del más reciente al más antiguo
      .order('nombre_completo', { ascending: true }); // 👈 2. Desempate alfabético si se bautizaron el mismo día

    if (error) {
      console.error('Error obteniendo miembros:', error);
      throw error;
    }
    return data as MiembroSeguimiento[];
  }

  // Guardado automático para CUALQUIER campo (Hitos, Fechas, Años)
  async actualizarDatoMiembro(miembroId: string, campo: string, valor: any): Promise<boolean> {
    const { error } = await this.supabase
      .from('seguimiento_miembros')
      .update({ [campo]: valor })
      .eq('id', miembroId);

    if (error) {
      console.error(`Error actualizando ${campo}:`, error);
      throw error;
    }
    return true;
  }

  // Obtener absolutamente TODOS los miembros de la estaca para estadísticas globales
  async getTodosLosMiembros(): Promise<MiembroSeguimiento[]> {
    const { data, error } = await this.supabase
      .from('seguimiento_miembros')
      .select('*')
      .order('barrio', { ascending: true });

    if (error) {
      console.error('Error obteniendo todos los miembros:', error);
      throw error;
    }
    return data as MiembroSeguimiento[];
  }
}