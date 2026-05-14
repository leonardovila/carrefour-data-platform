# SQL Layer — Star Schema sobre Bronze

Capas modeladas sobre el bronze, todas como **vistas Athena** (cero storage extra,
siempre frescas, idempotentes).

## Capas

```
              BRONZE (parquets en S3, particionados por dia)
                 ▼
              SILVER (vistas con tipos limpios y nombres en castellano)
                 ▼
              FACT + DIMS (modelo en estrella)
                 ▼
              MARTS (narrativa lista para mostrar)
```

## Files

| Archivo | Capa | Que hace |
|---------|------|----------|
| `silver_productos.sql` | Silver | Renombra columnas a castellano, calcula descuento_pct y te_ahorras_ars. Filtra filas sin product_id. |
| `dim_marca.sql` | Dim | Catalogo unico de marcas con perfil agregado (productos, categorias, precio promedio). |
| `dim_categoria.sql` | Dim | Categorias hoja con su path y URL. |
| `dim_fecha.sql` | Dim | Atributos de calendario por fecha ingestada. |
| `fact_observacion_diaria.sql` | Fact | Una fila por (fecha, producto). Base de todos los marts. |
| `mart_termometro_gondola.sql` | Mart | Una fila por dia: pulso global del catalogo. |
| `mart_ofertas_del_dia.sql` | Mart | Top descuentos disponibles HOY (>= 15%). |
| `mart_top_marcas_gondola.sql` | Mart | Ranking de marcas hoy con perfil rapido. |
| `mart_lo_que_mas_bajo_esta_semana.sql` | Mart | Productos que bajaron de precio vs hace 7 dias. Vacio hasta tener 7 dias de historia. |
| `mart_marcas_que_mas_aumentan.sql` | Mart | Marcas con mayor inflacion semanal. Igual: requiere 7 dias. |
| `mart_carrefour_vs_lider.sql` | Mart | Por categoria: producto Carrefour mas barato vs lider mas barato. "Cuanto te ahorras con marca propia". |

## Como aplicar

```bash
python apply_sql.py        # aplica todas las views via Athena
```

(Ese script vive en `scripts/apply_sql.py` y se conecta con boto3.)

## Filosofia de naming

Los nombres de columnas y tablas estan en **castellano** y en **lenguaje del consumidor**, no en jerga de data engineer:
- `precio_venta` (no `selling_price`)
- `te_ahorras_ars` (no `discount_amount`)
- `mart_lo_que_mas_bajo_esta_semana` (no `weekly_price_drop_facts`)

Esa decision esta enraizada en el plan maestro: el producto final tiene que poder usarlo el papa de Leonardo o un periodista, no solo un analista.
