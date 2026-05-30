import { BidRequest, HardwareBid, HardwareStore, QuoteItem } from "@/lib/types";

interface BidRequestRow {
  id: string;
  owner_user_id?: string | null;
  title: string;
  category: string;
  delivery_address: string;
  sector: string;
  status: string;
  state?: string | null;
  lat?: number | null;
  lng?: number | null;
  radius_km?: number | null;
  budget_limit?: number | null;
  created_at: string;
  expires_at: string;
  bids_count?: number | null;
}

interface BidRequestItemRow {
  id: string;
  request_id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface HardwareBidRow {
  id: string;
  request_id: string;
  bidder_user_id?: string | null;
  store_name: string;
  rating?: number | null;
  delivery_time: string;
  created_at: string;
}

interface BidOfferRow {
  id: string;
  bid_id: string;
  item_name: string;
  unit_price: number;
  is_available: boolean | null;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  store_name: string | null;
  sector: string | null;
  delivery_coverage: string[] | null;
  rating: number | null;
  reviews_count: number | null;
  is_public: boolean;
  cover_url?: string | null;
}

export const mapRequestItemRow = (row: BidRequestItemRow): QuoteItem => ({
  id: row.id,
  name: row.name,
  quantity: Number(row.quantity),
  unit: row.unit,
});

export const mapBidRequestRow = (row: BidRequestRow, allItems: BidRequestItemRow[]): BidRequest => {
  const items = allItems.filter((item) => item.request_id === row.id).map(mapRequestItemRow);

  return {
    id: row.id,
    ownerUserId: row.owner_user_id ?? null,
    title: row.title,
    category: row.category,
    deliveryAddress: row.delivery_address,
    sector: row.sector,
    status: row.status as BidRequest["status"],
    state: (row.state as BidRequest["state"]) || "DRAFT",
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    radiusKm: row.radius_km ?? 5,
    items,
    itemsCount: items.length,
    budgetLimit: row.budget_limit ?? null,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    bidsCount: row.bids_count ?? 0,
  };
};

export const mapHardwareBidRow = (row: HardwareBidRow, allOffers: BidOfferRow[]): HardwareBid => ({
  id: row.id,
  requestId: row.request_id,
  bidderUserId: row.bidder_user_id ?? null,
  storeId: row.bidder_user_id ?? row.id,
  storeName: row.store_name,
  rating: row.rating ?? null,
  deliveryTime: row.delivery_time,
  createdAt: row.created_at,
  offers: allOffers
    .filter((offer) => offer.bid_id === row.id)
    .map((offer) => ({
      id: offer.id,
      itemName: offer.item_name,
      unitPrice: Number(offer.unit_price),
      isAvailable: offer.is_available ?? true,
    })),
});

export const mapHardwareStoreRow = (row: ProfileRow): HardwareStore => ({
  id: row.id,
  name: row.store_name || row.full_name || "Ferretería sin nombre",
  rating: row.rating && row.rating > 0 ? Number(row.rating) : null,
  reviewsCount: row.reviews_count && row.reviews_count > 0 ? row.reviews_count : 0,
  sector: row.sector,
  deliveryCoverage: row.delivery_coverage ?? [],
  isVerified: row.is_public,
  coverUrl: row.cover_url,
});