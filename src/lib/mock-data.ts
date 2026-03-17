import { Pedido, Movimento } from './types';

export const MOCK_PEDIDOS: Pedido[] = [
  {
    id: 'PED-2024-001',
    data: '2024-05-10',
    empresa: 'GreenEnergy SA',
    cnpj: '12.345.678/0001-90',
    programa: 'Reflorestamento BR',
    uf: 'AM',
    quantidade: 5000,
    valor: 250000,
    hashPedido: 'NXT-8923-XK-21',
    auditado: true,
    status: 'ok',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PED-2024-002',
    data: '2024-05-12',
    empresa: 'CarbonClear Ltd',
    cnpj: '98.765.432/0001-11',
    programa: 'Eólica Nordeste',
    uf: 'CE',
    quantidade: 2500,
    valor: 125000,
    hashPedido: 'NXT-4412-ZY-99',
    auditado: false,
    status: 'pendente',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PED-2024-003',
    data: '2024-05-15',
    empresa: 'EcoTrust Global',
    cnpj: '55.666.777/0001-22',
    programa: 'Solar Pantanal',
    uf: 'MS',
    quantidade: 10000,
    valor: 500000,
    hashPedido: 'NXT-7711-BB-44',
    auditado: false,
    status: 'erro',
    createdAt: new Date().toISOString(),
  }
];

export const MOCK_MOVIMENTOS: Movimento[] = [
  {
    id: 'MOV-001',
    pedidoId: 'PED-2024-001',
    raw: 'GOV_TRANSFER_AM_001',
    hashMovimento: 'HM-111-AAA',
    tipo: 'gov',
    origem: 'Secretaria Meio Ambiente AM',
    destino: 'GreenEnergy SA',
    quantidade: 5000,
    duplicado: false,
    validado: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'MOV-002',
    pedidoId: 'PED-2024-003',
    raw: 'CLIENT_TRANS_002',
    hashMovimento: 'HM-111-AAA', // Duplicate of MOV-001 to trigger error
    tipo: 'cliente',
    origem: 'EcoTrust Global',
    destino: 'Private Buyer X',
    quantidade: 10000,
    duplicado: true,
    validado: false,
    createdAt: new Date().toISOString(),
  }
];