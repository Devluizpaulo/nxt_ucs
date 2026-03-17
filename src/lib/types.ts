export type OrderStatus = 'pendente' | 'ok' | 'erro';
export type MovementType = 'gov' | 'cliente' | 'outro';
export type OrderCategory = 'selo' | 'Saas_Tesouro_Verde' | 'Saas_BMV';
export type EntityStatus = 'disponivel' | 'bloqueado' | 'inapto';

export interface Movimento {
  id: string;
  pedidoId: string;
  raw: string;
  hashMovimento: string;
  tipo: MovementType;
  origem: string;
  destino: string;
  quantidade: number;
  duplicado: boolean;
  validado: boolean;
  createdAt: string;
}

export interface Pedido {
  id: string;
  data: string;
  empresa: string;
  cnpj: string;
  programa: string;
  uf: string;
  do: boolean; // Dispositivo de Origem
  quantidade: number; // UCS
  taxa: number;
  valorTotal: number;
  hashPedido: string;
  linkNxt: string;
  auditado: boolean;
  status: OrderStatus;
  categoria: OrderCategory;
  createdAt: string;
}

export interface EntidadeSaldo {
  id: string;
  nome: string;
  documento: string; // CPF ou CNPJ
  uf: string;
  quantidade: number; // Saldo UCS
  status: EntityStatus;
  createdAt: string;
}
