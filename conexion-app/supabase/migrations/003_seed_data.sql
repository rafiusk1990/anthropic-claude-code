-- =============================================
-- SEED DATA - The Life Church Santiago / Equipo Conexión
-- =============================================

-- Teams
insert into teams (id, name, "order") values
  ('00000000-0000-0000-0001-000000000001', 'Bienvenida', 1),
  ('00000000-0000-0000-0001-000000000002', 'Auditorio', 2),
  ('00000000-0000-0000-0001-000000000003', 'Eres Nuevo Aquí', 3);

-- Areas - Bienvenida
insert into areas (team_id, name, "order", capacity) values
  ('00000000-0000-0000-0001-000000000001', 'Salida Metro', 1, 2),
  ('00000000-0000-0000-0001-000000000001', 'Lobby 1', 2, 2),
  ('00000000-0000-0000-0001-000000000001', 'Lobby -2', 3, 2);

-- Areas - Auditorio
insert into areas (team_id, name, "order", capacity) values
  ('00000000-0000-0000-0001-000000000002', 'Santa Cena', 1, 2),
  ('00000000-0000-0000-0001-000000000002', 'Generosidad', 2, 1),
  ('00000000-0000-0000-0001-000000000002', 'Puertas y Asistencia', 3, 1);

-- Areas - Eres Nuevo Aquí
insert into areas (team_id, name, "order", capacity) values
  ('00000000-0000-0000-0001-000000000003', 'Eres Nuevo Aquí', 1, 3);

-- Special tasks
insert into special_tasks (name, "order", active) values
  ('Santa Cena en la Oficina 8h', 1, true),
  ('Preparar / Entregar Colación', 2, true),
  ('Cargar en la Bodega 8h', 3, true),
  ('Descargar en la Bodega', 4, true),
  ('Guardar y entregar 4 Radios', 5, true),
  ('Armar en el hotel', 6, true),
  ('Desarmar en el hotel', 7, true);
