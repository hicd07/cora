import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, MapPin, Store, Bot, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequestBids } from "@/hooks/useRequestBids";
import { useWaConversations } from "@/hooks/useWaConversations";
import { mapBidRequestRow } from "@/lib/mappers/bidRequests";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ConversationDrawer } from "@/components/ferreteria/ConversationDrawer";
import { HardwareBid } from "@/lib/types";

const fetchBidRequest = async (id: string) => {
  const { data: request, error } = await supabase
    .from("bid_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  const { data: items, error: itemsError } = await supabase
    .from("bid_request_items")
    .select("*")
    .eq("request_id", id);

  if (itemsError) throw itemsError;

  return mapBidRequestRow(request, items ?? []);
};

export default function LiveQuote() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeConversation, setActiveConversation] = useState<{ id: string; storeName: string } | null>(null);

  const { data: request, isLoading: isLoadingRequest } = useQuery({
    queryKey: ["bid-request", id],
    queryFn: () => fetchBidRequest(id as string),
    enabled: Boolean(id),
  });

  const { data: realBids = [], isLoading: isLoadingBids } = useRequestBids(id);
  const { data: realConversations = [], isLoading: isLoadingConversations } = useWaConversations(id);

  // Inject mock WhatsApp bids if the ID matches the requested one
  const bids = useMemo(() => {
    if (id === "ecbaceee-cb21-4b12-a40d-e7947bebb6e6" && request) {
      const mockBids: HardwareBid[] = [
        {
          id: "mock-wa-bid-1",
          requestId: id,
          storeId: "mock-wa-store-1",
          storeName: "Ferretería El Lápiz (WhatsApp)",
          rating: 4.5,
          deliveryTime: "Mismo día (3-5 horas)",
          createdAt: new Date().toISOString(),
          offers: request.items.map((item, idx) => ({
            id: `mock-offer-1-${idx}`,
            itemName: item.name,
            unitPrice: Math.round((350 + Math.random() * 150) * 100) / 100,
            isAvailable: true,
          })),
        },
        {
          id: "mock-wa-bid-2",
          requestId: id,
          storeId: "mock-wa-store-2",
          storeName: "Materiales SDE (WhatsApp)",
          rating: 4.2,
          deliveryTime: "Siguiente día (24 horas)",
          createdAt: new Date().toISOString(),
          offers: request.items.map((item, idx) => ({
            id: `mock-offer-2-${idx}`,
            itemName: item.name,
            unitPrice: Math.round((320 + Math.random() * 120) * 100) / 100,
            isAvailable: idx !== 1, // Simulate one item out of stock
          })),
        },
        {
          id: "mock-wa-bid-3",
          requestId: id,
          storeId: "mock-wa-store-3",
          storeName: "Ferretería Hermanos Díaz (WhatsApp)",
          rating: 4.7,
          deliveryTime: "Inmediato (1-2 horas)",
          createdAt: new Date().toISOString(),
          offers: request.items.map((item, idx) => ({
            id: `mock-offer-3-${idx}`,
            itemName: item.name,
            unitPrice: Math.round((380 + Math.random() * 180) * 100) / 100,
            isAvailable: true,
          })),
        },
      ];
      return [...realBids, ...mockBids];
    }
    return realBids;
  }, [id, realBids, request]);

  // Inject mock WhatsApp conversations if the ID matches
  const conversations = useMemo(() => {
    if (id === "ecbaceee-cb21-4b12-a40d-e7947bebb6e6") {
      const mockConversations = [
        {
          id: "mock-conv-1",
          state: "REPLIED",
          wa_phone_number: "+18095550101",
          updated_at: new Date().toISOString(),
          external_stores: {
            name: "Ferretería El Lápiz (WhatsApp)",
            address: "Av. Sabana Larga #42, SDE",
          },
        },
        {
          id: "mock-conv-2",
          state: "ACTIVE", // Escalated to human
          wa_phone_number: "+18095550102",
          updated_at: new Date().toISOString(),
          external_stores: {
            name: "Materiales SDE (WhatsApp)",
            address: "Carretera Mella Km 7, SDE",
          },
        },
        {
          id: "mock-conv-3",
          state: "REPLIED",
          wa_phone_number: "+18095550103",
          updated_at: new Date().toISOString(),
          external_stores: {
            name: "Ferretería Hermanos Díaz (WhatsApp)",
            address: "Calle Club de Leones #15, SDE",
          },
        },
      ];
      return [...realConversations, ...mockConversations];
    }
    return realConversations;
  }, [id, realConversations]);

  // Separate bids by channel
  const portalBids = bids.filter((bid) => bid.bidderUserId);
  const aiBids = bids.filter((bid) => !bid.bidderUserId);

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
                <MapPin className="h-3 w-3" /> {request.sector} • Radio: {request.radiusKm} km
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              En vivo
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
                {request.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <span>{item.name}</span>
                    <span className="font-medium">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-muted p-5">
              <h2 className="font-semibold text-sm mb-4">Conversaciones Externas (WhatsApp)</h2>
              {isLoadingConversations ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No hay conversaciones activas.</p>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setActiveConversation({ id: conv.id, storeName: conv.external_stores?.name || conv.wa_phone_number })}
                    >
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">
                          {conv.external_stores?.name || conv.wa_phone_number}
                        </p>
                        <p className={`text-xs mt-0.5 flex items-center gap-1 ${conv.state === 'ACTIVE' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          <MessageCircle className="h-3 w-3" />
                          {conv.state === 'ACTIVE' ? 'Requiere Atención (Humano)' : conv.state}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                        {conv.state === 'ACTIVE' && <div className="h-2 w-2 rounded-full bg-destructive absolute top-2 right-2 animate-pulse" />}
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            {isLoadingBids ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            ) : bids.length === 0 ? (
              <div className="panel-muted p-8 text-center flex flex-col items-center justify-center">
                <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <h3 className="font-medium text-foreground">Esperando respuestas</h3>
                <p className="text-sm text-muted-foreground mt-1">Las cotizaciones aparecerán aquí en tiempo real.</p>
              </div>
            ) : (
              <>
                {/* Section 1: Verified Providers (Portal) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      <h2 className="font-display font-bold text-base text-foreground">
                        Proveedores Verificados (Portal)
                      </h2>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      {portalBids.length} {portalBids.length === 1 ? "oferta" : "ofertas"}
                    </Badge>
                  </div>

                  {portalBids.length === 0 ? (
                    <div className="panel-muted p-6 text-center text-sm text-muted-foreground">
                      Aún no se han recibido ofertas de proveedores registrados en el portal.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {portalBids.map((bid) => {
                        const total = bid.offers.reduce((acc, offer) => acc + offer.unitPrice * (request.items.find(i => i.name === offer.itemName)?.quantity || 1), 0);
                        return (
                          <div key={bid.id} className="panel-strong p-5 border-emerald-500/10 bg-emerald-500/[0.01] animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                  <Store className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{bid.storeName}</p>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" /> {bid.deliveryTime}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                Portal
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 mt-4">
                              {bid.offers.slice(0, 3).map((offer, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground truncate mr-2">{offer.itemName}</span>
                                  <span className="font-medium whitespace-nowrap">RD$ {offer.unitPrice.toLocaleString()}</span>
                                </div>
                              ))}
                              {bid.offers.length > 3 && (
                                <p className="text-xs text-muted-foreground mt-2 text-center border-t pt-2">
                                  +{bid.offers.length - 3} artículos más
                                </p>
                              )}
                            </div>
                            
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total</span>
                              <span className="font-display font-semibold text-lg text-primary">RD$ {total.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section 2: WhatsApp AI Bids */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      <h2 className="font-display font-bold text-base text-foreground">
                        Ofertas vía WhatsApp (IA)
                      </h2>
                    </div>
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                      {aiBids.length} {aiBids.length === 1 ? "oferta" : "ofertas"}
                    </Badge>
                  </div>

                  {aiBids.length === 0 ? (
                    <div className="panel-muted p-6 text-center text-sm text-muted-foreground">
                      Aún no se han recibido ofertas estructuradas por WhatsApp.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiBids.map((bid) => {
                        const total = bid.offers.reduce((acc, offer) => acc + offer.unitPrice * (request.items.find(i => i.name === offer.itemName)?.quantity || 1), 0);
                        return (
                          <div key={bid.id} className="panel-strong p-5 border-purple-500/10 bg-purple-500/[0.01] animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                                  <Bot className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{bid.storeName}</p>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" /> {bid.deliveryTime}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                WhatsApp IA
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 mt-4">
                              {bid.offers.slice(0, 3).map((offer, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground truncate mr-2">{offer.itemName}</span>
                                  <span className="font-medium whitespace-nowrap">
                                    {offer.isAvailable ? `RD$ ${offer.unitPrice.toLocaleString()}` : "No disponible"}
                                  </span>
                                </div>
                              ))}
                              {bid.offers.length > 3 && (
                                <p className="text-xs text-muted-foreground mt-2 text-center border-t pt-2">
                                  +{bid.offers.length - 3} artículos más
                                </p>
                              )}
                            </div>
                            
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total</span>
                              <span className="font-display font-semibold text-lg text-primary">RD$ {total.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <ConversationDrawer
        conversationId={activeConversation?.id || null}
        storeName={activeConversation?.storeName || ""}
        onClose={() => setActiveConversation(null)}
      />
    </div>
  );
}