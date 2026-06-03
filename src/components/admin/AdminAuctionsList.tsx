"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminActiveBids, useAdminNearbyStores } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Store, Plus, ExternalLink, Search, Loader2 } from "lucide-react";
import { AdminManualBidModal } from "@/components/admin/AdminManualBidModal";
import { BidRequest } from "@/lib/types";

export const AdminAuctionsList = () => {
  const { data: bids = [], isLoading } = useAdminActiveBids();
  const [selectedBid, setSelectedBid] = useState<BidRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultStoreName, setDefaultStoreName] = useState("");

  const handleAddBid = (bid: BidRequest, storeName: string = "") => {
    setSelectedBid(bid);
    setDefaultStoreName(storeName);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed">
        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-lg font-medium">No hay subastas activas</h3>
        <p className="text-sm text-muted-foreground mt-1">Las solicitudes nuevas aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {bids.map((bid) => (
        <BidCard key={bid.id} bid={bid} onAddBid={handleAddBid} />
      ))}

      {selectedBid && (
        <AdminManualBidModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          bidRequest={selectedBid}
          defaultStoreName={defaultStoreName}
        />
      )}
    </div>
  );
};

function BidCard({ bid, onAddBid }: { bid: BidRequest; onAddBid: (bid: BidRequest, storeName?: string) => void }) {
  const navigate = useNavigate();
  const [hasSearched, setHasSearched] = useState(false);
  
  const { data: nearbyStores = [], isLoading: isLoadingStores } = useAdminNearbyStores(
    bid.lat || null,
    bid.lng || null,
    bid.radiusKm || 5,
    hasSearched
  );

  const googleMapsUrl = bid.lat && bid.lng 
    ? `https://www.google.com/maps/search/?api=1&query=${bid.lat},${bid.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bid.sector + " " + bid.deliveryAddress)}`;

  return (
    <Card className="overflow-hidden border-border/50 hover:border-primary/20 transition-all shadow-sm rounded-[1.8rem]">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold">{bid.title}</CardTitle>
            <a 
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-primary transition-colors w-fit"
            >
              <MapPin className="h-3 w-3" />
              {bid.sector} • {bid.radiusKm} km
            </a>
          </div>
          <Badge className="rounded-full text-[10px]">{bid.state}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Materiales</h4>
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{bid.items.length} ítems</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {bid.items.map((item, i) => (
              <Badge key={i} variant="outline" className="bg-background font-normal text-[10px] rounded-lg">
                {item.quantity} {item.unit} {item.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ferreterías Cercanas</h4>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-[10px] gap-1 px-2 border-primary/30 text-primary hover:bg-primary/5 transition-all" 
                onClick={() => setHasSearched(true)}
                disabled={isLoadingStores}
              >
                {isLoadingStores ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Search className="h-3 w-3" />
                )}
                {isLoadingStores ? "Buscando..." : "Buscar en zona"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2" onClick={() => onAddBid(bid)}>
                <Plus className="h-3 w-3" /> Manual
              </Button>
            </div>
          </div>
          
          {hasSearched ? (
            isLoadingStores ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ) : nearbyStores.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic bg-muted/20 p-3 rounded-xl border border-dashed text-center">
                No se encontraron tiendas en esta área.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {nearbyStores.map((store) => (
                  <div key={store.id} className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/50 text-[11px] hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Store className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate font-medium">{store.name}</span>
                    </div>
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] rounded-lg" onClick={() => onAddBid(bid, store.name)}>
                      Cotizar
                    </Button>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="bg-muted/10 border border-dashed rounded-xl p-4 text-center">
              <p className="text-[11px] text-muted-foreground">Presiona "Buscar en zona" para ver tiendas locales.</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(bid.createdAt).toLocaleDateString()}
          </div>
          <Button 
            size="sm" 
            variant="secondary" 
            className="h-8 gap-1.5 text-[11px] rounded-xl hover:bg-primary hover:text-white transition-colors" 
            onClick={() => navigate(`/quote/${bid.id}/live`)}
          >
            <ExternalLink className="h-3 w-3" /> Ver Vivo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminAuctionsList;