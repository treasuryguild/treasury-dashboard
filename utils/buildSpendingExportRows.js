const ALLOWED_TOKEN_COLUMNS = ['AGIX', 'GMBL', 'MINS'];
const ALLOWED_TOKEN_LOOKUP = new Map(
  ALLOWED_TOKEN_COLUMNS.map(token => [token.toLowerCase(), token])
);

function normalizeTaskText(value) {
  if (Array.isArray(value)) {
    return value.join(' ').trim();
  }
  if (value == null) {
    return '';
  }
  return String(value).trim();
}

function canonicalizeAllowedToken(token) {
  return ALLOWED_TOKEN_LOOKUP.get(String(token ?? '').trim().toLowerCase()) || null;
}

function rowKey({ userId, task, date, workgroup }) {
  return [userId, task, date, workgroup].join('\u0001');
}

function rowHasAllowedTokenAmount(row) {
  return ALLOWED_TOKEN_COLUMNS.some(token => Number(row[token]) || 0);
}

export function getSpendingExportTokenColumns() {
  return [...ALLOWED_TOKEN_COLUMNS];
}

export function buildSpendingExportRows(distributionsArray = []) {
  const aggregated = new Map();

  for (const distribution of distributionsArray) {
    if (distribution.tx_type !== 'Outgoing') {
      continue;
    }
    if (!Array.isArray(distribution.tokens) || !Array.isArray(distribution.amounts)) {
      continue;
    }

    const userId = distribution.contributor_id || '';
    if (String(userId).toLowerCase() === 'minswap') {
      continue;
    }

    const task = normalizeTaskText(distribution.task_name || distribution.task_description);
    const date = distribution.task_date || '';
    const workgroup = distribution.task_sub_group || '';
    const key = rowKey({ userId, task, date, workgroup });

    let row = aggregated.get(key);
    if (!row) {
      row = {
        userId,
        task,
        date,
        workgroup,
      };
      aggregated.set(key, row);
    }

    const tokenCount = Math.min(distribution.tokens.length, distribution.amounts.length);
    for (let i = 0; i < tokenCount; i += 1) {
      const token = canonicalizeAllowedToken(distribution.tokens[i]);
      if (!token) {
        continue;
      }
      const amount = Number(distribution.amounts[i]);
      if (!Number.isFinite(amount)) {
        continue;
      }
      row[token] = (Number(row[token]) || 0) + amount;
    }
  }

  return [...aggregated.values()].filter(rowHasAllowedTokenAmount);
}

export function sumSpendingExportAgix(rows = []) {
  return rows.reduce((sum, row) => sum + (Number(row.AGIX) || 0), 0);
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function spendingExportRowsToCsv(rows = []) {
  const tokenColumns = getSpendingExportTokenColumns();
  const header = ['userId', ...tokenColumns, 'task', 'date', 'workgroup'];
  const lines = [header.join(',')];

  for (const row of rows) {
    lines.push(
      header
        .map(key => {
          if (tokenColumns.includes(key)) {
            const value = row[key];
            if (value === '' || value == null) {
              return '';
            }
            return csvEscape(value);
          }
          return csvEscape(row[key]);
        })
        .join(',')
    );
  }

  return lines.join('\n');
}
