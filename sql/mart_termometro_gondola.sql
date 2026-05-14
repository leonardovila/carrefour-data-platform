-- Mart: "Termometro de la gondola" — una fila por dia, mostrando el pulso global.
-- Para titulares tipo "Hoy en Carrefour hay 12.345 productos disponibles a un promedio de $X".

CREATE OR REPLACE VIEW carrefour_bronze.mart_termometro_gondola AS
SELECT
  fecha,
  count(*)                                          AS productos_disponibles,
  count(DISTINCT marca)                             AS marcas_activas,
  count(DISTINCT categoria_id)                      AS categorias_con_stock,
  ROUND(AVG(precio_venta), 0)                       AS precio_promedio_ars,
  ROUND(APPROX_PERCENTILE(precio_venta, 0.5), 0)    AS precio_mediano_ars,
  count(CASE WHEN descuento_pct > 0 THEN 1 END)     AS productos_en_oferta,
  ROUND(SUM(te_ahorras_ars), 0)                     AS ahorro_total_disponible_ars
FROM carrefour_bronze.fact_observacion_diaria
WHERE esta_disponible
GROUP BY fecha
ORDER BY fecha DESC;
