import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface OrderAuditFormProps {
  onAdd: (raw: string) => void;
}

export function OrderAuditForm({ onAdd }: OrderAuditFormProps) {
  const [raw, setRaw] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raw.trim()) return;
    onAdd(raw);
    setRaw("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
      <div className="grid w-full gap-2">
        <Label htmlFor="movement-raw" className="text-sm font-semibold">Adicionar Extrato de Movimentação</Label>
        <Textarea
          id="movement-raw"
          placeholder="Cole os dados brutos do movimento aqui (Hash, Origem, Destino, Qtd)..."
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          className="min-h-[100px] font-mono text-xs"
        />
        <p className="text-[10px] text-muted-foreground">O sistema validará automaticamente o hash inserido para evitar duplicidade na rede.</p>
      </div>
      <Button type="submit" size="sm" className="w-full gap-2" disabled={!raw.trim()}>
        <Plus className="w-4 h-4" /> Registrar Movimento
      </Button>
    </form>
  );
}