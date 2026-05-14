-- Mart: "Marcas que mas aumentaron en los ultimos 7 dias".
-- Promedia el % de aumento de cada producto de la marca, dejando solo
-- marcas con al menos 5 productos comparables (ruido bajo).

CREATE OR REPLACE VIEW carrefour_bronze.mart_marcas_que_mas_aumentan AS
WITH max_fecha AS (
  SELECT max(fecha) AS hoy FROM carrefour_bronze.fact_observacion_diaria
),
fecha_semana_pasada AS (
  SELECT max(f.fecha) AS hace_7
  FROM carrefour_bronze.fact_observacion_diaria f
  CROSS JOIN max_fecha m
  WHERE f.fecha <= DATE_ADD('day', -7, m.hoy)
),
hoy_data AS (
  SELECT f.* FROM carrefour_bronze.fact_observacion_diaria f
  CROSS JOIN max_fecha m
  WHERE f.fecha = m.hoy AND f.precio_venta > 0
),
semana_pasada_data AS (
  SELECT f.* FROM carrefour_bronze.fact_observacion_diaria f
  CROSS JOIN fecha_semana_pasada s
  WHERE f.fecha = s.hace_7 AND f.precio_venta > 0
),
deltas AS (
  SELECT
    h.marca,
    h.producto_id,
    s.precio_venta                                       AS p_antes,
    h.precio_venta                                       AS p_hoy,
    (h.precio_venta - s.precio_venta) / s.precio_venta * 100 AS pct_cambio
  FROM hoy_data h
  JOIN semana_pasada_data s ON h.producto_id = s.producto_id
)
SELECT
  marca,
  count(*)                                             AS productos_comparados,
  ROUND(AVG(pct_cambio), 2)                            AS aumento_promedio_pct,
  ROUND(APPROX_PERCENTILE(pct_cambio, 0.5), 2)         AS aumento_mediano_pct
FROM deltas
GROUP BY marca
HAVING count(*) >= 5 AND AVG(pct_cambio) > 0
ORDER BY aumento_promedio_pct DESC
LIMIT 30;
