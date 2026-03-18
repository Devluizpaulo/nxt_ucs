"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EntidadeSaldo, RegistroTabela } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, ShieldCheck, Calculator, History, Download, Database, TrendingUp, ArrowRightLeft, CreditCard } from "lucide-react";
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
    }
  }, [entity]);

  // Cálculo Dinâmico do Saldo Final Auditado
  useEffect(() => {
    const sumTable = (table?: RegistroTabela[]) => (table || []).reduce((acc, row) => acc + (row.valor || 0), 0);
    
    const finalCalculated = 
      sumTable(formData.tabelaOriginacao) + 
      sumTable(formData.tabelaMovimentacao) + 
      sumTable(formData.tabelaImei) + 
      sumTable(formData.tabelaAquisicao) +
      sumTable(formData.tabelaLegado);
    
    if (finalCalculated !== formData.saldoFinalAtual) {
      setFormData(prev => ({ ...prev, saldoFinalAtual: finalCalculated }));
    }
  }, [
    formData.tabelaOriginacao, 
    formData.tabelaMovimentacao, 
    formData.tabelaImei, 
    formData.tabelaAquisicao, 
    formData.tabelaLegado
  ]);

  // Parser para diferentes formatos de tabela
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
      if (line.toLowerCase().includes('data') || line.toLowerCase().includes('usuário')) return;

      if (activePasteField === 'tabelaLegado') {
        const disp = parseFloat(parts[4]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        const res = parseFloat(parts[5]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        results.push({
          data: parts[0]?.trim(),
          plataforma: parts[1]?.trim(),
          nome: parts[2]?.trim(),
          documento: parts[3]?.trim(),
          disponivel: disp,
          reservado: res,
          valor: disp + res,
        });
      } else if (activePasteField === 'tabelaOriginacao') {
        const valor = parseFloat(parts[parts.length - 1]?.replace(/[R$\s.]/g, '').replace(',', '.') || parts[parts.length - 2]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        results.push({ dist: parts[0]?.trim(), data: parts[1]?.trim(), destino: parts[2]?.trim(), valor });
      } else if (activePasteField === 'tabelaImei') {
        const cred = parseFloat(parts[parts.length - 2]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        const deb = parseFloat(parts[parts.length - 1]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        results.push({ dist: parts[0]?.trim(), data: parts[1]?.trim(), destino: parts[2]?.trim(), valor: cred - deb, valorCredito: cred, valorDebito: deb });
      } else if (activePasteField === 'tabelaAquisicao') {
        const val = parseFloat(parts[parts.length - 1]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        results.push({ nome: parts[0]?.trim(), ano: parts[parts.length - 3] || "N/A", valor: -val });
      } else {
        const val = parseFloat(parts[parts.length - 1]?.replace(/[R$\s.]/g, '').replace(',', '.') || parts[parts.length - 2]?.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        results.push({ dist: parts[0]?.trim(), data: parts[1]?.trim(), destino: parts[2]?.trim(), valor: -val });
      }
    });

    setPreviewRows(results);
  }, [pasteBuffer, activePasteField]);

  const handleConfirmSection = () => {
    if (!activePasteField || previewRows.length === 0) return;
    setFormData(prev => ({ ...prev, [activePasteField]: previewRows }));
    setPasteBuffer("");
    setPreviewRows([]);
    setActivePasteField(null);
    toast({ title: "Auditado", description: "Histórico consolidado no Ledger." });
  };

  if (!entity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[1100px] h-[95vh] flex flex-col p-0 border-none bg-white shadow-2xl overflow-hidden rounded-[2.5rem]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* CABEÇALHO EXECUTIVO */}
        <div className="bg-[#0F172A] px-12 py-10 shrink-0 flex justify-between items-end border-b border-white/5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Auditoria de Rastreabilidade</span>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-3">{entity.nome}</h2>
              <div className="flex gap-10">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Registro Único</span>
                  <span className="text-sm font-mono font-bold text-slate-300 tracking-tighter">{entity.documento}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Origem / UF</span>
                  <span className="text-sm font-bold text-slate-300">{entity.uf || "MT"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Saldo Final Auditado</span>
            <div className="flex items-baseline justify-end gap-3 text-primary">
              <span className="text-6xl font-black tracking-tighter">{(formData.saldoFinalAtual || 0).toLocaleString('pt-BR')}</span>
              <span className="text-2xl font-black opacity-30">UCS</span>
            </div>
          </div>
        </div>

        {/* ÁREA TÉCNICA ROLÁVEL */}
        <ScrollArea className="flex-1 bg-slate-50/10">
          <div className="p-12 space-y-12">
            <SectionTechnical 
              title="Originação de Ativos"
              icon={TrendingUp}
              activeField="tabelaOriginacao"
              setActiveField={setActivePasteField}
              pasteBuffer={pasteBuffer}
              setPasteBuffer={setPasteBuffer}
              previewRows={previewRows}
              onConfirm={handleConfirmSection}
              data={formData.tabelaOriginacao || []}
              columns={[
                { label: "Ref. Dist.", key: "dist" },
                { label: "Data Início", key: "data" },
                { label: "Destino", key: "destino" },
                { label: "Volume", key: "valor", align: "right", variant: "emerald" }
              ]}
            />

            <SectionTechnical 
              title="Movimentações / Retiradas"
              icon={ArrowRightLeft}
              activeField="tabelaMovimentacao"
              setActiveField={setActivePasteField}
              pasteBuffer={pasteBuffer}
              setPasteBuffer={setPasteBuffer}
              previewRows={previewRows}
              onConfirm={handleConfirmSection}
              data={formData.tabelaMovimentacao || []}
              columns={[
                { label: "Ref. Dist.", key: "dist" },
                { label: "Data Operação", key: "data" },
                { label: "Destinatário", key: "destino" },
                { label: "Débito", key: "valor", align: "right", variant: "rose" }
              ]}
            />

            <SectionTechnical 
              title="Transferências IMEI (Fluxos)"
              icon={CreditCard}
              activeField="tabelaImei"
              setActiveField={setActivePasteField}
              pasteBuffer={pasteBuffer}
              setPasteBuffer={setPasteBuffer}
              previewRows={previewRows}
              onConfirm={handleConfirmSection}
              data={formData.tabelaImei || []}
              columns={[
                { label: "Dist.", key: "dist" },
                { label: "Crédito", key: "valorCredito", variant: "emerald" },
                { label: "Débito", key: "valorDebito", variant: "rose" },
                { label: "Ajuste Líquido", key: "valor", align: "right", variant: "primary" }
              ]}
            />

            <SectionTechnical 
              title="Saldo Legado Consolidado"
              color="amber"
              icon={History}
              activeField="tabelaLegado"
              setActiveField={setActivePasteField}
              pasteBuffer={pasteBuffer}
              setPasteBuffer={setPasteBuffer}
              previewRows={previewRows}
              onConfirm={handleConfirmSection}
              data={formData.tabelaLegado || []}
              columns={[
                { label: "Atualização", key: "data" },
                { label: "Plataforma", key: "plataforma" },
                { label: "Disponível", key: "disponivel", align: "right" },
                { label: "Reservado", key: "reservado", align: "right" },
                { label: "Total", key: "valor", align: "right", variant: "primary" }
              ]}
            />
          </div>
        </ScrollArea>

        {/* RODAPÉ DE AÇÕES */}
        <div className="p-8 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Descartar Auditoria
          </Button>
          <div className="flex gap-4">
            <Button variant="outline" className="h-12 px-8 rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest text-slate-600 gap-2">
              <Download className="w-4 h-4" /> Relatório Técnico
            </Button>
            <Button onClick={() => { onUpdate(entity.id, formData); onOpenChange(false); }} className="h-12 px-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 gap-3">
              <Save className="w-5 h-5" /> Confirmar Auditoria Permanente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionTechnical({ title, icon: Icon, color = "emerald", activeField, setActiveField, pasteBuffer, setPasteBuffer, previewRows, onConfirm, data, columns }: any) {
  const currentTotal = (data || []).reduce((acc: number, r: any) => acc + (r.valor || 0), 0);
  const parsedTotal = previewRows.reduce((acc: number, r: any) => acc + (r.valor || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn("w-1 h-8 rounded-full", color === "amber" ? "bg-amber-500" : "bg-primary")} />
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 leading-none mb-1">{title}</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase">
              Consolidado: <span className={cn("font-black", currentTotal < 0 ? "text-rose-500" : "text-emerald-600")}>
                {currentTotal.toLocaleString('pt-BR')} UCS
              </span>
            </p>
          </div>
        </div>

        <Popover onOpenChange={(open) => {
          if (!open) { setPasteBuffer(""); setActiveField(null); }
          else { setActiveField(activeField); }
        }}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10 px-6 rounded-lg border-slate-200 text-slate-600 font-black uppercase text-[9px] tracking-widest gap-2 hover:bg-slate-50">
              <Calculator className="w-3.5 h-3.5" /> Colagem via Calculadora
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[500px] p-0 rounded-3xl bg-white border-none shadow-3xl overflow-hidden" 
            side="top" 
            align="end"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <div className="flex flex-col">
              <div className="p-8 border-b bg-slate-50/50 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                  <Calculator className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-widest leading-none mb-1">Processador de Dados</h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">{title}</p>
                </div>
              </div>

              <div className="p-8">
                <Textarea 
                  value={pasteBuffer} 
                  onChange={e => setPasteBuffer(e.target.value)}
                  placeholder="Copie as colunas da planilha legado e cole aqui..."
                  className="bg-slate-50 border-slate-100 text-slate-900 font-mono text-[10px] h-40 resize-none rounded-xl p-6 focus:ring-primary shadow-inner"
                />
              </div>

              <div className="px-8 pb-8">
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Saldo Identificado</p>
                    <div className="flex items-baseline gap-1">
                      <span className={cn("text-4xl font-black tracking-tighter", parsedTotal < 0 ? "text-rose-500" : "text-emerald-500")}>
                        {parsedTotal.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-[10px] font-black opacity-30 uppercase">UCS</span>
                    </div>
                  </div>
                  <Button 
                    onClick={onConfirm} 
                    disabled={previewRows.length === 0} 
                    className="h-12 px-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest"
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[200px] flex flex-col">
        {data.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 opacity-30 gap-3">
            <History className="w-10 h-10 text-slate-200" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sem Histórico Registrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50 sticky top-0">
              <TableRow className="h-12 border-b border-slate-100">
                {columns.map((col: any) => (
                  <TableHead key={col.label} className={cn("text-[8px] font-black uppercase tracking-widest text-slate-400 px-8", col.align === 'right' && "text-right", col.align === 'center' && "text-center")}>
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row: any, i: number) => (
                <TableRow key={i} className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/20 transition-colors h-14">
                  {columns.map((col: any) => (
                    <TableCell key={col.label} className={cn(
                      "px-8 text-[10px] font-bold text-slate-600 tracking-tight",
                      col.align === 'right' && "text-right",
                      col.align === 'center' && "text-center",
                      col.variant === 'emerald' && "text-emerald-600",
                      col.variant === 'rose' && "text-rose-500",
                      col.variant === 'primary' && "text-primary font-black"
                    )}>
                      {typeof row[col.key] === 'number' ? Math.abs(row[col.key]).toLocaleString('pt-BR') : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
