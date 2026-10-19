export interface DetalleBarrio {
  id?: string;
  registro_domingo_id?: string;
  barrio_nombre: string;
  porcentaje: number;
  promedio: number;
  asistencia_hoy: number;
  asistencia_trimestre_anterior: number;
  incremento: number;
  diaconos: boolean;
  maestros: boolean;
  presbiteros: boolean;
  act_hhjj: boolean;
  act_mmjj: boolean;
  reu_clas_mmjj: boolean;
}

export interface RegistroDomingo {
  id?: string;
  fecha: string;
  es_semana_activa?: boolean;
  asistencia_total: number;
  asistencia_trimestre_anterior: number;
  asistencia_semana_pasada: number;
  diferencia: number;
  detalle_barrios?: DetalleBarrio[];
}

export interface TrimestreRango {
  trimestre: number;
  anio: number;
  inicio: string;
  fin: string;
}

export interface PromedioMensual {
  mesNombre: string;
  semanasActivas: number;
  promedioAsistencia: number;
}

export interface AsistenciaSemanalBarrio {
  fecha: string;
  semanaEtiqueta: string;
  mesNombre: string;
  asistenciasPorBarrio: { [barrioNombre: string]: number };
  totalEstaca: number;
}

export interface ResumenBarrioTrimestral {
  barrio_nombre: string;
  total_asistencia: number;
  promedio_asistencia: number;
  asistencia_trimestre_anterior: number;
  incremento_promedio: number;
  diaconos_cumplimiento: number;
  maestros_cumplimiento: number;
  presbiteros_cumplimiento: number;
  act_hhjj_cumplimiento: number;
  act_mmjj_cumplimiento: number;
  reu_clas_mmjj_cumplimiento: number;
  total_actividades_cumplidas: number;
  total_actividades_posibles: number;
  porcentaje_cumplimiento_actividades: number;
}

export interface ReporteTrimestral {
  trimestre: number;
  anio: number;
  semanas_registradas: number;
  asistencia_promedio_estaca: number;
  asistencia_trimestre_anterior_estaca: number;
  diferencia_promedio_estaca: number;
  promedios_mensuales: PromedioMensual[];
  asistencias_semanales: AsistenciaSemanalBarrio[];
  detalles_barrios: ResumenBarrioTrimestral[];
}

export function getRangoTrimestre(fechaStr: string): TrimestreRango {
  const f = new Date(fechaStr + 'T00:00:00');
  const anio = f.getFullYear();
  const mes = f.getMonth();

  let trimestre = 1;
  let inicio = `${anio}-01-01`;
  let fin = `${anio}-03-31`;

  if (mes >= 3 && mes <= 5) {
    trimestre = 2;
    inicio = `${anio}-04-01`;
    fin = `${anio}-06-30`;
  } else if (mes >= 6 && mes <= 8) {
    trimestre = 3;
    inicio = `${anio}-07-01`;
    fin = `${anio}-09-30`;
  } else if (mes >= 9) {
    trimestre = 4;
    inicio = `${anio}-10-01`;
    fin = `${anio}-12-31`;
  }

  return { trimestre, anio, inicio, fin };
}