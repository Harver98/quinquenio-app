-- ============================================
-- SQL COMPLETO - QUINQUENIO UIS 2025
-- Ejecutar en Supabase > SQL Editor
-- ============================================

-- 1. Tabla principal de inscritos
CREATE TABLE IF NOT EXISTS inscritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  cedula TEXT UNIQUE NOT NULL,
  telefono TEXT NOT NULL,
  correo TEXT NOT NULL,
  acompanantes INTEGER DEFAULT 0,
  programa1 TEXT NOT NULL,
  anio_grado1 TEXT NOT NULL,
  programa2 TEXT,
  anio_grado2 TEXT,
  tipo_egresado TEXT NOT NULL CHECK (tipo_egresado IN ('socio', 'no_socio')),
  cantidad_botones INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  estado_pago TEXT DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'verificando', 'aprobado', 'rechazado')),
  qr_token UUID DEFAULT gen_random_uuid() UNIQUE,
  ingreso BOOLEAN DEFAULT FALSE,
  fecha_ingreso TIMESTAMPTZ,
  comprobante_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de checkins
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscrito_id UUID NOT NULL REFERENCES inscritos(id) ON DELETE CASCADE,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  operador TEXT NOT NULL,
  dispositivo TEXT
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_inscritos_cedula ON inscritos(cedula);
CREATE INDEX IF NOT EXISTS idx_inscritos_estado ON inscritos(estado_pago);
CREATE INDEX IF NOT EXISTS idx_inscritos_qr_token ON inscritos(qr_token);
CREATE INDEX IF NOT EXISTS idx_checkins_inscrito ON checkins(inscrito_id);
CREATE INDEX IF NOT EXISTS idx_checkins_fecha ON checkins(fecha);

-- 4. Habilitar Row Level Security
ALTER TABLE inscritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para inscritos (solo usuarios autenticados)
CREATE POLICY "auth_select_inscritos"
  ON inscritos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_insert_inscritos"
  ON inscritos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "auth_update_inscritos"
  ON inscritos FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "auth_delete_inscritos"
  ON inscritos FOR DELETE
  TO authenticated
  USING (true);

-- 6. Políticas para checkins
CREATE POLICY "auth_select_checkins"
  ON checkins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_insert_checkins"
  ON checkins FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 7. Políticas de Storage para el bucket 'comprobantes'
-- (Crear el bucket primero en Storage > New bucket: 'comprobantes', privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth_upload_comprobantes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'comprobantes');

CREATE POLICY "auth_read_comprobantes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'comprobantes');

CREATE POLICY "auth_delete_comprobantes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'comprobantes');

-- 8. Crear usuarios (ejecutar desde Supabase Dashboard > Auth > Users
-- O usar este SQL para asignar rol a usuarios existentes:

-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'),
--   '{role}',
--   '"admin"'
-- )
-- WHERE email = 'admin@tuevento.com';

-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'),
--   '{role}',
--   '"checkin"'
-- )
-- WHERE email = 'checkin@tuevento.com';

-- ============================================
-- DATOS DE PRUEBA (opcional)
-- ============================================

-- INSERT INTO inscritos (nombre, cedula, telefono, correo, acompanantes, programa1, anio_grado1, tipo_egresado, 
-- cantidad_botones, total, estado_pago)
-- VALUES
--   ('Carlos Ramírez', '13456789', '3001234567', 'carlos@email.com', 1, 'Ingeniería de Sistemas', '2015', 'socio', 0, 180000, 'aprobado'),
--   ('María González', '24567890', '3109876543', 'maria@email.com', 0, 'Medicina', '2010', 'no_socio', 1, 165000, 'pendiente'),
--   ('Luis Torres', '35678901', '3201112233', 'luis@email.com', 2, 'Derecho', '2005', 'no_socio', 0, 310000, 'verificando');
