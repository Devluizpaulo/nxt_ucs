"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntidadeSaldo } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, ClipboardPaste, User, FileText, Database } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EntityEditDialogProps {
  entity: EntidadeSaldo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<EntidadeSaldo>) => void;
}

export function EntityEditDialog({ entity, open, onOpenChange, onUpdate }: EntityEditDialogProps) {
  const [formData, setFormData] = useState<Partial<EntidadeSaldo>>({});
  const [rawRow, setRawRow] = useState("");

  useEffect(() => {
    if (entity) {
      setFormData(entity);
      setRawRow("");
    }
  }, [entity]);

  const handleIndividualSave = () => {
    if (!entity) return;
    onUpdate(entity.id, formData);
    onOpenChange(false);
  };

  const handlePasteProcess = () => {
    if (!rawRow.trim() || !entity) return;
    
    const parts = rawRow.split('\t');
    if (parts.length < 5) {
      toast({ variant: "destructive", title: "Formato inválido", description: "Certifique-se de copiar uma linha completa da planilha." });
      return;
    }

    const parseNum = (v: string) => parseInt((v || "0").replace(/[^\d-]/g, '')) || 0;

    const updates: Partial<EntidadeSaldo> = {
      nome: parts[0]?.trim() || entity.nome,
      documento: parts[1]?.trim() || entity.documento,
      originacao: parseNum(parts[2]),
      debito: parseNum(parts[3]),
      aposentadas: parseNum(parts[4]),
      bloqueadas: parseNum(parts[5]),
      aquisicao: parseNum(parts[6]),
      transferenciaImei: parseNum(parts[7]),
      estornoImei: parseNum(parts[8]),
      saldoAjustarImei: parseNum(parts[9]),
      saldoLegado: parseNum(parts[10]),
      cprs: parts[11]?.trim() || "",
      bmtca: parts[12]?.trim() || "",
      statusBmtca: parts[13]?.trim() || "",
      desmate: parts[14]?.trim() || "",
      saldoFinal: parseNum(parts[15]),
      valorAjustar: parseNum(parts[16]),
    };

    setFormData(prev => ({ ...prev, ...updates }));
    toast({ title: "Dados Mapeados", description: "Os campos foram preenchidos com os dados da colagem." });
  };

  if (!entity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white border-none shadow-2xl rounded-[2.5rem] p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-slate-900 font-black uppercase text-xl flex items-center gap-3">
                <Database className="w-6 h-6 text-primary" />
                Auditoria Individual: {entity.nome}
              </DialogTitle>
              <div className="bg-primary/10 text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                ID: {entity.id}
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="individual" className="flex-1 overflow-hidden flex flex-col">
            <div className="px-8 pt-4">
              <TabsList className="bg-slate-100/50 p-1 border rounded-full h-12 w-fit">
                <TabsTrigger value="individual" className="data-[state=active]:bg-white px-8 rounded-full text-[10px] font-bold uppercase">Formulário</TabsTrigger>
                <TabsTrigger value="paste" className="data-[state=active]:bg-white px-8 rounded-full text-[10px] font-bold uppercase">Colagem de Linha (Mascara)</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 p-8">
              <TabsContent value="individual" className="mt-0 space-y-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Identificação */}
                  <div className="col-span-full border-b pb-2">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><User className="w-3 h-3" /> Identificação</h4>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase text-slate-400">Nome / Usuário</Label>
                    <Input value={formData.nome || ""} onChange={e => setFormData({...formData, nome: e.target.value})} className="rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase text-slate-400">Documento (CPF/CNPJ)</Label>
                    <Input value={formData.documento || ""} onChange={e => setFormData({...formData, documento: e.target.value})} className="rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase text-slate-400">Estado (UF)</Label>
                    <Input value={formData.uf || ""} onChange={e => setFormData({...formData, uf: e.target.value})} className="rounded-xl border-slate-200" />
                  </div>

                  {/* Financeiro / Saldos */}
                  <div className="col-span-full border-b pb-2 pt-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Database className="w-3 h-3" /> Saldos e Movimentações (UCS)</h4>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase text-slate-400">Originação</Label>
                    <Input type="number" value={formData.originacao || 0} onChange={e => setFormData({...formData, originacao: Number(e.target.value)})} className="rounded-xl border-slate-200 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase text-slate-400">Débito</Label>
                    <Input type="number" value={formData.debito || 0} onChange={e => setFormData({...formData, debito: Number(e.target.value)})} className="rounded-xl border-slate-200 font-mono text-rose-500" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase text-slate-400">Aposentadas</Label>
                    <Input type="number" value={formData.aposentadas || 0} onChange={e => setFormData({...formData, aposentadas: Number(e.target.value)})} className="rounded-xl border-slate-200 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase text-slate-400">Bloqueadas</Label>
                    <Input type="number" value={formData.bloqueadas || 0} onChange={e => setFormData({...formData, bloqueadas: Number(e.target.value)})} className="rounded-xl border-slate-200 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase text-slate-400">Aquisição</Label>
                    <Input type="number" value={formData.aquisicao || 0} onChange={e => setFormData({...formData, aquisicao: Number(e.target.value)})} className="rounded-xl border-slate-200 font-mono text-emerald-600" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase text-slate-400">Saldo Legado</Label>
                    <Input type="number" value={formData.saldoLegado || 0} onChange={e => setFormData({...formData, saldoLegado: Number(e.target.value)})} className="rounded-xl border-slate-200 font-mono" />
                  </div>

                  {/* IMEI / BMTCA */}
                  <div className="col-span-full border-b pb-2 pt-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><FileText className="w-3 h-3" /> IMEI & BMTCA</h4>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase text-slate-400">BMTCA</Label>
                    <Input value={formData.bmtca || ""} onChange={e => setFormData({...formData, bmtca: e.target.value})} className="rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase text-slate-400">Status BMTCA</Label>
                    <Input value={formData.statusBmtca || ""} onChange={e => setFormData({...formData, statusBmtca: e.target.value})} className="rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase text-slate-400">Desmate</Label>
                    <Input value={formData.desmate || ""} onChange={e => setFormData({...formData, desmate: e.target.value})} className="rounded-xl border-slate-200" />
                  </div>

                  {/* Resumo */}
                  <div className="col-span-full bg-slate-50 p-6 rounded-3xl grid grid-cols-2 gap-6 border border-slate-100">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-primary">Saldo Final (Calculado/Auditado)</Label>
                      <Input type="number" value={formData.saldoFinal || 0} onChange={e => setFormData({...formData, saldoFinal: Number(e.target.value)})} className="rounded-xl border-primary/30 bg-white font-black text-primary text-lg h-14" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-400">Valor a Ajustar</Label>
                      <Input type="number" value={formData.valorAjustar || 0} onChange={e => setFormData({...formData, valorAjustar: Number(e.target.value)})} className="rounded-xl border-slate-200 bg-white font-bold h-14" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="paste" className="mt-0 space-y-6">
                <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <ClipboardPaste className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase text-slate-900 leading-tight">Mapeamento Inteligente por Linha</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Cole a linha correspondente do Excel para atualizar todos os campos</p>
                    </div>
                  </div>
                  <Input 
                    placeholder="Cole aqui a linha completa da planilha..."
                    value={rawRow}
                    onChange={e => setRawRow(e.target.value)}
                    className="h-14 bg-white border-slate-200 rounded-2xl font-mono text-[10px]"
                  />
                  <Button onClick={handlePasteProcess} variant="outline" className="w-full h-12 rounded-xl border-primary/20 hover:bg-primary/5 font-black uppercase text-[10px] tracking-widest">
                    Processar e Mapear Campos
                  </Button>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="px-8 font-bold uppercase text-[10px] tracking-widest">Cancelar</Button>
            <Button onClick={handleIndividualSave} className="px-12 h-14 rounded-2xl font-black uppercase text-xs shadow-xl shadow-primary/20">
              <Save className="w-5 h-5 mr-2" /> Salvar Auditoria no Ledger
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
