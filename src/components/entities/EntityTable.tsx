"use client"

import { EntidadeSaldo } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertCircle, Ban, CheckCircle2 } from "lucide-react";

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
        return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 flex gap-1.5 py-1 px-3"><CheckCircle2 className="w-3 h-3" /> DISPONÍVEL</Badge>;
      case 'bloqueado':
        return <Badge className="bg-rose-50 text-rose-600 border-rose-100 flex gap-1.5 py-1 px-3"><Ban className="w-3 h-3" /> BLOQUEADO</Badge>;
      case 'inapto':
        return <Badge className="bg-amber-50 text-amber-600 border-amber-100 flex gap-1.5 py-1 px-3"><AlertCircle className="w-3 h-3" /> INAPTO</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-[2.5rem] border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 h-14">
            <TableHead className="w-[40px] pl-8">
              <Checkbox 
                checked={data.length > 0 && selectedIds.length === data.length} 
                onCheckedChange={toggleAll}
                className="rounded-md border-slate-300"
              />
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID / Código</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome / Razão Social</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">CPF / CNPJ</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">UF</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Saldo Atual (UCS)</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status Auditoria</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-48 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
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
                <TableCell className="font-mono font-bold text-xs text-primary">{item.id}</TableCell>
                <TableCell className="font-bold text-[11px] uppercase text-slate-900">{item.nome}</TableCell>
                <TableCell className="font-mono text-[10px] text-slate-500">{item.documento}</TableCell>
                <TableCell className="text-center font-bold text-[10px] text-slate-600">{item.uf}</TableCell>
                <TableCell className="text-right font-mono font-black text-xs text-slate-900">{item.quantidade.toLocaleString()} UCS</TableCell>
                <TableCell className="flex justify-center py-4">
                  {getStatusBadge(item.status)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
