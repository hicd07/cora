import { LucideIcon } from "lucide-react";

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
  lat: number;
  lng: number;
  radiusKm: number;
  status: string;
  state: string;
  budgetLimit: number | null;
  createdAt: string;
  expiresAt: string;
  items: QuoteItem[];
  itemsCount: number;
  bidsCount: number;
  ownerUserId?: string;
  userBidId?: string | null;
}

export interface BidOffer {
  id?: string;
  bidId?: string;
  itemName: string;
  unitPrice: number;
  isAvailable: boolean;
}

export interface HardwareBid {
  id: string;
  requestId: string;
  storeName: string;
  storeId: string;
  bidderUserId?: string;
  rating: number;
  deliveryTime: string;
  shippingCost: number;
  createdAt: string;
  offers: BidOffer[];
  phone?: string;
  website?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: any;
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
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
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
  phone?: string;
  website?: string;
  coverUrl?: string | null;
}