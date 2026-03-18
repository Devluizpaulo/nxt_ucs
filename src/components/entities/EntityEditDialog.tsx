"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

      // Ignora cabeçalhos
      const headerKeywords = ['dist', 'data', 'usuário', 'disponível', 'total', 'nome', 'documento'];
      if (headerKeywords.some(key => line.toLowerCase().includes(key))) return;

      if (activePasteField === 'saldoLegadoTotal') {
        // Formato Legado (8 colunas)
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
        // Formato Originação (4 colunas)
        const valor = parseFloat(parts[3]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        results.push({ dist: parts[0], data: parts[1], destino: parts[2], valor });
      } else {
        // Formato Padrão Movimentações (Variável)
        // Busca o valor numérico (geralmente onde tem UCS)
        let valor = 0;
        const ucsPart = parts.find(p => p.toLowerCase().includes('ucs') || /^\d+$/.test(p.replace(/[R$\s.,-]/g, '')));
        if (ucsPart) {
          valor = parseFloat(ucsPart.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        } else {
          valor = parseFloat(parts[parts.length - 2] || parts[parts.length - 1]) || 0;
        }

        // Se for campo redutor, garante sinal negativo
        const redutores = ['movimentacao', 'aposentado', 'bloqueado', 'aquisicao'];
        if (redutores.includes(activePasteField as string) && valor > 0) valor = -valor;

        results.push({ 
          dist: parts[0], 
          data: parts[1], 
          destino: parts[2] || "N/A", 
          valor,
          situacao: parts[parts.length - 1]
        });
      }
    });

    setPreviewRows(results);
  }, [pasteBuffer, activePasteField]);

  const consolidateField = () => {
    if (!activePasteField || previewRows.length === 0) return;

    const total = previewRows.reduce((acc, row) => acc + (row.valor || 0), 0);
    
    // Mapeia o campo para a tabela correspondente
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
      [activePasteField]: total,
      [targetTable]: [...(prev[targetTable] as any[] || []), ...previewRows]
    }));
    
    setPasteBuffer("");
    setPreviewRows([]);
    setActivePasteField(null);
    
    toast({ 
      title: "Dados Consolidados", 
      description: `O campo ${activePasteField.toString().toUpperCase()} foi atualizado com ${previewRows.length} novos registros.` 
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
          <PopoverContent className="w-[500px] p-0 rounded-[2rem] shadow-2xl border-none bg-slate-900 overflow-hidden" side="top">
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
              {previewRows.length > 0 && (
                <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-800/50">
                  <ScrollArea className="h-40">
                    <Table>
                      <TableHeader className="bg-slate-800 sticky top-0">
                        <TableRow className="border-slate-700 hover:bg-transparent h-8">
                          <TableHead className="text-[8px] font-black text-slate-500 uppercase">Ref</TableHead>
                          <TableHead className="text-[8px] font-black text-slate-500 uppercase text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewRows.map((row, i) => (
                          <TableRow key={i} className="border-slate-700 h-8">
                            <TableCell className="py-1 text-[9px] text-slate-400 font-mono truncate max-w-[150px]">{row.dist || row.plataforma || "N/A"}</TableCell>
                            <TableCell className={cn("py-1 text-right font-mono text-[9px] font-black", row.valor < 0 ? "text-rose-400" : "text-emerald-400")}>
                              {row.valor.toLocaleString('pt-BR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
              <Button onClick={consolidateField} disabled={previewRows.length === 0} className="w-full h-12 font-black uppercase text-[10px] bg-primary hover:bg-primary/90 rounded-xl">
                Confirmar e Somar ao Ledger
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

  const SectionHeader = ({ icon: Icon, title, tableField }: { icon: any, title: string, tableField?: keyof EntidadeSaldo }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-[0.2em]">{title}</h3>
      </div>
      {tableField && (formData[tableField] as any[])?.length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => clearTable(tableField)} className="text-[8px] font-black text-rose-500 uppercase h-6">
          <Trash2 className="w-3 h-3 mr-1" /> Limpar Tabela
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden bg-[#F1F5F9] border-none shadow-2xl rounded-[3rem] p-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Editor de Auditoria - {entity.nome}</DialogTitle>
          <DialogDescription>Gestão detalhada de movimentações e saldos do produtor no LedgerTrust.</DialogDescription>
        </DialogHeader>
        
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Final (Auditado)</p>
              <div className="flex items-baseline justify-end gap-2 text-primary">
                <span className="text-5xl font-black tracking-tighter">{(formData.saldoFinalAtual || 0).toLocaleString('pt-BR')}</span>
                <span className="text-xs font-bold opacity-50 uppercase">UCS</span>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-8 space-y-10">
            {/* Seção 1: Resumo de Saldos Atuais */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-slate-400" />
                  <h3 className="text-[11px] font-black uppercase text-slate-900 tracking-[0.2em]">Saldos Atuais (Processamento por Seção)</h3>
                </div>
                <div className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Cole os blocos da planilha nos ícones de calculadora</p>
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

            {/* Seção 2: Tabelas de Histórico Detalhado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tabela de Originação */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
                <SectionHeader icon={Database} title="Histórico de Originação" tableField="tabelaOriginacao" />
                <div className="flex-1 rounded-xl border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="h-10">
                        <TableHead className="text-[8px] font-black uppercase">Dist</TableHead>
                        <TableHead className="text-[8px] font-black uppercase">Data</TableHead>
                        <TableHead className="text-[8px] font-black uppercase text-right">Crédito (UCS)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!formData.tabelaOriginacao || formData.tabelaOriginacao.length === 0) ? (
                        <TableRow><TableCell colSpan={3} className="h-40 text-center text-[9px] font-bold text-slate-300 uppercase">Sem registros</TableCell></TableRow>
                      ) : (
                        formData.tabelaOriginacao.map((row, i) => (
                          <TableRow key={i} className="h-8 border-b border-slate-50">
                            <TableCell className="py-1 text-[9px] font-mono">{row.dist}</TableCell>
                            <TableCell className="py-1 text-[9px]">{row.data}</TableCell>
                            <TableCell className="py-1 text-right font-mono text-[9px] font-black text-emerald-600">{row.valor.toLocaleString('pt-BR')}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Tabela de Movimentações (Débitos) */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
                <SectionHeader icon={Database} title="Movimentações / Débitos" tableField="tabelaMovimentacao" />
                <div className="flex-1 rounded-xl border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="h-10">
                        <TableHead className="text-[8px] font-black uppercase">Dist</TableHead>
                        <TableHead className="text-[8px] font-black uppercase">Data</TableHead>
                        <TableHead className="text-[8px] font-black uppercase text-right">Débito (UCS)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!formData.tabelaMovimentacao || formData.tabelaMovimentacao.length === 0) ? (
                        <TableRow><TableCell colSpan={3} className="h-40 text-center text-[9px] font-bold text-slate-300 uppercase">Sem registros</TableCell></TableRow>
                      ) : (
                        formData.tabelaMovimentacao.map((row, i) => (
                          <TableRow key={i} className="h-8 border-b border-slate-50">
                            <TableCell className="py-1 text-[9px] font-mono">{row.dist}</TableCell>
                            <TableCell className="py-1 text-[9px]">{row.data}</TableCell>
                            <TableCell className="py-1 text-right font-mono text-[9px] font-black text-rose-500">{row.valor.toLocaleString('pt-BR')}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Tabela de IMEI */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
                <SectionHeader icon={Database} title="Detalhamento IMEI" tableField="tabelaImei" />
                <div className="flex-1 rounded-xl border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="h-10">
                        <TableHead className="text-[8px] font-black uppercase">Dist</TableHead>
                        <TableHead className="text-[8px] font-black uppercase">Data</TableHead>
                        <TableHead className="text-[8px] font-black uppercase text-right">Saldo Ajustar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!formData.tabelaImei || formData.tabelaImei.length === 0) ? (
                        <TableRow><TableCell colSpan={3} className="h-40 text-center text-[9px] font-bold text-slate-300 uppercase">Sem registros</TableCell></TableRow>
                      ) : (
                        formData.tabelaImei.map((row, i) => (
                          <TableRow key={i} className="h-8 border-b border-slate-50">
                            <TableCell className="py-1 text-[9px] font-mono">{row.dist}</TableCell>
                            <TableCell className="py-1 text-[9px]">{row.data}</TableCell>
                            <TableCell className="py-1 text-right font-mono text-[9px] font-black text-indigo-600">{row.valor.toLocaleString('pt-BR')}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Tabela de Aquisição */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
                <SectionHeader icon={Database} title="Tabela de Aquisição" tableField="tabelaAquisicao" />
                <div className="flex-1 rounded-xl border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="h-10">
                        <TableHead className="text-[8px] font-black uppercase">Ano</TableHead>
                        <TableHead className="text-[8px] font-black uppercase text-right">Saldo (UCS)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!formData.tabelaAquisicao || formData.tabelaAquisicao.length === 0) ? (
                        <TableRow><TableCell colSpan={2} className="h-40 text-center text-[9px] font-bold text-slate-300 uppercase">Sem registros</TableCell></TableRow>
                      ) : (
                        formData.tabelaAquisicao.map((row, i) => (
                          <TableRow key={i} className="h-8 border-b border-slate-50">
                            <TableCell className="py-1 text-[9px] font-bold uppercase">{row.ano || "N/A"}</TableCell>
                            <TableCell className="py-1 text-right font-mono text-[9px] font-black text-emerald-600">{row.valor.toLocaleString('pt-BR')}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Seção 3: Consolidação Legado */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-slate-400" />
                <h3 className="text-[11px] font-black uppercase text-slate-900 tracking-[0.2em]">Consolidação de Extrato Legado</h3>
              </div>
              <div className="bg-white p-8 rounded-[3rem] border border-slate-200 grid grid-cols-1 lg:grid-cols-4 gap-8 shadow-sm">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Legado Auditado</Label>
                  <Input 
                    type="number"
                    value={formData.saldoLegadoTotal || 0}
                    onChange={e => setFormData({...formData, saldoLegadoTotal: Number(e.target.value)})}
                    className="h-16 rounded-2xl bg-slate-50 border-slate-200 font-mono font-black text-xl text-slate-700 focus:ring-primary shadow-inner"
                  />
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                     <p className="text-[8px] font-black uppercase text-primary leading-tight">Use o ícone de calculadora na seção de Saldos Atuais se quiser automatizar esta soma via colagem de tabela.</p>
                  </div>
                </div>
                
                <div className="lg:col-span-3 rounded-[2.5rem] border border-slate-100 overflow-hidden flex flex-col">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="h-10">
                        <TableHead className="text-[8px] font-black uppercase">Plataforma</TableHead>
                        <TableHead className="text-[8px] font-black uppercase">Nome</TableHead>
                        <TableHead className="text-[8px] font-black uppercase text-right">Disponível</TableHead>
                        <TableHead className="text-[8px] font-black uppercase text-right">Aposentado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!formData.tabelaLegado || formData.tabelaLegado.length === 0) ? (
                        <TableRow><TableCell colSpan={4} className="h-32 text-center text-[9px] font-bold text-slate-300 uppercase">Aguardando inserção de extrato legado</TableCell></TableRow>
                      ) : (
                        formData.tabelaLegado.map((row, i) => (
                          <TableRow key={i} className="h-8 border-b border-slate-50">
                            <TableCell className="py-1 text-[9px] font-bold text-slate-600">{row.plataforma}</TableCell>
                            <TableCell className="py-1 text-[9px] truncate max-w-[150px]">{row.nome}</TableCell>
                            <TableCell className="py-1 text-right font-mono text-[9px] font-black text-primary">{row.disponivel?.toLocaleString('pt-BR')}</TableCell>
                            <TableCell className="py-1 text-right font-mono text-[9px] text-slate-400">{row.aposentado?.toLocaleString('pt-BR')}</TableCell>
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

        <div className="p-8 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="px-10 h-16 font-black uppercase text-[10px] text-slate-400">Descartar</Button>
          <Button onClick={handleIndividualSave} className="px-16 h-20 rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 transition-all active:scale-95">
            <Save className="w-6 h-6 mr-3" /> Gravar no Ledger Permanente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
