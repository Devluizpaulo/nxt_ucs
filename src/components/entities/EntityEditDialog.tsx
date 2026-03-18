"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EntidadeSaldo, RegistroTabela } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Database, ShieldCheck, Table as TableIcon, Calculator, CheckCircle2, Trash2 } from "lucide-react";
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

export function EntityEditDialog({ entity, open, onOpenChange, onUpdate }: EntityEditDialogProps) {
  const [formData, setFormData] = useState<Partial<EntidadeSaldo>>({});
  const [activePasteField, setActivePasteField] = useState<keyof EntidadeSaldo | null>(null);
  const [pasteBuffer, setPasteBuffer] = useState("");
  const [previewRows, setPreviewRows] = useState<RegistroTabela[]>([]);

  useEffect(() => {
    if (entity) {
      setFormData(entity);
      setPasteBuffer("");
      setPreviewRows([]);
    }
  }, [entity]);

  // Cálculo Automático do Saldo Final Baseado nos Totais Consolidados
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

  // Parser inteligente de linhas de planilha baseado no tipo de campo
  useEffect(() => {
    if (!pasteBuffer.trim()) {
      setPreviewRows([]);
      return;
    }

    const lines = pasteBuffer.split('\n').filter(l => l.trim());
    const results: RegistroTabela[] = [];

    lines.forEach(line => {
      const parts = line.split('\t');
      if (parts.length < 2) return;

      const headerKeywords = ['dist', 'data', 'usuário', 'disponível', 'total', 'nome', 'documento', 'plataforma'];
      if (headerKeywords.some(key => line.toLowerCase().includes(key))) return;

      if (activePasteField === 'saldoLegadoTotal') {
        if (parts.length >= 5) {
          results.push({
            data: parts[0]?.trim(),
            plataforma: parts[1]?.trim(),
            nome: parts[2]?.trim(),
            documento: parts[3]?.trim(),
            disponivel: parseFloat(parts[4]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
            reservado: parseFloat(parts[5]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
            bloqueado: parseFloat(parts[6]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
            aposentado: parseFloat(parts[7]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
            valor: parseFloat(parts[4]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
          });
        }
      } else if (activePasteField === 'originacao') {
        const valor = parseFloat(parts[parts.length - 2]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        results.push({ 
          dist: parts[0]?.trim(), 
          data: parts[1]?.trim(), 
          destino: parts[2]?.trim(), 
          valor 
        });
      } else if (activePasteField === 'saldoAjustarImei') {
        const credito = parseFloat(parts[parts.length - 2]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        const debito = parseFloat(parts[parts.length - 1]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        results.push({
          dist: parts[0]?.trim(),
          data: parts[1]?.trim(),
          destino: parts[2]?.trim(),
          valor: credito - debito
        });
      } else if (activePasteField === 'aquisicao') {
        const valor = parseFloat(parts[parts.length - 1]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        results.push({
          nome: parts[0]?.trim(),
          ano: "Múltiplos",
          valor: -valor
        });
      } else {
        const valorRaw = parts[parts.length - 2]?.replace(/[R$\s.]/g, '').replace(',', '.') || "0";
        const valor = parseFloat(valorRaw) || 0;
        results.push({ 
          dist: parts[0]?.trim(), 
          data: parts[1]?.trim(), 
          destino: parts[2]?.trim(), 
          valor: -valor,
          situacao: parts[parts.length - 1]?.trim()
        });
      }
    });

    setPreviewRows(results);
  }, [pasteBuffer, activePasteField]);

  const consolidateField = () => {
    if (!activePasteField || previewRows.length === 0) return;

    const totalCalculated = previewRows.reduce((acc, row) => acc + (row.valor || 0), 0);
    
    const tableMapping: Record<string, keyof EntidadeSaldo> = {
      originacao: 'tabelaOriginacao',
      movimentacao: 'tabelaMovimentacao',
      aposentado: 'tabelaMovimentacao',
      bloqueado: 'tabelaMovimentacao',
      aquisicao: 'tabelaAquisicao',
      saldoAjustarImei: 'tabelaImei',
      saldoLegadoTotal: 'tabelaLegado'
    };

    const targetTable = tableMapping[activePasteField as string];
    
    setFormData(prev => ({ 
      ...prev, 
      [activePasteField]: totalCalculated,
      [targetTable]: previewRows
    }));
    
    setPasteBuffer("");
    setPreviewRows([]);
    setActivePasteField(null);
    
    toast({ 
      title: "Consolidação Concluída", 
      description: `Campo ${activePasteField.toString().toUpperCase()} atualizado.` 
    });
  };

  const handleIndividualSave = () => {
    if (!entity) return;
    onUpdate(entity.id, formData);
    onOpenChange(false);
  };

  const clearTable = (field: keyof EntidadeSaldo) => {
    setFormData(prev => ({ ...prev, [field]: [] }));
    toast({ variant: "destructive", title: "Tabela limpa" });
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
          <PopoverContent className="w-[550px] p-0 rounded-[2rem] shadow-2xl border-none bg-slate-900 overflow-hidden" side="top">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Consolidar {label}</p>
                </div>
                {previewRows.length > 0 && (
                  <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-1 rounded-md">
                    TOTAL: {previewRows.reduce((a, b) => a + b.valor, 0).toLocaleString('pt-BR')} UCS
                  </span>
                )}
              </div>
              <Textarea 
                value={pasteBuffer}
                onChange={e => setPasteBuffer(e.target.value)}
                placeholder="Cole as colunas da planilha aqui..."
                className="bg-slate-800 border-slate-700 text-[9px] font-mono h-32 resize-none text-slate-300 rounded-xl"
              />
              <Button onClick={consolidateField} disabled={previewRows.length === 0} className="w-full h-12 font-black uppercase text-[10px] bg-primary rounded-xl">
                Confirmar e Popular Tabela
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className={cn("text-sm font-bold font-mono py-1 px-1 rounded", color)}>
        {(formData[field] as number || 0).toLocaleString('pt-BR')}
      </div>
    </div>
  );

  const SectionHeader = ({ icon: Icon, title, tableField }: { icon: any, title: string, tableField?: keyof EntidadeSaldo }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-[0.2em]">{title}</h3>
      </div>
      {tableField && (formData[tableField] as any[])?.length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => clearTable(tableField)} className="text-[8px] font-black text-rose-500 uppercase h-6">
          <Trash2 className="w-3 h-3 mr-1" /> Limpar
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden bg-[#F1F5F9] border-none shadow-2xl rounded-[3rem] p-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Auditoria Permanente LedgerTrust - {entity.nome}</DialogTitle>
          <DialogDescription>Gestão detalhada de movimentações técnicas e saldos auditados.</DialogDescription>
        </DialogHeader>
        
        {/* Cabeçalho Fixo */}
        <div className="bg-slate-900 p-8 text-white shrink-0">
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Final Auditado</p>
              <div className="flex items-baseline justify-end gap-2 text-primary">
                <span className="text-5xl font-black tracking-tighter">{(formData.saldoFinalAtual || 0).toLocaleString('pt-BR')}</span>
                <span className="text-xs font-bold opacity-50 uppercase">UCS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Área de Rolagem Principal */}
        <ScrollArea className="flex-1">
          <div className="p-8 space-y-10">
            {/* Consolidação de Saldos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-slate-400" />
                  <h3 className="text-[11px] font-black uppercase text-slate-900 tracking-[0.2em]">Consolidação de Saldos (Processamento por Guia)</h3>
                </div>
                <div className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Calculadora atualiza automaticamente as tabelas abaixo</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm bg-white">
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

            {/* Tabelas de Histórico */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Originação */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
                <SectionHeader icon={Database} title="Histórico de Originação" tableField="tabelaOriginacao" />
                <div className="flex-1 rounded-xl border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="h-10">
                        <TableHead className="text-[8px] font-black uppercase">Dist.</TableHead>
                        <TableHead className="text-[8px] font-black uppercase">Data Inicio</TableHead>
                        <TableHead className="text-[8px] font-black uppercase">Usuário Destino</TableHead>
                        <TableHead className="text-[8px] font-black uppercase text-right">Crédito (UCS)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!formData.tabelaOriginacao || formData.tabelaOriginacao.length === 0) ? (
                        <TableRow><TableCell colSpan={4} className="h-48 text-center text-[9px] font-bold text-slate-300 uppercase">Aguardando dados de Originação</TableCell></TableRow>
                      ) : (
                        formData.tabelaOriginacao.map((row, i) => (
                          <TableRow key={i} className="h-8 border-b border-slate-50">
                            <TableCell className="py-1 text-[9px] font-mono">{row.dist}</TableCell>
                            <TableCell className="py-1 text-[9px] text-slate-500">{row.data}</TableCell>
                            <TableCell className="py-1 text-[9px] truncate max-w-[120px]">{row.destino}</TableCell>
                            <TableCell className="py-1 text-right font-mono text-[9px] font-black text-emerald-600">{row.valor?.toLocaleString('pt-BR')}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Movimentações */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
                <SectionHeader icon={Database} title="Histórico de Movimentações" tableField="tabelaMovimentacao" />
                <div className="flex-1 rounded-xl border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="h-10">
                        <TableHead className="text-[8px] font-black uppercase">Dist.</TableHead>
                        <TableHead className="text-[8px] font-black uppercase">Data Inicio</TableHead>
                        <TableHead className="text-[8px] font-black uppercase">Usuário Destino</TableHead>
                        <TableHead className="text-[8px] font-black uppercase text-right">Débito (UCS)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!formData.tabelaMovimentacao || formData.tabelaMovimentacao.length === 0) ? (
                        <TableRow><TableCell colSpan={4} className="h-48 text-center text-[9px] font-bold text-slate-300 uppercase">Aguardando dados de Movimentação</TableCell></TableRow>
                      ) : (
                        formData.tabelaMovimentacao.map((row, i) => (
                          <TableRow key={i} className="h-8 border-b border-slate-50">
                            <TableCell className="py-1 text-[9px] font-mono">{row.dist}</TableCell>
                            <TableCell className="py-1 text-[9px] text-slate-500">{row.data}</TableCell>
                            <TableCell className="py-1 text-[9px] truncate max-w-[120px]">{row.destino}</TableCell>
                            <TableCell className="py-1 text-right font-mono text-[9px] font-black text-rose-500">{Math.abs(row.valor || 0)?.toLocaleString('pt-BR')}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* IMEI */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
                <SectionHeader icon={Database} title="Detalhamento IMEI" tableField="tabelaImei" />
                <div className="flex-1 rounded-xl border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="h-10">
                        <TableHead className="text-[8px] font-black uppercase">Dist.</TableHead>
                        <TableHead className="text-[8px] font-black uppercase">Data Inicio</TableHead>
                        <TableHead className="text-[8px] font-black uppercase">Usuário Destino</TableHead>
                        <TableHead className="text-[8px] font-black uppercase text-right">Saldo Ajuste</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!formData.tabelaImei || formData.tabelaImei.length === 0) ? (
                        <TableRow><TableCell colSpan={4} className="h-48 text-center text-[9px] font-bold text-slate-300 uppercase">Aguardando dados de IMEI</TableCell></TableRow>
                      ) : (
                        formData.tabelaImei.map((row, i) => (
                          <TableRow key={i} className="h-8 border-b border-slate-50">
                            <TableCell className="py-1 text-[9px] font-mono">{row.dist}</TableCell>
                            <TableCell className="py-1 text-[9px] text-slate-500">{row.data}</TableCell>
                            <TableCell className="py-1 text-[9px] truncate max-w-[120px]">{row.destino}</TableCell>
                            <TableCell className="py-1 text-right font-mono text-[9px] font-black text-indigo-600">{row.valor?.toLocaleString('pt-BR')}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Legado */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
                <SectionHeader icon={Database} title="Extrato Legado Auditado" tableField="tabelaLegado" />
                <div className="flex-1 rounded-xl border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="h-10">
                        <TableHead className="text-[8px] font-black uppercase">Plataforma</TableHead>
                        <TableHead className="text-[8px] font-black uppercase text-right">Disponível</TableHead>
                        <TableHead className="text-[8px] font-black uppercase text-right">Aposentado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!formData.tabelaLegado || formData.tabelaLegado.length === 0) ? (
                        <TableRow><TableCell colSpan={3} className="h-48 text-center text-[9px] font-bold text-slate-300 uppercase">Aguardando extrato legado</TableCell></TableRow>
                      ) : (
                        formData.tabelaLegado.map((row, i) => (
                          <TableRow key={i} className="h-8 border-b border-slate-50">
                            <TableCell className="py-1 text-[9px] font-black text-slate-500 uppercase">{row.plataforma}</TableCell>
                            <TableCell className="py-1 text-right font-mono text-[9px] font-black text-primary">{row.disponivel?.toLocaleString('pt-BR')}</TableCell>
                            <TableCell className="py-1 text-right font-mono text-[9px] text-rose-400">{row.aposentado?.toLocaleString('pt-BR')}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Rodapé Fixo */}
        <div className="p-8 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="px-10 h-16 font-black uppercase text-[10px] text-slate-400">Descartar</Button>
          <Button onClick={handleIndividualSave} className="px-16 h-20 rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 transition-all active:scale-95">
            <Save className="w-6 h-6 mr-3" /> Gravar Auditoria Permanente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
