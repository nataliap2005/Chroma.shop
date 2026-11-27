export interface Option {
  value: string; label: string;
  /** Colores de referencia que se muestran junto a la respuesta */
  colors?: string[];
  /** Foto de referencia (ruta dentro de /public), opcional; si existe se muestra en vez de los colores */
  image?: string;
  /** Para la pregunta de acabado: cómo se ve la muestra (mate, satinado o luminoso) */
  finish?: string;
}
export interface Question { key: string; section: string; heading: string; hint: string; options: Option[]; photo: boolean; multi: boolean }
export type Answers = Record<string, string | number | string[]>;
export interface Profile { season?: string; undertone?: string; answers?: Answers; needs_update?: boolean; analysis?: Analysis; [key: string]: unknown }
export interface Analysis { season: string; suggested: string; confidence: string; undertone: string; palette: string[]; axes: Record<string,number>; summary: string; method: string; alternatives: unknown[] }

export interface CompatFactor { label: string; points: number; maximum: number; ok: boolean; reason: string }
export interface Compatibility { score?: number | null; factors?: CompatFactor[]; messages?: string[] }

export interface Product {
  id: string; nombre: string; marca: string; categoria: string; tono: string; color_hex: string; precio_cop: number;
  imagen?: string; acabado?: string; profundidad?: string; subtono?: string; estacion?: string; descripcion?: string;
  /** B = color oficial de la marca */
  nivel?: string;
  /** ok | ambiguo | incoherente | transparente */
  calidad?: string;
  fuente?: string; precio_fuente?: string; tienda?: string; tienda_url?: string;
  /** tono = el enlace lleva al tono exacto; producto = hay que elegir el tono en la tienda */
  enlace_tipo?: string;
  /** Paletas: JSON con [{nombre, hex, zona}] */
  panes?: string;
  /** oficial | foto (color tomado de la foto oficial) */
  origen_color?: string;
  compatibilidad?: Compatibility;
  favorito?: boolean;
  /** La marca está en un plan superior al de la usuaria */
  bloqueado?: boolean;
  plan_requerido?: string;
  [key: string]: unknown;
}

export type ToneResult = 'acertado' | 'parcial' | 'incorrecto';
export interface ToneFeedback {
  product_id: string; tono_resultado: ToneResult; motivo_tono: string; forma_evaluacion: 'probado' | 'pantalla';
  comment: string; confidence_before: number | null; confidence_after: number | null; created_at?: string;
}

export type PlanId = 'free' | 'plus' | 'premium';
export interface PlanInfo {
  plan: PlanId; nombre: string; mes: string; sesion: boolean; is_admin: boolean;
  /** Fecha en que vence un plan pagado (null: no vence o es Free) */
  vence?: string | null;
  traductor: { usadas: number; limite: number }; looks: { usados: number; limite: number };
  /** Plan desde el que se ve cada marca (las que no aparecen son Free) */
  marcas: Record<string, PlanId>;
}
