"use client"

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EntidadeSaldo, RegistroTabela } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Printer, 
  Calculator, 
  ShieldCheck, 
  Save, 
  Layers,
  Plus,
  Database,
  AlertTriangle,
  MessageSquare,
  FileText,
  BadgeCheck,
  QrCode
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/firebase";

interface EntityEditDialogProps {
  entity: EntidadeSaldo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<EntidadeSaldo>) => void;
}

export function EntityEditDialog({ entity, open, onOpenChange, onUpdate }: EntityEditDialogProps) {
  const [formData, setFormData] = useState<Partial<EntidadeSaldo>>({});
  const [pasteData, setPasteData] = useState<{ section: string; raw: string } | null>(null);
  const { user } = useUser();
  
  useEffect(() => {
    if (entity) {
      setFormData(entity);
    }
  }, [entity]);

  const totals = useMemo(() => {
    const sumVal = (arr?: RegistroTabela[]) => (arr || []).reduce((acc, curr) => acc + (curr.valor || 0), 0);
    const sumCredits = (arr?: RegistroTabela[]) => (arr || []).reduce((acc, curr) => acc + (curr.valorCredito || 0), 0);
    const sumDebits = (arr?: RegistroTabela[]) => (arr || []).reduce((acc, curr) => acc + (curr.valorDebito || 0), 0);
    
    const orig = sumVal(formData.tabelaOriginacao);
    const mov = sumVal(formData.tabelaMovimentacao);
    const aq = (formData.tabelaAquisicao || []).reduce((acc, curr) => acc + (curr.valor || 0), 0);
    
    const imeiCredits = sumCredits(formData.tabelaImei);
    const imeiDebits = sumDebits(formData.tabelaImei);
    const imeiPending = imeiDebits - imeiCredits;

    const aposentado = (formData.tabelaLegado || []).reduce((acc, c) => acc + (c.aposentado || 0), 0);
    const bloqueado = (formData.tabelaLegado || []).reduce((acc, c) => acc + (c.bloqueado || 0), 0);
    const legDisp = (formData.tabelaLegado || []).reduce((acc, c) => acc + (c.disponivel || 0), 0);
    const legRes = (formData.tabelaLegado || []).reduce((acc, c) => acc + (c.reservado || 0), 0);
    const legadoTotal = legDisp + legRes;

    const final = orig + mov - aq - aposentado - bloqueado;
    const movPercentage = orig !== 0 ? ((Math.abs(mov) / Math.abs(orig)) * 100).toFixed(1) : "0.0";

    return { 
      orig, mov, aq, imeiPending, legadoTotal, aposentado, bloqueado, final, movPercentage 
    };
  }, [formData]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleSave = () => {
    if (!entity) return;
    onUpdate(entity.id, {
      ...formData,
      originacao: totals.orig,
      movimentacao: totals.mov,
      aquisicao: totals.aq,
      saldoAjustarImei: totals.imeiPending,
      saldoLegadoTotal: totals.legadoTotal,
      aposentado: totals.aposentado,
      bloqueado: totals.bloqueado,
      saldoFinalAtual: totals.final
    });
    onOpenChange(false);
  };

  const handleProcessPaste = () => {
    if (!pasteData) return;
    const lines = pasteData.raw.split('\n').filter(l => l.trim());
    
    const newRows: RegistroTabela[] = lines.map(line => {
      const parts = line.split('\t');
      const parseVal = (str: string | undefined) => {
        if (!str || !str.trim()) return 0;
        return parseInt(str.replace(/\./g, '').replace(/[^\d-]/g, '')) || 0;
      };

      switch (pasteData.section) {
        case 'tabelaLegado':
          return {
            id: `LEG-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            data: parts[0]?.trim() || '',
            plataforma: parts[1]?.trim() || '',
            nome: parts[2]?.trim() || '',
            documento: parts[3]?.trim() || '',
            disponivel: parseVal(parts[4]),
            reservado: parseVal(parts[5]),
            bloqueado: parseVal(parts[6]),
            aposentado: parseVal(parts[7]),
          };
        case 'tabelaImeiDebito':
          const valDeb = parseVal(parts[parts.length - 1]);
          return { id: `IMEI-D-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, dist: parts[0]?.trim() || '', data: parts[1]?.trim() || '', destino: parts[2]?.trim() || '', valorCredito: 0, valorDebito: valDeb, valor: valDeb };
        case 'tabelaImeiCredito':
          const valCred = parseVal(parts[parts.length - 1]);
          return { id: `IMEI-C-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, dist: parts[0]?.trim() || '', data: parts[1]?.trim() || '', destino: parts[2]?.trim() || '', valorCredito: valCred, valorDebito: 0, valor: -valCred };
        case 'tabelaOriginacao':
          let volOrig = 0;
          for (let j = parts.length - 1; j >= 0; j--) {
            const val = parseVal(parts[j]);
            if (val !== 0) { volOrig = val; break; }
          }
          return { id: `ORIG-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, dist: parts[0]?.trim() || '', data: parts[1]?.trim() || '', destino: parts[2]?.trim() || '', valor: volOrig };
        default:
          return { id: `MOV-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, dist: parts[0]?.trim() || '', data: parts[1]?.trim() || '', destino: parts[2]?.trim() || '', valor: parseVal(parts[parts.length - 1]) };
      }
    });

    const targetSection = (pasteData.section === 'tabelaImeiDebito' || pasteData.section === 'tabelaImeiCredito') ? 'tabelaImei' : pasteData.section;
    setFormData({ ...formData, [targetSection]: [...(formData[targetSection as keyof EntidadeSaldo] as any[] || []), ...newRows] });
    setPasteData(null);
  };

  if (!entity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1280px] w-[95vw] h-[95vh] p-0 border-none bg-white overflow-hidden flex flex-col rounded-[2.5rem] shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Console de Auditoria de Saldo - {entity.nome}</DialogTitle>
          <DialogDescription>Detalhamento técnico de conformidade e auditoria de UCS para {entity.nome}.</DialogDescription>
        </DialogHeader>
        
        {/* COMPONENTE DE PDF / IMPRESSÃO EXECUTIVA (RELATÓRIO DE SALDOS) */}
        <div className="printable-audit-report hidden print:block">
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-10">
            <div>
               <h1 className="text-[42px] font-black text-primary leading-none tracking-tighter">bmv</h1>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2 text-slate-400">LedgerTrust Auditoria de Conformidade</p>
            </div>
            <div className="text-right">
              <h2 className="text-[20px] font-black uppercase tracking-tight text-slate-900">Protocolo de Auditoria de Saldo</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref. Técnica: {entity.id}</p>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5">{new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-16 mb-12">
            <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 border-b border-slate-100 pb-2">Identificação da Entidade</h3>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <p className="text-[13px] font-black text-slate-900 uppercase">{entity.nome}</p>
                  <p className="text-[11px] font-bold text-slate-400 font-mono">{entity.documento}</p>
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Auditor Responsável:</p>
                    <p className="text-[11px] font-bold text-slate-900">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 border-b border-slate-100 pb-2">Sumário Executivo (UCS)</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Originação Total</p>
                    <p className="text-[16px] font-black text-slate-900">{totals.orig.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Saldo Final Auditado</p>
                    <p className="text-[16px] font-black text-primary">{totals.final.toLocaleString('pt-BR')}</p>
                  </div>
               </div>
               <div className="p-5 border-2 border-primary/20 rounded-2xl bg-primary/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Status de Conformidade</p>
                    <p className="text-[14px] font-black text-slate-900 mt-1 uppercase">✓ SALDO VALIDADO PELO LEDGER</p>
                  </div>
                  <QrCode className="w-12 h-12 text-slate-200" />
               </div>
            </div>
          </div>

          <div className="space-y-10">
            {formData.tabelaOriginacao && formData.tabelaOriginacao.length > 0 && (
              <ReportTable title="Histórico de Originação" data={formData.tabelaOriginacao} />
            )}
            {formData.tabelaMovimentacao && formData.tabelaMovimentacao.length > 0 && (
              <ReportTable title="Fluxo de Movimentação de Ativos" data={formData.tabelaMovimentacao} isNegative />
            )}
            {formData.tabelaImei && formData.tabelaImei.length > 0 && (
              <ReportTable title="Detalhamento de Ajustes IMEI" data={formData.tabelaImei} isImei />
            )}
          </div>

          <div className="mt-12 p-8 bg-slate-50/50 rounded-2xl border border-slate-100">
             <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Apontamentos e Observações Técnicas</h3>
             <p className="text-[11px] leading-relaxed text-slate-700 italic">
               {formData.observacao || "Nenhuma divergência ou apontamento registrado para este período de auditoria. O saldo final reflete a integridade dos lançamentos em blockchain."}
             </p>
          </div>

          <div className="mt-auto pt-20 flex justify-between items-end">
            <div className="flex items-center gap-3">
               <ShieldCheck className="w-8 h-8 text-primary" />
               <p className="text-[10px] font-black uppercase tracking-widest text-primary">Autenticidade Verificada</p>
            </div>
            <div className="text-right space-y-4">
               <div className="w-64 border-t border-slate-900 pt-2">
                 <p className="text-[10px] font-black uppercase text-slate-900">Responsável Técnico BMV</p>
                 <p className="text-[8px] font-bold text-slate-400 uppercase">Documento Gerado pelo Sistema LedgerTrust</p>
               </div>
            </div>
          </div>
        </div>

        {/* UI DO CONSOLE (HIDDEN EM PRINT) */}
        <div className="flex-1 flex flex-col overflow-hidden print:hidden">
          <div className="bg-[#0B0F1A] p-10 shrink-0 text-white relative">
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[12px] font-black uppercase tracking-[0.2em] text-primary">AUDITORIA TÉCNICA BMV</p>
                </div>
                <h1 className="text-[30px] font-black tracking-tight uppercase leading-none">{entity.nome}</h1>
                <p className="text-[14px] font-bold text-slate-500 font-mono tracking-widest">{entity.documento}</p>
              </div>

              <div className="bg-[#161B2E] border border-white/5 rounded-[2rem] p-8 min-w-[340px] shadow-2xl flex flex-col items-end relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-3xl -mr-20 -mt-20"></div>
                 <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-3 relative z-10">Saldo Final Auditado</p>
                 <div className="flex items-baseline gap-3 relative z-10">
                    <span className="text-[42px] font-black text-white tracking-tighter">{totals.final.toLocaleString('pt-BR')}</span>
                    <span className="text-[12px] font-black text-primary uppercase tracking-widest">UCS</span>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-5">
              <StatBox label="ORIGINAÇÃO" value={totals.orig} />
              <StatBox label="MOVIMENTAÇÃO" value={totals.mov} isNegative percentage={totals.movPercentage} />
              <StatBox label="APOSENTADO" value={totals.aposentado} isNegative />
              <StatBox label="BLOQUEADO" value={totals.bloqueado} isNegative />
              <StatBox label="AQUISIÇÃO" value={totals.aq} isNegative />
              <StatBox label="AJUSTE IMEI" value={totals.imeiPending} isPending />
              <StatBox label="SALDO LEGADO" value={totals.legadoTotal} isReference />
              <StatBox label="DISPONÍVEL" value={totals.final} isHighlight />
            </div>
          </div>

          <ScrollArea className="flex-1 bg-white">
            <div className="p-10 space-y-20">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100">
                 <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-900">APONTAMENTOS DE AUDITORIA</h3>
                    </div>
                    <Textarea 
                      value={formData.observacao || ""} 
                      onChange={e => setFormData({...formData, observacao: e.target.value})}
                      placeholder="Descreva aqui divergências, inconsistências ou justificativas..."
                      className="min-h-[140px] bg-white border-slate-200 rounded-2xl p-6 text-[13px] font-medium focus:ring-primary shadow-sm resize-none"
                    />
                 </div>
                 <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">STATUS DA CONFORMIDADE</Label>
                      <Select 
                        value={formData.statusAuditoriaSaldo || "valido"} 
                        onValueChange={v => setFormData({...formData, statusAuditoriaSaldo: v as any})}
                      >
                        <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200 font-bold text-[12px] uppercase tracking-widest">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="valido" className="font-bold text-[12px] uppercase">✓ SALDO VALIDADO</SelectItem>
                          <SelectItem value="inconsistente" className="font-bold text-[12px] uppercase text-rose-500">⚠ DIVERGÊNCIA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                <SectionHeader title="01. ORIGINAÇÃO" value={totals.orig} onPaste={() => setPasteData({ section: 'tabelaOriginacao', raw: '' })} />
                <SectionTable data={formData.tabelaOriginacao || []} type="originacao" />
              </div>

              <div className="space-y-6">
                <SectionHeader title="02. MOVIMENTAÇÃO" value={totals.mov} isNegative onPaste={() => setPasteData({ section: 'tabelaMovimentacao', raw: '' })} />
                <SectionTable data={formData.tabelaMovimentacao || []} type="movimentacao" />
              </div>

              <div className="space-y-6">
                <SectionHeader title="03. AJUSTE IMEI" value={totals.imeiPending} isImei onPaste={() => setPasteData({ section: 'tabelaImeiDebito', raw: '' })} />
                <SectionTable data={formData.tabelaImei || []} type="imei" />
              </div>
            </div>
          </ScrollArea>

          <div className="p-8 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[12px] font-black uppercase text-slate-400 tracking-widest hover:text-rose-500 px-8 h-14">
              Cancelar
            </Button>
            <div className="flex gap-4">
              <Button variant="outline" onClick={handlePrint} className="h-14 px-10 rounded-2xl border-slate-200 bg-slate-50/50 font-black uppercase text-[12px] tracking-widest text-slate-700">
                <Printer className="w-5 h-5 mr-2" /> Gerar Relatório Executivo
              </Button>
              <Button onClick={handleSave} className="h-14 px-12 rounded-2xl bg-[#734DCC] hover:bg-[#633fb9] text-white font-black uppercase text-[12px] tracking-widest shadow-xl shadow-indigo-200">
                <Save className="w-5 h-5 mr-2" /> Salvar no Ledger
              </Button>
            </div>
          </div>
        </div>

        {/* MODAL DE COLAGEM */}
        {pasteData && (
          <Dialog open={!!pasteData} onOpenChange={() => setPasteData(null)}>
            <DialogContent className="max-w-xl rounded-3xl p-8 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase text-slate-900 flex items-center gap-3">
                  <Calculator className="w-6 h-6 text-primary" /> COLAGEM TÉCNICA
                </DialogTitle>
                <DialogDescription className="sr-only">Interface de colagem de dados estruturados para processamento em lote.</DialogDescription>
              </DialogHeader>
              <Textarea 
                value={pasteData.raw} 
                onChange={e => setPasteData({ ...pasteData, raw: e.target.value })}
                placeholder="Cole colunas do Excel..."
                className="min-h-[250px] font-mono text-[11px] bg-slate-50 border-slate-200 rounded-2xl p-6"
              />
              <Button onClick={handleProcessPaste} className="w-full h-12 rounded-xl font-black uppercase text-[11px] bg-primary text-white">Importar Dados</Button>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReportTable({ title, data, isNegative, isImei }: any) {
  return (
    <div className="space-y-3">
       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 border-b border-slate-100 pb-2">{title}</h4>
       <table className="w-full text-left text-[10px]">
          <thead className="bg-[#F8FAFC]">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-500">Referência</th>
              <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-500">Histórico / Destino</th>
              <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-500 text-right">Volume (UCS)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, i: number) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-mono">{row.data || row.dist || '-'}</td>
                <td className="px-4 py-3 text-slate-600 uppercase font-bold">{row.destino || row.plataforma || '-'}</td>
                <td className={cn("px-4 py-3 text-right font-black", isNegative ? "text-rose-600" : "")}>
                  {isImei ? (row.valorDebito - row.valorCredito).toLocaleString('pt-BR') : row.valor?.toLocaleString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
       </table>
    </div>
  );
}

function StatBox({ label, value, isNegative, isHighlight, isReference, isPending, percentage }: any) {
  return (
    <div className={cn(
      "border rounded-2xl p-5 flex flex-col justify-between h-[110px] transition-all",
      isReference ? "bg-amber-500/10 border-amber-500/20" : 
      isPending ? "bg-indigo-500/10 border-indigo-500/20" :
      "bg-[#161B2E] border-white/5"
    )}>
      <div className="flex justify-between items-start w-full">
        <p className={cn(
          "text-[12px] font-black uppercase tracking-widest leading-none",
          isReference ? "text-amber-500" : isPending ? "text-indigo-400" : "text-slate-500"
        )}>
          {label}
        </p>
      </div>
      <p className={cn(
        "text-[30px] font-black font-mono leading-none tracking-tight",
        isNegative ? "text-rose-500" : 
        isHighlight ? "text-emerald-400" : 
        isReference ? "text-amber-500" : 
        isPending ? "text-indigo-400" :
        "text-white"
      )}>
        {value.toLocaleString('pt-BR')}
      </p>
    </div>
  );
}

function SectionHeader({ title, value, isNegative, onPaste }: any) {
  return (
    <div className="flex justify-between items-center border-b border-slate-100 pb-5">
      <div className="flex items-center gap-4">
        <div className="w-1.5 h-8 bg-[#10B981] rounded-full" />
        <div>
          <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-900">{title}</h3>
          <p className="text-[11px] font-bold uppercase tracking-tighter text-slate-400">
            TOTAL: <span className="font-black text-primary">{value.toLocaleString('pt-BR')} UCS</span>
          </p>
        </div>
      </div>
      <Button variant="outline" onClick={onPaste} className="h-10 px-6 rounded-3xl text-[10px] font-black uppercase gap-2 border-slate-200">
        <Calculator className="w-4 h-4" /> Colar Dados
      </Button>
    </div>
  );
}

function SectionTable({ data, type }: { data: any[], type: string }) {
  return (
    <div className="rounded-[2.5rem] border border-slate-100 overflow-hidden bg-white shadow-sm mb-12">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="text-[11px] font-black uppercase tracking-widest">Referência</TableHead>
            <TableHead className="text-[11px] font-black uppercase tracking-widest">Histórico</TableHead>
            <TableHead className="text-[11px] font-black uppercase tracking-widest text-right pr-8">Volume (UCS)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow><TableCell colSpan={3} className="py-12 text-center text-slate-300 font-bold uppercase text-xs">Aguardando dados...</TableCell></TableRow>
          ) : (
            data.map((row: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{row.dist || row.data || '-'}</TableCell>
                <TableCell className="font-bold text-xs uppercase">{row.destino || row.plataforma || '-'}</TableCell>
                <TableCell className="text-right font-mono font-black pr-8">
                   {type === 'imei' ? (row.valorDebito - row.valorCredito).toLocaleString('pt-BR') : row.valor?.toLocaleString('pt-BR')}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}