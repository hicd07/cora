export interface QuoteItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface BidRequest {
  id: string;
  title: string; // Nombre del proyecto o solicitud
  category: string;
  deliveryAddress: string;
  sector: string;
  status: 'active' | 'closed' | 'completed';
  items: QuoteItem[];
  itemsCount: number;
  budgetLimit?: number;
  createdAt: string;
  expiresAt: string;
  bidsCount: number;
}

export interface HardwareStore {
  id: string;
  name: string;
  rating: number;
  reviewsCount: number;
  sector: string;
  deliveryCoverage: string[];
  isVerified: boolean;
}

export const mockBidRequests: BidRequest[] = [
  {
    id: 'req-1',
    title: 'Vaciado de Techo - Segunda Planta',
    category: 'Cemento y Agregados',
    deliveryAddress: 'Calle Club de Leones #45, Alma Rosa I',
    sector: 'Alma Rosa I',
    status: 'active',
    items: [
      { name: 'Cemento Gris Portland', quantity: 50, unit: 'Fundas' },
      { name: 'Arena Itabo', quantity: 4, unit: 'Metros Cúbicos' },
      { name: 'Grava de 3/4', quantity: 6, unit: 'Metros Cúbicos' }
    ],
    itemsCount: 3,
    budgetLimit: 45000,
    createdAt: '2023-10-25T10:00:00Z',
    expiresAt: '2023-10-26T18:00:00Z',
    bidsCount: 3,
  },
  {
    id: 'req-2',
    title: 'Estructura de Columnas y Amarre',
    category: 'Metales y Estructuras',
    deliveryAddress: 'Av. San Vicente de Paul, Ensanche Ozama',
    sector: 'Ensanche Ozama',
    status: 'active',
    items: [
      { name: 'Varillas de acero de 3/8', quantity: 80, unit: 'Varillas' },
      { name: 'Alambre de amarre dulce', quantity: 2, unit: 'Cajas' },
      { name: 'Clavos de acero de 2.5 pulgadas', quantity: 15, unit: 'Unidades' }
    ],
    itemsCount: 3,
    budgetLimit: 35000,
    createdAt: '2023-10-25T11:30:00Z',
    expiresAt: '2023-10-27T12:00:00Z',
    bidsCount: 1,
  },
  {
    id: 'req-3',
    title: 'Instalación Sanitaria Baño Principal',
    category: 'Plomería',
    deliveryAddress: 'Calle Costa Rica, Lucerna',
    sector: 'Lucerna',
    status: 'closed',
    items: [
      { name: 'Tuberías PVC de 2 pulgadas', quantity: 12, unit: 'Unidades' },
      { name: 'Codos de presión PVC 90°', quantity: 8, unit: 'Unidades' },
      { name: 'Pegamento PVC líquido', quantity: 2, unit: 'Unidades' }
    ],
    itemsCount: 3,
    budgetLimit: 12000,
    createdAt: '2023-10-24T08:00:00Z',
    expiresAt: '2023-10-24T18:00:00Z',
    bidsCount: 5,
  }
];

export const mockHardwareStores: HardwareStore[] = [
  {
    id: 'store-1',
    name: 'Ferretería El Progreso SDE',
    rating: 4.8,
    reviewsCount: 124,
    sector: 'Alma Rosa II',
    deliveryCoverage: ['Alma Rosa I', 'Alma Rosa II', 'Ensanche Ozama', 'Lucerna'],
    isVerified: true,
  },
  {
    id: 'store-2',
    name: 'Mega Ferretería Oriental',
    rating: 4.5,
    reviewsCount: 89,
    sector: 'Carretera Mella',
    deliveryCoverage: ['Lucerna', 'San Isidro', 'Alma Rosa I', 'El Almirante'],
    isVerified: true,
  },
  {
    id: 'store-3',
    name: 'Ferretería Express Ozama',
    rating: 4.2,
    reviewsCount: 34,
    sector: 'Ensanche Ozama',
    deliveryCoverage: ['Ensanche Ozama', 'Alma Rosa I'],
    isVerified: false,
  }
];