import { fetchScriptJson } from "./blockfrost";
import {
  buildAutoMetadata,
  buildGithubFilePath,
  buildTxAmounts,
} from "./buildAutoMetadata";
import { buildContractInfo, classifyTransaction } from "./classifyTx";
import { isDappBuiltTx } from "./isDappBuiltTx";
import {
  fetchAdaUsdRate,
  fetchAddressInfo,
  fetchAddressTxs,
  fetchTxInfo,
  sleep,
} from "./koios";
import { persistCapturedTx } from "./persistTx";
import { getSupabaseAdmin } from "./supabaseAdmin";
import type {
  SyncProject,
  SyncProjectResult,
  SyncRunResult,
  TokenTypeRow,
} from "./types";

const DEFAULT_TX_LIMIT = 20;
const MAX_INSERTS_PER_PROJECT = 5;
const CONSECUTIVE_KNOWN_STOP = 8;
const KOIOS_DELAY_MS = 200;

export type SyncOptions = {
  dryRun?: boolean;
  txLimit?: number;
  maxInsertsPerProject?: number;
};

async function loadProjects(): Promise<SyncProject[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("groups")
    .select(
      "group_name, archived, projects(project_name, project_type, project_id, wallet, archived, budgets, website)"
    );

  if (error) throw error;

  const projects: SyncProject[] = [];
  for (const group of data || []) {
    if (group.archived) continue;
    for (const project of group.projects || []) {
      if (project.archived) continue;
      if (!project.wallet) continue;
      projects.push({
        project_id: project.project_id,
        project_name: project.project_name,
        project_type: project.project_type || "Treasury Wallet",
        wallet: project.wallet,
        website: project.website,
        budgets: project.budgets,
        group_name: group.group_name,
      });
    }
  }
  return projects;
}

async function loadTokenTypes(): Promise<TokenTypeRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tokens")
    .select(
      "asset_name, unit, asset_type, policy_id, ticker, fingerprint, decimals"
    );
  if (error) {
    console.warn("Failed to load token types:", error.message);
    return [];
  }
  return data || [];
}

async function loadExistingTxIds(projectId: string): Promise<Set<string>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("transactions")
    .select("transaction_id")
    .eq("project_id", projectId);
  if (error) throw error;
  return new Set((data || []).map((row) => row.transaction_id));
}

function resolveStakeAddress(addressInfo: any, txData: any, wallet: string): string | null {
  if (addressInfo?.stake_address) return addressInfo.stake_address;
  const fromInput = (txData?.inputs || []).find(
    (i: any) => i.payment_addr?.bech32 === wallet
  );
  if (fromInput?.stake_addr) return fromInput.stake_addr;
  const fromOutput = (txData?.outputs || []).find(
    (o: any) => o.payment_addr?.bech32 === wallet
  );
  if (fromOutput?.stake_addr) return fromOutput.stake_addr;
  return null;
}

async function syncOneProject(
  project: SyncProject,
  tTypes: TokenTypeRow[],
  adaUsdRate: number,
  options: SyncOptions
): Promise<SyncProjectResult> {
  const result: SyncProjectResult = {
    project_id: project.project_id,
    project_name: project.project_name,
    scanned: 0,
    skippedExisting: 0,
    skippedDapp: 0,
    inserted: 0,
    errors: [],
  };

  const dryRun = !!options.dryRun;
  const txLimit = options.txLimit ?? DEFAULT_TX_LIMIT;
  const maxInserts = options.maxInsertsPerProject ?? MAX_INSERTS_PER_PROJECT;

  try {
    const existing = await loadExistingTxIds(project.project_id);
    await sleep(KOIOS_DELAY_MS);
    const addressTxs = await fetchAddressTxs(project.wallet, txLimit);
    await sleep(KOIOS_DELAY_MS);
    const addressInfo = await fetchAddressInfo(project.wallet);
    const adaBalanceAfter =
      addressInfo?.balance != null
        ? parseFloat(addressInfo.balance) / 1_000_000
        : 0;

    let consecutiveKnown = 0;

    for (const addrTx of addressTxs) {
      if (result.inserted >= maxInserts) break;

      const txHash = addrTx.tx_hash;
      result.scanned += 1;

      if (existing.has(txHash)) {
        result.skippedExisting += 1;
        consecutiveKnown += 1;
        if (consecutiveKnown >= CONSECUTIVE_KNOWN_STOP) break;
        continue;
      }
      consecutiveKnown = 0;

      try {
        await sleep(KOIOS_DELAY_MS);
        const txData = await fetchTxInfo(txHash);
        if (!txData) {
          result.errors.push(`${txHash}: empty tx_info`);
          continue;
        }

        if (isDappBuiltTx(txData)) {
          result.skippedDapp += 1;
          continue;
        }

        const stakeAddress = resolveStakeAddress(
          addressInfo,
          txData,
          project.wallet
        );
        const classified = classifyTransaction({
          usedAddresses: [project.wallet],
          stakeAddress,
          txData,
          tTypes,
        });

        const { txamounts, totalAmounts } = buildTxAmounts(
          classified.addressAssets
        );

        // Ensure at least fee-level presence for empty asset maps
        if (Object.keys(totalAmounts).length === 0) {
          totalAmounts.ADA = parseFloat(txData.fee || "0") / 1_000_000;
          txamounts[project.wallet] = { ADA: totalAmounts.ADA };
        }

        let contractInfo = buildContractInfo(txData);
        if (contractInfo?.scriptHashes?.[0]) {
          const scriptJson = await fetchScriptJson(contractInfo.scriptHashes[0]);
          if (scriptJson) {
            contractInfo = { ...contractInfo, scriptJson };
          }
        }

        const metaData = buildAutoMetadata({
          project,
          txHash,
          txType: classified.transactionType,
          walletAddress: project.wallet,
          txamounts,
          totalAmounts,
          adaUsdRate,
          contractInfo,
        });

        const customFilePath = buildGithubFilePath({
          project,
          txType: classified.transactionType,
          walletAddress: project.wallet,
        });

        const addressByContributor: Record<string, string> = {};
        for (const address of Object.keys(txamounts)) {
          addressByContributor[address.slice(-6)] = address;
        }
        addressByContributor[project.wallet.slice(-6)] = project.wallet;

        const feeLovelace = parseInt(txData.fee || "0", 10) || 0;
        const transactionDateMs = String(
          (addrTx.block_time ? addrTx.block_time * 1000 : Date.now())
        );

        await persistCapturedTx({
          txHash,
          projectId: project.project_id,
          txType: classified.transactionType,
          metaData,
          customFilePath,
          fee: feeLovelace,
          adaBalanceAfter,
          totalAmounts,
          addressByContributor,
          adaUsdRate,
          monthlyBudgetBalance: {},
          transactionDateMs,
          dryRun,
        });

        result.inserted += 1;
        existing.add(txHash);
      } catch (err: any) {
        const message = err?.message || String(err);
        console.error(
          `Error syncing ${project.project_name} ${txHash}:`,
          message
        );
        result.errors.push(`${txHash}: ${message}`);
      }
    }
  } catch (err: any) {
    result.errors.push(err?.message || String(err));
  }

  return result;
}

export async function syncAllProjects(
  options: SyncOptions = {}
): Promise<SyncRunResult> {
  const startedAt = Date.now();
  const dryRun =
    options.dryRun === true || process.env.DRY_RUN === "true";
  const tTypes = await loadTokenTypes();
  const adaUsdRate = await fetchAdaUsdRate();
  const projects = await loadProjects();

  console.log(
    `Starting on-chain sync for ${projects.length} projects (dryRun=${dryRun})`
  );

  const projectResults: SyncProjectResult[] = [];
  for (const project of projects) {
    console.log(`Syncing project: ${project.project_name}`);
    const result = await syncOneProject(project, tTypes, adaUsdRate, {
      ...options,
      dryRun,
    });
    console.log(
      `Done ${project.project_name}: scanned=${result.scanned} inserted=${result.inserted} skippedExisting=${result.skippedExisting} skippedDapp=${result.skippedDapp} errors=${result.errors.length}`
    );
    projectResults.push(result);
  }

  const totals = projectResults.reduce(
    (acc, p) => {
      acc.scanned += p.scanned;
      acc.skippedExisting += p.skippedExisting;
      acc.skippedDapp += p.skippedDapp;
      acc.inserted += p.inserted;
      acc.errors += p.errors.length;
      return acc;
    },
    {
      scanned: 0,
      skippedExisting: 0,
      skippedDapp: 0,
      inserted: 0,
      errors: 0,
    }
  );

  const elapsedMs = Date.now() - startedAt;
  console.log(
    `On-chain sync finished in ${elapsedMs}ms (inserted=${totals.inserted}, errors=${totals.errors})`
  );

  return { dryRun, projects: projectResults, totals };
}
