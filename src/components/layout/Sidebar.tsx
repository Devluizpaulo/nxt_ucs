"use client"

import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  ShieldCheck, 
  Database, 
  Settings, 
  LogOut,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { 
      icon: LayoutDashboard, 
      label: "Pedidos", 
      href: "/", 
      tooltip: "Auditoria de Pedidos" 
    },
    { 
      icon: Users, 
      label: "Produtores", 
      href: "/produtores", 
      tooltip: "Saldos de Produtores" 
    },
    { 
      icon: Building2, 
      label: "Associações", 
      href: "/associacoes", 
      tooltip: "Saldos de Associações" 
    },
    { 
      icon: ShieldCheck, 
      label: "Auditoria", 
      href: "#", 
      tooltip: "Auditoria de Conformidade" 
    },
    { 
      icon: Database, 
      label: "Blockchain", 
      href: "#", 
      tooltip: "NXT Ledger Explorer" 
    },
    { 
      icon: FileText, 
      label: "Relatórios", 
      href: "#", 
      tooltip: "Relatórios Consolidados" 
    },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="w-20 bg-white border-r flex flex-col items-center py-8 sticky top-0 h-screen print:hidden shrink-0 shadow-sm z-20">
        {/* Logo / Home Brand */}
        <Link href="/">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-10 shadow-lg shadow-primary/20 cursor-pointer transition-transform hover:scale-105 active:scale-95">
            <span className="text-white font-black text-xs tracking-tighter">NXT</span>
          </div>
        </Link>

        {/* Navigation Section */}
        <nav className="flex flex-col gap-6 flex-1">
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
                        "w-12 h-12 rounded-2xl transition-all duration-300",
                        isActive 
                          ? "bg-primary/10 text-primary shadow-inner border border-primary/10" 
                          : "text-slate-400 hover:text-primary hover:bg-slate-50"
                      )}
                    >
                      <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-900 border-none text-white font-bold text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg">
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="flex flex-col gap-4 mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl text-slate-300 hover:text-slate-600 hover:bg-slate-100">
                <Settings className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-slate-900 text-white font-bold text-[10px] uppercase">Configurações</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl text-slate-300 hover:text-rose-500 hover:bg-rose-50">
                <LogOut className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-rose-600 text-white font-bold text-[10px] uppercase">Sair do Sistema</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
