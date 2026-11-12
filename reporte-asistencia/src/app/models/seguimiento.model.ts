// ==========================================
// 1. MODELOS DE BASE DE DATOS (Supabase)
// ==========================================
export interface UnidadEstaca {
  id: number;
  nombre: string;
}

export interface MiembroSeguimiento {
  id?: string;
  unidad_id: number; // 👈 Ahora mapea por ID numérico
  nombre_completo: string;
  genero: 'M' | 'F';
  anio_nacimiento: number;
  fecha_bautismo?: string;
  activo?: boolean;
  
  hito_post_bautismal: boolean;
  hito_entrevista_templo: boolean;
  hito_recomendacion: boolean;
  hito_aaronico: boolean;
  hito_llamamiento: boolean;
  hito_melquisedec: boolean;
  hito_nombres_templo: boolean;
  
  creado_en?: string;
}

// ==========================================
// 2. MODELOS PARA EL DASHBOARD ESTADÍSTICO
// ==========================================
export interface DetalleHito {
  posibles: number;
  cumplidos: number;
  porcentaje: number; // 👈 NUEVO
}

export interface DesgloseHitos {
  postBautismal: DetalleHito;
  entrevista: DetalleHito;
  recomendacion: DetalleHito;
  aaronico: DetalleHito;
  llamamiento: DetalleHito;
  melquisedec: DetalleHito;
  nombresTemplo: DetalleHito;
}

export interface EstadisticaBarrio {
  nombre: string;
  totalMiembros: number;
  hitosPosibles: number;
  hitosCumplidos: number;
  porcentaje: number;
  miembrosEnRiesgo: number; // 👈 NUEVA PROPIEDAD
  desglose: DesgloseHitos;
}

export interface EstadisticaEstaca {
  totalMiembros: number;
  hitosPosibles: number;
  hitosCumplidos: number;
  porcentaje: number;
  miembrosEnRiesgo: number; // 👈 NUEVA PROPIEDAD
  desglose: DesgloseHitos;
}