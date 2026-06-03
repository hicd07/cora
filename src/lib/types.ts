export type UserType = "engineer" | "hardware";

export interface QuoteItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface BidRequest {
  id: string;
  title: string;
  category: string;
  deliveryAddress: string;
  sector: string;
  status: string;
  budgetLimit: number | null;
  createdAt: string;
  expiresAt: string;
  bidsCount: number;
  ownerUserId: string;
  state: string;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  isTest: boolean;
  items: QuoteItem[];
  itemsCount: number;
}

export interface BidOffer {
  id?: string;
  itemName: string;
  unitPrice: number;
  isAvailable: boolean;
}

export interface AppBid {
  id: string;
  requestId: string;
  storeId: string;
  storeName: string;
  rating: number;
  deliveryTime: string;
  shippingCost: number;
  bidderUserId: string | null;
  address: string | null;
  sector?: string | null; // Nuevo campo para visualización rápida
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  createdAt: string;
  offers: BidOffer[];
  profile?: {
    sector: string | null;
    store_name: string | null;
    cover_url: string | null;
    delivery_coverage: string[];
    address?: string | null;
  } | null;
}

export interface AppProfile {
  id: string;
  full_name: string | null;
  document_id: string | null;
  user_type: UserType | null;
  onboarded: boolean;
  store_name: string | null;
  sector: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  delivery_coverage: string[];
  is_public: boolean;
  rating: number | null;
  reviews_count: number;
  cover_url: string | null;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  entityType: string | null;
  entityId: string | null;
  metadata: any;
  createdAt: string;
  readAt: string | null;
}

export interface HardwareStore {
  id: string;
  name: string;
  sector: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  isVerified: boolean;
  rating: number;
  reviewsCount: number;
  deliveryCoverage: string[];
  phone: string | null;
  website: string | null;
  coverUrl: string | null;
}