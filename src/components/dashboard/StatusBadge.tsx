import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/lib/types";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

export function StatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case 'ok':
      return (
        <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/50 flex items-center gap-1.5 py-1 px-3">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-bold text-[10px] tracking-wider">VÁLIDO</span>
        </Badge>
      );
    case 'pendente':
      return (
        <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/20 border-amber-500/50 flex items-center gap-1.5 py-1 px-3">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-bold text-[10px] tracking-wider">PENDENTE</span>
        </Badge>
      );
    case 'erro':
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-500">
           <AlertCircle className="w-5 h-5" />
        </div>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
