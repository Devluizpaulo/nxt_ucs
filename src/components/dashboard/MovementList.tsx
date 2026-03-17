import { Movimento } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, ShieldCheck, ArrowRightLeft } from "lucide-react";

interface MovementListProps {
  movements: Movimento[];
  onDelete: (id: string) => void;
}

export function MovementList({ movements, onDelete }: MovementListProps) {
  if (movements.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-dashed rounded-xl bg-muted/10 flex flex-col items-center gap-3">
        <ArrowRightLeft className="w-10 h-10 text-muted-foreground/30" />
        <div className="space-y-1">
          <p className="font-bold text-sm uppercase text-muted-foreground">Nenhuma movimentação registrada</p>
          <p className="text-xs text-muted-foreground/60">Aguardando importação de extratos ou registros manuais.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card/30 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b bg-muted/20">
            <TableHead className="font-headline text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Categoria</TableHead>
            <TableHead className="font-headline text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Origem do Ativo</TableHead>
            <TableHead className="font-headline text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Volume</TableHead>
            <TableHead className="font-headline text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Integridade</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((mov) => (
            <TableRow key={mov.id} className="group border-b border-border/20 last:border-0 hover:bg-muted/10">
              <TableCell className="font-bold text-[9px] uppercase text-foreground/60">
                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{mov.tipo}</span>
              </TableCell>
              <TableCell className="text-[10px] font-bold text-foreground/80">
                <div className="flex flex-col">
                  <span>{mov.origem}</span>
                  <span className="text-[8px] text-muted-foreground font-normal">para {mov.destino}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-[10px] font-black">{mov.quantidade.toLocaleString()} UCS</TableCell>
              <TableCell>
                {mov.duplicado ? (
                  <Badge variant="destructive" className="flex items-center gap-1 text-[8px] py-0 px-1 font-bold">
                    <AlertTriangle className="w-2.5 h-2.5" /> DUPLICADO
                  </Badge>
                ) : mov.validado ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 flex items-center gap-1 text-[8px] py-0 px-1 font-bold">
                    <ShieldCheck className="w-2.5 h-2.5" /> VALIDADO
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[8px] py-0 px-1 font-bold animate-pulse">PROCESSANDO</Badge>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(mov.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
