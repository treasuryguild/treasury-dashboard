/**
 * Detect treasury-dapp bulk / builder txs from on-chain CIP-20 label 674 metadata.
 * mdVersion 1.8 or contributions with arrayMap are produced by the dapp txbuilder.
 */
export function isDappBuiltTx(txData: any): boolean {
  const metadataEntries = txData?.metadata;
  if (!metadataEntries || !Array.isArray(metadataEntries)) {
    return false;
  }

  const label674 = metadataEntries.find(
    (entry: any) =>
      String(entry.label) === "674" || Number(entry.label) === 674
  );
  if (!label674?.json_metadata) return false;

  const meta = label674.json_metadata;
  const mdVersionRaw = Array.isArray(meta.mdVersion)
    ? meta.mdVersion[0]
    : meta.mdVersion;
  if (mdVersionRaw != null && String(mdVersionRaw).startsWith("1.8")) {
    return true;
  }

  const contributions = meta.contributions;
  if (Array.isArray(contributions)) {
    if (contributions.some((c: any) => c?.arrayMap != null)) {
      return true;
    }
  }

  return false;
}

export function extractLabel674(txData: any): any | null {
  const metadataEntries = txData?.metadata;
  if (!metadataEntries || !Array.isArray(metadataEntries)) return null;
  const label674 = metadataEntries.find(
    (entry: any) =>
      String(entry.label) === "674" || Number(entry.label) === 674
  );
  return label674?.json_metadata || null;
}
