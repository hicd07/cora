export interface BidRequest {
  id: string;
  title: string;
  category: string;
  deliveryAddress: string;
  sector: string; // e.g., Alma Rosa I, Ensanche Ozama
  status: 'active' | 'closed' | 'completed';
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
    title: '50 Fundas de Cemento Gris Portland',
    category: 'Cemento y Agregados',
    deliveryAddress: 'Calle Club de Leones #45, Alma Rosa I',
    sector: 'Alma Rosa I',
    status: 'active',
    itemsCount: 1,
    budgetLimit: 25000,
    createdAt: '2023-10-25T10:00:00Z',
    expiresAt: '2023-10-26T18:00:00Z',
    bidsCount: 3,
  },
  {
    id: 'req-2',
    title: 'Varillas de acero de 3/8 y Alambre de amarre',
    category: 'Metales y Estructuras',
    deliveryAddress: 'Av. San Vicente de Paul, Ensanche Ozama',
    sector: 'Ensanche Ozama',
    status: 'active',
    itemsCount: 4,
    budgetLimit: 45000,
    createdAt: '2023-10-25T11:30:00Z',
    expiresAt: '2023-10-27T12:00:00Z',
    bidsCount: 1,
  },
  {
    id: 'req-3',
    title: 'Tuberías PVC de 2 pulgadas y codos de presión',
    category: 'Plomería',
    deliveryAddress: 'Calle Costa Rica, Lucerna',
    sector: 'Lucerna',
    status: 'closed',
    itemsCount: 12,
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