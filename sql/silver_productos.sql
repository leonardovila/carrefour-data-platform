-- Silver: capa limpia y renombrada en castellano sobre el bronze.
-- View, no tabla: cero costo de storage, siempre fresca.

CREATE OR REPLACE VIEW carrefour_bronze.silver_productos AS
SELECT
  CAST(ingest_date AS DATE)                     AS ingest_date,
  product_id                                    AS producto_id,
  product_name                                  AS producto,
  brand                                         AS marca,
  selling_price                                 AS precio_venta,
  list_price                                    AS precio_lista,
  CASE
    WHEN list_price IS NOT NULL
     AND selling_price IS NOT NULL
     AND list_price > selling_price
    THEN ROUND((list_price - selling_price) / list_price * 100, 1)
    ELSE 0
  END                                            AS descuento_pct,
  CASE
    WHEN list_price IS NOT NULL AND selling_price IS NOT NULL
    THEN list_price - selling_price
    ELSE 0
  END                                            AS te_ahorras_ars,
  available_quantity                            AS stock,
  is_available                                  AS esta_disponible,
  installments_max_count                        AS cuotas_max,
  installments_value                            AS valor_cuota,
  seller_name                                   AS vendedor,
  ean,
  source_category_id                            AS categoria_id,
  source_category_name                          AS categoria,
  image_url                                     AS imagen,
  link                                          AS url,
  ingest_run_id                                 AS run_id
FROM carrefour_bronze.products_raw
WHERE product_id IS NOT NULL;
