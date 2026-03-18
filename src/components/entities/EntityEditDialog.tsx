
"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EntidadeSaldo, RegistroTabela } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Database, ShieldCheck, Table as TableIcon, Calculator, Plus, X, AlertCircle, Layers, History, Download, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

  // Cálculo automático do Saldo Final Auditado conforme a regra de negócio
  useEffect(() => {
    const final = 
      (formData.originacao || 0) + 
      (formData.movimentacao || 0) + 
      (formData.aposentado || 0) + 
      (formData.bloqueado || 0) + 
      (formData.aquisicao || 0) +
      (formData.saldoAjustarImei || 0) +
      (formData.saldoLegadoTotal || 0);
    
    if (final !== formData.saldoFinalAtual) {
      setFormData(prev => ({ ...prev, saldoFinalAtual: final }));
    }
  }, [formData.originacao, formData.movimentacao, formData.aposentado, formData.bloqueado, formData.aquisicao, formData.saldoAjustarImei, formData.saldoLegadoTotal]);

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

      const headerKeywords = ['dist', 'data', 'usuário', 'disponível', 'total', 'nome', 'documento', 'plataforma', 'originação'];
      if (headerKeywords.some(key => line.toLowerCase().includes(key))) return;

      if (activePasteField === 'saldoLegadoTotal') {
        if (parts.length >= 8) {
          const disp = parseFloat(parts[4]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
          const res = parseFloat(parts[5]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
          results.push({
            data: parts[0]?.trim(),
            plataforma: parts[1]?.trim(),
            nome: parts[2]?.trim(),
            documento: parts[3]?.trim(),
            disponivel: disp,
            reservado: res,
            bloqueado: parseFloat(parts[6]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
            aposentado: parseFloat(parts[7]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
            valor: disp + res,
          });
        }
      } else if (activePasteField === 'originacao') {
        const valor = parseFloat(parts[parts.length - 2]?.replace(/[R$\s.]/g, '').replace(',', '.') || parts[parts.length - 1]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        results.push({ dist: parts[0]?.trim(), data: parts[1]?.trim(), destino: parts[2]?.trim(), valor });
      } else if (activePasteField === 'saldoAjustarImei') {
        const cred = parseFloat(parts[parts.length - 2]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        const deb = parseFloat(parts[parts.length - 1]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        results.push({ dist: parts[0]?.trim(), data: parts[1]?.trim(), destino: parts[2]?.trim(), valor: cred - deb, valorCredito: cred, valorDebito: deb });
      } else if (activePasteField === 'aquisicao') {
        const val = parseFloat(parts[parts.length - 1]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        results.push({ nome: parts[0]?.trim() || "Aquisição", ano: parts[parts.length - 3] || "N/A", valor: -val });
      } else {
        const val = parseFloat(parts[parts.length - 2]?.replace(/[R$\s.]/g, '').replace(',', '.') || "0") || 0;
        results.push({ dist: parts[0]?.trim(), data: parts[1]?.trim(), destino: parts[2]?.trim(), valor: -val, situacao: parts[parts.length - 1]?.trim() });
      }
    });

    setPreviewRows(results);
  }, [pasteBuffer, activePasteField]);

  const consolidateField = () => {
    if (!activePasteField || previewRows.length === 0) return;

    const total = previewRows.reduce((acc, row) => acc + (row.valor || 0), 0);
    const tableMap: Record<string, keyof EntidadeSaldo> = {
      originacao: 'tabelaOriginacao',
      movimentacao: 'tabelaMovimentacao',
      aposentado: 'tabelaMovimentacao',
      bloqueado: 'tabelaMovimentacao',
      aquisicao: 'tabelaAquisicao',
      saldoAjustarImei: 'tabelaImei',
      saldoLegadoTotal: 'tabelaLegado'
    };

    setFormData(prev => ({ 
      ...prev, 
      [activePasteField]: total,
      [tableMap[activePasteField as string]]: previewRows
    }));
    
    setPasteBuffer("");
    setPreviewRows([]);
    setActivePasteField(null);
    toast({ title: "Dados Consolidados", description: "O Ledger foi atualizado com o histórico importado." });
  };

  if (!entity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] h-[90vh] flex flex-col p-0 border-none bg-white shadow-2xl overflow-hidden rounded-3xl">
        <DialogHeader className="px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-20 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-black text-slate-900">Auditoria de Produtor - {entity.nome}</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Painel de conformidade e rastreabilidade LedgerTrust
            </DialogDescription>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 bg-slate-50/30">
          <div className="p-8 space-y-10">
            
            {/* CABEÇALHO EXECUTIVO DE SALDOS */}
            <div className="bg-[#0F172A] rounded-3xl p-10 flex justify-between items-end shadow-2xl shadow-slate-200">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Saldo Atualizado Ledger</span>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-white">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Documento</span>
                    <span className="text-sm font-mono font-bold">{entity.documento}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Localização</span>
                    <span className="text-sm font-bold">{entity.uf || "MT"} - Brasil</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Saldo Final Auditado</span>
                <div className="flex items-baseline gap-2 text-primary">
                  <span className="text-6xl font-black tracking-tighter">{(formData.saldoFinalAtual || 0).toLocaleString('pt-BR')}</span>
                  <span className="text-xl font-black opacity-60">UCS</span>
                </div>
              </div>
            </div>

            {/* SEÇÕES TÉCNICAS */}
            <div className="space-y-12">
              
              <TechnicalSection 
                title="Sessão de Originação"
                activeField="originacao"
                setActiveField={setActivePasteField}
                pasteBuffer={pasteBuffer}
                setPasteBuffer={setPasteBuffer}
                previewRows={previewRows}
                onImport={consolidateField}
                data={formData.tabelaOriginacao || []}
                currentValue={formData.originacao || 0}
                columns={[
                  { label: "Dist.", key: "dist" },
                  { label: "Data Inicio", key: "data" },
                  { label: "Usuário Destino", key: "destino" },
                  { label: "Crédito (UCS)", key: "valor", align: "right", color: "text-emerald-600 font-black" }
                ]}
              />

              <TechnicalSection 
                title="Sessão de Movimentações"
                activeField="movimentacao"
                setActiveField={setActivePasteField}
                pasteBuffer={pasteBuffer}
                setPasteBuffer={setPasteBuffer}
                previewRows={previewRows}
                onImport={consolidateField}
                data={formData.tabelaMovimentacao || []}
                currentValue={formData.movimentacao || 0}
                columns={[
                  { label: "Dist.", key: "dist" },
                  { label: "Data Inicio", key: "data" },
                  { label: "Usuário Destino", key: "destino" },
                  { label: "Débito (UCS)", key: "valor", align: "right", color: "text-rose-500 font-black" }
                ]}
              />

              <TechnicalSection 
                title="Transferências IMEI (Ajuste)"
                activeField="saldoAjustarImei"
                setActiveField={setActivePasteField}
                pasteBuffer={pasteBuffer}
                setPasteBuffer={setPasteBuffer}
                previewRows={previewRows}
                onImport={consolidateField}
                data={formData.tabelaImei || []}
                currentValue={formData.saldoAjustarImei || 0}
                columns={[
                  { label: "Dist.", key: "dist" },
                  { label: "Crédito", key: "valorCredito", color: "text-emerald-600" },
                  { label: "Débito", key: "valorDebito", color: "text-rose-500" },
                  { label: "Líquido (UCS)", key: "valor", align: "right", font: "mono", color: "text-primary font-black" }
                ]}
              />

              <TechnicalSection 
                title="Aquisição de UCs (Empresa)"
                activeField="aquisicao"
                setActiveField={setActivePasteField}
                pasteBuffer={pasteBuffer}
                setPasteBuffer={setPasteBuffer}
                previewRows={previewRows}
                onImport={consolidateField}
                data={formData.tabelaAquisicao || []}
                currentValue={formData.aquisicao || 0}
                columns={[
                  { label: "Usuário", key: "nome" },
                  { label: "Ano", key: "ano", align: "center" },
                  { label: "Volume (UCS)", key: "valor", align: "right", color: "text-rose-500 font-black" }
                ]}
              />

              <TechnicalSection 
                title="Saldo Legado Auditado"
                activeField="saldoLegadoTotal"
                setActiveField={setActivePasteField}
                pasteBuffer={pasteBuffer}
                setPasteBuffer={setPasteBuffer}
                previewRows={previewRows}
                onImport={consolidateField}
                data={formData.tabelaLegado || []}
                currentValue={formData.saldoLegadoTotal || 0}
                variant="amber"
                columns={[
                  { label: "Data Atualização", key: "data" },
                  { label: "Plataforma", key: "plataforma" },
                  { label: "Disponível", key: "disponivel", align: "right" },
                  { label: "Reservado", key: "reservado", align: "right" },
                  { label: "Total Linha (UCS)", key: "valor", align: "right", color: "text-primary font-black" }
                ]}
              />

            </div>
          </div>
        </ScrollArea>

        <div className="p-8 border-t border-slate-100 bg-white flex justify-between items-center sticky bottom-0 z-20">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[10px] font-black uppercase text-slate-400 hover:text-rose-500">
            Descartar Auditoria
          </Button>
          <div className="flex gap-4">
             <Button variant="outline" className="gap-2 font-black uppercase text-[10px] h-12 px-8 rounded-xl border-slate-200">
                <Download className="w-4 h-4" /> Exportar Registro
             </Button>
             <Button onClick={() => { onUpdate(entity.id, formData); onOpenChange(false); }} className="bg-primary hover:bg-primary/90 text-white px-12 h-14 rounded-xl font-black uppercase text-xs shadow-xl shadow-primary/20 flex gap-3 transition-all active:scale-95">
               <Save className="w-5 h-5" /> Gravar Auditoria Permanente
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TechnicalSection({ title, activeField, setActiveField, pasteBuffer, setPasteBuffer, previewRows, onImport, data, columns, variant, currentValue }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-2 h-8 rounded-full",
            variant === 'amber' ? "bg-amber-500" : "bg-primary"
          )} />
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">{title}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              Saldo Consolidado: <span className={cn("font-black", currentValue < 0 ? "text-rose-500" : "text-emerald-600")}>{currentValue.toLocaleString('pt-BR')} UCS</span>
            </p>
          </div>
        </div>

        <Popover onOpenChange={(open) => {
          if (!open) { setPasteBuffer(""); setActiveField(null); }
          else { setActiveField(activeField); }
        }}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="border-primary/20 text-primary h-10 px-6 rounded-full font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-primary/5">
              <Plus className="w-3.5 h-3.5" /> Colagem via Calculadora
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[500px] p-6 rounded-2xl bg-white border-slate-200 shadow-3xl" side="top" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <Calculator className="w-4 h-4" /> Processador Excel: {title}
                </p>
                {previewRows.length > 0 && <Badge className="bg-emerald-100 text-emerald-600 font-black text-[9px]">{previewRows.length} LINHAS</Badge>}
              </div>
              <Textarea 
                value={pasteBuffer} 
                onChange={e => setPasteBuffer(e.target.value)}
                placeholder="Copie as colunas da planilha e cole aqui..."
                className="bg-slate-50 border-slate-100 text-slate-900 font-mono text-[10px] h-32 resize-none rounded-xl p-4"
              />
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Saldo a ser aplicado</p>
                  <p className="text-lg font-black text-primary">
                    {previewRows.reduce((acc, r) => acc + (r.valor || 0), 0).toLocaleString('pt-BR')} <span className="text-[10px] opacity-60">UCS</span>
                  </p>
                </div>
                <Button onClick={onImport} disabled={previewRows.length === 0} className="bg-primary text-white font-black uppercase text-[10px] h-10 px-6 rounded-lg">
                  Confirmar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <ScrollArea className="h-[280px]">
          <Table>
            <TableHeader className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="h-12 border-b border-slate-100">
                {columns.map((col: any) => (
                  <TableHead key={col.label} className={cn("text-[9px] font-black uppercase tracking-widest text-slate-400 px-6", col.align === 'right' && "text-right", col.align === 'center' && "text-center")}>
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30 gap-2">
                      <History className="w-8 h-8 text-slate-300" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Histórico de Auditoria Vazio</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row: any, i: number) => (
                  <TableRow key={i} className="group border-b border-slate-50 last:border-0 hover:bg-emerald-50/30 transition-colors">
                    {columns.map((col: any) => (
                      <TableCell key={col.label} className={cn("py-4 px-6 text-[10px] font-bold text-slate-600", col.align === 'right' && "text-right", col.align === 'center' && "text-center", col.color, col.font === 'mono' && "font-mono")}>
                        {typeof row[col.key] === 'number' ? Math.abs(row[col.key]).toLocaleString('pt-BR') : row[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
