import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/NonSnetDashboard.module.css';
import { useMyVariable } from '../context/MyVariableContext';
import DashboardBarChart from './dashboard/DashboardBarChart';
import {
  buildNonSnetDashboardData,
  extractFilterOptions,
  formatTokenAmount,
  formatUsd,
  normalizeNonSnetTransactions,
  normalizeTokenSymbol,
} from '../utils/nonSnetDashboardData';

interface DashboardProps {
  query: {
    month?: string;
    months?: string;
    workgroup?: string;
    workgroups?: string;
    token?: string;
    tokens?: string;
    label?: string;
    labels?: string;
    txTypes?: string;
  };
}

const DEFAULT_LEDGER_LIMIT = 50;

const Dashboard: React.FC<DashboardProps> = () => {
  const router = useRouter();
  const { groupName, projectName } = router.query;
  const { myVariable } = useMyVariable();

  const [selectedMonths, setSelectedMonths] = useState<string[]>(['All months']);
  const [selectedTokens, setSelectedTokens] = useState<string[]>(['All tokens']);
  const [selectedTxTypes, setSelectedTxTypes] = useState<string[]>(['All types']);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(['All labels']);
  const [selectedWorkgroups, setSelectedWorkgroups] = useState<string[]>(['All workgroups']);
  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  const [showAllLedger, setShowAllLedger] = useState<boolean>(false);
  const [initializedProjectId, setInitializedProjectId] = useState<string | null>(null);

  const rawTransactions = useMemo(() => {
    if (Array.isArray(myVariable.originalTransactions) && myVariable.originalTransactions.length > 0) {
      return myVariable.originalTransactions;
    }
    if (Array.isArray(myVariable.transactions)) {
      return myVariable.transactions;
    }
    return [];
  }, [myVariable.originalTransactions, myVariable.transactions]);

  const normalizedEntries = useMemo(() => {
    return normalizeNonSnetTransactions(rawTransactions, myVariable.toke_types || []);
  }, [rawTransactions, myVariable.toke_types]);

  const availableOptions = useMemo(() => {
    return extractFilterOptions(normalizedEntries, myVariable.projectInfo?.core_token);
  }, [normalizedEntries, myVariable.projectInfo?.core_token]);

  // Initialize filters cleanly once per loaded project from URL params + available options
  useEffect(() => {
    if (!router.isReady) return;
    const projectId = myVariable.projectInfo?.project_id || String(projectName || '');
    if (!projectId || initializedProjectId === projectId) return;

    const urlParams = new URLSearchParams(window.location.search);
    const parseParam = (key: string): string[] => {
      const val = urlParams.get(key);
      if (!val) return [];
      return val
        .split(',')
        .map((s) => decodeURIComponent(s).trim())
        .filter(Boolean);
    };

    const urlMonths = parseParam('months').filter(
      (m) => m === 'All months' || availableOptions.months.includes(m)
    );
    const urlTokens = parseParam('tokens')
      .map((t) => (t === 'All tokens' ? t : normalizeTokenSymbol(t)))
      .filter((t) => t === 'All tokens' || availableOptions.tokens.includes(t));
    const urlTxTypes = parseParam('txTypes').filter(
      (t) => t === 'All types' || availableOptions.txTypes.includes(t)
    );
    const urlLabels = parseParam('labels').filter(
      (l) => l === 'All labels' || availableOptions.labels.includes(l)
    );
    const urlWorkgroups = parseParam('workgroups').filter(
      (w) =>
        w === 'All workgroups' ||
        w === 'Unassigned' ||
        availableOptions.subgroups.includes(w)
    );

    setSelectedMonths(urlMonths.length > 0 ? urlMonths : ['All months']);

    if (urlTokens.length > 0) {
      setSelectedTokens(urlTokens);
    } else {
      const core = myVariable.projectInfo?.core_token
        ? normalizeTokenSymbol(myVariable.projectInfo.core_token)
        : '';
      if (core && availableOptions.tokens.includes(core)) {
        setSelectedTokens([core]);
      } else {
        setSelectedTokens(['All tokens']);
      }
    }

    setSelectedTxTypes(urlTxTypes.length > 0 ? urlTxTypes : ['All types']);
    setSelectedLabels(urlLabels.length > 0 ? urlLabels : ['All labels']);
    setSelectedWorkgroups(urlWorkgroups.length > 0 ? urlWorkgroups : ['All workgroups']);
    setInitializedProjectId(projectId);
  }, [
    router.isReady,
    myVariable.projectInfo?.project_id,
    myVariable.projectInfo?.core_token,
    projectName,
    availableOptions,
    initializedProjectId,
  ]);

  const updateUrlParam = (key: string, values: string[], allValue: string) => {
    const newQuery = { ...router.query };
    if (values.length === 0 || values.includes(allValue)) {
      newQuery[key] = allValue;
    } else {
      newQuery[key] = values.join(',');
    }
    router.push(
      {
        pathname: router.pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const toggleFilter = (
    item: string,
    allItem: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    queryKey: string
  ) => {
    let updated: string[];
    if (item === allItem) {
      updated = [allItem];
    } else if (current.includes(item)) {
      updated = current.filter((i) => i !== item);
      if (updated.length === 0) updated = [allItem];
    } else {
      updated = [...current.filter((i) => i !== allItem), item];
    }
    setter(updated);
    updateUrlParam(queryKey, updated, allItem);
  };

  const handleResetFilters = () => {
    const core = myVariable.projectInfo?.core_token
      ? normalizeTokenSymbol(myVariable.projectInfo.core_token)
      : '';
    const defaultTokens =
      core && availableOptions.tokens.includes(core) ? [core] : ['All tokens'];

    setSelectedMonths(['All months']);
    setSelectedTokens(defaultTokens);
    setSelectedTxTypes(['All types']);
    setSelectedLabels(['All labels']);
    setSelectedWorkgroups(['All workgroups']);
    setLedgerSearch('');

    const newQuery = { ...router.query };
    newQuery.months = 'All months';
    newQuery.tokens = defaultTokens.join(',');
    newQuery.txTypes = 'All types';
    newQuery.labels = 'All labels';
    newQuery.workgroups = 'All workgroups';
    router.push({ pathname: router.pathname, query: newQuery }, undefined, {
      shallow: true,
    });
  };

  const dashboard = useMemo(() => {
    return buildNonSnetDashboardData({
      entries: normalizedEntries,
      filters: {
        months: selectedMonths,
        tokens: selectedTokens,
        txTypes: selectedTxTypes,
        labels: selectedLabels,
        subgroups: selectedWorkgroups,
      },
      projectInfo: myVariable.projectInfo,
      balance: myVariable.balance || [],
    });
  }, [
    normalizedEntries,
    selectedMonths,
    selectedTokens,
    selectedTxTypes,
    selectedLabels,
    selectedWorkgroups,
    myVariable.projectInfo,
    myVariable.balance,
  ]);

  const { capabilities, filterOptions, primaryToken, activeTokens, kpi } = dashboard;

  const filteredLedger = useMemo(() => {
    const q = ledgerSearch.trim().toLowerCase();
    if (!q) return dashboard.taskLedger;
    return dashboard.taskLedger.filter((row) => {
      return (
        row.title.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q) ||
        row.txType.toLowerCase().includes(q) ||
        row.subgroup.toLowerCase().includes(q) ||
        row.labels.some((l) => l.toLowerCase().includes(q)) ||
        row.dateDisplay.includes(q)
      );
    });
  }, [dashboard.taskLedger, ledgerSearch]);

  const visibleLedger = showAllLedger
    ? filteredLedger
    : filteredLedger.slice(0, DEFAULT_LEDGER_LIMIT);

  // Chart datasets
  const cashflowChart = useMemo(() => {
    const labels = dashboard.monthlyCashflow.map((r) => r.month);
    const incomingData = dashboard.monthlyCashflow.map((r) => Number(r.incoming.toFixed(2)));
    const outgoingData = dashboard.monthlyCashflow.map((r) => Number(r.outgoing.toFixed(2)));
    return {
      labels,
      datasets: [
        {
          label: `Incoming (${primaryToken})`,
          data: incomingData,
          backgroundColor: 'rgba(52, 211, 153, 0.72)',
          borderColor: 'rgba(52, 211, 153, 1)',
        },
        {
          label: `Outgoing (${primaryToken})`,
          data: outgoingData,
          backgroundColor: 'rgba(251, 146, 60, 0.72)',
          borderColor: 'rgba(251, 146, 60, 1)',
        },
      ],
    };
  }, [dashboard.monthlyCashflow, primaryToken]);

  const labelChart = useMemo(() => {
    const top = dashboard.labelBreakdown.filter((r) => r.total > 0).slice(0, 14);
    return {
      labels: top.map((r) => r.name),
      datasets: [
        {
          label: primaryToken,
          data: top.map((r) => Number(r.total.toFixed(2))),
          backgroundColor: 'rgba(56, 189, 248, 0.72)',
          borderColor: 'rgba(56, 189, 248, 1)',
        },
      ],
    };
  }, [dashboard.labelBreakdown, primaryToken]);

  const subgroupChart = useMemo(() => {
    const top = dashboard.subgroupBreakdown.filter((r) => r.total > 0).slice(0, 14);
    return {
      labels: top.map((r) => r.name),
      datasets: [
        {
          label: primaryToken,
          data: top.map((r) => Number(r.total.toFixed(2))),
          backgroundColor: 'rgba(167, 139, 250, 0.72)',
          borderColor: 'rgba(167, 139, 250, 1)',
        },
      ],
    };
  }, [dashboard.subgroupBreakdown, primaryToken]);

  const activityChart = useMemo(() => {
    return {
      labels: dashboard.monthlyActivity.map((r) => r.month),
      datasets: [
        {
          label: 'Entries / Tasks',
          data: dashboard.monthlyActivity.map((r) => r.tasks),
          backgroundColor: 'rgba(56, 189, 248, 0.72)',
          borderColor: 'rgba(56, 189, 248, 1)',
        },
        {
          label: 'Unique Contributors',
          data: dashboard.monthlyActivity.map((r) => r.contributors),
          backgroundColor: 'rgba(244, 114, 182, 0.72)',
          borderColor: 'rgba(244, 114, 182, 1)',
        },
      ],
    };
  }, [dashboard.monthlyActivity]);

  const contributorChart = useMemo(() => {
    const top = dashboard.contributorBreakdown.filter((r) => r.total > 0).slice(0, 15);
    return {
      labels: top.map((r) => r.contributorId),
      datasets: [
        {
          label: primaryToken,
          data: top.map((r) => Number(r.total.toFixed(2))),
          backgroundColor: 'rgba(250, 204, 21, 0.72)',
          borderColor: 'rgba(250, 204, 21, 1)',
        },
      ],
    };
  }, [dashboard.contributorBreakdown, primaryToken]);

  // Display top 4 tokens in multi-token KPI sublines
  const secondaryTokens = activeTokens.filter((t) => t !== primaryToken).slice(0, 4);

  const primaryIncoming = kpi.incomingByToken[primaryToken] || 0;
  const primaryOutgoing = kpi.outgoingByToken[primaryToken] || 0;
  const primaryNet = kpi.netByToken[primaryToken] || 0;

  // Monthly cashflow totals
  const cashflowTotals = useMemo(() => {
    return dashboard.monthlyCashflow.reduce(
      (acc, row) => {
        acc.incoming += row.incoming;
        acc.outgoing += row.outgoing;
        acc.net += row.net;
        acc.txCount += row.txCount;
        if (row.budget != null) acc.budget += row.budget;
        return acc;
      },
      { incoming: 0, outgoing: 0, net: 0, txCount: 0, budget: 0 }
    );
  }, [dashboard.monthlyCashflow]);

  const tableTokenColumns = activeTokens.slice(0, 4);
  const encodedGroup = encodeURIComponent(String(groupName || ''));
  const encodedProject = encodeURIComponent(String(projectName || ''));

  const multiTokenNote =
    activeTokens.length > 1
      ? `Showing ${primaryToken} — select a specific token above to switch`
      : undefined;

  return (
    <div className={styles.container}>
      {/* Header & Live Wallet Balance */}
      <div className={styles.headerCard}>
        <div>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.projectTitle}>
              {myVariable.projectInfo?.project_name || projectName}
            </h2>
            {myVariable.projectInfo?.project_type && (
              <span
                className={
                  myVariable.projectInfo.project_type === 'Smart Contract'
                    ? styles.badgeContract
                    : styles.badge
                }
              >
                {myVariable.projectInfo.project_type}
              </span>
            )}
            {myVariable.projectInfo?.core_token && (
              <span className={styles.badgeMuted}>
                Core: {normalizeTokenSymbol(myVariable.projectInfo.core_token)}
              </span>
            )}
            {!capabilities.hasBudgets && (
              <span className={styles.badgeMuted}>Cashflow View</span>
            )}
          </div>
          <div className={styles.headerSub}>
            {kpi.firstDate && kpi.lastDate
              ? `Activity range: ${kpi.firstDate} to ${kpi.lastDate}`
              : 'No recorded transaction activity yet'}
            {capabilities.hasSmartContracts &&
              ` · ${kpi.smartContractTxCount} Smart Contract tx${
                kpi.smartContractTxCount === 1 ? '' : 's'
              }`}
          </div>
        </div>

        {kpi.fungibleBalances.length > 0 && (
          <div className={styles.walletPillGroup}>
            {kpi.fungibleBalances.slice(0, 5).map((token) => (
              <div key={token.id} className={styles.walletPill}>
                <span className={styles.walletPillLabel}>
                  Wallet {token.displayname || token.name}
                </span>
                <span className={styles.walletPillValue}>
                  {formatTokenAmount(parseFloat(token.amount))}
                </span>
              </div>
            ))}
            {kpi.nftBalanceCount > 0 && (
              <div className={styles.walletPill}>
                <span className={styles.walletPillLabel}>Wallet NFTs</span>
                <span className={styles.walletPillValue}>{kpi.nftBalanceCount}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State for 0-transaction projects */}
      {!capabilities.hasTransactions ? (
        <div className={styles.emptyState}>
          <h3>No Transactions Recorded Yet</h3>
          <p>
            This project does not have any indexed transactions in the database yet.
            {kpi.fungibleBalances.length > 0
              ? ' Current live wallet balances are displayed above.'
              : ''}
          </p>
        </div>
      ) : (
        <>
          {/* KPI Summary Strip */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Total Incoming ({primaryToken})</span>
              <span className={`${styles.kpiValue} ${styles.kpiPositive}`}>
                +{formatTokenAmount(primaryIncoming)} {primaryToken}
              </span>
              <span className={styles.kpiSub}>
                {primaryToken === 'ADA' && kpi.estimatedIncomingAdaUsd != null
                  ? `Est. ${formatUsd(kpi.estimatedIncomingAdaUsd)} at tx rates`
                  : secondaryTokens.length > 0
                  ? secondaryTokens
                      .filter((t) => (kpi.incomingByToken[t] || 0) > 0)
                      .map((t) => `+${formatTokenAmount(kpi.incomingByToken[t])} ${t}`)
                      .join(' · ') || 'Inflow transactions'
                  : 'Incoming & rewards withdrawals'}
              </span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Total Outgoing ({primaryToken})</span>
              <span className={`${styles.kpiValue} ${styles.kpiNegative}`}>
                -{formatTokenAmount(primaryOutgoing)} {primaryToken}
              </span>
              <span className={styles.kpiSub}>
                {primaryToken === 'ADA' && kpi.estimatedOutgoingAdaUsd != null
                  ? `Est. ${formatUsd(kpi.estimatedOutgoingAdaUsd)} at tx rates`
                  : secondaryTokens.length > 0
                  ? secondaryTokens
                      .filter((t) => (kpi.outgoingByToken[t] || 0) > 0)
                      .map((t) => `-${formatTokenAmount(kpi.outgoingByToken[t])} ${t}`)
                      .join(' · ') || 'Outflow transactions'
                  : 'Outgoing disbursements'}
              </span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Net Flow ({primaryToken})</span>
              <span
                className={`${styles.kpiValue} ${
                  primaryNet >= 0 ? styles.kpiPositive : styles.kpiNegative
                }`}
              >
                {primaryNet >= 0 ? '+' : ''}
                {formatTokenAmount(primaryNet)} {primaryToken}
              </span>
              <span className={styles.kpiSub}>
                {secondaryTokens.length > 0
                  ? secondaryTokens
                      .map((t) => {
                        const v = kpi.netByToken[t] || 0;
                        return `${v >= 0 ? '+' : ''}${formatTokenAmount(v)} ${t}`;
                      })
                      .join(' · ')
                  : 'Incoming minus outgoing'}
              </span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Transactions</span>
              <span className={styles.kpiValue}>{kpi.txCount}</span>
              <span className={styles.kpiSub}>
                {kpi.entryCount} metadata entr{kpi.entryCount === 1 ? 'y' : 'ies'} across{' '}
                {dashboard.monthlyCashflow.length} month
                {dashboard.monthlyCashflow.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Unique Contributors</span>
              <span className={styles.kpiValue}>{kpi.uniqueContributors}</span>
              <span className={styles.kpiSub}>
                {capabilities.hasSubgroups
                  ? `${filterOptions.subgroups.length} subgroup${
                      filterOptions.subgroups.length === 1 ? '' : 's'
                    } · ${filterOptions.labels.length} label${
                      filterOptions.labels.length === 1 ? '' : 's'
                    }`
                  : `${filterOptions.labels.length} category label${
                      filterOptions.labels.length === 1 ? '' : 's'
                    }`}
              </span>
            </div>
          </div>

          {/* Adaptive Filter Bar */}
          <div className={styles.filterCard}>
            <div className={styles.filterHeader}>
              <span className={styles.filterTitle}>Filters</span>
              <button type="button" onClick={handleResetFilters} className={styles.resetBtn}>
                Reset Filters
              </button>
            </div>
            <div className={styles.filterRows}>
              {filterOptions.tokens.length > 0 && (
                <div className={styles.filterRow}>
                  <span className={styles.filterRowLabel}>Tokens</span>
                  <div className={styles.filterChipWrap}>
                    {['All tokens', ...filterOptions.tokens].map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() =>
                          toggleFilter(
                            token,
                            'All tokens',
                            selectedTokens,
                            setSelectedTokens,
                            'tokens'
                          )
                        }
                        className={
                          selectedTokens.includes(token)
                            ? styles.filterChipActive
                            : styles.filterChip
                        }
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filterOptions.txTypes.length > 1 && (
                <div className={styles.filterRow}>
                  <span className={styles.filterRowLabel}>Tx Types</span>
                  <div className={styles.filterChipWrap}>
                    {['All types', ...filterOptions.txTypes].map((txType) => (
                      <button
                        key={txType}
                        type="button"
                        onClick={() =>
                          toggleFilter(
                            txType,
                            'All types',
                            selectedTxTypes,
                            setSelectedTxTypes,
                            'txTypes'
                          )
                        }
                        className={
                          selectedTxTypes.includes(txType)
                            ? styles.filterChipActive
                            : styles.filterChip
                        }
                      >
                        {txType}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filterOptions.months.length > 1 && (
                <div className={styles.filterRow}>
                  <span className={styles.filterRowLabel}>Months</span>
                  <div className={styles.filterChipWrap}>
                    {['All months', ...filterOptions.months].map((month) => (
                      <button
                        key={month}
                        type="button"
                        onClick={() =>
                          toggleFilter(
                            month,
                            'All months',
                            selectedMonths,
                            setSelectedMonths,
                            'months'
                          )
                        }
                        className={
                          selectedMonths.includes(month)
                            ? styles.filterChipActive
                            : styles.filterChip
                        }
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {capabilities.hasSubgroups && (
                <div className={styles.filterRow}>
                  <span className={styles.filterRowLabel}>Workgroups</span>
                  <div className={styles.filterChipWrap}>
                    {['All workgroups', ...filterOptions.subgroups, 'Unassigned'].map(
                      (wg) => (
                        <button
                          key={wg}
                          type="button"
                          onClick={() =>
                            toggleFilter(
                              wg,
                              'All workgroups',
                              selectedWorkgroups,
                              setSelectedWorkgroups,
                              'workgroups'
                            )
                          }
                          className={
                            selectedWorkgroups.includes(wg)
                              ? styles.filterChipActive
                              : styles.filterChip
                          }
                        >
                          {wg}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {capabilities.hasLabels && (
                <div className={styles.filterRow}>
                  <span className={styles.filterRowLabel}>Labels</span>
                  <div className={styles.filterChipWrap}>
                    {['All labels', ...filterOptions.labels].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          toggleFilter(
                            label,
                            'All labels',
                            selectedLabels,
                            setSelectedLabels,
                            'labels'
                          )
                        }
                        className={
                          selectedLabels.includes(label)
                            ? styles.filterChipActive
                            : styles.filterChip
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Charts Grid */}
          <div className={styles.chartsGrid}>
            <div className={styles.card}>
              <DashboardBarChart
                title={`Monthly Cashflow (${primaryToken})`}
                subtitle={multiTokenNote || 'Incoming vs Outgoing by month'}
                labels={cashflowChart.labels}
                datasets={cashflowChart.datasets}
                valueSuffix={primaryToken}
                emptyMessage="No incoming or outgoing cashflow for the selected filters."
              />
            </div>

            {labelChart.labels.length > 0 && (
              <div className={styles.card}>
                <DashboardBarChart
                  title={`Spending by Category / Label (${primaryToken})`}
                  subtitle={
                    multiTokenNote ||
                    'Top categories from transaction metadata labels'
                  }
                  labels={labelChart.labels}
                  datasets={labelChart.datasets}
                  horizontal
                  valueSuffix={primaryToken}
                />
              </div>
            )}

            {capabilities.hasSubgroups && subgroupChart.labels.length > 0 && (
              <div className={styles.card}>
                <DashboardBarChart
                  title={`Spending by Workgroup / Subgroup (${primaryToken})`}
                  subtitle={multiTokenNote || 'Based on subGroup metadata'}
                  labels={subgroupChart.labels}
                  datasets={subgroupChart.datasets}
                  horizontal
                  valueSuffix={primaryToken}
                />
              </div>
            )}

            {dashboard.monthlyActivity.length > 0 && (
              <div className={styles.card}>
                <DashboardBarChart
                  title="Monthly Activity"
                  subtitle="Metadata entries/tasks and unique outgoing contributors per month"
                  labels={activityChart.labels}
                  datasets={activityChart.datasets}
                />
              </div>
            )}

            {contributorChart.labels.length > 0 && (
              <div className={styles.card}>
                <DashboardBarChart
                  title={`Top Contributors (${primaryToken})`}
                  subtitle={
                    dashboard.contributorBreakdown.length > 15
                      ? `Top 15 of ${dashboard.contributorBreakdown.length} contributors`
                      : `${dashboard.contributorBreakdown.length} contributor${
                          dashboard.contributorBreakdown.length === 1 ? '' : 's'
                        }`
                  }
                  labels={contributorChart.labels}
                  datasets={contributorChart.datasets}
                  horizontal
                  valueSuffix={primaryToken}
                />
              </div>
            )}
          </div>

          {/* Summary Tables Grid */}
          <div className={styles.tablesGrid}>
            {/* Monthly Cashflow Summary Table */}
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>
                    Monthly Cashflow ({primaryToken})
                  </h3>
                  <p className={styles.sectionSub}>
                    {capabilities.hasBudgets
                      ? 'Incoming, outgoing, net flow, and configured budget'
                      : 'Chronological inflow, outflow, and net flow'}
                  </p>
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th className={styles.numCell}>Incoming</th>
                      <th className={styles.numCell}>Outgoing</th>
                      <th className={styles.numCell}>Net Flow</th>
                      {capabilities.hasBudgets && (
                        <th className={styles.numCell}>Budget</th>
                      )}
                      <th className={styles.numCell}>Txs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...dashboard.monthlyCashflow].reverse().map((row) => (
                      <tr key={row.month}>
                        <td>{row.month}</td>
                        <td className={`${styles.numCell} ${styles.positiveCell}`}>
                          {row.incoming > 0 ? `+${formatTokenAmount(row.incoming)}` : '0'}
                        </td>
                        <td className={`${styles.numCell} ${styles.negativeCell}`}>
                          {row.outgoing > 0 ? `-${formatTokenAmount(row.outgoing)}` : '0'}
                        </td>
                        <td
                          className={`${styles.numCell} ${
                            row.net >= 0 ? styles.positiveCell : styles.negativeCell
                          }`}
                        >
                          {row.net >= 0 ? '+' : ''}
                          {formatTokenAmount(row.net)}
                        </td>
                        {capabilities.hasBudgets && (
                          <td className={styles.numCell}>
                            {row.budget != null ? formatTokenAmount(row.budget) : '-'}
                          </td>
                        )}
                        <td className={styles.numCell}>{row.txCount}</td>
                      </tr>
                    ))}
                    <tr className={styles.totalsRow}>
                      <td>Totals</td>
                      <td className={`${styles.numCell} ${styles.positiveCell}`}>
                        +{formatTokenAmount(cashflowTotals.incoming)}
                      </td>
                      <td className={`${styles.numCell} ${styles.negativeCell}`}>
                        -{formatTokenAmount(cashflowTotals.outgoing)}
                      </td>
                      <td
                        className={`${styles.numCell} ${
                          cashflowTotals.net >= 0
                            ? styles.positiveCell
                            : styles.negativeCell
                        }`}
                      >
                        {cashflowTotals.net >= 0 ? '+' : ''}
                        {formatTokenAmount(cashflowTotals.net)}
                      </td>
                      {capabilities.hasBudgets && (
                        <td className={styles.numCell}>
                          {formatTokenAmount(cashflowTotals.budget)}
                        </td>
                      )}
                      <td className={styles.numCell}>{cashflowTotals.txCount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transaction Type Breakdown */}
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>Transaction Types</h3>
                  <p className={styles.sectionSub}>
                    All on-chain activity categories including transfers, staking &amp; smart
                    contracts
                  </p>
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th className={styles.numCell}>Txs</th>
                      {tableTokenColumns.map((tok) => (
                        <th key={tok} className={styles.numCell}>
                          {tok}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.txTypeSummary.map((row) => (
                      <tr key={row.txType}>
                        <td>{row.txType}</td>
                        <td className={styles.numCell}>{row.txCount}</td>
                        {tableTokenColumns.map((tok) => (
                          <td key={tok} className={styles.numCell}>
                            {row.tokenTotals[tok]
                              ? formatTokenAmount(row.tokenTotals[tok])
                              : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category / Label Breakdown Table */}
            {dashboard.labelBreakdown.length > 0 && (
              <div className={styles.card}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h3 className={styles.sectionTitle}>Category / Label Breakdown</h3>
                    <p className={styles.sectionSub}>
                      Multi-token totals grouped by metadata labels
                    </p>
                  </div>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Label</th>
                        <th className={styles.numCell}>Entries</th>
                        {tableTokenColumns.map((tok) => (
                          <th key={tok} className={styles.numCell}>
                            {tok}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.labelBreakdown.map((row) => (
                        <tr key={row.name}>
                          <td>{row.name}</td>
                          <td className={styles.numCell}>{row.entryCount}</td>
                          {tableTokenColumns.map((tok) => (
                            <td key={tok} className={styles.numCell}>
                              {row.tokenTotals[tok]
                                ? formatTokenAmount(row.tokenTotals[tok])
                                : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Workgroup / Subgroup Breakdown Table (only when project has subgroups) */}
            {capabilities.hasSubgroups && dashboard.subgroupBreakdown.length > 0 && (
              <div className={styles.card}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h3 className={styles.sectionTitle}>Workgroup / Subgroup Breakdown</h3>
                    <p className={styles.sectionSub}>
                      Multi-token totals by metadata subgroup
                    </p>
                  </div>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Subgroup</th>
                        <th className={styles.numCell}>Entries</th>
                        {tableTokenColumns.map((tok) => (
                          <th key={tok} className={styles.numCell}>
                            {tok}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.subgroupBreakdown.map((row) => (
                        <tr key={row.name}>
                          <td>{row.name}</td>
                          <td className={styles.numCell}>{row.entryCount}</td>
                          {tableTokenColumns.map((tok) => (
                            <td key={tok} className={styles.numCell}>
                              {row.tokenTotals[tok]
                                ? formatTokenAmount(row.tokenTotals[tok])
                                : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Searchable Task / Activity Ledger */}
          <div className={styles.card}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>
                  Activity &amp; Task Breakdown ({filteredLedger.length})
                </h3>
                <p className={styles.sectionSub}>
                  All matching contributions and legacy transactions with links to full
                  transaction details
                </p>
              </div>
              <input
                type="text"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                placeholder="Search title, label, subgroup, type..."
                className={styles.searchInput}
              />
            </div>

            <div className={styles.tableWrap} style={{ maxHeight: '520px' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Task / Description</th>
                    <th>Labels</th>
                    {capabilities.hasSubgroups && <th>Subgroup</th>}
                    {tableTokenColumns.map((tok) => (
                      <th key={tok} className={styles.numCell}>
                        {tok}
                      </th>
                    ))}
                    <th className={styles.numCell}>Est. USD</th>
                    <th>Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLedger.map((row) => (
                    <tr key={row.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{row.dateDisplay}</td>
                      <td>
                        <span
                          className={
                            row.direction === 'inflow'
                              ? styles.typePillIn
                              : row.direction === 'outflow'
                              ? styles.typePillOut
                              : styles.typePillOther
                          }
                        >
                          {row.txType}
                        </span>
                      </td>
                      <td style={{ maxWidth: '340px' }}>
                        <div style={{ fontWeight: 500, color: '#f8fafc' }}>{row.title}</div>
                        {row.description && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            {row.description}
                          </div>
                        )}
                      </td>
                      <td>
                        {row.labels.length > 0
                          ? row.labels.map((l) => (
                              <span key={l} className={styles.tag}>
                                {l}
                              </span>
                            ))
                          : '-'}
                      </td>
                      {capabilities.hasSubgroups && <td>{row.subgroup || '-'}</td>}
                      {tableTokenColumns.map((tok) => (
                        <td key={tok} className={styles.numCell}>
                          {row.tokenAmounts[tok]
                            ? formatTokenAmount(row.tokenAmounts[tok])
                            : '-'}
                        </td>
                      ))}
                      <td className={styles.numCell}>
                        {row.usdEstimate != null ? formatUsd(row.usdEstimate) : '-'}
                      </td>
                      <td>
                        <Link
                          href={`/${encodedGroup}/${encodedProject}/${row.transactionId}`}
                          className={styles.txLink}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLedger.length > DEFAULT_LEDGER_LIMIT && (
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowAllLedger((prev) => !prev)}
                  className={styles.resetBtn}
                >
                  {showAllLedger
                    ? `Show first ${DEFAULT_LEDGER_LIMIT}`
                    : `Show all ${filteredLedger.length} entries`}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
