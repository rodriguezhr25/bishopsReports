-- 1. Limpiar tablas si existen previamente
DROP TABLE IF EXISTS detalle_barrios;
DROP TABLE IF EXISTS registros_domingo;

-- 2. Crear tabla principal para los registros dominicales de la Estaca
CREATE TABLE registros_domingo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE UNIQUE NOT NULL,
  asistencia_total INT NOT NULL DEFAULT 0,
  asistencia_trimestre_anterior INT NOT NULL DEFAULT 0,
  asistencia_semana_pasada INT NOT NULL DEFAULT 0,
  diferencia INT NOT NULL DEFAULT 0,
  creado_el TIMESTAMP WITH TIMEZONE DEFAULT NOW()
);

-- 3. Crear tabla de detalle por cada barrio
CREATE TABLE detalle_barrios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_domingo_id UUID REFERENCES registros_domingo(id) ON DELETE CASCADE,
  barrio_nombre VARCHAR(100) NOT NULL,
  porcentaje INT DEFAULT 0,
  promedio INT DEFAULT 0,
  asistencia_hoy INT NOT NULL DEFAULT 0,
  asistencia_trimestre_anterior INT NOT NULL DEFAULT 0,
  incremento INT NOT NULL DEFAULT 0,
  
  -- Matriz de reuniones y actividades (Checks de asistencia)
  diaconos BOOLEAN DEFAULT FALSE,
  maestros BOOLEAN DEFAULT FALSE,
  presbiteros BOOLEAN DEFAULT FALSE,
  act_mmjj_1 BOOLEAN DEFAULT FALSE,
  act_mmjj_2 BOOLEAN DEFAULT FALSE,
  reu_clas_mmjj BOOLEAN DEFAULT FALSE
);

-- 4. Habilitar Row Level Security (RLS) para permitir lectura y escritura pública mediante la anon key
ALTER TABLE registros_domingo ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_barrios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura pública en registros_domingo" 
  ON registros_domingo FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública en registros_domingo" 
  ON registros_domingo FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización pública en registros_domingo" 
  ON registros_domingo FOR UPDATE USING (true);

CREATE POLICY "Permitir lectura pública en detalle_barrios" 
  ON detalle_barrios FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública en detalle_barrios" 
  ON detalle_barrios FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir eliminación pública en detalle_barrios" 
  ON detalle_barrios FOR DELETE USING (true);

-- 5. Insertar datos semilla del 13 de Septiembre
DO $$
DECLARE
  reg_id UUID;
BEGIN
  -- Insertar Cabecera de Estaca (Sept 13)
  INSERT INTO registros_domingo (fecha, asistencia_total, asistencia_trimestre_anterior, asistencia_semana_pasada, diferencia)
  VALUES ('2026-09-13', 368, 371, 363, -3)
  RETURNING id INTO reg_id;

  -- Insertar Barrios
  INSERT INTO detalle_barrios (registro_domingo_id, barrio_nombre, porcentaje, promedio, asistencia_hoy, asistencia_trimestre_anterior, incremento, diaconos, maestros, presbiteros, act_mmjj_1, act_mmjj_2, reu_clas_mmjj)
  VALUES 
    (reg_id, 'Barrio Anaco', 5, 88, 88, 86, 2, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
    (reg_id, 'Barrio Cantaura', 9, 92, 90, 99, -9, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE),
    (reg_id, 'Barrio Pariaguán', 6, 57, 60, 52, 8, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
    (reg_id, 'Barrio Tigrito', 6, 56, 61, 61, 0, FALSE, FALSE, FALSE, TRUE, FALSE, FALSE),
    (reg_id, 'Barrio Tigre', 15, 73, 69, 73, -4, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE);
END $$;