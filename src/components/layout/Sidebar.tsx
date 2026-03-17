"use client"

import { LayoutDashboard, Users, Building2, FileText, ShieldCheck, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { icon: LayoutDashboard, label: "Pedidos", href: "/", tooltip: "Auditoria de Pedidos" },
    { icon: Users, label: "Produtores", href: "/produtores", tooltip: "Saldos Produtores" },
    { icon: Building2, label: "Associações", href: "/associacoes", tooltip: "Saldos Associações" },
    { icon: ShieldCheck, label: "Auditoria", href: "#", tooltip: "Auditoria de Selos" },
    { icon: Database, label: "Blockchain", href: "#", tooltip: "NXT Ledger" },
    { icon: FileText, label: "Relatórios", href: "#", tooltip: "Relatórios Consolidados" },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="w-20 bg-white border-r flex flex-col items-center py-8 gap-10 sticky top-0 h-screen print:hidden shrink-0">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
          <span className="text-primary font-black text-xs">BMV</span>
        </div>

        <nav className="flex flex-col gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        "w-12 h-12 rounded-2xl transition-all",
                        isActive 
                          ? "bg-emerald-50 text-primary shadow-sm border border-emerald-100" 
                          : "text-slate-400 hover:text-primary hover:bg-emerald-50"
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-bold text-[10px] uppercase tracking-widest">{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
