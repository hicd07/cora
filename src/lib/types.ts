export interface QuoteItem {
  id?: string;
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
  status: "active" | "completed";
  budgetLimit: number | null;
  createdAt: string;
  expiresAt: string;
  bidsCount: number;
  ownerUserId: string | null;
  state: string;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  items: QuoteItem[];
  itemsCount: number;
}

export interface HardwareBid {
  id: string;
  requestId: string;
  storeId: string;
  storeName: string;
  rating: number;
  deliveryTime: string;
  createdAt: string;
  bidderUserId: string | null;
  offers: {
    itemName: string;
    unitPrice: number;
    isAvailable: boolean;
  }[];
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
  metadata: any; // Se añade el campo metadata solicitado
  createdAt: string;
  readAt: string | null;
}

export interface AppProfile {
  id: string;
  full_name: string | null;
  document_id: string | null;
  user_type: "engineer" | "hardware" | null;
  onboarded: boolean;
  store_name: string | null;
  sector: string | null;
  delivery_coverage: string[];
  is_public: boolean;
  rating: number | null;
  reviews_count: number;
  cover_url: string | null;
}

export interface HardwareStore {
  id: string;
  name: string;
  sector: string | null;
  rating: number | null;
  reviewsCount: number;
  isVerified: boolean;
  deliveryCoverage: string[];
  coverUrl: string | null;
}