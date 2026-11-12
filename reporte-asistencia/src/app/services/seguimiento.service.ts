import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { MiembroSeguimiento, UnidadEstaca } from '../models/seguimiento.model';

@Injectable({
  providedIn: 'root'
})
export class SeguimientoService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

// Asegúrate de agregar .eq('activo', true) en tus consultas de lectura actuales:
  async getMiembrosPorBarrio(barrio: string): Promise<MiembroSeguimiento[]> {
    const { data, error } = await this.supabase
      .from('seguimiento_miembros')
      .select('*')
      .eq('barrio', barrio)
      .eq('activo', true) // 👈 Solo activos
      .order('nombre_completo', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getTodosLosMiembros(): Promise<MiembroSeguimiento[]> {
    const { data, error } = await this.supabase
      .from('seguimiento_miembros')
      .select('*')
      .eq('activo', true); // 👈 Solo activos

    if (error) throw error;
    return data || [];
  }

  // NUEVO MÉTODO: Baja lógica
  async darDeBajaMiembro(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('seguimiento_miembros')
      .update({ activo: false })
      .eq('id', id);

    if (error) {
      console.error('Error al dar de baja:', error);
      throw error;
    }
    return true;
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


  // Insertar un nuevo miembro a la base de datos
  async agregarMiembro(miembro: Partial<MiembroSeguimiento>): Promise<boolean> {
    const { error } = await this.supabase
      .from('seguimiento_miembros')
      .insert([miembro]);

    if (error) {
      console.error('Error al agregar converso:', error);
      throw error;
    }
    return true;
  }

  // Obtener la lista dinámica de barrios/unidades
  async getBarriosDisponibles(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('estaca_unidades')
      .select('nombre')
      .order('nombre', { ascending: true }); // Ordenados alfabéticamente

    if (error) {
      console.error('Error obteniendo unidades:', error);
      return [];
    }
    
    // Convertimos el arreglo de objetos [{nombre: 'Anaco'}, ...] a un arreglo de textos ['Anaco', ...]
    return data.map(item => item.nombre);
  }


// Obtener lista de unidades con su ID y Nombre
  async getUnidades(): Promise<UnidadEstaca[]> {
    const { data, error } = await this.supabase
      .from('estaca_unidades')
      .select('id, nombre')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error obteniendo unidades:', error);
      return [];
    }
    return data || [];
  }

  // Filtrar miembros por el ID de la unidad
  async getMiembrosPorUnidad(unidadId: number): Promise<MiembroSeguimiento[]> {
    const { data, error } = await this.supabase
      .from('seguimiento_miembros')
      .select('*')
      .eq('unidad_id', unidadId)
      .eq('activo', true)
      .order('nombre_completo', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}