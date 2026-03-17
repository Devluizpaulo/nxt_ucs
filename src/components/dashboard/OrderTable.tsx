import { Pedido, OrderStatus, Movimento } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronRight, ExternalLink, Trash2, Check, X, AlertCircle, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MovementList } from "./MovementList";
import { OrderAuditForm } from "./OrderAuditForm";
import { Badge } from "@/components/ui/badge";

interface OrderTableProps {
  orders: Pedido[];
  onToggleAudit: (id: string, audited: boolean) => void;
  onDeleteOrder: (id: string) => void;
  onAddMovement: (orderId: string, raw: string) => void;
  onDeleteMovement: (orderId: string, moveId: string) => void;
}

export function OrderTable({ orders, onToggleAudit, onDeleteOrder, onAddMovement, onDeleteMovement }: OrderTableProps) {
  return (
    <div className="rounded-xl border bg-card/50 overflow-hidden shadow-2xl">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
            <TableHead className="w-[80px] font-headline text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Pedido</TableHead>
            <TableHead className="font-headline text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Data</TableHead>
            <TableHead className="font-headline text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Origem</TableHead>
            <TableHead className="font-headline text-muted-foreground uppercase text-[10px] font-bold tracking-wider">PARC/PROG</TableHead>
            <TableHead className="font-headline text-center text-muted-foreground uppercase text-[10px] font-bold tracking-wider">UF</TableHead>
            <TableHead className="font-headline text-center text-muted-foreground uppercase text-[10px] font-bold tracking-wider">D.O</TableHead>
            <TableHead className="font-headline text-right text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Quantidade</TableHead>
            <TableHead className="font-headline text-right text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Taxa</TableHead>
            <TableHead className="font-headline text-right text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Total</TableHead>
            <TableHead className="font-headline text-center text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Nxt</TableHead>
            <TableHead className="w-[100px] font-headline text-right text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="transition-colors group hover:bg-muted/20 border-b border-border/30">
              <TableCell className="font-mono font-bold text-sm text-primary">{order.id}</TableCell>
              <TableCell className="text-[11px] leading-tight text-muted-foreground">
                <div className="font-medium text-foreground">{new Date(order.data).toLocaleDateString('pt-BR')}</div>
                <div>{new Date(order.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                    <img src={`https://picsum.photos/seed/${order.id}/40/40`} className="w-8 h-8 rounded-full opacity-80" alt="logo" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-[11px] leading-tight max-w-[200px] truncate uppercase">{order.empresa}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{order.cnpj}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-[11px] font-medium text-muted-foreground">{order.programa}</span>
              </TableCell>
              <TableCell className="text-center">
                <span className="text-[11px] font-bold">{order.uf}</span>
              </TableCell>
              <TableCell className="text-center">
                <span className="text-[11px] font-medium">{order.do ? 'Sim' : 'Não'}</span>
              </TableCell>
              <TableCell className="text-right font-mono text-xs font-semibold">{order.quantidade} UCS</TableCell>
              <TableCell className="text-right font-mono text-xs text-muted-foreground">
                {order.taxa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </TableCell>
              <TableCell className="text-right font-mono font-black text-sm text-accent">
                {order.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col gap-0.5 items-center">
                  <div className="w-4 h-4 rounded-sm bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center text-[9px] font-bold">A</div>
                  <div className="w-4 h-4 rounded-sm bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center text-[9px] font-bold">B</div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <StatusBadge status={order.status} />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-sm border-primary/20">
                      <DialogHeader className="border-b pb-4">
                        <DialogTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-primary font-black">DETALHES DO PEDIDO {order.id}</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">Blockchain Hash:</span>
                            <Badge variant="outline" className="font-mono text-[10px] border-emerald-500/50 text-emerald-500">{order.hashPedido}</Badge>
                          </div>
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-8 mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-1 p-3 bg-muted/20 rounded-lg border">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Empresa Solicitante</label>
                            <p className="font-bold text-sm uppercase">{order.empresa}</p>
                            <p className="text-xs text-muted-foreground font-mono">{order.cnpj}</p>
                          </div>
                          <div className="space-y-1 p-3 bg-muted/20 rounded-lg border">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Volume Total</label>
                            <p className="font-black text-lg text-primary">{order.quantidade} UCS</p>
                          </div>
                          <div className="space-y-1 p-3 bg-muted/20 rounded-lg border">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Valor Financeiro</label>
                            <p className="font-black text-lg text-accent">{order.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black flex items-center gap-2 uppercase tracking-tight">
                              Movimentações de Rastreio (Traceability)
                              <Badge variant="secondary" className="text-[10px] font-bold">{(order.movimentos?.length || 0)}</Badge>
                            </h4>
                          </div>
                          <MovementList 
                            movements={order.movimentos || []} 
                            onDelete={(mid) => onDeleteMovement(order.id, mid)}
                          />
                        </div>

                        <div className="bg-card/50 p-6 rounded-xl border border-dashed border-primary/30">
                          <h4 className="text-xs font-bold uppercase mb-4 text-primary">Inserir Novo Registro de Movimento</h4>
                          <OrderAuditForm onAdd={(raw) => onAddMovement(order.id, raw)} />
                        </div>
                        
                        <div className="flex justify-between items-center pt-6 border-t">
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="gap-2 font-bold uppercase text-[10px]"
                            onClick={() => onDeleteOrder(order.id)}
                          >
                            <Trash2 className="w-4 h-4" /> Excluir Registro Permanente
                          </Button>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2 border-primary/50 text-primary hover:bg-primary/10 font-bold uppercase text-[10px]"
                            >
                              Gerar PDF
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="gap-2 bg-primary hover:bg-primary/90 font-bold uppercase text-[10px]"
                              disabled={order.status !== 'ok'}
                            >
                              <ExternalLink className="w-4 h-4" /> Validar na Rede Blockchain
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
