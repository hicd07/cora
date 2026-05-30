"use client";

import React, { useState } from "react";
import { Store, Globe, MapPin, Search, Star, ExternalLink } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminStores } from "@/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const AdminStores = () => {
  const { data: stores, isLoading } = useAdminStores();
  const [search, setSearch] = useState("");

  const filtered = (stores ?? []).filter(s => 
    (s.store_name || s.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.address || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Gestión de Ferreterías">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-background">
            Total: {stores?.length ?? 0}
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="app-shell p-5 group hover:border-primary/40 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    s.source === 'external' ? "bg-blue-500/10 text-blue-600" : "bg-emerald-500/10 text-emerald-600"
                  )}>
                    {s.source === 'external' ? <Globe className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base leading-tight">
                      {s.store_name || s.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-1.5 h-4">
                        {s.source === 'external' ? 'Google Places' : 'Portal CoRa'}
                      </Badge>
                      {s.rating && (
                        <div className="flex items-center gap-0.5 text-xs text-amber-500">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="font-bold">{s.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4 text-sm">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="line-clamp-2 leading-snug">{s.address || s.sector || "Ubicación no especificada"}</p>
                </div>
                {s.phone_e164 && (
                  <p className="text-xs font-mono bg-[hsl(var(--surface-2))] inline-block px-2 py-1 rounded-md">
                    {s.phone_e164}
                  </p>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border flex justify-end">
                <button className="text-xs font-semibold text-primary inline-flex items-center gap-1 hover:underline">
                  Ver detalles <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminStores;