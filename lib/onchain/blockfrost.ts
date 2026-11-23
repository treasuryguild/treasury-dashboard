/**
 * Optional Blockfrost script JSON enrichment (multisig-style).
 * Best-effort only; failures return null.
 */
export async function fetchScriptJson(
  scriptHash: string
): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.BLOCKFROST_API_KEY_MAINNET;
  if (!apiKey || !scriptHash) return null;

  try {
    const response = await fetch(
      `https://cardano-mainnet.blockfrost.io/api/v0/scripts/${scriptHash}/json`,
      {
        headers: { project_id: apiKey },
      }
    );
    if (!response.ok) return null;
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
