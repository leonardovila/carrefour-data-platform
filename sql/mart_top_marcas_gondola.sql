-- Mart: "Top marcas en gondola hoy". Ranking + perfil rapido.

CREATE OR REPLACE VIEW carrefour_bronze.mart_top_marcas_gondola AS
WITH hoy AS (
  SELECT max(fecha) AS f FROM carrefour_bronze.fact_observacion_diaria
)
SELECT
  f.marca,
  count(*)                                                    AS productos,
  count(DISTINCT f.categoria_id)                              AS categorias,
  ROUND(AVG(f.precio_venta), 0)                               AS precio_promedio_ars,
  ROUND(MIN(f.precio_venta), 0)                               AS precio_mas_bajo,
  ROUND(MAX(f.precio_venta), 0)                               AS precio_mas_alto,
  count(CASE WHEN f.descuento_pct > 0 THEN 1 END)             AS en_oferta,
  ROUND(AVG(CASE WHEN f.descuento_pct > 0 THEN f.descuento_pct END), 1) AS descuento_promedio_pct
FROM carrefour_bronze.fact_observacion_diaria f
JOIN hoy ON f.fecha = hoy.f
WHERE f.esta_disponible AND f.marca IS NOT NULL
GROUP BY f.marca
ORDER BY productos DESC
LIMIT 50;
