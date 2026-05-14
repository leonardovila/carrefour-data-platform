-- Fact: una fila por (dia, producto). Es la observacion diaria del precio.
-- Esta view es la base para todos los marts de narrativa.

CREATE OR REPLACE VIEW carrefour_bronze.fact_observacion_diaria AS
SELECT
  ingest_date           AS fecha,
  producto_id,
  producto,
  marca,
  categoria_id,
  categoria,
  precio_venta,
  precio_lista,
  descuento_pct,
  te_ahorras_ars,
  stock,
  esta_disponible,
  cuotas_max,
  valor_cuota,
  vendedor,
  ean,
  imagen,
  url
FROM carrefour_bronze.silver_productos;
