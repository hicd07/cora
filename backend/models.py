from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base
import uuid

class BidRequest(Base):
    __tablename__ = "bid_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    delivery_address = Column(String, nullable=False)
    sector = Column(String, nullable=False)
    status = Column(String, nullable=False, default="active")
    budget_limit = Column(Numeric, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    bids_count = Column(Integer, default=0)

    items = relationship("BidRequestItem", back_populates="request", cascade="all, delete-orphan")
    bids = relationship("HardwareBid", back_populates="request", cascade="all, delete-orphan")


class BidRequestItem(Base):
    __tablename__ = "bid_request_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = Column(String, ForeignKey("bid_requests.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    quantity = Column(Numeric, nullable=False)
    unit = Column(String, nullable=False)

    request = relationship("BidRequest", back_populates="items")


class HardwareBid(Base):
    __tablename__ = "hardware_bids"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = Column(String, ForeignKey("bid_requests.id", ondelete="CASCADE"), nullable=False)
    store_name = Column(String, nullable=False)
    rating = Column(Numeric, default=5.0)
    delivery_time = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    request = relationship("BidRequest", back_populates="bids")
    offers = relationship("BidOffer", back_populates="bid", cascade="all, delete-orphan")


class BidOffer(Base):
    __tablename__ = "bid_offers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bid_id = Column(String, ForeignKey("hardware_bids.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String, nullable=False)
    unit_price = Column(Numeric, nullable=False)
    is_available = Column(Boolean, default=True)

    bid = relationship("HardwareBid", back_populates="offers")
