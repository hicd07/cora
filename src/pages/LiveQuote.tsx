"use client";

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, MapPin, Store, Bot, ShieldCheck, Search, Truck, Phone, ExternalLink, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequestBids } from "@/hooks/useRequestBids";
import { useAdminNearbyStores } from "@/hooks/useAdmin";
import { mapBidRequestRow } from "@/lib/mappers/bidRequests";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StoreDetailModal } from "@/components/ferreteria/StoreDetailModal";
import { AdminManualBidModal } from "@/components/admin/AdminManualBidModal";
import { useSessionContext } from "@/components/auth/SessionContext";
import { HardwareStore } from "@/lib/types";

const fetchBidRequest = async (id: string) => {
    const { data: request, error } = await supabase.from("bid_requests").select("*").eq("id", id).single();
    if (error) throw error;
    const { data: items, error: itemsError } = await supabase.from("bid_request_items").select("*").eq("request_id", id);
    if (itemsError) throw itemsError;
    return mapBidRequestRow(request, items ?? []);
};

export default function LiveQuote() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAdmin } = useSessionContext();
    
    const [selectedStore, setSelectedStore] = useState<HardwareStore | null>(null);
    const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
    
    // Admin specific state
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedAdminStore, setSelectedAdminStore] = useState<any>(null);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

    const { data: request, isLoading: isLoadingRequest } = useQuery({
        queryKey: ["bid-request", id],
        queryFn: () => fetchBidRequest(id as string),
        enabled: Boolean(id)
    });

    const { data: bids = [], isLoading: isLoadingBids } = useRequestBids(id);

    const { data: nearbyStores = [], isLoading: isLoadingNearby } = useAdminNearbyStores(
        request?.lat || null,
        request?.lng || null,
        request?.radiusKm || 5,
        hasSearched
    );

    const portalBids = bids.filter(bid => bid.bidderUserId);
    const manualBids = bids.filter(bid => !bid.bidderUserId);

    const handleContactStore = (bid: any) => {
        const storeData: HardwareStore = {
            id: bid.id,
            name: bid.storeName,
            sector: bid.profile?.sector || bid.address || null,
            address: (bid.address && bid.address !== "Dirección no disponible") ? bid.address : (bid.profile?.address || null),
            lat: bid.lat,
            lng: bid.lng,
            isVerified: !!bid.bidderUserId,
            rating: bid.rating,
            reviewsCount: 0,
            deliveryCoverage: bid.profile?.deliveryCoverage || [],
            phone: bid.phone,
            website: bid.website,
            coverUrl: bid.profile?.coverUrl
        };
        setSelectedStore(storeData);
        setIsStoreModalOpen(true);
    };

    const handleOpenAdminManualBid = (store: any = null) => {
        setSelectedAdminStore(store);
        setIsAdminModalOpen(true);
    };

    if (isLoadingRequest) {
        return (
            <div className="container mx-auto p-6 space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    if (!request) {
        return (
            <div className="container mx-auto p-6">
                <p>No se encontró la cotización.</p>
            </div>
        );
    }

    const GoogleMapsLink = ({ bid }: { bid: any }) => {
        const address = (bid.address && bid.address !== "Dirección no disponible") ? bid.address : null;
        const storeLocationLabel = address || bid.profile?.sector || bid.sector;
        
        if (!storeLocationLabel) {
            return (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">Dirección no disponible</span>
                </div>
            );
        }

        let query = "";
        if (bid.lat && bid.lng) {
            query = `${bid.lat},${bid.lng}`;
        } else {
            query = encodeURIComponent(`${bid.storeName} ${storeLocationLabel}`);
        }
        
        return (
            <a 
                href={`https://www.google.com/maps/search/?api=1&query=${query}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline mt-0.5 group"
            >
                <MapPin className="h-3 w-3 text-primary/70 shrink-0" />
                <span className="truncate max-w-[180px]">{storeLocationLabel}</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </a>
        );
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-display font-semibold text-lg">{request.title}</h1>
                                <Badge variant={request.state === "DRAFT" ? "secondary" : "default"}>
                                    {request.state}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <MapPin className="h-3 w-3" /> {request.sector} • Radio: {request.radiusKm}km
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-2.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <span className="font-bold text-primary">{bids.length} Ofertas</span>
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-6 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 space-y-4">
                        <div className="panel-muted p-5 sticky top-24 space-y-6">
                            <div>
                                <h2 className="font-semibold text-sm mb-4">Materiales Solicitados</h2>
                                <div className="space-y-3">
                                    {request.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                            <span>{item.name}</span>
                                            <span className="font-medium">{item.quantity} {item.unit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="pt-6 border-t space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Herramientas Admin</h2>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-7 text-[10px] gap-1"
                                            onClick={() => handleOpenAdminManualBid()}
                                        >
                                            <Plus className="h-3 w-3" /> Manual
                                        </Button>
                                    </div>
                                    
                                    {!hasSearched ? (
                                        <Button 
                                            variant="outline" 
                                            className="w-full h-10 gap-2 text-xs border-primary/20 hover:bg-primary/5 text-primary"
                                            onClick={() => setHasSearched(true)}
                                            disabled={isLoadingNearby}
                                        >
                                            {isLoadingNearby ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                                            Buscar tiendas externas
                                        </Button>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-medium text-muted-foreground">Tiendas en la zona</p>
                                                {isLoadingNearby && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                                            </div>
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                                {nearbyStores.map((store: any) => (
                                                    <div key={store.id || store.place_id} className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/50 text-[10px]">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <Store className="h-3 w-3 text-primary shrink-0" />
                                                            <span className="truncate font-medium">{store.name}</span>
                                                        </div>
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            className="h-6 px-1.5 text-primary hover:bg-primary/10"
                                                            onClick={() => handleOpenAdminManualBid(store)}
                                                        >
                                                            Cotizar
                                                        </Button>
                                                    </div>
                                                ))}
                                                {nearbyStores.length === 0 && !isLoadingNearby && (
                                                    <p className="text-[10px] text-center text-muted-foreground italic py-2">No se encontraron tiendas.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-8">
                        {isLoadingBids ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                            </div>
                        ) : bids.length === 0 ? (
                            <div className="panel-muted p-8 text-center flex flex-col items-center justify-center">
                                <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
                                <h3 className="font-medium text-foreground">Esperando respuestas</h3>
                                <p className="text-sm text-muted-foreground mt-1">Las cotizaciones aparecerán aquí en tiempo real.</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                            <h2 className="font-display font-bold text-base text-foreground">Proveedores Verificados</h2>
                                        </div>
                                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                            {portalBids.length} {portalBids.length === 1 ? "oferta" : "ofertas"}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {portalBids.map(bid => {
                                            const subtotal = (bid.offers || []).reduce(
                                                (acc: number, offer: any) => acc + (Number(offer.unitPrice) || 0) * (request.items.find(i => i.name === offer.itemName)?.quantity || 0),
                                                0
                                            );
                                            const shipping = Number(bid.shippingCost) || 0;
                                            const total = subtotal + shipping;

                                            return (
                                                <div key={bid.id} className="panel-strong p-5 border-emerald-500/10 bg-emerald-500/[0.01] animate-in fade-in zoom-in-95 duration-300 flex flex-col">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                                <Store className="h-4 w-4 text-emerald-600" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-sm truncate">{bid.storeName}</p>
                                                                <GoogleMapsLink bid={bid} />
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0">Portal</Badge>
                                                    </div>
                                                    <div className="space-y-2 mt-4 flex-grow">
                                                        {(bid.offers || []).slice(0, 3).map((offer: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground truncate mr-2">{offer.itemName}</span>
                                                                <span className="font-medium">RD$ {(Number(offer.unitPrice) || 0).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                        <div className="flex flex-col pt-2 border-t mt-2">
                                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Envío</span>
                                                                <span className="font-medium">RD$ {shipping.toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1 bg-muted/30 p-1 px-2 rounded-lg w-fit">
                                                                <Clock className="h-2.5 w-2.5" /> Entrega: {bid.deliveryTime}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                                        <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total</span>
                                                        <span className="font-display font-semibold text-lg text-primary">RD$ {total.toLocaleString()}</span>
                                                    </div>
                                                    <Button onClick={() => handleContactStore(bid)} variant="outline" className="w-full mt-4 h-9 rounded-xl text-xs font-semibold gap-2">
                                                        <Phone className="h-3.5 w-3.5" /> Contactar proveedor
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <div className="flex items-center gap-2">
                                            <Search className="h-5 w-5 text-blue-500" />
                                            <h2 className="font-display font-bold text-base text-foreground">Proveedores Externos</h2>
                                        </div>
                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                            {manualBids.length} {manualBids.length === 1 ? "oferta" : "ofertas"}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {manualBids.map(bid => {
                                            const subtotal = (bid.offers || []).reduce(
                                                (acc: number, offer: any) => acc + (Number(offer.unitPrice) || 0) * (request.items.find(i => i.name === offer.itemName)?.quantity || 0),
                                                0
                                            );
                                            const shipping = Number(bid.shippingCost) || 0;
                                            const total = subtotal + shipping;

                                            return (
                                                <div key={bid.id} className="panel-strong p-5 border-blue-500/10 bg-blue-500/[0.01] animate-in fade-in zoom-in-95 duration-300 flex flex-col">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                                                <Bot className="h-4 w-4 text-blue-600" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-sm truncate">{bid.storeName}</p>
                                                                <GoogleMapsLink bid={bid} />
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 shrink-0">Externo</Badge>
                                                    </div>
                                                    <div className="space-y-2 mt-4 flex-grow">
                                                        {(bid.offers || []).slice(0, 3).map((offer: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground truncate mr-2">{offer.itemName}</span>
                                                                <span className="font-medium">
                                                                    {offer.isAvailable ? `RD$ ${(Number(offer.unitPrice) || 0).toLocaleString()}` : "N/D"}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        <div className="flex flex-col pt-2 border-t mt-2">
                                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Envío</span>
                                                                <span className="font-medium">RD$ {shipping.toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1 bg-muted/30 p-1 px-2 rounded-lg w-fit">
                                                                <Clock className="h-2.5 w-2.5" /> Entrega: {bid.deliveryTime}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                                        <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total</span>
                                                        <span className="font-display font-semibold text-lg text-primary">RD$ {total.toLocaleString()}</span>
                                                    </div>
                                                    <Button onClick={() => handleContactStore(bid)} variant="outline" className="w-full mt-4 h-9 rounded-xl text-xs font-semibold gap-2">
                                                        <Phone className="h-3.5 w-3.5" /> Contactar proveedor
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            <StoreDetailModal 
                isOpen={isStoreModalOpen} 
                onClose={() => setIsStoreModalOpen(false)} 
                store={selectedStore} 
            />

            {isAdmin && request && (
                <AdminManualBidModal
                    isOpen={isAdminModalOpen}
                    onClose={() => setIsAdminModalOpen(false)}
                    bidRequest={request}
                    selectedStore={selectedAdminStore}
                />
            )}
        </div>
    );
}