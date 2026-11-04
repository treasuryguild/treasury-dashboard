import {
  filterIncomingTransactions,
  isTransactionInSpecialReturnedGroup,
  calculateAgixTotal,
} from './transactionUtils';

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function getAgixAmount(tx) {
  const agixIndex = tx.total_tokens?.indexOf('AGIX') ?? -1;
  if (agixIndex < 0 || !Array.isArray(tx.total_amounts)) {
    return 0;
  }
  return Number(tx.total_amounts[agixIndex]) || 0;
}

function formatTransactionDate(tx) {
  const date = new Date(Number(tx.transaction_date));
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function splitTransactionsByPredicate(transactions, predicate) {
  return transactions.reduce(
    (acc, tx) => {
      if (predicate(tx)) {
        acc.specialTransactions.push(tx);
      } else {
        acc.regularTransactions.push(tx);
      }
      return acc;
    },
    { regularTransactions: [], specialTransactions: [] }
  );
}

export function getRegularIncomingTransactions(transactions = []) {
  const incomingTransactions = filterIncomingTransactions(transactions);
  const { regularTransactions } = splitTransactionsByPredicate(
    incomingTransactions,
    isTransactionInSpecialReturnedGroup
  );
  return regularTransactions;
}

export function buildIncomingTransactionsCsv(transactions = []) {
  const regularIncomingTransactions = getRegularIncomingTransactions(transactions);
  const regularAgixTotal = calculateAgixTotal(regularIncomingTransactions);
  const lines = ['Date,AGIX'];

  for (const tx of regularIncomingTransactions) {
    lines.push(
      [csvEscape(formatTransactionDate(tx)), csvEscape(getAgixAmount(tx).toFixed(2))].join(',')
    );
  }

  lines.push([csvEscape('Total'), csvEscape(regularAgixTotal.toFixed(2))].join(','));
  return lines.join('\n');
}
