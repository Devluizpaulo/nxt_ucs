"use client"

import { useState } from "react";
import { 
  LayoutDashboard, 
  Search, 
  TrendingUp, 
  Database,
  FileText,
  ShieldCheck,
  Link as LinkIcon,
  AlertCircle,
  Clock,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderTable } from "@/components/dashboard/OrderTable";
import { AuditOverview } from "@/components/dashboard/AuditOverview";
import { AddOrderDialog } from "@/components/dashboard/AddOrderDialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { Pedido, Movimento } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Dashboard() {
  const firestore = useFirestore();
  
  const pedidosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "pedidos");
  }, [firestore]);

  const { data: pedidos, isLoading } = useCollection<Pedido>(pedidosQuery);

  const handleAddOrder = async (order: Omit<Pedido, 'createdAt'>) => {
    if (!firestore) return;
    const colRef = collection(firestore, "pedidos");
    addDoc(colRef, {
      ...order,
      createdAt: new Date().toISOString()
    });
  };

  const handleUpdateOrder = async (id: string, updates: Partial<Pedido>) => {
    if (!firestore) return;
    const docRef = doc(firestore, "pedidos", id);
    updateDoc(docRef, updates);
  };

  const handleDeleteOrder = async (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, "pedidos", id);
    deleteDoc(docRef);
  };

  const handleAddMovement = async (orderId: string, raw: string) => {
    if (!firestore) return;
    const lines = raw.split('\n').filter(l => l.trim());
    const movementsRef = collection(firestore, "pedidos", orderId, "movimentos");

    for (const line of lines) {
      const id = `MOV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      addDoc(movementsRef, {
        id,
        pedidoId: orderId,
        raw: line,
        hashMovimento: `NXT-${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
        tipo: 'outro',
        origem: 'Importação Manual',
        destino: 'Rede NXT',
        quantidade: 0,
        duplicado: false,
        validado: true,
        createdAt: new Date().toISOString()
      });
    }
  };

  const handleDeleteMovement = async (orderId: string, moveId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, "pedidos", orderId, "movimentos", moveId);
    deleteDoc(docRef);
  };

  const orders = pedidos || [];

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-screen bg-[#F8FAFC]">
        {/* Sidebar Lateral */}
        <aside className="w-20 bg-white border-r flex flex-col items-center py-8 gap-10 sticky top-0 h-screen">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
            <span className="text-primary font-black text-xs">BMV</span>
          </div>

          <nav className="flex flex-col gap-8">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-emerald-50 text-primary shadow-sm border border-emerald-100">
                  <LayoutDashboard className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-bold text-xs">Painel Geral</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl text-slate-400 hover:text-primary hover:bg-emerald-50 hover:border-emerald-100 transition-all">
                  <ShieldCheck className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-bold text-xs">Auditoria de Selos</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl text-slate-400 hover:text-primary hover:bg-emerald-50 hover:border-emerald-100 transition-all">
                  <Database className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-bold text-xs">NXT Blockchain</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl text-slate-400 hover:text-primary hover:bg-emerald-50 hover:border-emerald-100 transition-all">
                  <FileText className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-bold text-xs">Relatórios</p>
              </TooltipContent>
            </Tooltip>
          </nav>
        </aside>

        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-20 bg-white/50 backdrop-blur-md px-8 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-medium text-slate-600">Portal de Auditoria <span className="font-bold text-slate-900">NXT Ledger</span></h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Buscar pedido ou hash..." className="pl-10 bg-slate-100 border-none rounded-full h-10 text-sm" />
              </div>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">AD</div>
            </div>
          </header>

          <div className="p-8 space-y-8 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sincronizando com Blockchain...</p>
                </div>
              </div>
            ) : (
              <>
                <AuditOverview orders={orders} />

                <div className="space-y-6">
                  <Tabs defaultValue="selo" className="w-full">
                    <div className="flex items-center justify-between mb-6">
                      <TabsList className="bg-slate-100/50 p-1 border rounded-full h-12">
                        <TabsTrigger value="selo" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-8 rounded-full text-xs font-bold uppercase">Selo Tesouro Verde</TabsTrigger>
                        <TabsTrigger value="certificado_sas" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-8 rounded-full text-xs font-bold uppercase">Certificado SAS</TabsTrigger>
                        <TabsTrigger value="sas_dmv" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-8 rounded-full text-xs font-bold uppercase">SAS DMV</TabsTrigger>
                      </TabsList>
                      <div className="flex gap-3">
                         <AddOrderDialog onAdd={handleAddOrder} />
                         <Button variant="outline" size="sm" className="gap-2 text-[10px] font-bold uppercase tracking-widest border-slate-200">
                           <FileText className="w-3.5 h-3.5" /> Exportar Dados
                         </Button>
                      </div>
                    </div>

                    <TabsContent value="selo" className="mt-0">
                      <OrderTable 
                        orders={orders.filter(o => o.categoria === 'selo' || !o.categoria)} 
                        onUpdateOrder={handleUpdateOrder}
                        onDeleteOrder={handleDeleteOrder}
                        onAddMovement={handleAddMovement}
                        onDeleteMovement={handleDeleteMovement}
                      />
                    </TabsContent>
                    <TabsContent value="certificado_sas" className="mt-0">
                      <OrderTable 
                        orders={orders.filter(o => o.categoria === 'certificado_sas')} 
                        onUpdateOrder={handleUpdateOrder}
                        onDeleteOrder={handleDeleteOrder}
                        onAddMovement={handleAddMovement}
                        onDeleteMovement={handleDeleteMovement}
                      />
                    </TabsContent>
                    <TabsContent value="sas_dmv" className="mt-0">
                      <OrderTable 
                        orders={orders.filter(o => o.categoria === 'sas_dmv')} 
                        onUpdateOrder={handleUpdateOrder}
                        onDeleteOrder={handleDeleteOrder}
                        onAddMovement={handleAddMovement}
                        onDeleteMovement={handleDeleteMovement}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
