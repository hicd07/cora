"use client";

import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminActiveBids, useAdminNearbyStores } from "@/hooks/useAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Store, Plus, ExternalLink, Search } from "lucide-react";
import { AdminManualBidModal } from "@/components/admin/AdminManualBidModal";
import { BidRequest } from "@/lib/types";

export default function AdminAuctions() {
  const { data: bids = [], isLoading } = useAdminActiveBids();
  const [selectedBid, setSelectedBid] = useState<BidRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultStoreName, setDefaultStoreName] = useState("");

  const handleAddBid = (bid: BidRequest, storeName: string = "") => {
    setSelectedBid(bid);
    setDefaultStoreName(storeName);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout title="Gestión de Subastas">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subastas Activas</h2>
          <p className="text-muted-foreground">
            Monitorea y gestiona manualmente las cotizaciones externas para los ingenieros.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : bids.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No hay subastas activas</h3>
            <p className="text-muted-foreground">Cuando un ingeniero cree una subasta, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bids.map((bid) => (
              <BidCard key={bid.id} bid={bid} onAddBid={handleAddBid} />
            ))}
          </div>
        )}
      </div>

      {selectedBid && (
        <AdminManualBidModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          bidRequest={selectedBid}
          defaultStoreName={defaultStoreName}
        />
      )}
    </AdminLayout>
  );
}

function BidCard({ bid, onAddBid }: { bid: BidRequest; onAddBid: (bid: BidRequest, storeName?: string) => void }) {
  const { data: nearbyStores = [], isLoading: isLoadingStores } = useAdminNearbyStores(bid.lat || null, bid.lng || null);

  const googleMapsUrl = bid.lat && bid.lng 
    ? `https://www.google.com/maps/search/?api=1&query=${bid.lat},${bid.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bid.sector + " " + bid.deliveryAddress)}`;

  return (
    <Card className="overflow-hidden border-border/50 hover:border-primary/20 transition-all shadow-sm">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{bid.title}</CardTitle>
            <a 
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary hover:underline transition-colors w-fit"
              title="Abrir en Google Maps"
            >
              <MapPin className="h-3 w-3" />
              {bid.sector} • Radio: {bid.radiusKm} km
            </a>
          </div>
          <Badge>{bid.state}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Materiales</h4>
          <div className="flex flex-wrap gap-2">
            {bid.items.map((item, i) => (
              <Badge key={i} variant="outline" className="bg-background font-normal">
                {item.quantity} {item.unit} {item.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ferreterías Cercanas</h4>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => onAddBid(bid)}>
              <Plus className="h-3 w-3" /> Agregar otra
            </Button>
          </div>
          
          {isLoadingStores ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : nearbyStores.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No se encontraron tiendas en la caché para esta ubicación.</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {nearbyStores.map((store) => (
                <div key={store.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/50 text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Store className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate font-medium">{store.name}</span>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onAddBid(bid, store.name)}>
                    Cotizar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Creada: {new Date(bid.createdAt).toLocaleDateString()}
          </div>
          <Button size="sm" variant="secondary" asChild className="h-8 gap-1.5">
            <a href={`/quote/${bid.id}/live`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3 w-3" /> Ver en vivo
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}