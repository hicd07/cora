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
  sector: string;
  deliveryAddress: string;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  status: string;
  state: string;
  budgetLimit: number | null;
  createdAt: string;
  expiresAt: string;
  items: QuoteItem[];
  itemsCount: number;
  userBidId?: string | null;
}

export interface HardwareStore {
  id: string;
  name: string;
  sector: string | null;
  address: string | null;
  lat?: number | null;
  lng?: number | null;
  isVerified: boolean;
  rating: number;
  reviewsCount: number;
  deliveryCoverage: string[];
  phone?: string | null;
  website?: string | null;
  coverUrl?: string | null;
}

export interface AppProfile {
  id: string;
  full_name: string | null;
  document_id: string | null;
  user_type: "engineer" | "hardware" | null;
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
  entityType?: string;
  entityId?: string;
  metadata: Record<string, any>;
  createdAt: string;
}