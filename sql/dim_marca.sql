-- Dimension marca: catalogo unico de marcas con su perfil agregado al ultimo dia.
-- Util para joins rapidos y para la pagina de cada marca.

CREATE OR REPLACE VIEW carrefour_bronze.dim_marca AS
WITH ultimo AS (
  SELECT max(ingest_date) AS d FROM carrefour_bronze.silver_productos
)
SELECT
  marca,
  CASE WHEN LOWER(marca) LIKE '%carrefour%' THEN TRUE ELSE FALSE END AS es_marca_propia,
  count(*)                          AS productos_disponibles,
  count(DISTINCT categoria_id)      AS categorias_donde_juega,
  ROUND(AVG(precio_venta), 0)       AS precio_promedio_ars,
  ROUND(AVG(descuento_pct), 1)      AS descuento_promedio_pct,
  MIN(ingest_date)                  AS visto_por_primera_vez,
  MAX(ingest_date)                  AS visto_por_ultima_vez
FROM carrefour_bronze.silver_productos
WHERE marca IS NOT NULL AND esta_disponible
GROUP BY marca;
