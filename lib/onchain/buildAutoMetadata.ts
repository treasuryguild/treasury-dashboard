import type {
  AddressAssetToken,
  AutoMetadata,
  ContractInfo,
  SyncProject,
} from "./types";

function defaultDescription(txType: string, projectName: string): string {
  switch (txType) {
    case "Incoming":
      return `Incoming rewards from ${projectName}`;
    case "Staking":
      return "Staking to Pool";
    case "Rewards Withdrawal":
      return "Rewards Withdrawal";
    case "Internal Transfer":
      return "Internal Transfer";
    case "Minting":
      return "Minted new tokens";
    case "Burning":
      return "Burnt tokens";
    case "Swap":
      return "Token swap";
    case "Smart Contract":
      return "Smart contract interaction";
    case "Vote Delegation":
      return "Vote Delegation";
    case "DRep Registration":
      return "DRep Registration";
    case "Outgoing":
      return "Outgoing transfer";
    case "Wallet Emptied":
      return "Wallet emptied";
    default:
      return `${txType} transaction`;
  }
}

function formatAmounts(
  amounts: Record<string, number>,
  rates: Record<string, number>
): string[] {
  const output: string[] = [];
  for (const key of Object.keys(amounts)) {
    let amount: string | number = amounts[key];
    const rate = rates[key] || 0;
    if (key !== "ADA") {
      amount = parseFloat(String(amount)).toFixed(2);
    }
    const usdAmount = parseFloat(String(amount)) * parseFloat(String(rate));
    output.push(`${usdAmount.toFixed(2)} USD in ${amount} ${key}`);
  }
  return output;
}

export function tokensToAmountMap(
  tokens: AddressAssetToken[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const token of tokens) {
    const name = token.name || "Unknown";
    const amount = parseFloat(String(token.amount));
    if (!Number.isFinite(amount)) continue;
    map[name] = (map[name] || 0) + amount;
  }
  return map;
}

export function buildTxAmounts(
  addressAssets: Record<string, AddressAssetToken[]>
): {
  txamounts: Record<string, Record<string, number>>;
  totalAmounts: Record<string, number>;
} {
  const txamounts: Record<string, Record<string, number>> = {};
  const totalAmounts: Record<string, number> = {};

  for (const [address, tokens] of Object.entries(addressAssets)) {
    const amounts = tokensToAmountMap(tokens);
    txamounts[address] = amounts;
    for (const [token, amount] of Object.entries(amounts)) {
      totalAmounts[token] = (totalAmounts[token] || 0) + amount;
    }
  }

  if (totalAmounts.ADA != null) {
    totalAmounts.ADA = parseFloat(Number(totalAmounts.ADA).toFixed(6));
  }

  return { txamounts, totalAmounts };
}

export function buildAutoMetadata(args: {
  project: SyncProject;
  txHash: string;
  txType: string;
  walletAddress: string;
  txamounts: Record<string, Record<string, number>>;
  totalAmounts: Record<string, number>;
  adaUsdRate: number;
  contractInfo?: ContractInfo | null;
}): AutoMetadata {
  const {
    project,
    txHash,
    txType,
    walletAddress,
    txamounts,
    totalAmounts,
    adaUsdRate,
    contractInfo,
  } = args;

  const website = project.website || "https://www.treasuryguild.io/";
  const contributor: Record<string, Record<string, number | string>> = {};
  const keys = Object.keys(txamounts);
  const lastSix = walletAddress.slice(-6);

  if (txType === "Incoming" || keys.length === 0) {
    contributor[lastSix] =
      keys.length > 0 ? txamounts[keys[0]] : totalAmounts;
  } else {
    for (const key of keys) {
      contributor[key.slice(-6)] = txamounts[key];
    }
  }

  const description = defaultDescription(txType, project.project_name);
  const recipientCount = Math.max(1, Object.keys(contributor).length);
  const tokenRates: Record<string, number> = { ADA: adaUsdRate };

  const msg = [
    `${project.project_name} Transaction`,
    `Website: ${website}`,
    `Recipients: ${recipientCount}`,
    `Transaction made by Treasury Guild @${adaUsdRate}`,
    "https://www.treasuryguild.io/",
  ];

  const usdLines = formatAmounts(totalAmounts, tokenRates);
  msg.splice(3, 0, ...usdLines);

  const metadata: AutoMetadata = {
    mdVersion: ["1.4"],
    txid: txHash,
    msg,
    contributions: [
      {
        taskCreator: [project.project_name],
        label: [txType],
        description: [description],
        contributors: contributor,
      },
    ],
  };

  if (contractInfo) {
    metadata.contractInfo = contractInfo;
  }

  return metadata;
}

export function buildGithubFilePath(args: {
  project: SyncProject;
  txType: string;
  walletAddress: string;
  timestamp?: number;
}): string {
  const { project, txType, walletAddress } = args;
  const timestamp = args.timestamp ?? Date.now();

  let pType = "";
  if (project.project_type === "Treasury Wallet") {
    pType = "TreasuryWallet";
  } else {
    pType = project.project_type.replace(/\s/g, "").replace("Proposal", "");
  }

  const folder =
    txType === "Outgoing"
      ? "bulkTransactions"
      : txType.replace(/\s/g, "-");
  const filename =
    txType === "Outgoing"
      ? `${project.group_name.replace(/\s/g, "-")}-bulkTransactions`
      : walletAddress.slice(-6);

  return `Transactions/${project.group_name.replace(/\s/g, "-")}/${pType}/${project.project_name.replace(/\s/g, "-")}/${folder}/${timestamp}-${filename}.json`;
}
