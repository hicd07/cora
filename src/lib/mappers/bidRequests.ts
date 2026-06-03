import { BidRequest, QuoteItem, HardwareStore } from "@/lib/types";

export const mapBidRequestRow = (row: any, items: any[] = []): BidRequest => ({
  id: row.id,
  title: row.title,
  category: row.category,
  sector: row.sector,
  deliveryAddress: row.delivery_address,
  lat: row.lat,
  lng: row.lng,
  radiusKm: row.radius_km || 5,
  status: row.status,
  state: row.state,
  budgetLimit: row.budget_limit,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  bidsCount: row.bids_count || 0,
  ownerUserId: row.owner_user_id,
  items: items.map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit
  })),
  itemsCount: items.length
});

export const mapHardwareStoreRow = (row: any): HardwareStore => ({
  id: row.id,
  name: row.name || row.store_name,
  sector: row.sector,
  address: row.address,
  lat: row.lat,
  lng: row.lng,
  isVerified: !!row.id,
  rating: Number(row.rating) || 0,
  reviewsCount: row.reviews_count || 0,
  deliveryCoverage: row.delivery_coverage || [],
  phone: row.phone || row.phone_e164,
  website: row.website,
  coverUrl: row.cover_url
});