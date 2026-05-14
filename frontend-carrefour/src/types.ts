// Tipos compartidos por toda la app.
// Mapean lo que devuelven los endpoints /cloud/* del backend.

export interface CloudResponse<T> {
  source: string;
  view: string;
  rows: T[];
}

export interface TermometroRow {
  fecha: string;
  productos_disponibles: string;
  marcas_activas: string;
  categorias_con_stock: string;
  precio_promedio_ars: string;
  precio_mediano_ars: string;
  productos_en_oferta: string;
  ahorro_total_disponible_ars: string;
}

export interface TopMarcaRow {
  marca: string;
  productos: string;
  categorias: string;
  precio_promedio_ars: string;
  precio_mas_bajo: string;
  precio_mas_alto: string;
  en_oferta: string;
  descuento_promedio_pct: string;
}

export interface OfertaRow {
  producto: string;
  marca: string;
  categoria: string;
  precio_lista: string;
  precio_venta: string;
  te_ahorras_ars: string;
  descuento_pct: string;
  cuotas_max: string | null;
  valor_cuota: string | null;
  vendedor: string;
  imagen: string | null;
  url: string;
}

export interface CarrefourVsLiderRow {
  categoria: string;
  producto_carrefour: string;
  precio_carrefour: string;
  imagen_carrefour: string | null;
  url_carrefour: string;
  marca_competencia: string;
  producto_competencia: string;
  precio_competencia: string;
  te_ahorras_ars: string;
  te_ahorras_pct: string;
  imagen_competencia: string | null;
  url_competencia: string;
}

export interface BajoSemanaRow {
  producto: string;
  marca: string;
  categoria: string;
  precio_hace_una_semana: string;
  precio_hoy: string;
  bajo_ars: string;
  bajo_pct: string;
  imagen: string | null;
  url: string;
}

export interface MarcasAumentanRow {
  marca: string;
  productos_comparados: string;
  aumento_promedio_pct: string;
  aumento_mediano_pct: string;
}

export interface SystemStatus {
  partitions: { ingest_date: string; products: number; unique_products: number; brands: number; source_categories: number }[];
  latest_date: string | null;
  total_partitions: number;
}
