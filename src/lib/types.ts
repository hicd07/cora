export interface QuoteItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface BidRequest {
  id: string;
  ownerUserId?: string | null;
  title: string;
  category: string;
  deliveryAddress: string;
  sector: string;
  status: "active" | "closed" | "completed";
  items: QuoteItem[];
  itemsCount: number;
  budgetLimit?: number | null;
  createdAt: string;
  expiresAt: string;
  bidsCount: number;
}

export interface HardwareStore {
  id: string;
  name: string;
  rating: number | null;
  reviewsCount: number | null;
  sector: string | null;
  deliveryCoverage: string[];
  isVerified: boolean;
}

export interface ItemOffer {
  id?: string;
  itemName: string;
  unitPrice: number;
  isAvailable: boolean;
}

export interface HardwareBid {
  id: string;
  requestId: string;
  bidderUserId?: string | null;
  storeId: string;
  storeName: string;
  rating: number | null;
  deliveryTime: string;
  createdAt: string;
  offers: ItemOffer[];
}

export type NotificationType = "bid_created" | "bid_updated" | "order_completed";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  isRead: boolean;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
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
  reviews_count: number | null;
}
