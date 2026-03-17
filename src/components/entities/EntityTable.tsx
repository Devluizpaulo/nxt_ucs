"use client"

import { EntidadeSaldo } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Ban, AlertCircle } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface EntityTableProps {
  data: EntidadeSaldo[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function EntityTable({ data, selectedIds, onSelectionChange }: EntityTableProps) {
  const toggleAll = () => {
    if (selectedIds.length === data.length) onSelectionChange([]);
    else onSelectionChange(data.map(i => i.id));
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter(i => i !== id));
    else onSelectionChange([...selectedIds, id]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponivel':
        return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 flex gap-1.5 py-1 px-3 whitespace-nowrap"><CheckCircle2 className="w-3 h-3" /> DISPONÍVEL</Badge>;
      case 'bloqueado':
        return <Badge className="bg-rose-50 text-rose-600 border-rose-100 flex gap-1.5 py-1 px-3 whitespace-nowrap"><Ban className="w-3 h-3" /> BLOQUEADO</Badge>;
      case 'inapto':
        return <Badge className="bg-amber-50 text-amber-600 border-amber-100 flex gap-1.5 py-1 px-3 whitespace-nowrap"><AlertCircle className="w-3 h-3" /> INAPTO</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatUCS = (val: number) => (val || 0).toLocaleString('pt-BR');

  return (
    <div className="rounded-[2.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
      <ScrollArea className="w-full">
        <Table className="min-w-[1800px]">
          <TableHeader>
            <TableRow className="bg-slate-50/50 h-14 border-b border-slate-100">
              <TableHead className="w-[60px] pl-8">
                <Checkbox 
                  checked={data.length > 0 && selectedIds.length === data.length} 
                  onCheckedChange={toggleAll}
                  className="rounded-md border-slate-300"
                />
              </TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Usuário</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Documento</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Originação</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Débito</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Aposentadas</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Bloqueadas</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Aquisição</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Transf. IMEI</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Estorno IMEI</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Legado</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">CPRs</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">BMTCA</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status BMTCA</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Desmate</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-900 text-right bg-slate-100/50">Saldo Final</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Ajustar (V)</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Auditoria</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={18} className="h-48 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                  Nenhum registro encontrado nesta categoria
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id} className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <TableCell className="pl-8">
                    <Checkbox 
                      checked={selectedIds.includes(item.id)} 
                      onCheckedChange={() => toggleOne(item.id)}
                      className="rounded-md border-slate-200"
                    />
                  </TableCell>
                  <TableCell className="font-bold text-[10px] uppercase text-slate-900 max-w-[200px] truncate">{item.nome}</TableCell>
                  <TableCell className="font-mono text-[9px] text-slate-500">{item.documento}</TableCell>
                  <TableCell className="text-right font-mono text-[10px]">{formatUCS(item.originacao)}</TableCell>
                  <TableCell className="text-right font-mono text-[10px] text-rose-500">{formatUCS(item.debito)}</TableCell>
                  <TableCell className="text-right font-mono text-[10px]">{formatUCS(item.aposentadas)}</TableCell>
                  <TableCell className="text-right font-mono text-[10px]">{formatUCS(item.bloqueadas)}</TableCell>
                  <TableCell className="text-right font-mono text-[10px] text-emerald-600">{formatUCS(item.aquisicao)}</TableCell>
                  <TableCell className="text-right font-mono text-[10px]">{formatUCS(item.transferenciaImei)}</TableCell>
                  <TableCell className="text-right font-mono text-[10px]">{formatUCS(item.estornoImei)}</TableCell>
                  <TableCell className="text-right font-mono text-[10px]">{formatUCS(item.saldoLegado)}</TableCell>
                  <TableCell className="text-[9px] font-medium text-slate-500">{item.cprs || '-'}</TableCell>
                  <TableCell className="text-[9px] font-medium text-slate-500">{item.bmtca || '-'}</TableCell>
                  <TableCell className="text-[9px] font-medium text-slate-500 whitespace-nowrap">{item.statusBmtca || '-'}</TableCell>
                  <TableCell className="text-[9px] font-medium text-slate-500">{item.desmate || '-'}</TableCell>
                  <TableCell className="text-right font-mono font-black text-[11px] text-primary bg-slate-50/50">{formatUCS(item.saldoFinal)} UCS</TableCell>
                  <TableCell className="text-right font-mono text-[10px]">{formatUCS(item.valorAjustar)}</TableCell>
                  <TableCell className="flex justify-center py-4">
                    {getStatusBadge(item.status)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
