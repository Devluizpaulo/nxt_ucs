"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EntidadeSaldo, RegistroTabela } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Database, ShieldCheck, Table as TableIcon, Calculator, Plus, X, AlertCircle } from "lucide-react";
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

  // Cálculo automático do Saldo Final Auditado
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
        // Formato Legado: Data | Plataforma | Nome | Doc | Disponível | Reservado | Bloqueado | Aposentado
        if (parts.length >= 8) {
          const disponivel = parseFloat(parts[4]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
          const reservado = parseFloat(parts[5]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
          results.push({
            data: parts[0]?.trim(),
            plataforma: parts[1]?.trim(),
            nome: parts[2]?.trim(),
            documento: parts[3]?.trim(),
            disponivel: disponivel,
            reservado: reservado,
            bloqueado: parseFloat(parts[6]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
            aposentado: parseFloat(parts[7]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
            valor: disponivel + reservado, // Regra Técnica: Disponível + Reservado
          });
        }
      } else if (activePasteField === 'originacao') {
        const valorRaw = parts[parts.length - 2] || parts[parts.length - 1];
        const valor = parseFloat(valorRaw?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
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
          valor: credito - debito,
          valorCredito: credito,
          valorDebito: debito
        });
      } else if (activePasteField === 'aquisicao') {
        const valor = parseFloat(parts[parts.length - 1]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        results.push({
          nome: parts[0]?.trim() || "Aquisição BMTCA",
          ano: parts.length > 3 ? parts[parts.length - 3]?.trim() : "N/A",
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
      description: `Histórico de ${activePasteField.toString().toUpperCase()} atualizado.` 
    });
  };

  if (!entity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1400px] max-h-[95vh] overflow-hidden bg-white border-none shadow-2xl rounded-[1.5rem] p-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Auditoria Permanente LedgerTrust - {entity.nome}</DialogTitle>
          <DialogDescription>Gestão executiva de auditoria para ativos ambientais.</DialogDescription>
        </DialogHeader>
        
        {/* HEADER EXECUTIVO DE ALTA FIDELIDADE */}
        <div className="bg-[#0F172A] px-12 py-10 text-white shrink-0 relative">
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="absolute right-8 top-8 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </Button>
          
          <div className="flex items-end justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Auditoria Permanente LedgerTrust</p>
              </div>
              <h2 className="text-5xl font-black uppercase tracking-tight leading-none">{entity.nome}</h2>
              <div className="flex gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                <p>DOC: <span className="text-white font-mono">{entity.documento}</span></p>
                <p>UF: <span className="text-white">{entity.uf}</span></p>
              </div>
            </div>

            <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Saldo Final Auditado</p>
              <div className="flex items-baseline justify-end gap-2 text-emerald-400">
                <span className="text-7xl font-black tracking-tighter">{(formData.saldoFinalAtual || 0).toLocaleString('pt-BR')}</span>
                <span className="text-xl font-black uppercase opacity-60">UCS</span>
              </div>
            </div>
          </div>
        </div>

        {/* ÁREA DE AUDITORIA COM SCROLL */}
        <ScrollArea className="flex-1 bg-slate-50/30">
          <div className="p-12 space-y-12 pb-32">
            
            {/* SUMÁRIO DE SALDOS EM MENOR DESTAQUE */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: "Originação", val: formData.originacao, color: "text-slate-900" },
                { label: "Movimentação", val: formData.movimentacao, color: "text-rose-500" },
                { label: "Aposentado", val: formData.aposentado, color: "text-slate-600" },
                { label: "Bloqueado", val: formData.bloqueado, color: "text-amber-600" },
                { label: "Aquisição", val: formData.aquisicao, color: "text-emerald-600" },
                { label: "Ajuste IMEI", val: formData.saldoAjustarImei, color: "text-indigo-600" },
                { label: "Saldo Legado", val: formData.saldoLegadoTotal, color: "text-amber-600", highlight: true }
              ].map((s, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "bg-white p-6 rounded-2xl border transition-all shadow-sm",
                    s.highlight ? "border-amber-200 bg-amber-50/30" : "border-slate-100"
                  )}
                >
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{s.label}</p>
                  <p className={cn("text-xl font-black font-mono tracking-tighter", s.color)}>
                    {Math.abs(s.val || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>

            {/* SESSÕES TÉCNICAS */}
            <div className="space-y-10">
              
              <TableSection 
                title="Sessão: Saldo Legado Auditado" 
                activeField="saldoLegadoTotal"
                setActiveField={setActivePasteField}
                pasteBuffer={pasteBuffer}
                setPasteBuffer={setPasteBuffer}
                previewRows={previewRows}
                onImport={consolidateField}
                data={formData.tabelaLegado || []}
                variant="warning"
                columns={[
                  { label: "Data Atualização", key: "data" },
                  { label: "Plataforma", key: "plataforma" },
                  { label: "Documento", key: "documento", font: "mono" },
                  { label: "Disponível", key: "disponivel", align: "right", color: "text-emerald-600" },
                  { label: "Reservado", key: "reservado", align: "right", color: "text-amber-600" },
                  { label: "Bloqueado", key: "bloqueado", align: "right" },
                  { label: "Aposentado", key: "aposentado", align: "right" },
                  { label: "Subtotal", key: "valor", align: "right", color: "text-primary font-black" }
                ]}
                description="O saldo legado é composto pela soma do Disponível + Reservado de todas as plataformas auditadas."
              />

              <TableSection 
                title="Sessão: Histórico de Originação" 
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
                  { label: "Crédito (UCS)", key: "valor", align: "right", color: "text-emerald-600 font-black" }
                ]}
              />

              <TableSection 
                title="Sessão: Histórico de Movimentações" 
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
                  { label: "Débito (UCS)", key: "valor", align: "right", color: "text-rose-500 font-black" }
                ]}
              />

              <TableSection 
                title="Sessão: Detalhamento de Transferências IMEI" 
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
                  { label: "Ajuste Líquido", key: "valor", align: "right", color: "text-indigo-600 font-black" }
                ]}
              />

              <TableSection 
                title="Sessão: Aquisição de UCs (BMTCA)" 
                activeField="aquisicao"
                setActiveField={setActivePasteField}
                pasteBuffer={pasteBuffer}
                setPasteBuffer={setPasteBuffer}
                previewRows={previewRows}
                onImport={consolidateField}
                data={formData.tabelaAquisicao || []}
                columns={[
                  { label: "Usuário", key: "nome" },
                  { label: "Ano", key: "ano", align: "center" },
                  { label: "Volume Adquirido (UCS)", key: "valor", align: "right", color: "text-emerald-600 font-black" }
                ]}
              />

            </div>
          </div>
        </ScrollArea>

        {/* RODAPÉ DE AÇÕES FIXO */}
        <div className="p-8 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="px-8 h-12 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-rose-500 transition-all">
            Descartar Auditoria
          </Button>
          <Button onClick={() => { onUpdate(entity.id, formData); onOpenChange(false); }} className="px-12 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-200 bg-emerald-500 hover:bg-emerald-600 text-white flex gap-4 transition-all active:scale-95">
            <Save className="w-5 h-5" /> Gravar Auditoria Permanente no Ledger
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TableSection({ title, activeField, setActiveField, pasteBuffer, setPasteBuffer, previewRows, onImport, data, columns, variant, description }: any) {
  return (
    <div className={cn(
      "p-8 rounded-3xl border shadow-sm space-y-6 transition-all",
      variant === 'warning' ? "bg-amber-50/20 border-amber-100" : "bg-white border-slate-100"
    )}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Database className={cn("w-4 h-4", variant === 'warning' ? "text-amber-500" : "text-slate-300")} />
            <h3 className="text-[11px] font-black uppercase text-slate-900 tracking-[0.2em]">{title}</h3>
          </div>
          {description && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-7">{description}</p>}
        </div>

        <Popover onOpenChange={(open) => {
          if (!open) {
            setPasteBuffer("");
            setActiveField(null);
          } else {
            setActiveField(activeField);
          }
        }}>
          <PopoverTrigger asChild>
            <Button className={cn(
              "h-10 px-6 font-black uppercase text-[10px] tracking-widest rounded-full flex gap-2 shadow-lg transition-all",
              variant === 'warning' 
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100" 
                : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-100"
            )}>
              <Plus className="w-4 h-4" /> Importar Excel
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[600px] p-0 rounded-2xl shadow-3xl border-none bg-[#0F172A] overflow-hidden" side="top">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between text-white border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Mapeamento de Dados: {title}</p>
                </div>
              </div>
              <Textarea 
                value={pasteBuffer}
                onChange={e => setPasteBuffer(e.target.value)}
                placeholder="Copie as colunas do Excel e cole aqui..."
                className="bg-slate-800 border-slate-700 text-[11px] font-mono h-32 resize-none text-slate-200 rounded-xl focus:ring-emerald-500 shadow-inner"
              />
              
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/50">
                <Table>
                  <TableBody>
                    {previewRows.slice(0, 5).map((r: any, i: number) => (
                      <TableRow key={i} className="border-slate-800">
                        <TableCell className="text-[9px] text-slate-400 py-2">
                          <div className="flex flex-col">
                            <span>{r.data || r.nome}</span>
                            <span className="text-[8px] opacity-60">{r.plataforma}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[9px] text-emerald-400 text-right py-2 font-mono font-bold">
                          {r.valor?.toLocaleString('pt-BR')} UCS
                        </TableCell>
                      </TableRow>
                    ))}
                    {previewRows.length > 5 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-2 text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                          + {previewRows.length - 5} registros adicionais detectados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-4">
                 <Button onClick={onImport} disabled={previewRows.length === 0} className="flex-1 h-14 font-black uppercase text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-xl shadow-emerald-500/20">
                    Confirmar Consolidação ({previewRows.length} itens)
                 </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50/20">
        <ScrollArea className="h-[280px]">
          <Table>
            <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="h-10 border-b border-slate-100">
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
                  <TableCell colSpan={columns.length} className="h-32 text-center text-[10px] font-bold text-slate-300 uppercase italic tracking-widest">Aguardando importação de registros técnicos via Excel</TableCell>
                </TableRow>
              ) : (
                data.map((row: any, i: number) => (
                  <TableRow key={i} className="h-10 border-b border-slate-50 hover:bg-white transition-colors">
                    {columns.map((col: any) => (
                      <TableCell key={col.label} className={cn("py-2 text-[10px] font-medium text-slate-600", col.align === 'right' && "text-right", col.align === 'center' && "text-center", col.color, col.font === 'mono' && "font-mono")}>
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
