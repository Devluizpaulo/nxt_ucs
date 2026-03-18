
"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EntidadeSaldo, RegistroTabela } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Database, ShieldCheck, Table as TableIcon, Calculator, Plus, X, AlertCircle, Layers } from "lucide-react";
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

      // Filtro de cabeçalho
      const headerKeywords = ['dist', 'data', 'usuário', 'disponível', 'total', 'nome', 'documento', 'plataforma', 'originação'];
      if (headerKeywords.some(key => line.toLowerCase().includes(key))) return;

      if (activePasteField === 'saldoLegadoTotal') {
        // Formato Legado (8 Colunas): Data | Plataforma | Nome | Doc | Disponível | Reservado | Bloqueado | Aposentado
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
            valor: disp + res, // Regra Técnica: Disponível + Reservado
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
      <DialogContent className="max-w-[1200px] h-[95vh] flex flex-col p-0 border-none bg-white shadow-2xl overflow-hidden rounded-[2rem]">
        <DialogHeader className="sr-only">
          <DialogTitle>Auditoria Permanente - {entity.nome}</DialogTitle>
          <DialogDescription>Painel de conformidade e rastreabilidade LedgerTrust.</DialogDescription>
        </DialogHeader>

        {/* HEADER EXECUTIVO FIXO */}
        <div className="bg-[#0F172A] px-12 py-12 shrink-0 relative flex justify-between items-end">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Auditoria Permanente LedgerTrust</p>
            </div>
            <h2 className="text-5xl font-black text-white uppercase tracking-tight leading-none">{entity.nome}</h2>
            <div className="flex gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <p>DOC: <span className="text-white font-mono">{entity.documento}</span></p>
              <p>UF: <span className="text-white">{entity.uf}</span></p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Saldo Final Auditado</p>
            <div className="flex items-baseline gap-2 text-[#10B981]">
              <span className="text-7xl font-black tracking-tighter">{(formData.saldoFinalAtual || 0).toLocaleString('pt-BR')}</span>
              <span className="text-2xl font-black opacity-60">UCS</span>
            </div>
          </div>
        </div>

        {/* ÁREA DE CONTEÚDO COM SCROLL */}
        <ScrollArea className="flex-1 bg-[#F8FAFC]">
          <div className="p-12 space-y-12">
            
            {/* GRID DE CONSOLIDAÇÃO DE SALDOS */}
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                 <Layers className="w-4 h-4 text-slate-400" />
                 <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Consolidação de Saldos</h3>
               </div>
               <div className="grid grid-cols-7 border border-slate-200 bg-white rounded-2xl overflow-hidden divide-x divide-slate-100 shadow-sm">
                 {[
                   { label: "Originação", val: formData.originacao, color: "text-slate-900" },
                   { label: "Movimentação", val: formData.movimentacao, color: "text-rose-500" },
                   { label: "Aposentado", val: formData.aposentado, color: "text-slate-600" },
                   { label: "Bloqueado", val: formData.bloqueado, color: "text-amber-500" },
                   { label: "Aquisição", val: formData.aquisicao, color: "text-emerald-600" },
                   { label: "Ajuste IMEI", val: formData.saldoAjustarImei, color: "text-indigo-600" },
                   { label: "Legado", val: formData.saldoLegadoTotal, color: "text-slate-400" }
                 ].map((s, i) => (
                   <div key={i} className="p-6 space-y-1">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                     <p className={cn("text-xl font-black font-mono tracking-tighter", s.color)}>
                       {Math.abs(s.val || 0).toLocaleString('pt-BR')}
                     </p>
                   </div>
                 ))}
               </div>
            </div>

            {/* SESSÕES TÉCNICAS (EMPILHADAS) */}
            <div className="space-y-10">
              
              <TechnicalSection 
                title="Histórico de Originação"
                activeField="originacao"
                setActiveField={setActivePasteField}
                pasteBuffer={pasteBuffer}
                setPasteBuffer={setPasteBuffer}
                previewRows={previewRows}
                onImport={consolidateField}
                data={formData.tabelaOriginacao || []}
                columns={[
                  { label: "Dist.", key: "dist" },
                  { label: "Data Inicio", key: "data" },
                  { label: "Usuário Destino", key: "destino" },
                  { label: "Crédito (UCS)", key: "valor", align: "right", color: "text-emerald-600 font-bold" }
                ]}
              />

              <TechnicalSection 
                title="Histórico de Movimentações"
                activeField="movimentacao"
                setActiveField={setActivePasteField}
                pasteBuffer={pasteBuffer}
                setPasteBuffer={setPasteBuffer}
                previewRows={previewRows}
                onImport={consolidateField}
                data={formData.tabelaMovimentacao || []}
                columns={[
                  { label: "Dist.", key: "dist" },
                  { label: "Data Inicio", key: "data" },
                  { label: "Usuário Destino", key: "destino" },
                  { label: "Débito (UCS)", key: "valor", align: "right", color: "text-rose-500 font-bold" }
                ]}
              />

              <TechnicalSection 
                title="Sessão: Saldo Legado Auditado"
                activeField="saldoLegadoTotal"
                setActiveField={setActivePasteField}
                pasteBuffer={pasteBuffer}
                setPasteBuffer={setPasteBuffer}
                previewRows={previewRows}
                onImport={consolidateField}
                data={formData.tabelaLegado || []}
                variant="amber"
                columns={[
                  { label: "Data Atualização", key: "data" },
                  { label: "Plataforma", key: "plataforma" },
                  { label: "Documento", key: "documento", font: "mono" },
                  { label: "Disponível", key: "disponivel", align: "right" },
                  { label: "Reservado", key: "reservado", align: "right" },
                  { label: "Total Linha", key: "valor", align: "right", color: "text-primary font-black" }
                ]}
              />

              <TechnicalSection 
                title="Detalhamento Transferências IMEI"
                activeField="saldoAjustarImei"
                setActiveField={setActivePasteField}
                pasteBuffer={pasteBuffer}
                setPasteBuffer={setPasteBuffer}
                previewRows={previewRows}
                onImport={consolidateField}
                data={formData.tabelaImei || []}
                columns={[
                  { label: "Dist.", key: "dist" },
                  { label: "Crédito", key: "valorCredito", color: "text-emerald-600" },
                  { label: "Débito", key: "valorDebito", color: "text-rose-500" },
                  { label: "Ajuste Líquido", key: "valor", align: "right", font: "mono" }
                ]}
              />

            </div>
          </div>
        </ScrollArea>

        {/* FOOTER FIXO */}
        <div className="p-8 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors tracking-widest">
            Descartar Alterações
          </Button>
          <Button onClick={() => { onUpdate(entity.id, formData); onOpenChange(false); }} className="bg-[#10B981] hover:bg-[#059669] text-white px-10 h-14 rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-100 flex gap-3 transition-all active:scale-95">
            <Save className="w-5 h-5" /> Gravar Auditoria Permanente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TechnicalSection({ title, activeField, setActiveField, pasteBuffer, setPasteBuffer, previewRows, onImport, data, columns, variant }: any) {
  return (
    <div className={cn(
      "p-10 rounded-[2.5rem] border bg-white shadow-sm space-y-6",
      variant === 'amber' ? "border-amber-200 bg-amber-50/10" : "border-slate-100"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-lg">
            <TableIcon className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="text-[11px] font-black uppercase text-slate-900 tracking-[0.2em]">{title}</h3>
        </div>

        <Popover onOpenChange={(open) => {
          if (!open) { setPasteBuffer(""); setActiveField(null); }
          else { setActiveField(activeField); }
        }}>
          <PopoverTrigger asChild>
            <Button className="bg-[#10B981] hover:bg-[#059669] text-white h-11 px-8 rounded-full font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-emerald-50">
              <Plus className="w-4 h-4" /> Importar Excel
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[600px] p-8 rounded-[1.5rem] bg-[#0F172A] border-none shadow-3xl text-white" side="top" align="end">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <p className="text-[11px] font-black uppercase tracking-widest">Processador de Dados: {title}</p>
              </div>
              <Textarea 
                value={pasteBuffer} 
                onChange={e => setPasteBuffer(e.target.value)}
                placeholder="Cole as colunas do Excel aqui..."
                className="bg-slate-800 border-slate-700 text-slate-200 font-mono text-xs h-32 resize-none rounded-xl"
              />
              <div className="max-h-32 overflow-y-auto bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Prévia do Mapeamento:</p>
                {previewRows.length === 0 ? (
                  <p className="text-[9px] text-slate-600 italic">Aguardando colagem de dados...</p>
                ) : (
                  <div className="space-y-1">
                    {previewRows.slice(0, 3).map((r: any, i: number) => (
                      <div key={i} className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{r.data || r.nome}</span>
                        <span className="text-emerald-400">{r.valor?.toLocaleString('pt-BR')} UCS</span>
                      </div>
                    ))}
                    {previewRows.length > 3 && <p className="text-[8px] text-slate-500 font-bold text-center mt-2">+ {previewRows.length - 3} itens detectados</p>}
                  </div>
                )}
              </div>
              <Button onClick={onImport} disabled={previewRows.length === 0} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 font-black uppercase text-[11px] rounded-xl">
                Confirmar Consolidação de {previewRows.length} Registros
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white">
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="h-12">
                {columns.map((col: any) => (
                  <TableHead key={col.label} className={cn("text-[9px] font-black uppercase tracking-widest text-slate-400", col.align === 'right' && "text-right", col.align === 'center' && "text-center")}>
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48 text-center text-[10px] font-bold text-slate-300 uppercase italic tracking-widest">
                    Aguardando importação de registros técnicos
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row: any, i: number) => (
                  <TableRow key={i} className="h-12 border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                    {columns.map((col: any) => (
                      <TableCell key={col.label} className={cn("py-3 text-[10px] font-medium text-slate-600", col.align === 'right' && "text-right", col.align === 'center' && "text-center", col.color, col.font === 'mono' && "font-mono")}>
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

