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

  const parseNumber = (val: string) => {
    if (!val) return 0;
    return parseInt(val.replace(/[^\d-]/g, '')) || 0;
  };

  const parseTSV = (text: string) => {
    if (!text.trim()) return [];
    
    const lines = text.split('\n').filter(l => l.trim());
    const results: any[] = [];
    
    // Supondo ordem da planilha fornecida:
    // Usuário | Documento | ORIGINAÇÃO | Débito | APOSENTADAS | BLOQUEADAS | Aquisição | TRANSF (IMEI) | ESTORNO (IMEI) | Saldo Ajustar (IMEI) | Saldo Legado | CPRs | BMTCA | Status BMTCA | Desmate | SALDO FINAL | VALOR A AJUSTAR | [Status Auditoria]
    
    const startIdx = (lines[0]?.toLowerCase().includes('usuário') || lines[0]?.toLowerCase().includes('documento')) ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split('\t');
      if (parts.length < 5) continue;

      results.push({
        id: `ID-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        nome: parts[0]?.trim() || "N/A",
        documento: parts[1]?.trim() || "N/A",
        originacao: parseNumber(parts[2]),
        debito: parseNumber(parts[3]),
        aposentadas: parseNumber(parts[4]),
        bloqueadas: parseNumber(parts[5]),
        aquisicao: parseNumber(parts[6]),
        transferenciaImei: parseNumber(parts[7]),
        estornoImei: parseNumber(parts[8]),
        saldoAjustarImei: parseNumber(parts[9]),
        saldoLegado: parseNumber(parts[10]),
        cprs: parts[11]?.trim() || "",
        bmtca: parts[12]?.trim() || "",
        statusBmtca: parts[13]?.trim() || "",
        desmate: parts[14]?.trim() || "",
        saldoFinal: parseNumber(parts[15]),
        valorAjustar: parseNumber(parts[16]),
        status: (parts[17]?.trim().toLowerCase() as EntityStatus) || 'disponivel',
        createdAt: new Date().toISOString()
      });
    }
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
      <DialogContent className="max-w-6xl bg-white border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
        <div className="flex flex-col h-[85vh]">
          <DialogHeader className="p-8 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-slate-900 font-black uppercase text-xl flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-primary" /> 
              Importação Avançada de Saldos: {type.toUpperCase()}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
            <div className="p-8 border-r flex flex-col gap-4 overflow-hidden">
              <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Estrutura Esperada (17+ Colunas):</p>
                <p className="text-[8px] text-slate-400 leading-tight">
                  Usuário, Doc, Originação, Débito, Aposentadas, Bloqueadas, Aquisição, Transf IMEI, Estorno IMEI, Ajuste IMEI, Legado, CPRs, BMTCA, Status BMTCA, Desmate, Saldo Final, Valor Ajustar.
                </p>
              </div>
              <Textarea 
                value={raw} 
                onChange={e => setRaw(e.target.value)} 
                placeholder="Copie as colunas do Excel e cole aqui..."
                className="flex-1 font-mono text-[10px] bg-slate-50 border-slate-200 p-6 resize-none rounded-2xl focus:ring-primary shadow-inner"
              />
            </div>

            <div className="p-8 bg-slate-50 flex flex-col overflow-hidden">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-primary" /> Mapeamento para o Ledger ({preview.length} itens)
              </p>
              <div className="flex-1 rounded-2xl border bg-white overflow-hidden shadow-sm flex flex-col">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader className="bg-slate-50/50 sticky top-0">
                      <TableRow>
                        <TableHead className="text-[9px] font-black uppercase">Usuário</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-right">Saldo Final</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="h-32 text-center text-[9px] font-bold text-slate-300 uppercase">Aguardando colagem...</TableCell>
                        </TableRow>
                      ) : (
                        preview.map((p, i) => (
                          <TableRow key={i} className="border-b border-slate-50">
                            <TableCell className="font-bold text-[10px] uppercase truncate max-w-[150px]">{p.nome}</TableCell>
                            <TableCell className="text-right font-mono font-black text-primary">{p.saldoFinal.toLocaleString('pt-BR')} UCS</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </div>

          <div className="p-8 border-t flex items-center justify-between gap-6 bg-white">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100 flex-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-tight">Certifique-se de que a ordem das colunas no Excel segue o padrão técnico do LedgerTrust.</p>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => setOpen(false)} className="text-[10px] font-bold uppercase tracking-widest px-8">Cancelar</Button>
              <Button 
                onClick={handleConfirm} 
                disabled={preview.length === 0}
                className="h-14 px-12 font-black uppercase text-xs rounded-2xl shadow-xl shadow-primary/20"
              >
                Sincronizar {preview.length} Saldos no Ledger
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
