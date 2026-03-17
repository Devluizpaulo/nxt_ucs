import { Pedido, OrderStatus, Movimento } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronRight, ExternalLink, Trash2 } from "lucide-react";
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
    <div className="rounded-xl border bg-card/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[100px] font-headline">ID</TableHead>
            <TableHead className="font-headline">Data</TableHead>
            <TableHead className="font-headline">Empresa</TableHead>
            <TableHead className="font-headline">Programa / UF</TableHead>
            <TableHead className="font-headline text-right">Qtd (UCS)</TableHead>
            <TableHead className="font-headline text-right">Valor (R$)</TableHead>
            <TableHead className="font-headline text-center">Status</TableHead>
            <TableHead className="font-headline text-center">Auditado</TableHead>
            <TableHead className="w-[120px] font-headline text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="transition-colors">
              <TableCell className="font-mono font-bold text-xs">{order.id}</TableCell>
              <TableCell className="text-xs">{new Date(order.data).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{order.empresa}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{order.cnpj}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-xs">{order.programa}</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1 border-primary/30 text-primary">{order.uf}</Badge>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono font-medium">{order.quantidade.toLocaleString()}</TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {order.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </TableCell>
              <TableCell className="text-center">
                <StatusBadge status={order.status} />
              </TableCell>
              <TableCell className="text-center">
                <Checkbox
                  checked={order.auditado}
                  onCheckedChange={(checked) => onToggleAudit(order.id, !!checked)}
                  className="mx-auto"
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-accent">
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            Rastreabilidade do Pedido: {order.id}
                            <StatusBadge status={order.status} />
                          </div>
                          <Badge variant="outline" className="font-mono text-xs">{order.hashPedido}</Badge>
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Empresa Solicitante</label>
                            <p className="font-semibold">{order.empresa} ({order.cnpj})</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Volume de Créditos</label>
                            <p className="font-semibold">{order.quantidade.toLocaleString()} UCS</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-bold flex items-center gap-2">
                            Movimentos Vinculados
                            <span className="text-xs font-normal text-muted-foreground">({order.movimentos?.length || 0})</span>
                          </h4>
                          <MovementList 
                            movements={order.movimentos || []} 
                            onDelete={(mid) => onDeleteMovement(order.id, mid)}
                          />
                        </div>

                        <OrderAuditForm onAdd={(raw) => onAddMovement(order.id, raw)} />
                        
                        <div className="flex justify-between items-center pt-4 border-t">
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => onDeleteOrder(order.id)}
                          >
                            <Trash2 className="w-4 h-4" /> Excluir Pedido
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                            disabled={order.status !== 'ok'}
                          >
                            <ExternalLink className="w-4 h-4" /> Preparar Migração
                          </Button>
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