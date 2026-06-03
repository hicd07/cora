export const DELIVERY_OPTIONS = [
  "Inmediato (1-2 horas)",
  "Mismo día (4-6 horas)",
  "Siguiente día (24 horas)",
  "48 horas",
  "72 horas",
] as const;

export type DeliveryTime = typeof DELIVERY_OPTIONS[number];