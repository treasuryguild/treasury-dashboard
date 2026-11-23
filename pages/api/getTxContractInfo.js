import {
  buildContractInfo,
  fetchScriptJson,
  fetchTxInfo,
} from "../../lib/onchain";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const txHash = req.body?.txid || req.body?.txHash;
  if (!txHash || typeof txHash !== "string") {
    res.status(400).json({ message: "txid is required" });
    return;
  }

  try {
    const txData = await fetchTxInfo(txHash);
    if (!txData) {
      res.status(404).json({ message: "Transaction not found" });
      return;
    }

    let contractInfo = buildContractInfo(txData);
    if (!contractInfo) {
      res.status(200).json({
        txHash,
        hasSmartContract: false,
        contractInfo: null,
        fee: txData.fee,
        certificates: txData.certificates || [],
      });
      return;
    }

    if (contractInfo.scriptHashes?.[0]) {
      const scriptJson = await fetchScriptJson(contractInfo.scriptHashes[0]);
      if (scriptJson) {
        contractInfo = { ...contractInfo, scriptJson };
      }
    }

    res.status(200).json({
      txHash,
      hasSmartContract: true,
      contractInfo,
      fee: txData.fee,
      certificates: txData.certificates || [],
      plutusContractCount: contractInfo.plutusContracts?.length || 0,
    });
  } catch (error) {
    console.error("getTxContractInfo failed:", error.message);
    res.status(500).json({ message: error.message || "Failed to fetch contract info" });
  }
}
