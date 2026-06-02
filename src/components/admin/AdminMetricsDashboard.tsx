"use client";

import React from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, MapPin, TrendingUp } from "lucide-react";

const USER_TYPE_DATA = [
  { name: "Ingenieros", value: 45, color: "hsl(var(--primary))" },
  { name: "Ferreterías", value: 32, color: "hsl(var(--accent))" },
];

const STATUS_DATA = [
  { name: "Activos", value: 12 },
  { name: "Completados", value: 28 },
  { name: "Borradores", value: 8 },
];

const PROVINCE_DATA = [
  { name: "SDE", pedidos: 42 },
  { name: "DN", pedidos: 35 },
  { name: "SDN", pedidos: 18 },
  { name: "B. Chica", pedidos: 12 },
];

export const AdminMetricsDashboard = () => {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-none bg-primary/10 shadow-none rounded-[1.5rem]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Pedidos</span>
            </div>
            <p className="text-2xl font-bold text-primary">154</p>
            <p className="text-[10px] text-primary/60 mt-1">+12% vs mes ant.</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-accent/10 shadow-none rounded-[1.5rem]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-accent-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent-foreground/70">Usuarios</span>
            </div>
            <p className="text-2xl font-bold text-accent-foreground">77</p>
            <p className="text-[10px] text-accent-foreground/60 mt-1">98% tasa retención</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md rounded-[2rem] overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Distribución por Estado
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={STATUS_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }} 
                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <Card className="border-none shadow-md rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Pedidos por Localidad
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PROVINCE_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="pedidos" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Tipos de Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={USER_TYPE_DATA}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {USER_TYPE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMetricsDashboard;