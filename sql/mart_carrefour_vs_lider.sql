-- Mart: "Marca Carrefour vs marca lider". Por cada categoria muestra:
-- el producto Carrefour mas barato vs el producto lider mas barato de la misma categoria.
-- "Cuanto te ahorras yendo por la marca propia".

CREATE OR REPLACE VIEW carrefour_bronze.mart_carrefour_vs_lider AS
WITH hoy AS (
  SELECT max(fecha) AS f FROM carrefour_bronze.fact_observacion_diaria
),
base_hoy AS (
  SELECT *
  FROM carrefour_bronze.fact_observacion_diaria, hoy
  WHERE fecha = hoy.f AND esta_disponible AND precio_venta IS NOT NULL
),
carrefour_por_cat AS (
  SELECT categoria_id, categoria, producto_id, producto, precio_venta, marca, imagen, url,
    ROW_NUMBER() OVER (PARTITION BY categoria_id ORDER BY precio_venta ASC) AS rk
  FROM base_hoy
  WHERE LOWER(marca) LIKE '%carrefour%'
),
otros_por_cat AS (
  SELECT categoria_id, marca, producto, precio_venta, imagen, url,
    ROW_NUMBER() OVER (PARTITION BY categoria_id ORDER BY precio_venta ASC) AS rk
  FROM base_hoy
  WHERE LOWER(marca) NOT LIKE '%carrefour%'
)
SELECT
  c.categoria,
  c.producto                                        AS producto_carrefour,
  c.precio_venta                                    AS precio_carrefour,
  c.imagen                                          AS imagen_carrefour,
  c.url                                             AS url_carrefour,
  o.marca                                           AS marca_competencia,
  o.producto                                        AS producto_competencia,
  o.precio_venta                                    AS precio_competencia,
  o.precio_venta - c.precio_venta                   AS te_ahorras_ars,
  ROUND((o.precio_venta - c.precio_venta) / o.precio_venta * 100, 1) AS te_ahorras_pct,
  o.imagen                                          AS imagen_competencia,
  o.url                                             AS url_competencia
FROM carrefour_por_cat c
JOIN otros_por_cat o
  ON c.categoria_id = o.categoria_id
 AND c.rk = 1 AND o.rk = 1
WHERE o.precio_venta > c.precio_venta
ORDER BY te_ahorras_pct DESC;
