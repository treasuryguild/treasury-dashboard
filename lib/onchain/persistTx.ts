import type { AutoMetadata } from "./types";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { commitFileToGitHub, rawGithubUrl } from "./githubCommit";

export type PersistTxArgs = {
  txHash: string;
  projectId: string;
  txType: string;
  metaData: AutoMetadata;
  customFilePath: string;
  fee: number;
  adaBalanceAfter: number;
  totalAmounts: Record<string, number>;
  /** Map contributor suffix (last 6) → full payment address when known */
  addressByContributor: Record<string, string>;
  adaUsdRate: number;
  monthlyBudgetBalance?: Record<string, unknown>;
  transactionDateMs: string;
  dryRun?: boolean;
};

async function updateContributors(walletAddress: string, contributorKey: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("contributors").upsert([
    {
      contributor_id: contributorKey,
      wallet: walletAddress,
    },
  ]);
  if (error) throw error;
  return contributorKey;
}

export async function persistCapturedTx(
  args: PersistTxArgs
): Promise<{ tx_id: string | null; dryRun: boolean }> {
  const {
    txHash,
    projectId,
    txType,
    metaData,
    customFilePath,
    fee,
    adaBalanceAfter,
    totalAmounts,
    addressByContributor,
    adaUsdRate,
    monthlyBudgetBalance = {},
    transactionDateMs,
    dryRun = false,
  } = args;

  const total_tokens = Object.keys(totalAmounts);
  const total_amounts = Object.values(totalAmounts);
  let recipients = 1;
  const recipientsMsg = metaData.msg.find((msg) =>
    msg.startsWith("Recipients: ")
  );
  if (recipientsMsg) {
    recipients = parseInt(recipientsMsg.split(" ")[1], 10) || 1;
  }

  if (dryRun) {
    console.log("[dry-run] would persist", {
      txHash,
      projectId,
      txType,
      customFilePath,
      total_tokens,
      total_amounts,
    });
    return { tx_id: null, dryRun: true };
  }

  const supabase = getSupabaseAdmin();
  const tx_json_url = rawGithubUrl(customFilePath);

  const fileContent = JSON.stringify({ ...metaData, txid: txHash }, null, 2);
  await commitFileToGitHub({
    filePath: customFilePath,
    fileContent,
    commitMessage: `Auto-capture ${txType}: ${txHash.slice(0, 8)}`,
  });

  const { data: insertResult, error } = await supabase
    .from("transactions")
    .insert([
      {
        transaction_id: txHash,
        transaction_date: transactionDateMs,
        wallet_balance_after: adaBalanceAfter,
        md_version: metaData.mdVersion[0] || "1.4",
        tx_json: metaData,
        tx_json_url,
        exchange_rate: adaUsdRate || 0,
        recipients,
        fee: fee || 0,
        tx_type: txType,
        project_id: projectId,
        total_tokens,
        total_amounts,
        monthly_budget_balance: monthlyBudgetBalance,
      },
    ])
    .select("tx_id")
    .single();

  if (error) throw error;
  const tx_id = insertResult?.tx_id || null;
  if (!tx_id) throw new Error("Failed to insert transaction");

  const contribution = metaData.contributions[0];
  const task_label = Array.isArray(contribution.label)
    ? contribution.label.join(",")
    : contribution.label || txType;
  const task_description = Array.isArray(contribution.description)
    ? contribution.description.join(" ")
    : contribution.description || null;

  const { data: contribData, error: contribError } = await supabase
    .from("contributions")
    .insert([
      {
        project_id: projectId,
        tx_id,
        task_creator: contribution.taskCreator?.[0] || null,
        task_name: null,
        task_label,
        task_description,
        task_date: null,
        task_sub_group: null,
        task_array_map: null,
        task_type: txType === "Incoming" ? "Incoming" : txType,
      },
    ])
    .select("contribution_id")
    .single();

  if (contribError) throw contribError;
  const contribution_id = contribData.contribution_id;

  for (const contributorKey of Object.keys(contribution.contributors || {})) {
    const tokensObj = contribution.contributors[contributorKey];
    const tokensArray: string[] = [];
    const amountsArray: number[] = [];
    for (const token of Object.keys(tokensObj)) {
      const amount = Number(tokensObj[token]);
      if (token.toLowerCase() === "gimbal") {
        tokensArray.push("GMBL");
      } else {
        tokensArray.push(token);
      }
      amountsArray.push(amount);
    }

    const walletAddress =
      addressByContributor[contributorKey] || contributorKey;
    await updateContributors(walletAddress, contributorKey);

    const { error: distError } = await supabase.from("distributions").insert([
      {
        contributor_id: contributorKey,
        tokens: tokensArray,
        amounts: amountsArray,
        contribution_id,
        project_id: projectId,
        tx_id,
      },
    ]);
    if (distError) throw distError;
  }

  return { tx_id, dryRun: false };
}
