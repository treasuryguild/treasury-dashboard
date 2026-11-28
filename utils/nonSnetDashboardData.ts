import { TokenBalance } from '../types/transactions';

export interface TokenTypeInfo {
  asset_name: string;
  unit?: string;
  asset_type?: string;
  policy_id?: string;
  ticker?: string;
  fingerprint?: string;
  decimals?: number;
}

export interface NormalizedEntry {
  id: string;
  transactionId: string;
  txHash: string;
  txType: string;
  direction: 'inflow' | 'outflow' | 'other';
  dateIso: string; // YYYY-MM-DD
  dateDisplay: string; // DD.MM.YYYY
  monthKey: string; // MM.YYYY
  monthSortKey: string; // YYYY-MM
  title: string;
  description: string;
  labels: string[]; // cleaned meaningful labels
  rawLabels: string[]; // all labels including system ones
  subgroup: string; // '' when absent
  taskCreator: string;
  exchangeRate: number | null;
  hasContractInfo: boolean;
  contractInfo?: any;
  isLegacy: boolean;
  recipientCount: number;
  // Fungible token totals for this entry
  tokenAmounts: Record<string, number>;
  // Per-contributor fungible token breakdown
  contributorAmounts: Record<string, Record<string, number>>;
  nftCount: number;
}

export interface ProjectCapabilities {
  hasTransactions: boolean;
  hasSubgroups: boolean;
  hasLabels: boolean;
  hasBudgets: boolean;
  hasSmartContracts: boolean;
  hasMultipleTokens: boolean;
  hasContributors: boolean;
  hasLegacyTransactions: boolean;
}

export interface FilterOptions {
  months: string[]; // descending MM.YYYY
  tokens: string[]; // sorted, core_token first if present
  txTypes: string[];
  labels: string[];
  subgroups: string[];
}

export interface DashboardFilters {
  months: string[]; // ['All months'] or selected MM.YYYY
  tokens: string[]; // ['All tokens'] or selected tokens
  txTypes: string[]; // ['All types'] or selected txTypes
  labels: string[]; // ['All labels'] or selected labels
  subgroups: string[]; // ['All workgroups'] or selected subgroups
}

export interface MonthlyCashflowRow {
  month: string; // MM.YYYY
  monthSortKey: string; // YYYY-MM
  incoming: number;
  outgoing: number;
  net: number;
  txCount: number;
  budget?: number;
  tokenIncoming: Record<string, number>;
  tokenOutgoing: Record<string, number>;
}

export interface BreakdownRow {
  name: string;
  total: number;
  txCount: number;
  entryCount: number;
  tokenTotals: Record<string, number>;
}

export interface MonthlyActivityRow {
  month: string;
  monthSortKey: string;
  tasks: number;
  contributors: number;
  txCount: number;
}

export interface ContributorRow {
  contributorId: string;
  total: number;
  taskCount: number;
  tokenTotals: Record<string, number>;
}

export interface TxTypeSummaryRow {
  txType: string;
  txCount: number;
  tokenTotals: Record<string, number>;
  totalSelected: number;
}

export interface TaskLedgerRow {
  id: string;
  transactionId: string;
  dateIso: string;
  dateDisplay: string;
  txType: string;
  direction: 'inflow' | 'outflow' | 'other';
  title: string;
  description: string;
  labels: string[];
  subgroup: string;
  contributorCount: number;
  tokenAmounts: Record<string, number>;
  totalSelected: number;
  usdEstimate: number | null;
  hasContractInfo: boolean;
}

export interface NonSnetDashboardData {
  capabilities: ProjectCapabilities;
  filterOptions: FilterOptions;
  activeTokens: string[];
  primaryToken: string;
  kpi: {
    txCount: number;
    entryCount: number;
    uniqueContributors: number;
    incomingByToken: Record<string, number>;
    outgoingByToken: Record<string, number>;
    netByToken: Record<string, number>;
    estimatedOutgoingAdaUsd: number | null;
    estimatedIncomingAdaUsd: number | null;
    firstDate: string | null;
    lastDate: string | null;
    smartContractTxCount: number;
    fungibleBalances: TokenBalance[];
    nftBalanceCount: number;
  };
  monthlyCashflow: MonthlyCashflowRow[];
  labelBreakdown: BreakdownRow[];
  subgroupBreakdown: BreakdownRow[];
  monthlyActivity: MonthlyActivityRow[];
  contributorBreakdown: ContributorRow[];
  txTypeSummary: TxTypeSummaryRow[];
  taskLedger: TaskLedgerRow[];
}

const SYSTEM_LABELS = new Set([
  'incoming',
  'incoming-reserve',
  'outgoing',
  'staking',
  'swap',
  'swap-incoming',
  'internal-transfer',
  'minting',
  'vote-delegation',
  'smart-contract',
  'rewards-withdrawal',
  'drep-registration',
  'burning',
  'wallet-emptied',
  'voting',
]);

const INFLOW_TYPES = new Set([
  'Incoming',
  'Incoming Reserve',
  'Rewards Withdrawal',
  'Swap Incoming',
]);

const OUTFLOW_TYPES = new Set([
  'Outgoing',
  'Wallet Emptied',
]);

export function normalizeTokenSymbol(token: string): string {
  if (!token) return 'Unknown';
  const trimmed = String(token).trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'ada') return 'ADA';
  if (lower === 'gimbal' || lower === 'gmbl') return 'GMBL';
  if (lower === 'minutes' || lower === 'mins') return 'MINS';
  if (lower === 'agix') return 'AGIX';
  if (lower === 'fet') return 'FET';
  if (lower === 'djed') return 'DJED';
  return trimmed;
}

export function normalizeTxType(txType: string | null | undefined): string {
  if (!txType) return 'Unknown';
  const cleaned = String(txType).trim().replace(/[-_]+/g, ' ');
  const lower = cleaned.toLowerCase();
  const map: Record<string, string> = {
    'incoming': 'Incoming',
    'incoming reserve': 'Incoming Reserve',
    'outgoing': 'Outgoing',
    'internal transfer': 'Internal Transfer',
    'rewards withdrawal': 'Rewards Withdrawal',
    'smart contract': 'Smart Contract',
    'staking': 'Staking',
    'minting': 'Minting',
    'burning': 'Burning',
    'swap': 'Swap',
    'swap incoming': 'Swap Incoming',
    'vote delegation': 'Vote Delegation',
    'drep registration': 'DRep Registration',
    'wallet emptied': 'Wallet Emptied',
    'voting': 'Voting',
  };
  return map[lower] || cleaned;
}

function getDirection(txType: string): 'inflow' | 'outflow' | 'other' {
  if (INFLOW_TYPES.has(txType)) return 'inflow';
  if (OUTFLOW_TYPES.has(txType)) return 'outflow';
  return 'other';
}

function formatLabelDisplay(raw: string): string {
  const cleaned = raw.trim().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
  if (!cleaned) return '';
  // Preserve short codes/acronyms or strings with mixed caps, otherwise title-case words
  return cleaned
    .split(' ')
    .map((word) => {
      if (word.length <= 4 && word === word.toUpperCase()) return word;
      if (/[A-Z]/.test(word.slice(1))) return word; // e.g. UI, UX, DeFi
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function canonicalKey(str: string): string {
  return str.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
}

function parseTimestamp(rawDate: string | number | null | undefined): Date | null {
  if (rawDate == null || rawDate === '') return null;
  const num = typeof rawDate === 'string' ? parseInt(rawDate, 10) : rawDate;
  if (!Number.isFinite(num) || num <= 0) return null;
  const ms = num > 1_000_000_000_000 ? num : num * 1000;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseTaskDateString(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();

  // DD.MM.YY or DD.MM.YYYY
  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (dotMatch) {
    const day = parseInt(dotMatch[1], 10);
    const month = parseInt(dotMatch[2], 10);
    let year = parseInt(dotMatch[3], 10);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(Date.UTC(year, month - 1, day));
      if (!Number.isNaN(d.getTime())) return d;
    }
  }

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(Date.UTC(year, month - 1, day));
    if (!Number.isNaN(d.getTime())) return d;
  }

  return null;
}

function formatDateParts(date: Date): {
  dateIso: string;
  dateDisplay: string;
  monthKey: string;
  monthSortKey: string;
} {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return {
    dateIso: `${year}-${month}-${day}`,
    dateDisplay: `${day}.${month}.${year}`,
    monthKey: `${month}.${year}`,
    monthSortKey: `${year}-${month}`,
  };
}

function parseExchangeRate(rawRate: any, txJson?: any): number | null {
  const candidates = [rawRate, txJson?.exchangeRate];
  for (const val of candidates) {
    if (val == null || val === '') continue;
    const match = String(val).match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const parsed = parseFloat(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return null;
}

function buildNftSet(tokenTypes: TokenTypeInfo[] = []): Set<string> {
  const nftSet = new Set<string>();
  for (const t of tokenTypes) {
    if (t?.asset_type === 'nft') {
      if (t.asset_name) nftSet.add(t.asset_name.toLowerCase());
      if (t.ticker) nftSet.add(t.ticker.toLowerCase());
    }
  }
  return nftSet;
}

function isNftToken(tokenName: string, nftSet: Set<string>): boolean {
  return nftSet.has(tokenName.trim().toLowerCase());
}

function parseRawTxJson(tx: any): any {
  if (tx?.original_tx_json && typeof tx.original_tx_json === 'object') {
    return tx.original_tx_json;
  }
  if (typeof tx?.tx_json === 'string') {
    try {
      return JSON.parse(tx.tx_json);
    } catch {
      return {};
    }
  }
  if (tx?.tx_json && typeof tx.tx_json === 'object') {
    return tx.tx_json;
  }
  return {};
}

function extractLabels(rawField: any): string[] {
  if (!rawField) return [];
  const items = Array.isArray(rawField) ? rawField : [rawField];
  const result: string[] = [];
  for (const item of items) {
    if (item == null) continue;
    for (const part of String(item).split(',')) {
      const trimmed = part.trim();
      if (trimmed) result.push(trimmed);
    }
  }
  return result;
}

function extractStringField(field: any): string {
  if (!field) return '';
  if (Array.isArray(field)) {
    return field.filter(Boolean).map(String).join(' ').trim();
  }
  return String(field).trim();
}

export function normalizeNonSnetTransactions(
  rawTransactions: any[] = [],
  tokenTypes: TokenTypeInfo[] = []
): NormalizedEntry[] {
  const nftSet = buildNftSet(tokenTypes);
  const rawEntries: NormalizedEntry[] = [];

  // Track best display casing for subgroups & labels across the project
  const subgroupDisplayCounts = new Map<string, Map<string, number>>();
  const labelDisplayCounts = new Map<string, Map<string, number>>();

  const recordDisplay = (
    store: Map<string, Map<string, number>>,
    rawVal: string
  ): string => {
    const key = canonicalKey(rawVal);
    if (!key) return '';
    const formatted = formatLabelDisplay(rawVal);
    if (!store.has(key)) store.set(key, new Map());
    const counts = store.get(key)!;
    counts.set(formatted, (counts.get(formatted) || 0) + 1);
    return key;
  };

  for (let txIdx = 0; txIdx < rawTransactions.length; txIdx++) {
    const tx = rawTransactions[txIdx];
    if (!tx) continue;

    const txJson = parseRawTxJson(tx);

    // Skip FaultyTx-Filter metadata records
    if (Array.isArray(txJson.msg) && txJson.msg[0] === 'FaultyTx-Filter') {
      continue;
    }

    const txType = normalizeTxType(tx.tx_type);
    const direction = getDirection(txType);
    const txDateObj = parseTimestamp(tx.transaction_date);
    const exchangeRate = parseExchangeRate(tx.exchange_rate, txJson);
    const transactionId = String(tx.transaction_id || tx.tx_id || `tx-${txIdx}`);
    const txHash = String(tx.tx_id || tx.transaction_id || txJson.txid || '');
    const hasContractInfo = Boolean(txJson.contractInfo);
    const contributions = Array.isArray(txJson.contributions) ? txJson.contributions : [];

    if (contributions.length > 0) {
      contributions.forEach((contrib: any, cIdx: number) => {
        const contribDateObj =
          parseTaskDateString(contrib?.arrayMap?.date?.[0]) || txDateObj;
        if (!contribDateObj) return;
        const dateParts = formatDateParts(contribDateObj);

        const name = extractStringField(contrib?.name);
        const description = extractStringField(contrib?.description);
        const title = name || description || `${txType} Transaction`;

        const rawLabelList = [
          ...extractLabels(contrib?.arrayMap?.label),
          ...extractLabels(contrib?.label),
        ];
        const meaningfulLabelKeys: string[] = [];
        const allRawLabels: string[] = [];

        for (const lbl of rawLabelList) {
          allRawLabels.push(lbl);
          const slug = lbl.trim().toLowerCase().replace(/\s+/g, '-');
          if (!SYSTEM_LABELS.has(slug)) {
            const key = recordDisplay(labelDisplayCounts, lbl);
            if (key && !meaningfulLabelKeys.includes(key)) {
              meaningfulLabelKeys.push(key);
            }
          }
        }

        const rawSubgroup = extractStringField(contrib?.arrayMap?.subGroup?.[0]);
        const subgroupKey = rawSubgroup
          ? recordDisplay(subgroupDisplayCounts, rawSubgroup)
          : '';

        const taskCreator = extractStringField(contrib?.taskCreator);

        const tokenAmounts: Record<string, number> = {};
        const contributorAmounts: Record<string, Record<string, number>> = {};
        let nftCount = 0;

        if (contrib?.contributors && typeof contrib.contributors === 'object') {
          for (const [cid, tokMap] of Object.entries(contrib.contributors)) {
            if (!tokMap || typeof tokMap !== 'object') continue;
            for (const [rawTok, rawAmt] of Object.entries(tokMap as Record<string, any>)) {
              const amount = parseFloat(String(rawAmt));
              if (!Number.isFinite(amount) || amount === 0) continue;
              if (isNftToken(rawTok, nftSet)) {
                nftCount += 1;
                continue;
              }
              const token = normalizeTokenSymbol(rawTok);
              tokenAmounts[token] = (tokenAmounts[token] || 0) + amount;
              if (!contributorAmounts[cid]) contributorAmounts[cid] = {};
              contributorAmounts[cid][token] =
                (contributorAmounts[cid][token] || 0) + amount;
            }
          }
        }

        // Fallback to tx-level total_tokens if contribution had no amounts
        if (
          Object.keys(tokenAmounts).length === 0 &&
          contributions.length === 1 &&
          Array.isArray(tx.total_tokens) &&
          Array.isArray(tx.total_amounts)
        ) {
          tx.total_tokens.forEach((rawTok: string, i: number) => {
            const amount = parseFloat(String(tx.total_amounts[i]));
            if (!Number.isFinite(amount) || amount === 0) return;
            if (isNftToken(rawTok, nftSet)) {
              nftCount += 1;
              return;
            }
            const token = normalizeTokenSymbol(rawTok);
            tokenAmounts[token] = (tokenAmounts[token] || 0) + amount;
          });
        }

        rawEntries.push({
          id: `${transactionId}-${cIdx}`,
          transactionId,
          txHash,
          txType,
          direction,
          ...dateParts,
          title,
          description: description !== title ? description : '',
          labels: meaningfulLabelKeys,
          rawLabels: allRawLabels,
          subgroup: subgroupKey,
          taskCreator,
          exchangeRate,
          hasContractInfo,
          contractInfo: txJson.contractInfo,
          isLegacy: false,
          recipientCount:
            Object.keys(contributorAmounts).length ||
            Number(tx.recipients) ||
            0,
          tokenAmounts,
          contributorAmounts,
          nftCount,
        });
      });
    } else {
      // Legacy / non-contribution transaction (e.g., Fund 8 / pre-1.4 metadata)
      if (!txDateObj) continue;
      const dateParts = formatDateParts(txDateObj);

      const legacyName = extractStringField(txJson.name);
      const legacyDesc = extractStringField(txJson.description);
      const legacyBudget = extractStringField(txJson.budget);
      const title = legacyName || legacyDesc || `${txType} Transaction`;

      const meaningfulLabelKeys: string[] = [];
      const allRawLabels: string[] = [];
      if (legacyBudget) {
        allRawLabels.push(legacyBudget);
        const slug = legacyBudget.toLowerCase().replace(/\s+/g, '-');
        if (!SYSTEM_LABELS.has(slug)) {
          const key = recordDisplay(labelDisplayCounts, legacyBudget);
          if (key) meaningfulLabelKeys.push(key);
        }
      }

      const tokenAmounts: Record<string, number> = {};
      let nftCount = 0;

      if (Array.isArray(tx.total_tokens) && Array.isArray(tx.total_amounts)) {
        tx.total_tokens.forEach((rawTok: string, i: number) => {
          const amount = parseFloat(String(tx.total_amounts[i]));
          if (!Number.isFinite(amount) || amount === 0) return;
          if (isNftToken(rawTok, nftSet)) {
            nftCount += 1;
            return;
          }
          const token = normalizeTokenSymbol(rawTok);
          tokenAmounts[token] = (tokenAmounts[token] || 0) + amount;
        });
      } else {
        const adaAmt = parseFloat(String(txJson.ada || ''));
        if (Number.isFinite(adaAmt) && adaAmt > 0) {
          tokenAmounts['ADA'] = adaAmt;
        }
        const gmblAmt = parseFloat(String(txJson.gimbals || ''));
        if (Number.isFinite(gmblAmt) && gmblAmt > 0) {
          tokenAmounts['GMBL'] = gmblAmt;
        }
      }

      const contributorAmounts: Record<string, Record<string, number>> = {};
      if (direction === 'outflow' && legacyName && Object.keys(tokenAmounts).length > 0) {
        contributorAmounts[legacyName] = { ...tokenAmounts };
      }

      rawEntries.push({
        id: `${transactionId}-legacy`,
        transactionId,
        txHash,
        txType,
        direction,
        ...dateParts,
        title,
        description: legacyDesc && legacyDesc !== title ? legacyDesc : '',
        labels: meaningfulLabelKeys,
        rawLabels: allRawLabels,
        subgroup: '',
        taskCreator: extractStringField(txJson.project),
        exchangeRate,
        hasContractInfo,
        contractInfo: txJson.contractInfo,
        isLegacy: true,
        recipientCount: Number(tx.recipients) || (legacyName ? 1 : 0),
        tokenAmounts,
        contributorAmounts,
        nftCount,
      });
    }
  }

  // Resolve canonical keys to most-frequent display casing
  const pickBestDisplay = (store: Map<string, Map<string, number>>) => {
    const resolved = new Map<string, string>();
    store.forEach((counts, key) => {
      let best = key;
      let maxCount = -1;
      counts.forEach((count, label) => {
        if (count > maxCount) {
          maxCount = count;
          best = label;
        }
      });
      resolved.set(key, best);
    });
    return resolved;
  };

  const subgroupMap = pickBestDisplay(subgroupDisplayCounts);
  const labelMap = pickBestDisplay(labelDisplayCounts);

  return rawEntries.map((entry) => ({
    ...entry,
    subgroup: entry.subgroup ? subgroupMap.get(entry.subgroup) || entry.subgroup : '',
    labels: entry.labels.map((k) => labelMap.get(k) || k),
  }));
}

export function extractFilterOptions(
  entries: NormalizedEntry[],
  coreToken?: string
): FilterOptions {
  const monthMap = new Map<string, string>(); // monthKey -> monthSortKey
  const tokenTotals = new Map<string, number>();
  const txTypeSet = new Set<string>();
  const labelSet = new Set<string>();
  const subgroupSet = new Set<string>();

  for (const entry of entries) {
    monthMap.set(entry.monthKey, entry.monthSortKey);
    txTypeSet.add(entry.txType);
    entry.labels.forEach((l) => labelSet.add(l));
    if (entry.subgroup) subgroupSet.add(entry.subgroup);
    for (const [tok, amt] of Object.entries(entry.tokenAmounts)) {
      tokenTotals.set(tok, (tokenTotals.get(tok) || 0) + Math.abs(amt));
    }
  }

  const months = Array.from(monthMap.entries())
    .sort((a, b) => b[1].localeCompare(a[1]))
    .map(([monthKey]) => monthKey);

  const normalizedCore = coreToken ? normalizeTokenSymbol(coreToken) : '';
  const tokens = Array.from(tokenTotals.keys()).sort((a, b) => {
    if (a === normalizedCore) return -1;
    if (b === normalizedCore) return 1;
    if (a === 'ADA') return -1;
    if (b === 'ADA') return 1;
    return (tokenTotals.get(b) || 0) - (tokenTotals.get(a) || 0);
  });

  return {
    months,
    tokens,
    txTypes: Array.from(txTypeSet).sort((a, b) => a.localeCompare(b)),
    labels: Array.from(labelSet).sort((a, b) => a.localeCompare(b)),
    subgroups: Array.from(subgroupSet).sort((a, b) => a.localeCompare(b)),
  };
}

export function buildNonSnetDashboardData(args: {
  entries: NormalizedEntry[];
  filters: DashboardFilters;
  projectInfo?: {
    project_name?: string;
    project_type?: string;
    core_token?: string;
    budgets?: Record<string, number> | null;
  };
  balance?: TokenBalance[];
}): NonSnetDashboardData {
  const { entries, filters, projectInfo, balance = [] } = args;
  const filterOptions = extractFilterOptions(entries, projectInfo?.core_token);

  const hasBudgets = Boolean(
    projectInfo?.budgets &&
      typeof projectInfo.budgets === 'object' &&
      Object.keys(projectInfo.budgets).length > 0
  );

  const capabilities: ProjectCapabilities = {
    hasTransactions: entries.length > 0,
    hasSubgroups: filterOptions.subgroups.length > 0,
    hasLabels: filterOptions.labels.length > 0,
    hasBudgets,
    hasSmartContracts: entries.some(
      (e) => e.txType === 'Smart Contract' || e.hasContractInfo
    ),
    hasMultipleTokens: filterOptions.tokens.length > 1,
    hasContributors: entries.some(
      (e) => Object.keys(e.contributorAmounts).length > 0
    ),
    hasLegacyTransactions: entries.some((e) => e.isLegacy),
  };

  // Determine active tokens for aggregation
  const isAllTokens =
    filters.tokens.length === 0 || filters.tokens.includes('All tokens');
  const activeTokens = isAllTokens
    ? filterOptions.tokens
    : filters.tokens.filter((t) => filterOptions.tokens.includes(t));
  const effectiveTokens =
    activeTokens.length > 0 ? activeTokens : filterOptions.tokens;
  const normalizedCore = projectInfo?.core_token
    ? normalizeTokenSymbol(projectInfo.core_token)
    : '';
  const primaryToken =
    effectiveTokens.length === 1
      ? effectiveTokens[0]
      : effectiveTokens.includes(normalizedCore)
      ? normalizedCore
      : effectiveTokens[0] || normalizedCore || 'ADA';

  const isAllMonths =
    filters.months.length === 0 || filters.months.includes('All months');
  const isAllTxTypes =
    filters.txTypes.length === 0 || filters.txTypes.includes('All types');
  const isAllLabels =
    filters.labels.length === 0 || filters.labels.includes('All labels');
  const isAllSubgroups =
    filters.subgroups.length === 0 ||
    filters.subgroups.includes('All workgroups');

  const filtered = entries.filter((entry) => {
    if (!isAllMonths && !filters.months.includes(entry.monthKey)) return false;
    if (!isAllTxTypes && !filters.txTypes.includes(entry.txType)) return false;
    if (!isAllTokens) {
      const hasToken = Object.keys(entry.tokenAmounts).some((t) =>
        effectiveTokens.includes(t)
      );
      if (!hasToken) return false;
    }
    if (!isAllLabels) {
      const hasLabel = entry.labels.some((l) => filters.labels.includes(l));
      if (!hasLabel) return false;
    }
    if (!isAllSubgroups) {
      const entrySubgroup = entry.subgroup || 'Unassigned';
      if (!filters.subgroups.includes(entrySubgroup)) return false;
    }
    return true;
  });

  // KPI & Aggregations
  const uniqueTxIds = new Set<string>();
  const uniqueSmartContractTxIds = new Set<string>();
  const uniqueContributors = new Set<string>();
  const incomingByToken: Record<string, number> = {};
  const outgoingByToken: Record<string, number> = {};
  let estimatedOutgoingAdaUsd = 0;
  let estimatedIncomingAdaUsd = 0;
  let hasOutgoingUsd = false;
  let hasIncomingUsd = false;
  let firstDate: string | null = null;
  let lastDate: string | null = null;

  const monthlyMap = new Map<
    string,
    {
      month: string;
      monthSortKey: string;
      incoming: number;
      outgoing: number;
      txIds: Set<string>;
      tokenIncoming: Record<string, number>;
      tokenOutgoing: Record<string, number>;
      tasks: Set<string>;
      contributors: Set<string>;
    }
  >();

  const labelMap = new Map<
    string,
    {
      name: string;
      total: number;
      txIds: Set<string>;
      entryCount: number;
      tokenTotals: Record<string, number>;
    }
  >();

  const subgroupMap = new Map<
    string,
    {
      name: string;
      total: number;
      txIds: Set<string>;
      entryCount: number;
      tokenTotals: Record<string, number>;
    }
  >();

  const contributorMap = new Map<
    string,
    {
      contributorId: string;
      total: number;
      taskIds: Set<string>;
      tokenTotals: Record<string, number>;
    }
  >();

  const txTypeMap = new Map<
    string,
    {
      txType: string;
      txIds: Set<string>;
      tokenTotals: Record<string, number>;
      totalSelected: number;
    }
  >();

  const taskLedger: TaskLedgerRow[] = [];

  for (const entry of filtered) {
    uniqueTxIds.add(entry.transactionId);
    if (entry.txType === 'Smart Contract' || entry.hasContractInfo) {
      uniqueSmartContractTxIds.add(entry.transactionId);
    }

    if (!firstDate || entry.dateIso < firstDate) firstDate = entry.dateIso;
    if (!lastDate || entry.dateIso > lastDate) lastDate = entry.dateIso;

    // Ensure monthly bucket
    if (!monthlyMap.has(entry.monthKey)) {
      monthlyMap.set(entry.monthKey, {
        month: entry.monthKey,
        monthSortKey: entry.monthSortKey,
        incoming: 0,
        outgoing: 0,
        txIds: new Set(),
        tokenIncoming: {},
        tokenOutgoing: {},
        tasks: new Set(),
        contributors: new Set(),
      });
    }
    const mBucket = monthlyMap.get(entry.monthKey)!;
    mBucket.txIds.add(entry.transactionId);
    mBucket.tasks.add(entry.id);

    // Ensure txType bucket
    if (!txTypeMap.has(entry.txType)) {
      txTypeMap.set(entry.txType, {
        txType: entry.txType,
        txIds: new Set(),
        tokenTotals: {},
        totalSelected: 0,
      });
    }
    const tBucket = txTypeMap.get(entry.txType)!;
    tBucket.txIds.add(entry.transactionId);

    // Entry filtered token amounts
    const entryTokenAmounts: Record<string, number> = {};
    let entryPrimaryTotal = 0;

    for (const [token, amount] of Object.entries(entry.tokenAmounts)) {
      if (!effectiveTokens.includes(token)) continue;
      entryTokenAmounts[token] = (entryTokenAmounts[token] || 0) + amount;
      tBucket.tokenTotals[token] = (tBucket.tokenTotals[token] || 0) + amount;

      if (token === primaryToken) {
        entryPrimaryTotal += amount;
        tBucket.totalSelected += amount;
      }

      if (entry.direction === 'inflow') {
        incomingByToken[token] = (incomingByToken[token] || 0) + amount;
        mBucket.tokenIncoming[token] = (mBucket.tokenIncoming[token] || 0) + amount;
        if (token === primaryToken) mBucket.incoming += amount;
        if (token === 'ADA' && entry.exchangeRate) {
          estimatedIncomingAdaUsd += amount * entry.exchangeRate;
          hasIncomingUsd = true;
        }
      } else if (entry.direction === 'outflow') {
        outgoingByToken[token] = (outgoingByToken[token] || 0) + amount;
        mBucket.tokenOutgoing[token] = (mBucket.tokenOutgoing[token] || 0) + amount;
        if (token === primaryToken) mBucket.outgoing += amount;
        if (token === 'ADA' && entry.exchangeRate) {
          estimatedOutgoingAdaUsd += amount * entry.exchangeRate;
          hasOutgoingUsd = true;
        }
      }
    }

    // Contributors (focus on outflow for payouts; if no outflows exist, still count unique participants)
    const entryContribs = Object.entries(entry.contributorAmounts);
    for (const [cid, tokMap] of entryContribs) {
      if (entry.direction === 'outflow') {
        uniqueContributors.add(cid);
        mBucket.contributors.add(cid);

        if (!contributorMap.has(cid)) {
          contributorMap.set(cid, {
            contributorId: cid,
            total: 0,
            taskIds: new Set(),
            tokenTotals: {},
          });
        }
        const cBucket = contributorMap.get(cid)!;
        cBucket.taskIds.add(entry.id);

        for (const [tok, amt] of Object.entries(tokMap)) {
          if (!effectiveTokens.includes(tok)) continue;
          cBucket.tokenTotals[tok] = (cBucket.tokenTotals[tok] || 0) + amt;
          if (tok === primaryToken) {
            cBucket.total += amt;
          }
        }
      }
    }

    // Label breakdown (for outgoing entries, or all entries if user filtered to non-outgoing txTypes)
    const includeInBreakdown =
      entry.direction === 'outflow' ||
      (!isAllTxTypes && !filters.txTypes.includes('Outgoing'));

    if (includeInBreakdown && Object.keys(entryTokenAmounts).length > 0) {
      const targetLabels =
        entry.labels.length > 0 ? entry.labels : ['Uncategorized'];
      // If an entry has multiple labels, attribute evenly to avoid double-counting totals in charts,
      // or track full amount per label when single-label. Dividing by targetLabels.length keeps sum accurate.
      const labelShare = 1 / targetLabels.length;
      for (const lbl of targetLabels) {
        if (!labelMap.has(lbl)) {
          labelMap.set(lbl, {
            name: lbl,
            total: 0,
            txIds: new Set(),
            entryCount: 0,
            tokenTotals: {},
          });
        }
        const lBucket = labelMap.get(lbl)!;
        lBucket.txIds.add(entry.transactionId);
        lBucket.entryCount += 1;
        lBucket.total += entryPrimaryTotal * labelShare;
        for (const [tok, amt] of Object.entries(entryTokenAmounts)) {
          lBucket.tokenTotals[tok] =
            (lBucket.tokenTotals[tok] || 0) + amt * labelShare;
        }
      }

      if (capabilities.hasSubgroups) {
        const sgName = entry.subgroup || 'Unassigned';
        if (!subgroupMap.has(sgName)) {
          subgroupMap.set(sgName, {
            name: sgName,
            total: 0,
            txIds: new Set(),
            entryCount: 0,
            tokenTotals: {},
          });
        }
        const sBucket = subgroupMap.get(sgName)!;
        sBucket.txIds.add(entry.transactionId);
        sBucket.entryCount += 1;
        sBucket.total += entryPrimaryTotal;
        for (const [tok, amt] of Object.entries(entryTokenAmounts)) {
          sBucket.tokenTotals[tok] = (sBucket.tokenTotals[tok] || 0) + amt;
        }
      }
    }

    const adaAmt = entryTokenAmounts['ADA'];
    const usdEstimate =
      adaAmt && entry.exchangeRate ? adaAmt * entry.exchangeRate : null;

    taskLedger.push({
      id: entry.id,
      transactionId: entry.transactionId,
      dateIso: entry.dateIso,
      dateDisplay: entry.dateDisplay,
      txType: entry.txType,
      direction: entry.direction,
      title: entry.title,
      description: entry.description,
      labels: entry.labels,
      subgroup: entry.subgroup,
      contributorCount: entry.recipientCount,
      tokenAmounts: entryTokenAmounts,
      totalSelected: entryPrimaryTotal,
      usdEstimate,
      hasContractInfo: entry.hasContractInfo,
    });
  }

  // Net by token
  const netByToken: Record<string, number> = {};
  for (const tok of effectiveTokens) {
    netByToken[tok] = (incomingByToken[tok] || 0) - (outgoingByToken[tok] || 0);
  }

  // Sort monthly cashflow chronologically ascending for charts
  const monthlyCashflow: MonthlyCashflowRow[] = Array.from(monthlyMap.values())
    .sort((a, b) => a.monthSortKey.localeCompare(b.monthSortKey))
    .map((m) => {
      const budgetVal =
        hasBudgets && projectInfo?.budgets?.[m.month] != null
          ? Number(projectInfo.budgets[m.month])
          : undefined;
      return {
        month: m.month,
        monthSortKey: m.monthSortKey,
        incoming: m.incoming,
        outgoing: m.outgoing,
        net: m.incoming - m.outgoing,
        txCount: m.txIds.size,
        ...(budgetVal !== undefined ? { budget: budgetVal } : {}),
        tokenIncoming: m.tokenIncoming,
        tokenOutgoing: m.tokenOutgoing,
      };
    });

  const monthlyActivity: MonthlyActivityRow[] = Array.from(monthlyMap.values())
    .sort((a, b) => a.monthSortKey.localeCompare(b.monthSortKey))
    .map((m) => ({
      month: m.month,
      monthSortKey: m.monthSortKey,
      tasks: m.tasks.size,
      contributors: m.contributors.size,
      txCount: m.txIds.size,
    }));

  const labelBreakdown: BreakdownRow[] = Array.from(labelMap.values())
    .map((l) => ({
      name: l.name,
      total: l.total,
      txCount: l.txIds.size,
      entryCount: l.entryCount,
      tokenTotals: l.tokenTotals,
    }))
    .sort((a, b) => b.total - a.total || b.entryCount - a.entryCount);

  const subgroupBreakdown: BreakdownRow[] = Array.from(subgroupMap.values())
    .map((s) => ({
      name: s.name,
      total: s.total,
      txCount: s.txIds.size,
      entryCount: s.entryCount,
      tokenTotals: s.tokenTotals,
    }))
    .sort((a, b) => b.total - a.total || b.entryCount - a.entryCount);

  const contributorBreakdown: ContributorRow[] = Array.from(contributorMap.values())
    .map((c) => ({
      contributorId: c.contributorId,
      total: c.total,
      taskCount: c.taskIds.size,
      tokenTotals: c.tokenTotals,
    }))
    .sort((a, b) => b.total - a.total || b.taskCount - a.taskCount);

  const txTypeSummary: TxTypeSummaryRow[] = Array.from(txTypeMap.values())
    .map((t) => ({
      txType: t.txType,
      txCount: t.txIds.size,
      tokenTotals: t.tokenTotals,
      totalSelected: t.totalSelected,
    }))
    .sort((a, b) => b.txCount - a.txCount);

  taskLedger.sort((a, b) => b.dateIso.localeCompare(a.dateIso));

  const fungibleBalances = balance.filter((b) => b.tokenType === 'fungible');
  const nftBalanceCount = balance.filter((b) => b.tokenType === 'nft').length;

  return {
    capabilities,
    filterOptions,
    activeTokens: effectiveTokens,
    primaryToken,
    kpi: {
      txCount: uniqueTxIds.size,
      entryCount: filtered.length,
      uniqueContributors: uniqueContributors.size,
      incomingByToken,
      outgoingByToken,
      netByToken,
      estimatedOutgoingAdaUsd: hasOutgoingUsd ? estimatedOutgoingAdaUsd : null,
      estimatedIncomingAdaUsd: hasIncomingUsd ? estimatedIncomingAdaUsd : null,
      firstDate,
      lastDate,
      smartContractTxCount: uniqueSmartContractTxIds.size,
      fungibleBalances,
      nftBalanceCount,
    },
    monthlyCashflow,
    labelBreakdown,
    subgroupBreakdown,
    monthlyActivity,
    contributorBreakdown,
    txTypeSummary,
    taskLedger,
  };
}

export function formatTokenAmount(amount: number, token?: string): string {
  if (!Number.isFinite(amount)) return '0';
  const abs = Math.abs(amount);
  const decimals = abs >= 1000 ? 0 : abs >= 1 ? 2 : 4;
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatUsd(amount: number | null): string {
  if (amount == null || !Number.isFinite(amount)) return '';
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}
