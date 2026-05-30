"use client";

import React, { useState } from "react";
import { Gavel, Calendar, User, Package, Filter, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminQuotes } from "@/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const AdminQuotes = () => {
  const { data: quotes, isLoading } = useAdminQuotes();
  const [search, setSearch] = useState("");

  const filtered = (quotes ?? []).filter(q => 
    q.title.toLowerCase().includes(search.toLowerCase()) ||
    (q.owner?.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'DRAFT': return 'bg-slate-500/10 text-slate-600';
      case 'BROADCASTING': return 'bg-blue-500/10 text-blue-600';
      case 'AWAITING_RESPONSES': return 'bg-amber-500/10 text-amber-600';
      case 'CLOSED_WON': return 'bg-emerald-500/10 text-emerald-600';
      default: return 'bg-slate-500/10 text-slate-600';
    }
  };

  return (
    <AdminLayout title="Monitoreo de Cotizaciones">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Input
            placeholder="Buscar por título o ingeniero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-3 h-11"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-10 rounded-xl">
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <div key={q.id} className="app-shell p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className={cn("text-[10px] font-bold tracking-wider", getStatusColor(q.state))}>
                    {q.state}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(q.created_at), "dd MMM, yyyy", { locale: es })}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg leading-tight truncate">{q.title}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>{q.owner?.full_name || "Anónimo"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    <span>{q.items?.[0]?.count || 0} ítems</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Gavel className="h-3.5 w-3.5" />
                    <span className="font-semibold text-foreground">{q.bids_count || 0} ofertas</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0 md:ml-auto">
                <Button variant="outline" size="sm" className="h-9 rounded-xl">
                  Inspeccionar
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-muted-foreground">No se encontraron cotizaciones.</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminStores;