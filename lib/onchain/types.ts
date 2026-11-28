export type TokenTypeRow = {
  asset_name: string;
  unit?: string;
  asset_type?: string;
  policy_id?: string;
  ticker?: string;
  fingerprint?: string;
  decimals?: number;
};

export type ResolvedAssetInfo = {
  fingerprint: string;
  policy_id?: string;
  asset_name?: string;
  name?: string;
  assetName?: string;
  decimals?: number | null;
};

export type AddressAssetToken = {
  id: string;
  name: string;
  amount: string | number;
  unit: string;
  fingerprint: string;
  decimals: number;
};

export type ClassifyResult = {
  addressAssets: Record<string, AddressAssetToken[]>;
  transactionType: string;
  rawType: string;
};

export type ContractInfo = {
  scriptHashes: string[];
  addresses: string[];
  purposes: string[];
  plutusContracts: unknown[];
  scriptJson?: Record<string, unknown>;
};

export type AutoMetadata = {
  mdVersion: string[];
  txid: string;
  msg: string[];
  contributions: Array<{
    taskCreator: string[];
    label: string[];
    description: string[];
    contributors: Record<string, Record<string, number | string>>;
  }>;
  contractInfo?: ContractInfo;
};

export type SyncProject = {
  project_id: string;
  project_name: string;
  project_type: string;
  wallet: string;
  website?: string | null;
  budgets?: Record<string, unknown> | null;
  group_name: string;
  group_archived?: boolean;
  project_archived?: boolean;
};

export type SyncProjectResult = {
  project_id: string;
  project_name: string;
  scanned: number;
  skippedExisting: number;
  skippedDapp: number;
  inserted: number;
  errors: string[];
};

export type SyncRunResult = {
  dryRun: boolean;
  projects: SyncProjectResult[];
  totals: {
    scanned: number;
    skippedExisting: number;
    skippedDapp: number;
    inserted: number;
    errors: number;
  };
};
