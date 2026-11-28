import axios from "axios";
import type { ResolvedAssetInfo, TokenTypeRow } from "./types";

const KOIOS_BASE = "https://api.koios.rest/api/v1";

function koiosHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (process.env.KOIOS_API_KEY) {
    headers.Authorization = `Bearer ${process.env.KOIOS_API_KEY}`;
  }
  return headers;
}

async function koiosPost<T>(path: string, body: unknown): Promise<T> {
  const response = await axios.post(`${KOIOS_BASE}${path}`, body, {
    headers: koiosHeaders(),
    timeout: 60000,
  });
  return response.data as T;
}

export type KoiosAddressTx = {
  tx_hash: string;
  block_time?: number;
  block_height?: number;
};

export async function fetchAddressTxs(
  wallet: string,
  limit = 50
): Promise<KoiosAddressTx[]> {
  const data = await koiosPost<KoiosAddressTx[]>("/address_txs", {
    _addresses: [wallet],
  });
  return (data || []).slice(0, limit);
}

export async function fetchTxInfo(txHash: string): Promise<any | null> {
  const data = await koiosPost<any[]>("/tx_info", {
    _tx_hashes: [txHash],
    _inputs: true,
    _metadata: true,
    _assets: true,
    _withdrawals: true,
    _certs: true,
    _scripts: true,
    _bytecode: true,
  });
  return data?.[0] || null;
}

export async function fetchAddressInfo(wallet: string): Promise<any | null> {
  const data = await koiosPost<any[]>("/address_info", {
    _addresses: [wallet],
  });
  return data?.[0] || null;
}

export async function fetchAssetInfo(
  assetPairs: [string, string][]
): Promise<any[]> {
  if (!assetPairs.length) return [];
  const data = await koiosPost<any[]>("/asset_info", {
    _asset_list: assetPairs,
  });
  return data || [];
}

function isPrintableName(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !/[\x00-\x1f\x7f\ufffd]/.test(value)
  );
}

export function mapKoiosAssetInfo(info: any): ResolvedAssetInfo {
  const isNft = Number(info?.total_supply) === 1;
  const cip25Policy = info?.minting_tx_metadata?.["721"]?.[info?.policy_id];
  const cip25Entry =
    cip25Policy?.[info?.asset_name] || cip25Policy?.[info?.asset_name_ascii];
  const cip25Name = cip25Entry?.name;
  const registryTicker = info?.token_registry_metadata?.ticker;
  const registryName = info?.token_registry_metadata?.name;
  const asciiName = info?.asset_name_ascii;

  let name: string | undefined;
  if (isNft) {
    if (isPrintableName(cip25Name)) name = cip25Name.trim();
    else if (isPrintableName(asciiName)) name = asciiName.trim();
  } else {
    if (isPrintableName(registryTicker)) name = registryTicker.trim();
    else if (isPrintableName(registryName)) name = registryName.trim();
    else if (isPrintableName(asciiName)) name = asciiName.trim();
  }

  const rawDecimals = info?.token_registry_metadata?.decimals;
  const decimals =
    rawDecimals != null && Number.isFinite(Number(rawDecimals))
      ? Number(rawDecimals)
      : null;

  return {
    fingerprint: info?.fingerprint || "",
    policy_id: info?.policy_id,
    asset_name: info?.asset_name,
    name,
    decimals,
  };
}

export async function enrichUnknownTxAssets(
  txData: any,
  tTypes: TokenTypeRow[]
): Promise<ResolvedAssetInfo[]> {
  const knownFingerprints = new Set(
    tTypes.map((t) => t.fingerprint).filter(Boolean)
  );
  const pairMap = new Map<string, [string, string]>();

  const collect = (list: any[] | undefined) => {
    for (const asset of list || []) {
      if (!asset?.policy_id || asset.asset_name == null) continue;
      if (asset.fingerprint && knownFingerprints.has(asset.fingerprint)) {
        continue;
      }
      const key = `${asset.policy_id}.${asset.asset_name}`;
      if (!pairMap.has(key)) {
        pairMap.set(key, [asset.policy_id, asset.asset_name]);
      }
    }
  };

  for (const output of txData?.outputs || []) {
    collect(output.asset_list);
  }
  collect(txData?.assets_minted);

  const pairs = Array.from(pairMap.values());
  if (pairs.length === 0) return [];

  try {
    const details = await fetchAssetInfo(pairs);
    return details.map(mapKoiosAssetInfo).filter((a) => a.fingerprint);
  } catch (err: any) {
    console.warn(
      "Koios /asset_info lookup failed (falling back to hex decode):",
      err?.message || err
    );
    return [];
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchAdaUsdRate(): Promise<number> {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd",
      { timeout: 15000 }
    );
    const rate = response.data?.cardano?.usd;
    return rate != null ? Number(parseFloat(rate).toFixed(3)) : 0;
  } catch {
    return 0;
  }
}
