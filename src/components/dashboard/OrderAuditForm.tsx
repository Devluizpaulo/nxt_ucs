import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Database, AlertCircle, CheckCircle2, Table as TableIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrderAuditFormProps {
  onAdd: (movements: any[]) => void;
}

export function OrderAuditForm({ onAdd }: OrderAuditFormProps) {
  const [raw, setRaw] = useState("");
  const [previewData, setPreviewData] = useState<any[]>([]);

  const parseMovements = (text: string) => {
    if (!text.trim()) return [];
    
    const rows = text.split('\n').filter(r => r.trim());
    const results: any[] = [];

    if (text.includes('\t')) {
      const startIdx = (rows[0]?.toLowerCase().includes('id') || rows[0]?.toLowerCase().includes('dist')) ? 1 : 0;

      for (let i = startIdx; i < rows.length; i++) {
        const parts = rows[i].split('\t');
        if (parts.length < 10) continue;

        const id = parts[0]?.trim() || "";
        const tipoOrigem = parts[4]?.trim() || "";
        const categoriaOrigem = parts[5]?.trim() || "";
        const nomeOrigem = parts[6]?.trim() || "N/A";
        const nomeDestino = parts[9]?.trim() || "N/A";
        const qtdStr = parts[11]?.replace(/[^\d]/g, '') || "0";
        const quantidade = parseInt(qtdStr) || 0;

        results.push({
          tipo: categoriaOrigem || tipoOrigem || 'outro',
          hashMovimento: id ? `ID-${id}` : `REF-${Math.random().toString(36).substr(2, 9)}`,
          origem: nomeOrigem,
          destino: nomeDestino,
          quantidade,
          raw: rows[i]
        });
      }
    } else {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^\d{5,}/)) {
          results.push({
            tipo: lines[i+5] || (lines[i+4]?.toLowerCase().includes('gov') ? 'Governo' : 'Cliente'),
            hashMovimento: `ID-${lines[i]}`,
            origem: lines[i+6] || "N/A",
            destino: lines[i+9] || "N/A",
            quantidade: parseInt(lines[i+11]) || 1,
            raw: lines.slice(i, i+12).join(' | ')
          });
          i += 11;
        }
      }
    }

    return results;
  };

  useEffect(() => {
    setPreviewData(parseMovements(raw));
  }, [raw]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (previewData.length === 0) return;
    onAdd(previewData);
    setRaw("");
    setPreviewData([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="movement-raw" className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Database className="w-3 h-3" /> Colar Dados de Rastreabilidade (12 Colunas)
            </Label>
            {previewData.length > 0 && (
              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md animate-in fade-in zoom-in">
                {previewData.length} REGISTROS DETECTADOS
              </span>
            )}
          </div>
          
          <Textarea
            id="movement-raw"
            placeholder="Cole aqui os dados do Excel (ID, Dist, Data, Origem, Categoria, Nome...)"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="min-h-[120px] font-mono text-[9px] bg-slate-50 border-slate-200 focus:ring-primary rounded-xl resize-none shadow-inner"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <TableIcon className="w-3 h-3" /> Detalhamento do Mapeamento
          </Label>
          <div className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
            <ScrollArea className="h-[200px]">
              {previewData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[180px] opacity-30 text-center p-4">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-tighter">Aguardando dados para processamento...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[8px] font-black uppercase h-8">Categoria</TableHead>
                      <TableHead className="text-[8px] font-black uppercase h-8">Origem do Ativo</TableHead>
                      <TableHead className="text-[8px] font-black uppercase h-8 text-right">Volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((mov, idx) => (
                      <TableRow key={idx} className="border-b border-slate-50">
                        <TableCell className="py-2">
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase bg-slate-100 text-slate-600">
                            {mov.tipo}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold text-slate-700 truncate max-w-[150px]">{mov.origem}</span>
                            <span className="text-[8px] text-slate-400 italic">Destino: {mov.destino}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono text-[9px] font-black text-primary">
                          {mov.quantidade} UCS
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <Alert variant="default" className="bg-emerald-50/50 border-emerald-100 py-2 px-3">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          <AlertDescription className="text-[9px] text-emerald-700 leading-tight font-medium">
            Mapeamento concluído com sucesso. Verifique se as categorias (Produtor, Parceiro, etc.) estão corretas.
          </AlertDescription>
        </Alert>
        
        <Button 
          type="submit" 
          className="w-full gap-2 font-black uppercase text-[10px] h-12 shadow-lg shadow-primary/20 rounded-xl" 
          disabled={previewData.length === 0}
        >
          <Plus className="w-4 h-4" /> Gravar Rastreabilidade no Ledger
        </Button>
      </div>
    </form>
  );
}
