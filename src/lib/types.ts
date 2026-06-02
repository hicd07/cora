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
  status: "active" | "completed" | "expired";
  state: "DRAFT" | "BROADCASTING" | "NEGOTIATING" | "CLOSED";
  budgetLimit: number | null;
  createdAt: string;
  expiresAt: string;
  bidsCount: number;
  ownerUserId: string;
  itemsCount: number;
  items: QuoteItem[];
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export interface HardwareBid {
  id: string;
  requestId: string;
  storeName: string;
  storeId: string;
  rating: number;
  deliveryTime: string;
  createdAt: string;
  bidderUserId?: string;
  offers: {
    itemName: string;
    unitPrice: number;
    isAvailable: boolean;
  }[];
}

export interface HardwareStore {
  id: string;
  name: string;
  sector: string | null;
  rating: number | null;
  reviewsCount: number;
  deliveryCoverage: string[];
  coverUrl: string | null;
  isVerified: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}