import React, { useEffect, useRef, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ConversationDrawerProps {
  conversationId: string | null;
  storeName: string;
  onClose: () => void;
}

export function ConversationDrawer({ conversationId, storeName, onClose }: ConversationDrawerProps) {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["wa-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("wa_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: Boolean(conversationId),
  });

  // Suscribirse a mensajes nuevos
  useEffect(() => {
    if (!conversationId) return;

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
  }, [conversationId, queryClient]);

  // Auto-scroll al fondo
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!conversationId) return;
      
      // Llamar al Edge Function wa-reply
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
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm mt-10">
              No hay mensajes aún.
            </div>
          ) : (
            messages.map((msg: any) => {
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
