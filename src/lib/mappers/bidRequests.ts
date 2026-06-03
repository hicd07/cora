import { BidRequest, QuoteItem } from "../types";

export const mapBidRequestRow = (row: any, items: any[] = []): BidRequest => {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    deliveryAddress: row.delivery_address,
    sector: row.sector,
    status: row.status,
    state: row.state,
    budgetLimit: row.budget_limit ? Number(row.budget_limit) : null,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    bidsCount: row.bids_count || 0,
    ownerUserId: row.owner_user_id,
    lat: row.lat ? Number(row.lat) : null,
    lng: row.lng ? Number(row.lng) : null,
    radiusKm: row.radius_km || 5,
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: Number(item.quantity),
      unit: item.unit
    }))
  };
};