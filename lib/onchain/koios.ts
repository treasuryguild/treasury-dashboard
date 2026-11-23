import axios from "axios";

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
