const SPENDING_EXPORT_WALLETS_ENV = process.env.NEXT_PUBLIC_SPENDING_EXPORT_WALLETS;

function normalizeSuffix(value) {
  return String(value || '').trim().toLowerCase().replace(/^["']|["']$/g, '').slice(-6);
}

function stripWrappingQuotes(value) {
  const trimmed = String(value || '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function parseSpendingExportWallets(raw = SPENDING_EXPORT_WALLETS_ENV) {
  if (!raw || typeof raw !== 'string') {
    return [];
  }

  const trimmed = stripWrappingQuotes(raw);
  if (!trimmed) {
    return [];
  }

  let values = [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        values = parsed;
      }
    } catch (error) {
      values = [];
    }
  } else {
    values = trimmed.split(',');
  }

  return values
    .map(normalizeSuffix)
    .filter(suffix => suffix.length === 6);
}

export function isWalletSuffixAllowed(suffix, allowed = parseSpendingExportWallets()) {
  const normalized = normalizeSuffix(suffix);
  return normalized.length === 6 && allowed.includes(normalized);
}

export function isAnyAddressAllowed(addresses = []) {
  const allowed = parseSpendingExportWallets();
  return addresses.some(address => isWalletSuffixAllowed(address, allowed));
}

async function safeAddressList(getter) {
  try {
    const result = await getter();
    if (!result) {
      return [];
    }
    return Array.isArray(result) ? result : [result];
  } catch (error) {
    return [];
  }
}

export async function getConnectedWalletAddresses(wallet) {
  if (!wallet) {
    return [];
  }

  const [used, unused, change, reward] = await Promise.all([
    safeAddressList(() => wallet.getUsedAddresses?.()),
    safeAddressList(() => wallet.getUnusedAddresses?.()),
    safeAddressList(() => wallet.getChangeAddress?.()),
    safeAddressList(() => wallet.getRewardAddresses?.()),
  ]);

  return [...new Set([...used, ...unused, ...change, ...reward].filter(Boolean).map(String))];
}
