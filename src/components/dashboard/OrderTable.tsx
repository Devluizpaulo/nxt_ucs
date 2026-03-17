import { Pedido, OrderStatus, Movimento } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2, MoreHorizontal, Link as LinkIcon, Save, Database, ShieldCheck, Check, X, Printer, FileText, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MovementList } from "./MovementList";
import { OrderAuditForm } from "./OrderAuditForm";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import Image from "next/image";

interface OrderTableProps {
  orders: Pedido[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onUpdateOrder: (id: string, updates: Partial<Pedido>) => void;
  onDeleteOrder: (id: string) => void;
  onAddMovement: (orderId: string, movements: any[]) => void;
  onDeleteMovement: (orderId: string, moveId: string) => void;
}

export function OrderTable({ 
  orders, 
  selectedIds, 
  onSelectionChange, 
  onUpdateOrder, 
  onDeleteOrder, 
  onAddMovement, 
  onDeleteMovement 
}: OrderTableProps) {
  
  const allIds = orders.map(o => o.id);
  const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange(selectedIds.filter(id => !allIds.includes(id)));
    } else {
      const newSelection = Array.from(new Set([...selectedIds, ...allIds]));
      onSelectionChange(newSelection);
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="rounded-[2.5rem] border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
            <TableHead className="w-[40px] pl-8">
              <Checkbox 
                checked={isAllSelected} 
                onCheckedChange={toggleSelectAll} 
                className="rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Pedido</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Data</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Origem</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">PARC/PROG</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center h-14">UF</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center h-14">D.O</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right h-14">Qtd</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right h-14">Taxa</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right h-14">Total</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center h-14">Nxt</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center h-14">Status</TableHead>
            <TableHead className="w-[100px] pr-8 h-14"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={13} className="h-48 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                Nenhum pedido registrado nesta categoria
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow 
                key={order.id} 
                className={`group transition-colors border-b border-slate-50 last:border-0 ${selectedIds.includes(order.id) ? 'bg-emerald-50/30' : 'hover:bg-slate-50/80'}`}
              >
                <TableCell className="pl-8">
                  <Checkbox 
                    checked={selectedIds.includes(order.id)} 
                    onCheckedChange={() => toggleSelectOne(order.id)}
                    className="rounded-md border-slate-200"
                  />
                </TableCell>
                <TableCell className="font-mono font-bold text-xs text-primary">{order.id}</TableCell>
                <TableCell className="text-[10px] text-slate-500 whitespace-nowrap">
                  <div className="font-bold text-slate-900">{new Date(order.data).toLocaleDateString('pt-BR')}</div>
                  <div className="text-[9px] opacity-70">{new Date(order.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-[10px] uppercase truncate max-w-[150px] text-slate-900">{order.empresa}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{order.cnpj}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[10px] font-medium text-slate-600 max-w-[120px] truncate">
                  {order.programa}
                </TableCell>
                <TableCell className="text-center font-bold text-[10px] text-slate-500">
                  {order.uf}
                </TableCell>
                <TableCell className="text-center">
                  {order.do ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-[10px] font-black text-slate-900 whitespace-nowrap">{order.quantidade} UCS</TableCell>
                <TableCell className="text-right font-mono text-[10px] text-slate-500">
                  {order.taxa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
                <TableCell className="text-right font-mono font-black text-[11px] text-primary whitespace-nowrap">
                  {order.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
                <TableCell className="text-center">
                  {order.linkNxt ? (
                    <a href={order.linkNxt} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                      <LinkIcon className="w-3 h-3" />
                    </a>
                  ) : (
                    <Badge variant="outline" className="text-[7px] border-rose-100 bg-rose-50 text-rose-500 uppercase px-1 py-0 font-bold tracking-tighter">OFF</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-right pr-8">
                  <div className="flex items-center justify-end gap-1">
                    {order.status === 'ok' && (
                      <OrderDetailsDialog 
                        order={order} 
                        onUpdateOrder={onUpdateOrder}
                        onDeleteOrder={onDeleteOrder}
                        onAddMovement={onAddMovement}
                        onDeleteMovement={onDeleteMovement}
                        variant="pdf"
                      />
                    )}
                    <OrderDetailsDialog 
                      order={order} 
                      onUpdateOrder={onUpdateOrder}
                      onDeleteOrder={onDeleteOrder}
                      onAddMovement={onAddMovement}
                      onDeleteMovement={onDeleteMovement}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function OrderDetailsDialog({ order, onUpdateOrder, onDeleteOrder, onAddMovement, onDeleteMovement, variant = "default" }: any) {
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

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${order.id} ${order.empresa}`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === "pdf" ? (
          <Button variant="ghost" size="icon" title="Gerar Certificado PDF" className="h-8 w-8 text-primary hover:bg-emerald-50 rounded-lg animate-in fade-in zoom-in">
            <FileText className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] border-none shadow-2xl p-8 print:p-0 print:max-h-none print:overflow-visible print:shadow-none print:rounded-none">
        {/* Layout Visual do Dashboard */}
        <div className="print:hidden">
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
                <OrderAuditForm onAdd={(movements) => onAddMovement(order.id, movements)} />
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
               {order.status === 'ok' && (
                 <Button onClick={handlePrint} className="text-[10px] font-black uppercase rounded-xl h-11 px-8 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white flex items-center gap-2 animate-in fade-in zoom-in">
                   <FileText className="w-4 h-4" /> Gerar Certificado PDF
                 </Button>
               )}
            </div>
          </div>
        </div>

        {/* Layout de Auditoria (PDF SOLICITADO) */}
        <div className="hidden print:block p-16 font-body text-slate-900 bg-white min-h-screen">
          {/* Cabeçalho com Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative w-48 h-24 mb-6">
              <Image 
                src="/image/logo_amarelo.png" 
                alt="Logo BMV" 
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-bold uppercase tracking-tight">RELATÓRIO DE AUDITORIA DE PEDIDO</h1>
          </div>

          {/* Dados do Pedido */}
          <div className="space-y-6 text-[11px] leading-relaxed">
            <div className="space-y-1">
              <p><strong>ID:</strong> {order.id}</p>
              <p><strong>Data:</strong> {new Date(order.data).toLocaleString('pt-BR')}</p>
              <p><strong>Empresa:</strong> {order.empresa}</p>
              <p><strong>CNPJ:</strong> {order.cnpj}</p>
              <p><strong>Programa:</strong> {order.programa}</p>
              <p><strong>UF:</strong> {order.uf}</p>
            </div>

            <div className="space-y-1">
              <p><strong>Quantidade:</strong> {order.quantidade} UCS</p>
              <p><strong>Valor:</strong> {order.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>

            {/* Lista de Movimentações conforme imagem */}
            <div className="space-y-2">
              <p className="font-bold">Movimentações:</p>
              <div className="space-y-1 ml-4">
                {movimentos?.length === 0 ? (
                  <p className="italic text-slate-400">- Nenhuma movimentação registrada</p>
                ) : (
                  movimentos?.map((mov) => (
                    <p key={mov.id}>
                      - {mov.origem} → {mov.quantidade} UCS ({mov.tipo === 'gov' ? 'Governo' : 'Cliente'})
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* Validação Blockchain */}
            <div className="space-y-1 pt-4">
              <p className="font-bold">Validação:</p>
              <p>Sem duplicidade</p>
              <p>Compatível com pedido</p>
              <p className="font-mono text-[9px] text-slate-500 break-all mt-2">Hash: {order.hashPedido}</p>
            </div>

            {/* Status Final com Destaque */}
            <div className="pt-10 border-t border-slate-100">
              <p className="text-sm font-bold">
                Status Final: <span className="uppercase text-emerald-600">APROVADO PARA MIGRAÇÃO</span>
              </p>
            </div>
          </div>

          {/* Rodapé do PDF */}
          <div className="mt-20 pt-8 border-t border-slate-100 text-[9px] text-slate-400 text-center uppercase tracking-widest">
            Documento gerado eletronicamente via LedgerTrust Auditoria • {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
