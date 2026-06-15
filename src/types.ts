/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum OperationType {
  RECEITA = 'receita',
  DESPESA = 'despesa',
  INVESTIMENTO = 'investimento',
}

export interface Carteira {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  cnpj?: string;
  razaoSocial?: string;
  cpf?: string;
  nomeCompleto?: string;
  userId: string;
}

export interface Lancamento {
  id: string;
  tipo: OperationType;
  data: string;
  valor: number;
  desc: string;
  cat: string;
  obs?: string;
  carteiraId: string;
}

export interface Meta {
  id: string;
  titulo: string;
  valor: number;
  atual: number;
  prazo: string;
  cor: string;
  carteiraId: string;
}

export interface Investimento {
  id: string;
  ativo: string;
  tipo: string;
  valor: number;
  qtd: number;
  preco: number;
  data: string;
  carteiraId: string;
  rentabilidadeMensal?: number;
}

export interface ShoppingItem {
  id: string;
  nome: string;
  prioridade: 'baixa' | 'media' | 'alta';
  comprado: boolean;
  precoEstimado?: number;
  userId: string;
  carteiraId?: string;
}

export interface GastoFixo {
  id: string;
  nome: string;
  valor: number;
  diaVencimento: number;
  categoria: string;
  userId: string;
  carteiraId?: string;
}

export interface UserProfileData {
  dataNascimento?: string;
  genero?: string;
  cidade?: string;
  uf?: string;
  pais?: string;
  rendimentoMensal?: number;
}

export interface UserProfile extends UserProfileData {
  userId: string;
}

export interface DBState {
  lancamentos: Lancamento[];
  metas: Meta[];
  investimentos: Investimento[];
  carteiras: Carteira[];
  shoppingItems: ShoppingItem[];
  gastosFixos: GastoFixo[];
}

export const CATS = {
  [OperationType.RECEITA]: ['Salário', 'Freelance', 'Aluguel recebido', 'Investimentos', 'Presente', 'Outros'],
  [OperationType.DESPESA]: ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Academia', 'Lazer', 'Educação', 'Vestuário', 'Serviços', 'Assinaturas', 'Extras', 'Outros'],
  [OperationType.INVESTIMENTO]: ['Renda Fixa', 'Ações', 'FIIs', 'Cripto', 'Tesouro', 'ETFs', 'Poupança', 'Outros Ativos'],
};

export const COLORS = [
  '#00843D', '#FF6B35', '#3A86FF', '#FF3B5C', '#FFBE0B',
  '#8338EC', '#00B4D8', '#FB5607', '#06D6A0', '#EF476F',
];

export const CAT_MAP: Record<string, string> = {
  'Salário': 'salary', 'Freelance': 'freelance', 'Aluguel recebido': 'rent_received',
  'Investimentos': 'investments_cat', 'Presente': 'gift', 'Outros': 'others',
  'Alimentação': 'food', 'Moradia': 'housing', 'Transporte': 'transport',
  'Saúde': 'health', 'Academia': 'gym', 'Lazer': 'leisure', 'Educação': 'education',
  'Vestuário': 'clothing', 'Serviços': 'services', 'Assinaturas': 'subscriptions',
  'Extras': 'extras', 'Renda Fixa': 'fixed_income', 'Ações': 'stocks', 'FIIs': 'fiis',
  'Tesouro': 'treasury', 'Cripto': 'crypto', 'ETFs': 'etfs', 'Poupança': 'savings',
  'Outros Ativos': 'other_assets', 'Outros ativos': 'other_assets'
};

export const INV_TYPE_MAP: Record<string, string> = {
  'Renda Fixa': 'fixed_income',
  'Ações': 'stocks',
  'FIIs': 'fiis',
  'Tesouro': 'treasury',
  'Cripto': 'crypto',
  'ETFs': 'etfs',
  'Poupança': 'savings',
  'Outros Ativos': 'other_assets',
  'Outros ativos': 'other_assets'
};

export const COLOR_MAP: Record<string, string> = {
  '#00843D': 'green', '#00A94F': 'light_green', '#af52de': 'purple',
  '#ff9500': 'orange', '#ff3b30': 'red_color'
};
