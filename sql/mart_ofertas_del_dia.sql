-- Mart: "Ofertas del dia". Top productos con mayor descuento real.
-- Corazon de "lo que conviene comprar hoy".

CREATE OR REPLACE VIEW carrefour_bronze.mart_ofertas_del_dia AS
WITH hoy AS (
  SELECT max(fecha) AS f FROM carrefour_bronze.fact_observacion_diaria
)
SELECT
  f.fecha,
  f.producto,
  f.marca,
  f.categoria,
  f.precio_lista,
  f.precio_venta,
  f.te_ahorras_ars,
  f.descuento_pct,
  f.cuotas_max,
  f.valor_cuota,
  f.vendedor,
  f.imagen,
  f.url
FROM carrefour_bronze.fact_observacion_diaria f
JOIN hoy ON f.fecha = hoy.f
WHERE f.esta_disponible
  AND f.descuento_pct >= 15
ORDER BY f.descuento_pct DESC, f.te_ahorras_ars DESC
LIMIT 200;
