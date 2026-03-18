
"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EntidadeSaldo } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, ClipboardPaste, Database, ShieldCheck, Table as TableIcon, Calculator, ListFilter, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface EntityEditDialogProps {
  entity: EntidadeSaldo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<EntidadeSaldo>) => void;
}

interface ParsedRow {
  ref: string;
  data: string;
  valor: number;
}

export function EntityEditDialog({ entity, open, onOpenChange, onUpdate }: EntityEditDialogProps) {
  const [formData, setFormData] = useState<Partial<EntidadeSaldo>>({});
  const [activePasteField, setActivePasteField] = useState<keyof EntidadeSaldo | null>(null);
  const [pasteBuffer, setPasteBuffer] = useState("");
  const [previewRows, setPreviewRows] = useState<ParsedRow[]>([]);

  useEffect(() => {
    if (entity) {
      setFormData(entity);
      setPasteBuffer("");
      setPreviewRows([]);
    }
  }, [entity]);

  // Cálculo Automático do Saldo Final
  useEffect(() => {
    const final = 
      (formData.originacao || 0) + 
      (formData.movimentacao || 0) + 
      (formData.aposentado || 0) + 
      (formData.bloqueado || 0) + 
      (formData.aquisicao || 0) +
      (formData.saldoAjustarImei || 0);
    
    if (final !== formData.saldoFinalAtual) {
      setFormData(prev => ({ ...prev, saldoFinalAtual: final }));
    }
  }, [formData.originacao, formData.movimentacao, formData.aposentado, formData.bloqueado, formData.aquisicao, formData.saldoAjustarImei]);

  // Parser inteligente de linhas de planilha
  useEffect(() => {
    if (!pasteBuffer.trim()) {
      setPreviewRows([]);
      return;
    }

    const lines = pasteBuffer.split('\n').filter(l => l.trim());
    const results: ParsedRow[] = [];

    lines.forEach(line => {
      const parts = line.split('\t');
      if (parts.length < 2) return;

      // Ignora cabeçalhos
      if (line.toLowerCase().includes('dist.') || line.toLowerCase().includes('data')) return;

      let valor = 0;
      let ref = parts[0];
      let data = parts[1];

      // Busca o valor numérico (geralmente na penúltima ou última coluna relevante)
      // No formato de Débitos: Dist(0), Data(1), Destino(2), ... Débito(5), Situação(6)
      if (parts.length >= 6) {
        const rawValue = parts[5].trim() || parts[parts.length - 2];
        valor = parseFloat(rawValue.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        // Se o campo for de débito/movimentação, garantimos que seja negativo para a soma
        if (activePasteField === 'movimentacao' || activePasteField === 'aposentado' || activePasteField === 'bloqueado') {
          if (valor > 0) valor = -valor;
        }
      } else {
        const rawValue = parts[parts.length - 1];
        valor = parseFloat(rawValue.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
      }

      results.push({ ref, data, valor });
    });

    setPreviewRows(results);
  }, [pasteBuffer, activePasteField]);

  const handleIndividualSave = () => {
    if (!entity) return;
    onUpdate(entity.id, formData);
    onOpenChange(false);
  };

  const consolidateField = () => {
    if (!activePasteField || previewRows.length === 0) return;

    const total = previewRows.reduce((acc, row) => acc + row.valor, 0);
    setFormData(prev => ({ ...prev, [activePasteField]: total }));
    
    setPasteBuffer("");
    setPreviewRows([]);
    setActivePasteField(null);
    
    toast({ 
      title: "Consolidação Concluída", 
      description: `O campo ${activePasteField.toString().toUpperCase()} foi atualizado com o saldo de ${previewRows.length} registros.` 
    });
  };

  const processLegacyPaste = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    let totalDisponivel = 0;
    lines.forEach(line => {
      const parts = line.split('\t');
      if (parts.length >= 5 && !line.toLowerCase().includes('data atualização')) {
        const rawValue = parts[4].trim();
        const cleanValue = parseFloat(rawValue.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        totalDisponivel += cleanValue;
      }
    });
    setFormData(prev => ({ ...prev, saldoLegadoTotal: totalDisponivel }));
    toast({ title: "Extrato Legado Processado", description: `Total de ${totalDisponivel.toLocaleString('pt-BR')} UCS consolidado.` });
  };

  if (!entity) return null;

  const SaldoField = ({ label, field, color }: { label: string, field: keyof EntidadeSaldo, color: string }) => (
    <div className="bg-white p-4 space-y-2 relative group border-r border-slate-100 last:border-0">
      <div className="flex items-center justify-between">
        <Label className="text-[8px] font-black uppercase text-slate-400 tracking-tighter block">{label}</Label>
        <Popover open={activePasteField === field} onOpenChange={(open) => setActivePasteField(open ? field : null)}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-emerald-50 rounded-md">
              <Calculator className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[450px] p-0 rounded-[2rem] shadow-2xl border-none bg-slate-900 overflow-hidden" side="top">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Consolidar {label}</p>
                </div>
                {previewRows.length > 0 && (
                  <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-1 rounded-md">
                    SOMA: {previewRows.reduce((a, b) => a + b.valor, 0).toLocaleString('pt-BR')} UCS
                  </span>
                )}
              </div>
              
              <Textarea 
                value={pasteBuffer}
                onChange={e => setPasteBuffer(e.target.value)}
                placeholder="Cole as linhas da planilha aqui..."
                className="bg-slate-800 border-slate-700 text-[9px] font-mono h-32 resize-none text-slate-300 rounded-xl"
              />

              {previewRows.length > 0 && (
                <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-800/50">
                  <ScrollArea className="h-40">
                    <Table>
                      <TableHeader className="bg-slate-800 sticky top-0">
                        <TableRow className="border-slate-700 hover:bg-transparent">
                          <TableHead className="text-[8px] font-black text-slate-500 uppercase h-8">Ref</TableHead>
                          <TableHead className="text-[8px] font-black text-slate-500 uppercase h-8">Data</TableHead>
                          <TableHead className="text-[8px] font-black text-slate-500 uppercase h-8 text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewRows.map((row, i) => (
                          <TableRow key={i} className="border-slate-700 hover:bg-slate-700/30">
                            <TableCell className="py-1.5 text-[9px] text-slate-400 font-mono">{row.ref}</TableCell>
                            <TableCell className="py-1.5 text-[9px] text-slate-400">{row.data}</TableCell>
                            <TableCell className={cn("py-1.5 text-right font-mono text-[9px] font-black", row.valor < 0 ? "text-rose-400" : "text-emerald-400")}>
                              {row.valor.toLocaleString('pt-BR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              <Button 
                onClick={consolidateField}
                disabled={previewRows.length === 0}
                className="w-full h-12 font-black uppercase text-[10px] bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20"
              >
                Atualizar Coluna {label}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <Input 
        type="number" 
        value={formData[field] || 0}
        onChange={e => setFormData({...formData, [field]: Number(e.target.value)})}
        className={cn("border-none p-0 h-auto text-sm font-bold font-mono focus-visible:ring-0 bg-transparent", color)}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden bg-[#F1F5F9] border-none shadow-2xl rounded-[3rem] p-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Editor de Auditoria - {entity.nome}</DialogTitle>
          <DialogDescription>Processamento de saldos legado e atual para o LedgerTrust.</DialogDescription>
        </DialogHeader>
        
        <div className="bg-slate-900 p-10 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Auditoria Permanente LedgerTrust</p>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white">{entity.nome}</h2>
              <div className="flex gap-4">
                <p className="text-xs font-mono opacity-60 uppercase">DOC: {entity.documento}</p>
                <p className="text-xs font-mono opacity-60 uppercase">UF: {entity.uf}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Final (Auditado)</p>
              <div className="flex items-baseline justify-end gap-2">
                <span className="text-5xl font-black text-primary tracking-tighter">{(formData.saldoFinalAtual || 0).toLocaleString('pt-BR')}</span>
                <span className="text-xs font-bold text-primary opacity-50 uppercase">UCS</span>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-10 space-y-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-slate-400" />
                  <h3 className="text-[11px] font-black uppercase text-slate-900 tracking-[0.2em]">Saldos Atuais (Processamento por Seção)</h3>
                </div>
                <div className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Cole as linhas da planilha no ícone de calculadora</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl bg-white">
                <SaldoField label="Originação" field="originacao" color="text-slate-900" />
                <SaldoField label="Movimentação" field="movimentacao" color="text-rose-600" />
                <SaldoField label="Aposentado" field="aposentado" color="text-slate-600" />
                <SaldoField label="Bloqueado" field="bloqueado" color="text-amber-600" />
                <SaldoField label="Aquisição" field="aquisicao" color="text-emerald-600" />
                <SaldoField label="Ajuste IMEI" field="saldoAjustarImei" color="text-indigo-600" />
                <div className="bg-slate-50 p-4 space-y-2 border-l border-slate-200">
                  <Label className="text-[8px] font-black uppercase text-slate-400 tracking-tighter block">Auditado</Label>
                  <div className="text-sm font-black font-mono text-primary">
                    {(formData.saldoFinalAtual || 0).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-slate-400" />
                <h3 className="text-[11px] font-black uppercase text-slate-900 tracking-[0.2em]">Consolidação de Extrato Legado</h3>
              </div>
              <div className="bg-white p-8 rounded-[3rem] border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-10 shadow-sm">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Legado (Auditado)</Label>
                  <Input 
                    type="number"
                    value={formData.saldoLegadoTotal || 0}
                    onChange={e => setFormData({...formData, saldoLegadoTotal: Number(e.target.value)})}
                    className="h-16 rounded-2xl bg-slate-50 border-slate-200 font-mono font-black text-xl text-slate-700 focus:ring-primary shadow-inner"
                  />
                </div>
                
                <div className="col-span-2 relative group">
                  <Textarea 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onPaste={(e) => processLegacyPaste(e.clipboardData.getData('text'))}
                  />
                  <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px] group-hover:border-primary group-hover:bg-emerald-50/30 transition-all">
                    <ClipboardPaste className="w-8 h-8 text-slate-300 group-hover:text-primary transition-colors" />
                    <p className="text-[10px] font-black text-slate-600 group-hover:text-primary uppercase tracking-widest">Cole o Extrato de 8 Colunas Aqui</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">O sistema processará a coluna "Disponível" automaticamente.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-10 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="px-10 h-16 font-black uppercase text-[10px] text-slate-400">Descartar</Button>
          <Button onClick={handleIndividualSave} className="px-16 h-20 rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 transition-all active:scale-95">
            <Save className="w-6 h-6 mr-3" /> Gravar no Ledger Permanente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
