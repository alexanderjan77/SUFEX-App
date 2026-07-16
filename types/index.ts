export type TransactionNature =
  | 'PESSOA_JURIDICA'
  | 'PESSOA_FISICA'
  | 'MATERIAL_CONSUMO'
  | 'MATERIAL_PERMANENTE'
  | 'GRATIFICACAO_FONTE'
  | 'DIFICIL_COMPROVACAO';

export interface FundTransaction {
  id: string;
  type: 'WITHDRAWAL' | 'EXPENSE';
  amount: number;
  timestamp: number;
  nature?: TransactionNature;
  description: string;
  beneficiary?: string;
  documentNumber?: string;
  isDificilComprovacao: boolean;
  abaterNature?: "PESSOA_FISICA" | "PESSOA_JURIDICA";
  invoicePhotoPath?: string;
  date?: string;
}

export interface POISettings {
  poiNumber: string;
  seiNumber: string;
  supridoName: string;
  valorSolicitado?: number;
  /** @deprecated use vigenciaStart + vigenciaEnd */
  vigenciaDate?: string;
  vigenciaStart: string;
  vigenciaEnd: string;
  limitePJ: number;
  limitePF: number;
  limiteConsumo: number;
  limitePermanente: number;
  biometricEnabled: boolean;
  pinConfigured: boolean;
  /** Report-only fields, filled via the "Completar Relatório" screen when exporting the PDF. */
  remiNumber?: string;
  superintendenciaUf?: string;
  supridoMatricula?: string;
  solicitanteName?: string;
  solicitanteMatricula?: string;
  solicitanteCargo?: string;
  gruSeiNumber?: string;
}

export const NATURE_LABELS: Record<TransactionNature, string> = {
  PESSOA_JURIDICA: 'Pessoa Jurídica',
  PESSOA_FISICA: 'Pessoa Física',
  MATERIAL_CONSUMO: 'Material de Consumo',
  MATERIAL_PERMANENTE: 'Material Permanente',
  GRATIFICACAO_FONTE: 'Gratificação de Fonte',
  DIFICIL_COMPROVACAO: 'Difícil Comprovação',
};

export const NATURE_ANNEX: Record<TransactionNature, string> = {
  PESSOA_JURIDICA: 'Anexo B',
  PESSOA_FISICA: 'Anexo C',
  MATERIAL_CONSUMO: 'Anexo D',
  MATERIAL_PERMANENTE: 'Anexo G',
  GRATIFICACAO_FONTE: 'Anexo A',
  DIFICIL_COMPROVACAO: 'Anexo J',
};

export const DEFAULT_POI: POISettings = {
  poiNumber: '',
  seiNumber: '',
  supridoName: '',
  valorSolicitado: 0,
  vigenciaStart: '',
  vigenciaEnd: '',
  limitePJ: 0,
  limitePF: 0,
  limiteConsumo: 0,
  limitePermanente: 0,
  biometricEnabled: false,
  pinConfigured: false,
  remiNumber: '',
  superintendenciaUf: '',
  supridoMatricula: '',
  solicitanteName: '',
  solicitanteMatricula: '',
  solicitanteCargo: '',
  gruSeiNumber: '',
};
