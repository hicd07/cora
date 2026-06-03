export interface QuoteItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface BidOffer {
  id: string;
  bidId: string;
  itemName: string;
  unitPrice: number;
  isAvailable: boolean;
}

export interface BidRequest {
  id: string;
  title: string;
  category: string;
  deliveryAddress: string;
  sector: string;
  status: string;
  state: string;
  budgetLimit: number | null;
  createdAt: string;
  expiresAt: string;
  bidsCount: number;
  ownerUserId: string;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  items: QuoteItem[];
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
  isVerified: boolean;
  rating: number | null;
  reviewsCount: number;
  deliveryCoverage: string[];
  phone?: string | null;
  website?: string | null;
  coverUrl?: string | null;
}