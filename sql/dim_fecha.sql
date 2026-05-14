-- Dimension fecha: una fila por dia ingestado, con atributos de calendario.

CREATE OR REPLACE VIEW carrefour_bronze.dim_fecha AS
WITH fechas AS (
  SELECT DISTINCT ingest_date FROM carrefour_bronze.silver_productos
)
SELECT
  ingest_date                                                        AS fecha,
  YEAR(ingest_date)                                                  AS anio,
  MONTH(ingest_date)                                                 AS mes,
  DAY(ingest_date)                                                   AS dia,
  DAY_OF_WEEK(ingest_date)                                           AS dia_semana,
  CASE DAY_OF_WEEK(ingest_date)
    WHEN 1 THEN 'lunes' WHEN 2 THEN 'martes' WHEN 3 THEN 'miercoles'
    WHEN 4 THEN 'jueves' WHEN 5 THEN 'viernes' WHEN 6 THEN 'sabado'
    WHEN 7 THEN 'domingo' END                                        AS dia_semana_nombre,
  CASE WHEN DAY_OF_WEEK(ingest_date) IN (6, 7) THEN TRUE ELSE FALSE END AS es_finde
FROM fechas;
