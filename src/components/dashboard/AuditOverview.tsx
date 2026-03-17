import { Pedido } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Clock, Database } from "lucide-react";

export function AuditOverview({ orders }: { orders: Pedido[] }) {
  const total = orders.length;
  const audited = orders.filter(o => o.auditado).length;
  const error = orders.filter(o => o.status === 'erro').length;
  const ok = orders.filter(o => o.status === 'ok').length;
  const pending = orders.filter(o => o.status === 'pendente').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="bg-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Total Pedidos</p>
              <p className="text-3xl font-black">{total}</p>
            </div>
            <Database className="w-8 h-8 text-primary opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-emerald-500/10 border-emerald-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Prontos (OK)</p>
              <p className="text-3xl font-black">{ok}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-50" />
          </div>
          <p className="text-[10px] mt-2 text-emerald-500/70 font-medium italic">Auditados: {audited} de {total}</p>
        </CardContent>
      </Card>

      <Card className="bg-amber-500/10 border-amber-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Pendentes</p>
              <p className="text-3xl font-black">{pending}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-rose-500/10 border-rose-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Criticos (Erro)</p>
              <p className="text-3xl font-black">{error}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-rose-500 opacity-50" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}