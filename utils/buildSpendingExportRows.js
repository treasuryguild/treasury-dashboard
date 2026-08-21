function findAgixIndex(tokens = []) {
  return tokens.findIndex(token => String(token).toLowerCase() === 'agix');
}

export function buildSpendingExportRows(distributionsArray = []) {
  const rows = [];

  for (const distribution of distributionsArray) {
    if (distribution.tx_type !== 'Outgoing') {
      continue;
    }
    if (!Array.isArray(distribution.tokens) || !Array.isArray(distribution.amounts)) {
      continue;
    }

    const agixIndex = findAgixIndex(distribution.tokens);
    if (agixIndex === -1) {
      continue;
    }

    rows.push({
      userId: distribution.contributor_id || '',
      amount: Number(distribution.amounts[agixIndex]),
      task: distribution.task_name || '',
      date: distribution.task_date || '',
      workgroup: distribution.task_sub_group || '',
    });
  }

  return rows;
}

export function sumSpendingExportAgix(rows = []) {
  return rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function spendingExportRowsToCsv(rows = []) {
  const header = ['userId', 'amount', 'task', 'date', 'workgroup'];
  const lines = [header.join(',')];

  for (const row of rows) {
    lines.push(header.map(key => csvEscape(row[key])).join(','));
  }

  return lines.join('\n');
}
