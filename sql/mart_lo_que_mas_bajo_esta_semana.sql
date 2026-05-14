-- Mart: "Lo que mas bajo esta semana".
-- Requiere al menos 2 particiones (>=7 dias atras y hoy). Si no hay,
-- la view devuelve vacio sin romper.

CREATE OR REPLACE VIEW carrefour_bronze.mart_lo_que_mas_bajo_esta_semana AS
WITH max_fecha AS (
  SELECT max(fecha) AS hoy FROM carrefour_bronze.fact_observacion_diaria
),
fecha_semana_pasada AS (
  SELECT max(f.fecha) AS hace_7
  FROM carrefour_bronze.fact_observacion_diaria f, max_fecha m
  WHERE f.fecha <= DATE_ADD('day', -7, m.hoy)
),
hoy_data AS (
  SELECT * FROM carrefour_bronze.fact_observacion_diaria f, max_fecha m
  WHERE f.fecha = m.hoy AND f.esta_disponible AND f.precio_venta IS NOT NULL
),
semana_pasada_data AS (
  SELECT * FROM carrefour_bronze.fact_observacion_diaria f, fecha_semana_pasada h
  WHERE f.fecha = h.hace_7 AND f.precio_venta IS NOT NULL
)
SELECT
  h.producto,
  h.marca,
  h.categoria,
  s.precio_venta                                   AS precio_hace_una_semana,
  h.precio_venta                                   AS precio_hoy,
  s.precio_venta - h.precio_venta                  AS bajo_ars,
  ROUND((s.precio_venta - h.precio_venta) / s.precio_venta * 100, 1) AS bajo_pct,
  h.imagen,
  h.url
FROM hoy_data h
JOIN semana_pasada_data s ON h.producto_id = s.producto_id
WHERE s.precio_venta > h.precio_venta
ORDER BY bajo_pct DESC
LIMIT 50;
