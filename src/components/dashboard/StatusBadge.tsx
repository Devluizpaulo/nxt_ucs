import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/lib/types";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

export function StatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case 'ok':
      return (
        <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/50 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          OK
        </Badge>
      );
    case 'pendente':
      return (
        <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/20 border-amber-500/50 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pendente
        </Badge>
      );
    case 'erro':
      return (
        <Badge className="bg-rose-500/15 text-rose-500 hover:bg-rose-500/20 border-rose-500/50 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Erro
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}