import { Pedido, OrderStatus, Movimento } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2, MoreHorizontal, Link as LinkIcon, Save, Database, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MovementList } from "./MovementList";
import { OrderAuditForm } from "./OrderAuditForm";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

interface OrderTableProps {
  orders: Pedido[];
  onUpdateOrder: (id: string, updates: Partial<Pedido>) => void;
  onDeleteOrder: (id: string) => void;
  onAddMovement: (orderId: string, raw: string) => void;
  onDeleteMovement: (orderId: string, moveId: string) => void;
}

export function OrderTable({ orders, onUpdateOrder, onDeleteOrder, onAddMovement, onDeleteMovement }: OrderTableProps) {
  return (
    <div className="rounded-[2.5rem] border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
            <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-widest text-slate-400 pl-8 h-14">ID Pedido</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Data / Hora</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Empresa / CNPJ</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right h-14">Quantidade</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right h-14">Total (R$)</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center h-14">NXT Link</TableHead>
            <TableHead className="w-[100px] text-[10px] font-black uppercase tracking-widest text-slate-400 text-right pr-8 h-14">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-48 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                Nenhum pedido registrado nesta categoria
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0">
                <TableCell className="font-mono font-bold text-sm text-primary pl-8">{order.id}</TableCell>
                <TableCell className="text-[11px] text-slate-500">
                  <div className="font-bold text-slate-900">{new Date(order.data).toLocaleDateString('pt-BR')}</div>
                  <div className="text-[10px]">{new Date(order.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-[11px] uppercase truncate max-w-[200px] text-slate-900">{order.empresa}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{order.cnpj}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-xs font-black text-slate-900">{order.quantidade} UCS</TableCell>
                <TableCell className="text-right font-mono font-black text-sm text-primary">
                  {order.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
                <TableCell className="text-center">
                  {order.linkNxt ? (
                    <a href={order.linkNxt} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                      <LinkIcon className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <Badge variant="outline" className="text-[8px] border-rose-100 bg-rose-50 text-rose-500 uppercase px-1.5 py-0.5 font-bold tracking-tighter">Ausente</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <OrderDetailsDialog 
                    order={order} 
                    onUpdateOrder={onUpdateOrder}
                    onDeleteOrder={onDeleteOrder}
                    onAddMovement={onAddMovement}
                    onDeleteMovement={onDeleteMovement}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function OrderDetailsDialog({ order, onUpdateOrder, onDeleteOrder, onAddMovement, onDeleteMovement }: any) {
  const [hash, setHash] = useState(order.hashPedido || "");
  const [link, setLink] = useState(order.linkNxt || "");
  const firestore = useFirestore();
  
  const movimentosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "pedidos", order.id, "movimentos");
  }, [firestore, order.id]);

  const { data: movimentos } = useCollection<Movimento>(movimentosQuery);

  const handleSaveAudit = () => {
    onUpdateOrder(order.id, { 
      hashPedido: hash, 
      linkNxt: link, 
      auditado: !!(hash && link),
      status: (hash && link) ? 'ok' : 'pendente'
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] border-none shadow-2xl p-8">
        <DialogHeader className="border-b border-slate-100 pb-6">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-slate-900 font-black uppercase text-xl tracking-tight">AUDITORIA DE PEDIDO {order.id}</span>
              <StatusBadge status={order.status} />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-8">
          <div className="space-y-8">
            <div className="bg-slate-50/50 p-6 rounded-3xl space-y-6 border border-slate-100">
              <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2 tracking-widest">
                <ShieldCheck className="w-4 h-4" /> Vincular Blockchain NXT
              </h4>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hash do Pedido</label>
                <Input 
                  value={hash} 
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="Ex: 0x885...NXT"
                  className="font-mono text-xs bg-white border-slate-200 rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">URL de Auditoria (Link Nxt)</label>
                <Input 
                  value={link} 
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://nxt.explorer/tx/..."
                  className="font-mono text-xs bg-white border-slate-200 rounded-xl h-12"
                />
              </div>
              <Button onClick={handleSaveAudit} className="w-full gap-2 font-black uppercase text-[10px] h-12 rounded-2xl shadow-lg shadow-primary/10">
                <Save className="w-4 h-4" /> Salvar Auditoria de Hash
              </Button>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-2 tracking-widest">
                <Database className="w-4 h-4" /> Importar Novos Rastreios
              </h4>
              <OrderAuditForm onAdd={(raw) => onAddMovement(order.id, raw)} />
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-2 tracking-widest">
              Movimentações Registradas <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-full">{movimentos?.length || 0}</Badge>
            </h4>
            <MovementList 
              movements={movimentos || []} 
              onDelete={(mid) => onDeleteMovement(order.id, mid)}
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-8 border-t border-slate-100 mt-10">
          <Button variant="ghost" className="text-[10px] font-bold uppercase text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl" onClick={() => onDeleteOrder(order.id)}>
            <Trash2 className="w-4 h-4 mr-2" /> Remover Permanente
          </Button>
          <div className="flex gap-3">
             <Button variant="outline" className="text-[10px] font-bold uppercase rounded-xl h-11 border-slate-200">Exportar XML</Button>
             <Button className="text-[10px] font-black uppercase rounded-xl h-11 px-8 shadow-lg shadow-primary/20" disabled={!order.linkNxt}>Gerar Relatório Final</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}