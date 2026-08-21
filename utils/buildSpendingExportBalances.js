import * as WorkgroupUtils from './workgroupUtils';

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvLine(values) {
  return values.map(csvEscape).join(',');
}

export function buildWorkgroupBalanceRows({
  data,
  months = ['All months'],
  workgroupsBudgets = [],
  selectedWorkgroups = ['All workgroups'],
  selectedQuarterFilters = ['No Quarters'],
}) {
  const { quarters, years } = WorkgroupUtils.getQuartersAndYearsFromMonths(months, workgroupsBudgets);

  let workgroupsToRender = [];
  if (workgroupsBudgets) {
    workgroupsToRender = selectedWorkgroups.includes('All workgroups')
      ? workgroupsBudgets.map((wg) => wg.sub_group)
      : selectedWorkgroups.filter((w) => w !== 'All workgroups');
    workgroupsToRender.sort((a, b) => a.localeCompare(b));
  }

  const rows = workgroupsToRender
    .map((workgroupName) => {
      const workgroup = workgroupsBudgets.find((wg) => wg.sub_group === workgroupName);
      if (!workgroup) {
        return null;
      }

      const budget = Math.round(WorkgroupUtils.getBudgetForWorkgroup(workgroup, quarters, years));
      const spent = Math.round(WorkgroupUtils.getSpentForWorkgroup(workgroupName, months, data));
      const incomingReallocation = Math.round(
        WorkgroupUtils.getReallocationForWorkgroup(workgroup, quarters, years, 'incoming', selectedQuarterFilters)
      );
      const outgoingReallocation = Math.round(
        WorkgroupUtils.getReallocationForWorkgroup(workgroup, quarters, years, 'outgoing', selectedQuarterFilters)
      );
      const remaining = budget - spent + incomingReallocation - outgoingReallocation;
      const cumulativeReallocation = Math.round(
        WorkgroupUtils.getCumulativeReallocationForWorkgroup(workgroup, quarters, years, selectedQuarterFilters)
      );
      const cumulativeRemaining = Math.round(
        WorkgroupUtils.getCumulativeRemainingForWorkgroup(workgroup, months, data, selectedQuarterFilters)
      );

      return {
        workgroup: workgroupName,
        budget,
        spent,
        incomingReallocation,
        outgoingReallocation,
        remaining,
        cumulativeReallocation,
        cumulativeRemaining,
      };
    })
    .filter(Boolean);

  const totalBudget = workgroupsToRender.reduce((sum, workgroupName) => {
    const workgroup = workgroupsBudgets.find((wg) => wg.sub_group === workgroupName);
    return sum + (workgroup ? WorkgroupUtils.getBudgetForWorkgroup(workgroup, quarters, years) : 0);
  }, 0);

  const totalSpent = workgroupsToRender.reduce(
    (sum, workgroupName) => sum + WorkgroupUtils.getSpentForWorkgroup(workgroupName, months, data),
    0
  );

  const totalIncomingReallocation = workgroupsToRender.reduce((sum, workgroupName) => {
    const workgroup = workgroupsBudgets.find((wg) => wg.sub_group === workgroupName);
    return sum + (workgroup ? WorkgroupUtils.getReallocationForWorkgroup(workgroup, quarters, years, 'incoming', selectedQuarterFilters) : 0);
  }, 0);

  const totalOutgoingReallocation = workgroupsToRender.reduce((sum, workgroupName) => {
    const workgroup = workgroupsBudgets.find((wg) => wg.sub_group === workgroupName);
    return sum + (workgroup ? WorkgroupUtils.getReallocationForWorkgroup(workgroup, quarters, years, 'outgoing', selectedQuarterFilters) : 0);
  }, 0);

  const totalRemaining = totalBudget - totalSpent + totalIncomingReallocation - totalOutgoingReallocation;

  const totalCumulativeReallocation = workgroupsToRender.reduce((sum, workgroupName) => {
    const workgroup = workgroupsBudgets.find((wg) => wg.sub_group === workgroupName);
    return sum + (workgroup ? WorkgroupUtils.getCumulativeReallocationForWorkgroup(workgroup, quarters, years, selectedQuarterFilters) : 0);
  }, 0);

  const totalCumulativeRemaining = workgroupsToRender.reduce((sum, workgroupName) => {
    const workgroup = workgroupsBudgets.find((wg) => wg.sub_group === workgroupName);
    return sum + (workgroup ? WorkgroupUtils.getCumulativeRemainingForWorkgroup(workgroup, months, data, selectedQuarterFilters) : 0);
  }, 0);

  rows.push({
    workgroup: 'Totals',
    budget: Math.round(totalBudget),
    spent: Math.round(totalSpent),
    incomingReallocation: Math.round(totalIncomingReallocation),
    outgoingReallocation: Math.round(totalOutgoingReallocation),
    remaining: Math.round(totalRemaining),
    cumulativeReallocation: Math.round(totalCumulativeReallocation),
    cumulativeRemaining: Math.round(totalCumulativeRemaining),
  });

  return rows;
}

export function spendingExportBalancesToCsv({
  paymentsAgixTotal,
  table1 = [],
  workgroupRows = [],
}) {
  const totalsRow = table1.find((row) => row.month === 'Totals') || {};
  const balanceRow = table1.find((row) => row.month === 'Balance') || {};
  const lines = [];

  lines.push(csvLine(['section', 'label', 'value']));
  lines.push(csvLine(['summary', 'paymentsAgixTotalExact', paymentsAgixTotal]));
  lines.push(csvLine(['summary', 'table1TotalsAgixRounded', totalsRow.agix ?? '']));
  lines.push(csvLine(['summary', 'table1Balance', balanceRow.mbBalance ?? '']));
  lines.push('');

  lines.push(csvLine(['section', 'month', 'agix', 'monthlyBudget', 'mbBalance', 'incomingReserve']));
  for (const row of table1) {
    lines.push(csvLine([
      'monthly',
      row.month,
      row.agix,
      row.monthlyBudget,
      row.mbBalance,
      row.incomingReserve,
    ]));
  }
  lines.push('');

  lines.push(csvLine([
    'section',
    'workgroup',
    'budget',
    'spent',
    'incomingReallocation',
    'outgoingReallocation',
    'remaining',
    'cumulativeReallocation',
    'cumulativeRemaining',
  ]));
  for (const row of workgroupRows) {
    lines.push(csvLine([
      'workgroup',
      row.workgroup,
      row.budget,
      row.spent,
      row.incomingReallocation,
      row.outgoingReallocation,
      row.remaining,
      row.cumulativeReallocation,
      row.cumulativeRemaining,
    ]));
  }

  return lines.join('\n');
}
