"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Layers, CheckCircle2, FileSpreadsheet, AlertCircle } from "lucide-react";
import { EntityStatus, EntidadeSaldo } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EntityBulkImportProps {
  onImport: (data: any[]) => void;
  type: 'produtor' | 'associacao';
}

export function EntityBulkImport({ onImport, type }: EntityBulkImportProps) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<any[]>([]);

  const parseTSV = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    const results: any[] = [];
    
    // Supondo ordem: ID | Nome | Documento | UF | Saldo | Status
    lines.forEach((line, idx) => {
      const parts = line.split('\t');
      if (parts.length < 5) return;

      results.push({
        id: parts[0]?.trim() || `ID-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        nome: parts[1]?.trim() || "N/A",
        documento: parts[2]?.trim() || "N/A",
        uf: parts[3]?.trim() || "XX",
        quantidade: parseInt(parts[4]?.replace(/[^\d]/g, '') || "0"),
        status: (parts[5]?.trim().toLowerCase() as EntityStatus) || 'disponivel',
        createdAt: new Date().toISOString()
      });
    });
    return results;
  };

  useEffect(() => {
    setPreview(parseTSV(raw));
  }, [raw]);

  const handleConfirm = () => {
    onImport(preview);
    setRaw("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-[10px] font-bold uppercase tracking-widest border-primary/20 hover:bg-primary/5 h-12 px-6 rounded-full">
          <Layers className="w-3.5 h-3.5" /> Importar {type === 'produtor' ? 'Produtores' : 'Associações'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl bg-white border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
        <div className="flex flex-col h-[80vh]">
          <DialogHeader className="p-8 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-slate-900 font-black uppercase text-xl flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-primary" /> 
              Importação de Saldos: {type.toUpperCase()}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 grid grid-cols-2 overflow-hidden">
            <div className="p-8 border-r flex flex-col gap-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cole os dados (ID | Nome | Doc | UF | Saldo | Status)</p>
              <Textarea 
                value={raw} 
                onChange={e => setRaw(e.target.value)} 
                placeholder="Ex: 001	Eco Produtor	00.000.000/0001-00	MT	1500	disponivel"
                className="flex-1 font-mono text-[10px] bg-slate-50 border-slate-200 p-6 resize-none rounded-2xl"
              />
            </div>

            <div className="p-8 bg-slate-50 flex flex-col overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Pré-visualização do Ledger ({preview.length})</p>
              <div className="flex-1 rounded-2xl border bg-white overflow-hidden shadow-sm">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="text-[9px] font-black uppercase">Nome</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((p, i) => (
                        <TableRow key={i} className="border-b border-slate-50">
                          <TableCell className="font-bold text-[10px]">{p.nome}</TableCell>
                          <TableCell className="text-right font-mono font-black text-primary">{p.quantidade} UCS</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </div>

          <div className="p-8 border-t flex items-center justify-between gap-6 bg-white">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100 flex-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-tight">O status deve ser: disponivel, bloqueado ou inapto.</p>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => setOpen(false)} className="text-[10px] font-bold uppercase">Cancelar</Button>
              <Button 
                onClick={handleConfirm} 
                disabled={preview.length === 0}
                className="h-14 px-12 font-black uppercase text-xs rounded-2xl shadow-xl shadow-primary/20"
              >
                Confirmar Importação de {preview.length} Registros
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
