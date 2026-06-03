// Separate bids by channel
/* Section 1: Verified Providers (Portal) */
/* Section 2: Unverified Providers (Manual) */
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, MapPin, Store, Bot, ShieldCheck, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequestBids } from "@/hooks/useRequestBids";
import { mapBidRequestRow } from "@/lib/mappers/bidRequests";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const fetchBidRequest = async (id: string) => {
    const {
        data: request,
        error
    } = await supabase.from("bid_requests").select("*").eq("id", id).single();

    if (error)
        throw error;

    const {
        data: items,
        error: itemsError
    } = await supabase.from("bid_request_items").select("*").eq("request_id", id);

    if (itemsError)
        throw itemsError;

    return mapBidRequestRow(request, items ?? []);
};

export default function LiveQuote() {
    const {
        id
    } = useParams<{
        id: string;
    }>();

    const navigate = useNavigate();

    const {
        data: request,
        isLoading: isLoadingRequest
    } = useQuery({
        queryKey: ["bid-request", id],
        queryFn: () => fetchBidRequest(id as string),
        enabled: Boolean(id)
    });

    const {
        data: bids = [],
        isLoading: isLoadingBids
    } = useRequestBids(id);

    const portalBids = bids.filter(bid => bid.bidderUserId);
    const manualBids = bids.filter(bid => !bid.bidderUserId);

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

    return (
        <div className="min-h-screen bg-background pb-20">
            <header
                className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="-ml-2">
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
                                <MapPin className="h-3 w-3" /> {request.sector}• Radio: {request.radiusKm}km
                                              </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span
                                    className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>En vivo
                                        </Badge>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-6 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 space-y-4">
                        <div className="panel-muted p-5 sticky top-24">
                            <h2 className="font-semibold text-sm mb-4">Materiales Solicitados</h2>
                            <div className="space-y-3">
                                {request.items.map((item, idx) => (<div
                                    key={idx}
                                    className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                    <span>{item.name}</span>
                                    <span className="font-medium">{item.quantity} {item.unit}</span>
                                </div>))}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-8 space-y-8">
                        {isLoadingBids ? (<div className="space-y-4">
                            {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                        </div>) : bids.length === 0 ? (<div
                            className="panel-muted p-8 text-center flex flex-col items-center justify-center">
                            <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
                            <h3 className="font-medium text-foreground">Esperando respuestas</h3>
                            <p className="text-sm text-muted-foreground mt-1">Las cotizaciones aparecerán aquí en tiempo real.</p>
                        </div>) : (<>
                            {}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                        <h2 className="font-display font-bold text-base text-foreground">Proveedores Verificados (Portal)
                                                                  </h2>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                        {portalBids.length} {portalBids.length === 1 ? "oferta" : "ofertas"}
                                    </Badge>
                                </div>
                                {portalBids.length === 0 ? (<div className="panel-muted p-6 text-center text-sm text-muted-foreground">Aún no se han recibido ofertas de proveedores registrados en el portal.
                                                        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {portalBids.map(bid => {
                                        const total = bid.offers.reduce(
                                            (acc, offer) => acc + offer.unitPrice * (request.items.find(i => i.name === offer.itemName)?.quantity || 1),
                                            0
                                        );

                                        return (
                                            <div
                                                key={bid.id}
                                                className="panel-strong p-5 border-emerald-500/10 bg-emerald-500/[0.01] animate-in fade-in zoom-in-95 duration-300">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                            <Store className="h-4 w-4 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{bid.storeName}</p>
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <Clock className="h-3 w-3" /> {bid.deliveryTime}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Verificado</Badge>
                                                </div>
                                                <div className="space-y-2 mt-4">
                                                    {bid.offers.slice(0, 3).map((offer, idx) => (<div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground truncate mr-2">{offer.itemName}</span>
                                                        <span className="font-medium whitespace-nowrap">RD$ {offer.unitPrice.toLocaleString()}</span>
                                                    </div>))}
                                                    {bid.offers.length > 3 && (<p className="text-xs text-muted-foreground mt-2 text-center border-t pt-2">+{bid.offers.length - 3}artículos más
                                                                                        </p>)}
                                                </div>
                                                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                                    <span
                                                        className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total</span>
                                                    <span className="font-display font-semibold text-lg text-primary">RD$ {total.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>)}
                            </div>
                            {}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <div className="flex items-center gap-2">
                                        <Search className="h-5 w-5 text-blue-500" />
                                        <h2 className="font-display font-bold text-base text-foreground">Proveedores no verificados
                                                                  </h2>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                        {manualBids.length} {manualBids.length === 1 ? "oferta" : "ofertas"}
                                    </Badge>
                                </div>
                                {manualBids.length === 0 ? (<div
                                    className="panel-muted p-8 text-center flex flex-col items-center justify-center border-dashed">
                                    <Search className="h-8 w-8 text-blue-500/50 mb-3 animate-pulse" />
                                    <h3 className="font-medium text-foreground">🔎 Buscando proveedores...</h3>
                                    <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">Nuestro equipo está contactando ferreterías en la zona para conseguirte las mejores ofertas.
                                                              </p>
                                </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {manualBids.map(bid => {
                                        const total = bid.offers.reduce(
                                            (acc, offer) => acc + offer.unitPrice * (request.items.find(i => i.name === offer.itemName)?.quantity || 1),
                                            0
                                        );

                                        return (
                                            <div
                                                key={bid.id}
                                                className="panel-strong p-5 border-blue-500/10 bg-blue-500/[0.01] animate-in fade-in zoom-in-95 duration-300">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                            <Bot className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{bid.storeName}</p>
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <Clock className="h-3 w-3" /> {bid.deliveryTime}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-blue-500/10 text-blue-600 border-blue-500/20">Externo
                                                                                      </Badge>
                                                </div>
                                                <div className="space-y-2 mt-4">
                                                    {bid.offers.slice(0, 3).map((offer, idx) => (<div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground truncate mr-2">{offer.itemName}</span>
                                                        <span className="font-medium whitespace-nowrap">
                                                            {offer.isAvailable ? `RD$ ${offer.unitPrice.toLocaleString()}` : "No disponible"}
                                                        </span>
                                                    </div>))}
                                                    {bid.offers.length > 3 && (<p className="text-xs text-muted-foreground mt-2 text-center border-t pt-2">+{bid.offers.length - 3}artículos más
                                                                                        </p>)}
                                                </div>
                                                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                                    <span
                                                        className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total</span>
                                                    <span className="font-display font-semibold text-lg text-primary">RD$ {total.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>)}
                            </div>
                        </>)}
                    </div>
                </div>
            </main>
        </div>
    );
}