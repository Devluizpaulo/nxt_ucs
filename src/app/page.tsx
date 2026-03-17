"use client"

import { useState, useEffect } from "react";
import { MOCK_PEDIDOS, MOCK_MOVIMENTOS } from "@/lib/mock-data";
import { Pedido, Movimento, OrderStatus } from "@/lib/types";
import { OrderTable } from "@/components/dashboard/OrderTable";
import { AuditOverview } from "@/components/dashboard/AuditOverview";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Search, Filter, Plus, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function AuditDashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const { toast } = useToast();

  // Initialize data with movements nested
  useEffect(() => {
    const initialized = MOCK_PEDIDOS.map(p => ({
      ...p,
      movimentos: MOCK_MOVIMENTOS.filter(m => m.pedidoId === p.id)
    }));
    setPedidos(initialized);
  }, []);

  const handleToggleAudit = (id: string, audited: boolean) => {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, auditado: audited } : p));
  };

  const handleDeleteOrder = (id: string) => {
    setPedidos(prev => prev.filter(p => p.id !== id));
    toast({ title: "Pedido excluído", description: `O pedido ${id} foi removido do sistema.` });
  };

  const handleAddMovement = (orderId: string, raw: string) => {
    // Basic logic for mock purposes:
    // 1. Generate a "hash" from raw
    const newHash = `HM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    // Check for global duplicates
    const allMovs = pedidos.flatMap(p => p.movimentos || []);
    const isDuplicate = allMovs.some(m => m.hashMovimento === newHash);

    const newMov: Movimento = {
      id: `MOV-${Date.now()}`,
      pedidoId: orderId,
      raw,
      hashMovimento: newHash,
      tipo: 'cliente',
      origem: 'Importação Manual',
      destino: 'Destinatário Desconhecido',
      quantidade: Math.floor(Math.random() * 1000) + 1,
      duplicado: isDuplicate,
      validado: !isDuplicate,
      createdAt: new Date().toISOString()
    };

    setPedidos(prev => prev.map(p => {
      if (p.id === orderId) {
        const updatedMovs = [...(p.movimentos || []), newMov];
        
        // Logical check for parent status
        let newStatus: OrderStatus = 'ok';
        if (updatedMovs.some(m => m.duplicado)) {
          newStatus = 'erro';
        } else if (updatedMovs.length === 0) {
          newStatus = 'pendente';
        }

        return {
          ...p,
          movimentos: updatedMovs,
          status: newStatus
        };
      }
      return p;
    }));

    if (isDuplicate) {
      toast({ 
        variant: "destructive", 
        title: "Atenção: Hash Duplicado", 
        description: "Este movimento já existe no sistema global. O pedido foi marcado com erro." 
      });
    } else {
      toast({ title: "Movimento registrado", description: "O novo movimento foi validado e associado ao pedido." });
    }
  };

  const handleDeleteMovement = (orderId: string, moveId: string) => {
    setPedidos(prev => prev.map(p => {
      if (p.id === orderId) {
        const updatedMovs = (p.movimentos || []).filter(m => m.id !== moveId);
        
        let newStatus: OrderStatus = 'ok';
        if (updatedMovs.some(m => m.duplicado)) {
          newStatus = 'erro';
        } else if (updatedMovs.length === 0) {
          newStatus = 'pendente';
        }

        return { ...p, movimentos: updatedMovs, status: newStatus };
      }
      return p;
    }));
  };

  const filteredOrders = pedidos.filter(p => {
    const matchesSearch = p.empresa.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-headline tracking-tighter">LEDGERTRUST <span className="text-primary">AUDIT</span></h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Traceability & Integrity System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/10">
              <FileSpreadsheet className="w-4 h-4" /> Exportar Relatório
            </Button>
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Novo Pedido
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        <AuditOverview orders={pedidos} />

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card/30 p-4 rounded-xl border">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por ID ou Empresa..." 
              className="pl-10 bg-background/50 border-border/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-border/50">
                  <Filter className="w-4 h-4" /> 
                  Filtrar Status: {statusFilter === 'all' ? 'Todos' : statusFilter.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>Todos</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('ok')}>OK</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pendente')}>Pendente</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('erro')}>Erro</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-[10px] text-muted-foreground ml-2 whitespace-nowrap">
              Exibindo <strong>{filteredOrders.length}</strong> de {pedidos.length} pedidos
            </p>
          </div>
        </div>

        <OrderTable 
          orders={filteredOrders} 
          onToggleAudit={handleToggleAudit}
          onDeleteOrder={handleDeleteOrder}
          onAddMovement={handleAddMovement}
          onDeleteMovement={handleDeleteMovement}
        />

        <div className="mt-8 flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/30">
          <div className="space-y-1">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Certificação de Integridade Blockchain
            </h3>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Este sistema atua como camada de validação NXT antes da migração para a rede Polca. 
              Ações de migração são bloqueadas automaticamente para pedidos com status inconsistente.
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-background bg-emerald-500 flex items-center justify-center text-[10px] font-bold">G</div>
              <div className="w-8 h-8 rounded-full border-2 border-background bg-primary flex items-center justify-center text-[10px] font-bold">L</div>
              <div className="w-8 h-8 rounded-full border-2 border-background bg-amber-500 flex items-center justify-center text-[10px] font-bold">A</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}