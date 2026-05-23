from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

# Item schemas
class BidRequestItemBase(BaseModel):
    name: str
    quantity: float
    unit: str

class BidRequestItemCreate(BidRequestItemBase):
    pass

class BidRequestItem(BidRequestItemBase):
    id: str
    request_id: str

    class Config:
        from_attributes = True


# Offer schemas
class BidOfferBase(BaseModel):
    item_name: str
    unit_price: float
    is_available: bool = True

class BidOfferCreate(BidOfferBase):
    pass

class BidOffer(BidOfferBase):
    id: str
    bid_id: str

    class Config:
        from_attributes = True


# Bid schemas
class HardwareBidBase(BaseModel):
    store_name: str
    rating: float = 5.0
    delivery_time: str

class HardwareBidCreate(HardwareBidBase):
    offers: List[BidOfferCreate]

class HardwareBid(HardwareBidBase):
    id: str
    request_id: str
    created_at: datetime
    offers: List[BidOffer] = []

    class Config:
        from_attributes = True


# Request schemas
class BidRequestBase(BaseModel):
    title: str
    category: str
    delivery_address: str
    sector: str
    budget_limit: Optional[float] = None
    expires_at: datetime

class BidRequestCreate(BidRequestBase):
    items: List[BidRequestItemCreate]

class BidRequestUpdateStatus(BaseModel):
    status: str

class BidRequest(BidRequestBase):
    id: str
    status: str
    created_at: datetime
    bids_count: int
    items: List[BidRequestItem] = []
    bids: List[HardwareBid] = []

    class Config:
        from_attributes = True
