"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  User, 
  Users, 
  Shield, 
  Key, 
  Bell, 
  ChevronRight, 
  Loader2, 
  Plus, 
  Trash2, 
  UserPlus,
  Mail,
  MoreVertical,
  ShieldCheck
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { AppUser, UserRole, UserStatus } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState("perfil");

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users"), orderBy("nome", "asc"));
  }, [firestore, user]);

  const { data: appUsers, isLoading: isUsersLoading } = useCollection<AppUser>(usersQuery);

  const handleSeedUsers = async () => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    const mockUsers: AppUser[] = [
      { id: "U-001", nome: "Admin LedgerTrust", email: "admin@ledgertrust.com", role: "admin", status: "ativo", ultimoAcesso: new Date().toISOString(), createdAt: new Date().toISOString() },
      { id: "U-002", nome: "Audit Produtores", email: "audit@bmv.org", role: "auditor", status: "ativo", ultimoAcesso: new Date().toISOString(), createdAt: new Date().toISOString() },
      { id: "U-003", nome: "Revisor Técnico", email: "revisor@bmv.org", role: "viewer", status: "suspenso", ultimoAcesso: new Date().toISOString(), createdAt: new Date().toISOString() }
    ];
    mockUsers.forEach(u => batch.set(doc(firestore, "users", u.id), u));
    await batch.commit();
    toast({ title: "Usuários de teste gerados" });
  };

  const handleDeleteUser = async (id: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, "users", id));
    toast({ variant: "destructive", title: "Usuário removido" });
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white px-8 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-accent" />
             </div>
             <h1 className="text-lg font-black uppercase tracking-[0.2em] text-slate-900">Configurações</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Auditor Autenticado</p>
              <p className="text-sm font-bold text-slate-900">{user.email}</p>
            </div>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md uppercase">{user.email?.substring(0,2)}</div>
          </div>
        </header>

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Navegação de Configurações */}
              <div className="w-full lg:w-72 space-y-2">
                <TabsList className="flex flex-col h-auto bg-transparent p-0 space-y-2">
                  <TabsTrigger value="perfil" className="w-full justify-start gap-3 h-14 px-6 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary border-none text-[11px] font-black uppercase tracking-widest text-slate-400 transition-all">
                    <User className="w-4 h-4" /> Meu Perfil
                  </TabsTrigger>
                  <TabsTrigger value="usuarios" className="w-full justify-start gap-3 h-14 px-6 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary border-none text-[11px] font-black uppercase tracking-widest text-slate-400 transition-all">
                    <Users className="w-4 h-4" /> Gerenciar Usuários
                  </TabsTrigger>
                  <TabsTrigger value="seguranca" className="w-full justify-start gap-3 h-14 px-6 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary border-none text-[11px] font-black uppercase tracking-widest text-slate-400 transition-all">
                    <Shield className="w-4 h-4" /> Segurança & Logs
                  </TabsTrigger>
                  <TabsTrigger value="api" className="w-full justify-start gap-3 h-14 px-6 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary border-none text-[11px] font-black uppercase tracking-widest text-slate-400 transition-all">
                    <Key className="w-4 h-4" /> Chaves de API
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Conteúdo das Configurações */}
              <div className="flex-1">
                <TabsContent value="perfil" className="mt-0 space-y-6">
                  <Card className="rounded-[2.5rem] border-none shadow-sm">
                    <CardHeader className="p-10 pb-4">
                      <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Perfil do Auditor</CardTitle>
                      <CardDescription className="text-slate-400 font-medium">Informações de identificação no ecossistema BMV.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 pt-0 space-y-8">
                      <div className="flex items-center gap-8 py-8 border-b border-slate-100">
                        <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 text-3xl font-black">
                          {user.email?.substring(0,1).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-lg font-black text-slate-900">Auditor Responsável</h4>
                          <p className="text-sm text-slate-400 font-medium">{user.email}</p>
                          <Badge variant="outline" className="mt-2 bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[9px] uppercase">Acesso Autorizado</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Nome Completo</Label>
                          <Input placeholder="Seu nome..." className="h-12 rounded-xl bg-slate-50/50 border-slate-200" defaultValue="Auditor Master" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Cargo / Função</Label>
                          <Input placeholder="Ex: Auditor Senior" className="h-12 rounded-xl bg-slate-50/50 border-slate-200" defaultValue="Auditor de UCS" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">E-mail Corporativo</Label>
                          <Input className="h-12 rounded-xl bg-slate-100 border-none cursor-not-allowed" value={user.email || ""} disabled />
                        </div>
                        <div className="space-y-2 flex items-end">
                          <Button className="h-12 w-full rounded-xl bg-primary text-white font-black uppercase text-[11px] tracking-widest">Salvar Alterações</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="usuarios" className="mt-0 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Gestão de Auditores</h2>
                      <p className="text-slate-400 text-sm font-medium">Controle de acesso e permissões do sistema.</p>
                    </div>
                    <div className="flex gap-3">
                       {(!appUsers || appUsers.length === 0) && (
                         <Button onClick={handleSeedUsers} variant="outline" className="h-12 px-6 rounded-2xl text-[11px] font-black uppercase border-dashed">
                           Gerar Usuários Teste
                         </Button>
                       )}
                       <Button className="h-12 px-8 rounded-2xl bg-primary gap-2 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                         <UserPlus className="w-4 h-4" /> Novo Auditor
                       </Button>
                    </div>
                  </div>

                  <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-b border-slate-100">
                          <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400 h-14 pl-10">Usuário</TableHead>
                          <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400 h-14">Função</TableHead>
                          <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400 h-14">Status</TableHead>
                          <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400 h-14">Último Acesso</TableHead>
                          <TableHead className="w-[100px] h-14 pr-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isUsersLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center">
                              <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                            </TableCell>
                          </TableRow>
                        ) : !appUsers || appUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                              Nenhum auditor cadastrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          appUsers.map((item) => (
                            <TableRow key={item.id} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                              <TableCell className="pl-10">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs">
                                    {item.nome.substring(0,1)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[13px] font-black text-slate-900 uppercase">{item.nome}</span>
                                    <span className="text-[11px] text-slate-400 font-medium">{item.email}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-black text-[9px] uppercase tracking-widest">
                                  {item.role === 'admin' ? 'Administrador' : item.role === 'auditor' ? 'Auditor' : 'Observador'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", item.status === 'ativo' ? 'bg-emerald-500' : 'bg-slate-300')} />
                                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">{item.status}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-[11px] text-slate-400 font-medium">
                                {new Date(item.ultimoAcesso).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell className="pr-10 text-right">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDeleteUser(item.id)}
                                  className="text-slate-300 hover:text-rose-500 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>

                <TabsContent value="seguranca" className="mt-0 space-y-6">
                  <Card className="rounded-[2.5rem] border-none shadow-sm">
                    <CardHeader className="p-10">
                      <CardTitle className="text-xl font-black uppercase text-slate-900">Logs de Conformidade</CardTitle>
                      <CardDescription className="text-slate-400">Rastreabilidade completa de todas as ações de auditoria no sistema.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 pt-0">
                       <div className="border-2 border-dashed border-slate-100 rounded-[2rem] p-20 flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-8 h-8 text-slate-200" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Criptografia de Auditoria Ativa</p>
                            <p className="text-xs text-slate-300 font-medium">Os logs estão sendo gravados e sincronizados com o LedgerTrust.</p>
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="api" className="mt-0 space-y-6">
                  <Card className="rounded-[2.5rem] border-none shadow-sm">
                    <CardHeader className="p-10">
                      <CardTitle className="text-xl font-black uppercase text-slate-900">Integração Ledger</CardTitle>
                      <CardDescription className="text-slate-400">Configure o acesso via API para sistemas externos de auditoria.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 pt-0">
                       <div className="bg-slate-50 p-6 rounded-2xl flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chave de Produção</p>
                            <p className="text-sm font-mono text-slate-600">lt_prod_********************************</p>
                          </div>
                          <Button variant="outline" className="h-10 px-6 rounded-xl text-[10px] font-black uppercase border-slate-200">Revogar Chave</Button>
                       </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
