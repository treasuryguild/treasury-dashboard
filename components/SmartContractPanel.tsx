import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "../styles/Txid.module.css";

type ContractInfo = {
  scriptHashes?: string[];
  addresses?: string[];
  purposes?: string[];
  scriptJson?: Record<string, unknown>;
  plutusContracts?: unknown[];
};

type Props = {
  txHash: string;
  storedContractInfo?: ContractInfo | null;
  txType?: string;
};

const SMART_CONTRACT_TYPES = new Set([
  "Smart Contract",
  "Swap",
  "Vote Delegation",
  "DRep Registration",
]);

const SmartContractPanel: React.FC<Props> = ({
  txHash,
  storedContractInfo,
  txType,
}) => {
  const [loading, setLoading] = useState(false);
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(
    storedContractInfo || null
  );
  const [error, setError] = useState<string | null>(null);

  const shouldShow =
    !!storedContractInfo ||
    (txType != null && SMART_CONTRACT_TYPES.has(txType));

  useEffect(() => {
    if (!shouldShow || !txHash) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post("/api/getTxContractInfo", {
          txid: txHash,
        });
        if (cancelled) return;
        if (response.data?.contractInfo) {
          setContractInfo(response.data.contractInfo);
        } else if (!storedContractInfo) {
          setContractInfo(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load contract details");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [txHash, shouldShow, storedContractInfo]);

  if (!shouldShow) return null;

  const explorerUrl = `https://cardanoscan.io/transaction/${txHash}`;

  return (
    <div className={`${styles.taskCard} ${styles.contractPanel}`}>
      <h2 className={styles.taskName}>Smart Contract</h2>
      {loading && <p>Loading contract details…</p>}
      {error && <p className={styles.contractError}>{error}</p>}
      {!loading && !contractInfo && (
        <p>No on-chain Plutus contract data found for this transaction.</p>
      )}
      {contractInfo && (
        <div className={styles.contractDetails}>
          {txType && (
            <p>
              <strong>Type:</strong> {txType}
            </p>
          )}
          {contractInfo.purposes && contractInfo.purposes.length > 0 && (
            <p>
              <strong>Purpose:</strong> {contractInfo.purposes.join(", ")}
            </p>
          )}
          {contractInfo.scriptHashes && contractInfo.scriptHashes.length > 0 && (
            <div>
              <strong>Script hashes</strong>
              <ul>
                {contractInfo.scriptHashes.map((hash) => (
                  <li key={hash}>
                    <code>{hash}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {contractInfo.addresses && contractInfo.addresses.length > 0 && (
            <div>
              <strong>Contract addresses</strong>
              <ul>
                {contractInfo.addresses.map((addr) => (
                  <li key={addr}>
                    <code>{addr}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {contractInfo.scriptJson && (
            <div>
              <strong>Script JSON</strong>
              <pre className={styles.contractJson}>
                {JSON.stringify(contractInfo.scriptJson, null, 2)}
              </pre>
            </div>
          )}
          <p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contractLink}
            >
              View on Cardanoscan
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartContractPanel;
