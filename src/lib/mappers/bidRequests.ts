import { BidRequest, QuoteItem } from "../types";

export const mapBidRequestRow = (row: any, items: any[]): BidRequest => {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    sector: row.sector,
    deliveryAddress: row.delivery_address,
    status: row.status,
    state: row.state,
    budgetLimit: row.budget_limit,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    bidsCount: row.bids_count || 0,
    lat: row.lat,
    lng: row.lng,
    radiusKm: row.radius_km || 5,
    itemsCount: items.length,
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit
    }))
  };
};