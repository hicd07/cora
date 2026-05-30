import React, { useEffect, useRef, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ConversationDrawerProps {
  conversationId: string | null;
  storeName: string;
  onClose: () => void;
}

const EMPTY_ARRAY: any[] = [];

// Mock message histories for the 3 mock conversations
const MOCK_MESSAGES: Record<string, any[]> = {
  "mock-conv-1": [
    {
      id: "m1-1",
      direction: "outbound",
      content_type: "template",
      body: "Hola, un ingeniero en Alma Rosa I necesita cotizar materiales de construcción. ¿Tienes disponibilidad?",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "m1-2",
      direction: "inbound",
      content_type: "text",
      body: "Hola! Sí claro, tenemos cemento gris a RD$ 480 la funda y arena a RD$ 1,200 el metro.",
      created_at: new Date(Date.now() - 3600000 * 1.8).toISOString(),
    },
    {
      id: "m1-3",
      direction: "outbound",
      content_type: "text",
      body: "Excelente, ¿tienen entrega para hoy mismo?",
      created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    },
    {
      id: "m1-4",
      direction: "inbound",
      content_type: "text",
      body: "Sí, si confirmas antes de las 2 PM te lo enviamos hoy mismo sin costo adicional.",
      created_at: new Date(Date.now() - 3600000 * 1.4).toISOString(),
    }
  ],
  "mock-conv-2": [
    {
      id: "m2-1",
      direction: "outbound",
      content_type: "template",
      body: "Hola, un ingeniero en Alma Rosa I necesita cotizar materiales de construcción. ¿Tienes disponibilidad?",
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: "m2-2",
      direction: "inbound",
      content_type: "text",
      body: "Buenas, solo me queda cemento blanco. ¿Te sirve ese o necesitas gris obligatoriamente? Avísame para ver si te consigo con un colega.",
      created_at: new Date(Date.now() - 3600000 * 2.8).toISOString(),
    }
  ],
  "mock-conv-3": [
    {
      id: "m3-1",
      direction: "outbound",
      content_type: "template",
      body: "Hola, un ingeniero en Alma Rosa I necesita cotizar materiales de construcción. ¿Tienes disponibilidad?",
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: "m3-2",
      direction: "inbound",
      content_type: "text",
      body: "Saludos. Sí, tenemos disponibilidad de todo. Cemento a RD$ 495 y arena a RD$ 1,150. Despacho inmediato.",
      created_at: new Date(Date.now() - 3600000 * 3.8).toISOString(),
    }
  ]
};

export function ConversationDrawer({ conversationId, storeName, onClose }: ConversationDrawerProps) {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>(EMPTY_ARRAY);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isMock = conversationId?.startsWith("mock-");

  const { data: dbMessages = EMPTY_ARRAY, isLoading } = useQuery({
    queryKey: ["wa-messages", conversationId],
    queryFn: async () => {
      if (!conversationId || isMock) return EMPTY_ARRAY;
      const { data, error } = await supabase
        .from("wa_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || EMPTY_ARRAY;
    },
    enabled: Boolean(conversationId),
  });

  // Sync local messages with DB or Mock data
  useEffect(() => {
    if (conversationId) {
      if (isMock) {
        setLocalMessages(MOCK_MESSAGES[conversationId] || EMPTY_ARRAY);
      } else {
        setLocalMessages(dbMessages);
      }
    } else {
      setLocalMessages(EMPTY_ARRAY);
    }
  }, [conversationId, dbMessages, isMock]);

  // Suscribirse a mensajes nuevos reales
  useEffect(() => {
    if (!conversationId || isMock) return;

    const channel = supabase
      .channel(`wa_messages_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wa_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          queryClient.setQueryData(["wa-messages", conversationId], (old: any) => {
            return old ? [...old, payload.new] : [payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient, isMock]);

  // Auto-scroll al fondo
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!conversationId) return;
      
      if (isMock) {
        // Simulate mock reply delay
        return new Promise((resolve) => {
          setTimeout(() => {
            const userMsg = {
              id: `mock-user-${Date.now()}`,
              direction: "outbound",
              content_type: "text",
              body,
              created_at: new Date().toISOString()
            };
            setLocalMessages(prev => [...prev, userMsg]);
            resolve(true);
          }, 300);
        });
      }

      // Llamar al Edge Function wa-reply real
      const { data, error } = await supabase.functions.invoke("wa-reply", {
        body: { conversationId, body },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewMessage("");
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  return (
    <Drawer open={Boolean(conversationId)} onOpenChange={(o) => !o && onClose()} direction="right">
      <DrawerContent className="h-screen top-0 right-0 left-auto mt-0 w-full sm:w-[400px] rounded-none">
        <DrawerHeader className="border-b flex justify-between items-center px-4 py-3">
          <DrawerTitle className="text-lg">Chat con {storeName}</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30"
        >
          {isLoading ? (
            <div className="text-center text-muted-foreground text-sm mt-10">
              Cargando mensajes...
            </div>
          ) : localMessages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm mt-10">
              No hay mensajes aún.
            </div>
          ) : (
            localMessages.map((msg: any) => {
              const isOutbound = msg.direction === "outbound";
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      isOutbound 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-background border shadow-sm rounded-tl-sm"
                    }`}
                  >
                    {msg.content_type === "template" && (
                      <div className="flex items-center gap-1 mb-1 text-xs opacity-80">
                        <Bot className="h-3 w-3" /> IA
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                    <div className={`text-[10px] mt-1 text-right ${isOutbound ? "opacity-70" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Al enviar un mensaje, asumes el control manual del chat.
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}