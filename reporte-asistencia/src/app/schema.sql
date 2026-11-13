-- ==========================================
-- SCRIPT DE INSTALACIÓN: BASE DE DATOS
-- Sistema de Asistencia y Seguimiento
-- ==========================================

-- 1. Crear tabla maestra de Unidades (Barrios/Ramas)
create table public.estaca_unidades (
  id serial not null,
  nombre text not null,
  constraint estaca_unidades_pkey primary key (id),
  constraint estaca_unidades_nombre_key unique (nombre)
) TABLESPACE pg_default;

-- 2. Crear tabla principal para los registros dominicales
create table public.registros_domingo (
  id uuid not null default gen_random_uuid(),
  fecha date not null,
  asistencia_total integer not null default 0,
  asistencia_trimestre_anterior integer not null default 0,
  asistencia_semana_pasada integer not null default 0,
  diferencia integer not null default 0,
  creado_el timestamp with time zone null default now(),
  es_semana_activa boolean null default true,
  constraint registros_domingo_pkey primary key (id),
  constraint registros_domingo_fecha_key unique (fecha)
) TABLESPACE pg_default;

-- 3. Crear tabla de detalle de asistencia por cada barrio
create table public.detalle_barrios (
  id uuid not null default gen_random_uuid(),
  registro_domingo_id uuid null,
  porcentaje integer null default 0,
  promedio integer null default 0,
  asistencia_hoy integer not null default 0,
  asistencia_trimestre_anterior integer not null default 0,
  incremento integer not null default 0,
  diaconos boolean null default false,
  maestros boolean null default false,
  presbiteros boolean null default false,
  act_mmjj boolean null default false,
  reu_clas_mmjj boolean null default false,
  act_hhjj boolean null default false,
  unidad_id integer not null,
  constraint detalle_barrios_pkey primary key (id),
  constraint detalle_barrios_registro_domingo_id_fkey foreign KEY (registro_domingo_id) references registros_domingo (id) on delete CASCADE,
  constraint fk_detalle_barrios_unidad foreign KEY (unidad_id) references estaca_unidades (id) on update CASCADE
) TABLESPACE pg_default;

-- 4. Crear tabla para el Seguimiento de Conversos / Miembros
create table public.seguimiento_miembros (
  id uuid not null default gen_random_uuid(),
  nombre_completo text not null,
  genero text not null,
  anio_nacimiento integer not null,
  fecha_bautismo date null,
  hito_post_bautismal boolean null default false,
  hito_entrevista_templo boolean null default false,
  hito_recomendacion boolean null default false,
  hito_aaronico boolean null default false,
  hito_llamamiento boolean null default false,
  hito_melquisedec boolean null default false,
  hito_nombres_templo boolean null default false,
  creado_en timestamp with time zone null default timezone('utc'::text, now()),
  activo boolean not null default true,
  unidad_id integer not null,
  constraint seguimiento_miembros_pkey primary key (id),
  constraint fk_seguimiento_unidad foreign KEY (unidad_id) references estaca_unidades (id) on update CASCADE,
  constraint seguimiento_miembros_genero_check check ((genero = any (array['M'::text, 'F'::text])))
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.estaca_config (
  id INT4 PRIMARY KEY DEFAULT 1,
  nombre_estaca TEXT NOT NULL,
  subtitulo TEXT DEFAULT 'El Tigre',
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.estaca_config (id, nombre_estaca, subtitulo)
VALUES (1, 'Estaca El Tigre', 'El Tigre')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.estaca_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura a autenticados" ON public.estaca_config;
CREATE POLICY "Permitir lectura a autenticados"
ON public.estaca_config FOR SELECT
TO authenticated
USING (true);


-- Crear tabla para la hoja de seguimiento mensual con el obispo
CREATE TABLE seguimiento_obispos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidad_id INT REFERENCES estaca_unidades(id) ON DELETE CASCADE,
  anio INT NOT NULL,
  mes INT NOT NULL,
  nombre_obispo TEXT,
  
  -- Item 1: La asistencia general se calcula automática, solo guardamos jóvenes
  rs_jovenes_asistencia INT DEFAULT 0,
  
  -- Item 2: Consejos
  consejos_barrio INT DEFAULT 0,
  consejos_juventud INT DEFAULT 0,
  
  -- Item 3: Seminario, Instituto y Prep. Misional
  sem_inscritos INT DEFAULT 0,
  sem_asistencia INT DEFAULT 0,
  inst_inscritos INT DEFAULT 0,
  inst_asistencia INT DEFAULT 0,
  pm_inscritos INT DEFAULT 0,
  pm_asistencia INT DEFAULT 0,
  
  -- Item 4: Jóvenes al Campo Misional
  misional_papeles INT DEFAULT 0,
  misional_entrevistas INT DEFAULT 0,
  
  -- Item 6: Ministración a la Juventud
  min_jovenes_entrevistados INT DEFAULT 0,
  
  -- Item 7: Sacerdocio de Melquisedec
  melquisedec_entrevistas INT DEFAULT 0,
  
  -- Restricción para que no existan dos registros del mismo mes, año y barrio
  UNIQUE(unidad_id, anio, mes)
);

-- Habilitar seguridad (RLS)
ALTER TABLE seguimiento_obispos ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimiento_obispos ADD COLUMN conv_seguimiento_pct INT DEFAULT 0;
CREATE POLICY "Permitir todo a usuarios autenticados y publicos" ON seguimiento_obispos FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ==========================================
ALTER TABLE estaca_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_domingo ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_barrios ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimiento_miembros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios autenticados y publicos" ON estaca_unidades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados y publicos" ON registros_domingo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados y publicos" ON detalle_barrios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados y publicos" ON seguimiento_miembros FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- DATOS SEMILLA (Catálogo de Unidades)
-- ==========================================
-- Modifica estos nombres por los barrios o ramas reales de tu estaca
INSERT INTO estaca_unidades (nombre) VALUES 
('Barrio 1'),
('Barrio 2'),
('Barrio 3'),
('Barrio 4'),
('Barrio 5');