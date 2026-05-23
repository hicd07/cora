from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import engine, get_db

# Create database tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ferretería Bidding API",
    description="Backend en Python (FastAPI) para la plataforma de subastas de ferretería",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "¡Bienvenido a la API de Subastas de Ferretería!",
        "docs": "/docs"
    }

# --- BID REQUESTS ---

@app.get("/api/bid-requests", response_model=List[schemas.BidRequest])
def get_bid_requests(db: Session = Depends(get_db)):
    requests = db.query(models.BidRequest).order_by(models.BidRequest.created_at.desc()).all()
    return requests

@app.get("/api/bid-requests/{id}", response_model=schemas.BidRequest)
def get_bid_request(id: str, db: Session = Depends(get_db)):
    request = db.query(models.BidRequest).filter(models.BidRequest.id == id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Solicitud de cotización no encontrada")
    return request

@app.post("/api/bid-requests", response_model=schemas.BidRequest, status_code=status.HTTP_201_CREATED)
def create_bid_request(request_data: schemas.BidRequestCreate, db: Session = Depends(get_db)):
    # Create the main request
    db_request = models.BidRequest(
        title=request_data.title,
        category=request_data.category,
        delivery_address=request_data.delivery_address,
        sector=request_data.sector,
        budget_limit=request_data.budget_limit,
        expires_at=request_data.expires_at,
        status="active",
        bids_count=0
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)

    # Create the items
    for item in request_data.items:
        db_item = models.BidRequestItem(
            request_id=db_request.id,
            name=item.name,
            quantity=item.quantity,
            unit=item.unit
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_request)
    return db_request

@app.patch("/api/bid-requests/{id}/status", response_model=schemas.BidRequest)
def update_request_status(id: str, status_update: schemas.BidRequestUpdateStatus, db: Session = Depends(get_db)):
    db_request = db.query(models.BidRequest).filter(models.BidRequest.id == id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Solicitud de cotización no encontrada")
    
    db_request.status = status_update.status
    db.commit()
    db.refresh(db_request)
    return db_request

# --- BIDS ---

@app.post("/api/bid-requests/{id}/bids", response_model=schemas.HardwareBid, status_code=status.HTTP_201_CREATED)
def create_bid(id: str, bid_data: schemas.HardwareBidCreate, db: Session = Depends(get_db)):
    # Verify request exists
    db_request = db.query(models.BidRequest).filter(models.BidRequest.id == id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Solicitud de cotización no encontrada")
    
    # Create the bid
    db_bid = models.HardwareBid(
        request_id=id,
        store_name=bid_data.store_name,
        rating=bid_data.rating,
        delivery_time=bid_data.delivery_time
    )
    db.add(db_bid)
    db.commit()
    db.refresh(db_bid)

    # Create the offers
    for offer in bid_data.offers:
        db_offer = models.BidOffer(
            bid_id=db_bid.id,
            item_name=offer.item_name,
            unit_price=offer.unit_price,
            is_available=offer.is_available
        )
        db.add(db_offer)
    
    # Increment bids count on the request
    db_request.bids_count += 1
    
    db.commit()
    db.refresh(db_bid)
    return db_bid

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
