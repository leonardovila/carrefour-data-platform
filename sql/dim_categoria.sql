-- Dimension categoria, joineable con la tabla de categorias del bronze.

CREATE OR REPLACE VIEW carrefour_bronze.dim_categoria AS
SELECT DISTINCT
  category_id        AS categoria_id,
  category_name      AS categoria,
  category_path      AS path,
  category_url       AS url
FROM carrefour_bronze.categories_raw;
