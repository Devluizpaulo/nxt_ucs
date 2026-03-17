import { Movimento } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, ShieldCheck } from "lucide-react";

interface MovementListProps {
  movements: Movimento[];
  onDelete: (id: string) => void;
}

export function MovementList({ movements, onDelete }: MovementListProps) {
  if (movements.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
        Nenhum movimento registrado para este pedido.
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-muted/30">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="font-headline">Origem</TableHead>
            <TableHead className="font-headline">Destino</TableHead>
            <TableHead className="font-headline">Quantidade</TableHead>
            <TableHead className="font-headline">Hash Movimento</TableHead>
            <TableHead className="font-headline">Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((mov) => (
            <TableRow key={mov.id} className="group">
              <TableCell className="font-medium text-xs">{mov.origem}</TableCell>
              <TableCell className="text-xs">{mov.destino}</TableCell>
              <TableCell className="font-mono text-xs">{mov.quantidade.toLocaleString()}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{mov.hashMovimento}</TableCell>
              <TableCell>
                {mov.duplicado ? (
                  <Badge variant="destructive" className="flex items-center gap-1 text-[10px] py-0">
                    <AlertTriangle className="w-3 h-3" /> Duplicado
                  </Badge>
                ) : mov.validado ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 flex items-center gap-1 text-[10px] py-0">
                    <ShieldCheck className="w-3 h-3" /> Válido
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] py-0">Validando</Badge>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(mov.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}