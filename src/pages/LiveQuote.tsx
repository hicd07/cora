import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, MapPin, Store, Bot, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequestBids } from "@/hooks/useRequestBids";
import { useWaConversations } from "@/hooks/useWaConversations";
import { mapBidRequestRow } from "@/lib/mappers/bidRequests";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ConversationDrawer } from "@/components/ferreteria/ConversationDrawer";

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

  const { data: bids = [], isLoading: isLoadingBids } = useRequestBids(id);
  const { data: conversations = [], isLoading: isLoadingConversations } = useWaConversations(id);

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
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {conv.state}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Ofertas Recibidas ({bids.length})</h2>
            </div>
            
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bids.map((bid) => {
                  const total = bid.offers.reduce((acc, offer) => acc + offer.unitPrice * (request.items.find(i => i.name === offer.itemName)?.quantity || 1), 0);
                  // We simulate channel badge since it's not yet in the DB
                  const channel = Math.random() > 0.5 ? 'portal' : 'whatsapp_ai';
                  
                  return (
                    <div key={bid.id} className="panel p-5 animate-in fade-in zoom-in-95 duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Store className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{bid.storeName}</p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> {bid.deliveryTime}
                            </div>
                          </div>
                        </div>
                        {channel === 'whatsapp_ai' ? (
                          <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                            <Bot className="h-3 w-3 mr-1" /> IA
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                            <Store className="h-3 w-3 mr-1" /> Portal
                          </Badge>
                        )}
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
