import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Layers, AlertCircle } from "lucide-react";
import { OrderCategory } from "@/lib/types";

interface BulkImportDialogProps {
  onImport: (orders: any[]) => void;
  category: OrderCategory;
}

export function BulkImportDialog({ onImport, category }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const getCategoryName = (cat: OrderCategory) => {
    switch(cat) {
      case 'selo': return 'Selo Tesouro Verde';
      case 'Saas_Tesouro_Verde': return 'Saas Tesouro Verde';
      case 'Saas_BMV': return 'SaaS BMV';
      default: return cat;
    }
  }

  // Função robusta para parse de TSV respeitando aspas e quebras de linha internas
  const parseTSV = (text: string) => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === '\t' && !inQuotes) {
        currentRow.push(currentField);
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentField);
        if (currentRow.some(f => f.trim())) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      if (currentRow.some(f => f.trim())) rows.push(currentRow);
    }
    return rows;
  };

  const handleImport = async () => {
    setIsProcessing(true);
    const parsedRows = parseTSV(raw);
    const parsedOrders: any[] = [];

    // Ignorar cabeçalho se existir
    const startIdx = parsedRows[0]?.[0]?.toLowerCase().includes('pedido') ? 1 : 0;

    for (let i = startIdx; i < parsedRows.length; i++) {
      const parts = parsedRows[i];
      if (parts.length < 5) continue;

      const id = parts[0].trim();
      const dataStr = parts[1].trim();
      const originRaw = parts[2].trim();
      const programa = parts[3]?.trim() || "";
      const uf = parts[4]?.trim() || "";
      const doFlag = parts[5]?.trim().toLowerCase() === 'sim' || parts[5]?.trim().toLowerCase() === 's';
      
      const quantidadeStr = parts[6]?.replace(/[^\d]/g, '') || "0";
      const quantidade = parseInt(quantidadeStr);
      
      const parseBRL = (val: string) => {
        if (!val) return 0;
        return parseFloat(val.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
      };

      const taxa = parseBRL(parts[7]);
      const total = parseBRL(parts[8]);

      // Extração inteligente de Empresa e CNPJ
      const originLines = originRaw.split(/\n/);
      const empresa = originLines[0]?.trim() || originRaw;
      const cnpj = originLines.length > 1 ? originLines[originLines.length - 1]?.trim() : "";

      let isoDate = new Date().toISOString();
      try {
        const datePart = dataStr.split(' ')[0];
        const timePart = dataStr.split(' ')[1] || "00:00:00";
        const [day, month, year] = datePart.split('/').map(Number);
        const [hour, min, sec] = timePart.split(':').map(Number);
        
        if (day && month && year) {
          const d = new Date(year, month - 1, day, hour, min, sec);
          if (!isNaN(d.getTime())) {
            isoDate = d.toISOString();
          }
        }
      } catch (e) {
        console.error("Erro data:", dataStr);
      }

      parsedOrders.push({
        id,
        data: isoDate,
        empresa,
        cnpj,
        programa,
        uf,
        do: doFlag,
        quantidade,
        taxa,
        valorTotal: total,
        auditado: false,
        status: 'pendente',
        hashPedido: "",
        linkNxt: "",
        categoria: category,
        createdAt: new Date().toISOString()
      });
    }

    if (parsedOrders.length > 0) {
      await onImport(parsedOrders);
      setRaw("");
      setOpen(false);
    }
    setIsProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-[10px] font-bold uppercase tracking-widest border-primary/20 hover:bg-primary/5 h-12 px-6 rounded-full">
          <Layers className="w-3.5 h-3.5" /> Importar em Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-white border-none shadow-2xl rounded-[2rem] p-8">
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-black uppercase text-xl tracking-tight flex items-center gap-3">
            <Layers className="w-6 h-6 text-primary" /> 
            Importação: {getCategoryName(category).toUpperCase()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Estrutura Esperada (Colunas TAB):</p>
            <p className="text-[9px] text-primary font-mono bg-white p-2 rounded-lg border border-slate-200 mb-3">
              Pedido | Data | Origem (Empresa + CNPJ) | PARC/PROG | UF | D.O | Quantidade | Taxa | Total
            </p>
            <ul className="text-[9px] text-slate-400 space-y-1 font-medium uppercase">
              <li>• Suporta nomes de empresas e CNPJs com quebra de linha.</li>
              <li>• Detecta automaticamente o formato de data brasileiro (DD/MM/AAAA).</li>
              <li>• Valores financeiros são limpos e convertidos automaticamente.</li>
            </ul>
          </div>

          <Textarea 
            value={raw} 
            onChange={e => setRaw(e.target.value)}
            placeholder="Cole aqui os dados da tabela..."
            className="min-h-[350px] font-mono text-[10px] bg-slate-50 border-slate-200 rounded-2xl p-4 focus:ring-primary focus:border-primary"
          />

          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 px-4 py-3 rounded-xl border border-amber-100 flex-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-[9px] font-bold uppercase leading-tight">
                Certifique-se de que as colunas estão separadas por TAB (copiando diretamente do Excel/Sheets).
              </p>
            </div>
            <Button 
              onClick={handleImport} 
              disabled={isProcessing || !raw.trim()}
              className="h-14 px-10 font-black uppercase text-xs rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95"
            >
              {isProcessing ? "Processando..." : "Confirmar e Salvar no Banco"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
