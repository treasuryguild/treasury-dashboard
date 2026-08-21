import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import { useWallet } from '@meshsdk/react';
import { getOrgs } from '../../utils/getOrgs';
import { getAllTransactions } from '../../utils/getAllTransactions';
import { txDenormalizer } from '../../utils/txDenormalizer';
import { processDashboardData } from '../../utils/processSnetDashboardData';
import { mergeSubgroupRowsByCanonicalName } from '../../utils/workgroupUtils';
import { getConnectedWalletAddresses, isAnyAddressAllowed } from '../../utils/parseSpendingExportWallets';
import {
  buildSpendingExportRows,
  spendingExportRowsToCsv,
  sumSpendingExportAgix,
} from '../../utils/buildSpendingExportRows';
import {
  buildWorkgroupBalanceRows,
  spendingExportBalancesToCsv,
} from '../../utils/buildSpendingExportBalances';
import DynamicTable from '../../components/tables/DynamicTable';
import WorkgroupBalances from '../../components/WorkgroupBalances';
import styles from '../../styles/SpendingExport.module.css';

const AMBASSADOR_PROJECT_NAME = 'Singularity Net Ambassador Wallet';
const DASHBOARD_MONTHS = ['All months'];
const DASHBOARD_WORKGROUPS = ['All workgroups'];
const DASHBOARD_TOKENS = ['AGIX'];
const DASHBOARD_LABELS = ['All labels'];
const DASHBOARD_QUARTER_FILTERS = ['No Quarters'];

function findAmbassadorProject(groupInfo: any[]) {
  for (const group of groupInfo || []) {
    const project = group.projects?.find(
      (item: any) => item.project_name === AMBASSADOR_PROJECT_NAME
    );
    if (project) {
      return project;
    }
  }
  return null;
}

function parseTaskDate(dateStr: string) {
  if (!dateStr) return 0;
  const parts = String(dateStr).split('.');
  if (parts.length < 3) return 0;
  const [day, month, year] = parts;
  const fullYear = year.length === 2 ? `20${year}` : year;
  return new Date(Number(fullYear), Number(month) - 1, Number(day)).getTime();
}

async function getWorkgroups(projectId: string) {
  const response = await fetch('/api/getSubgroups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      project_id: projectId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch workgroups from subgroups table');
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.workgroups)) {
    return [];
  }

  const processedData = data.workgroups.map((item: any) => ({
    ...item,
    sub_group_data: typeof item.sub_group_data === 'string'
      ? JSON.parse(item.sub_group_data)
      : item.sub_group_data,
  }));

  return mergeSubgroupRowsByCanonicalName(processedData);
}

function downloadFile(contents: string, filename: string) {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const SpendingExport: NextPage = () => {
  const { connected, wallet } = useWallet();
  const [authState, setAuthState] = useState<'checking' | 'disconnected' | 'unauthorized' | 'authorized'>('checking');
  const [rows, setRows] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [table1, setTable1] = useState<any[]>([]);
  const [processedData, setProcessedData] = useState<any>(null);
  const [workgroupsBudgets, setWorkgroupsBudgets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const walletReady = Boolean(wallet);

  useEffect(() => {
    if (!connected) {
      setAuthState('disconnected');
      setRows([]);
      setDistributions([]);
      setTable1([]);
      setProcessedData(null);
      setWorkgroupsBudgets([]);
      return;
    }

    if (!wallet) {
      setAuthState('checking');
      return;
    }

    let cancelled = false;

    async function checkAccess() {
      try {
        const addresses = await getConnectedWalletAddresses(wallet);
        if (cancelled) return;
        const allowed = isAnyAddressAllowed(addresses);
        setAuthState(allowed ? 'authorized' : 'unauthorized');
        if (!allowed) {
          setRows([]);
          setDistributions([]);
          setTable1([]);
          setProcessedData(null);
          setWorkgroupsBudgets([]);
        }
      } catch (err) {
        if (!cancelled) {
          setAuthState('unauthorized');
          setRows([]);
        }
      }
    }

    checkAccess();
    return () => {
      cancelled = true;
    };
  }, [connected, walletReady]);

  useEffect(() => {
    let cancelled = false;

    async function loadExportRows() {
      if (authState !== 'authorized') {
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const groupInfo = await getOrgs();
        const project = findAmbassadorProject(groupInfo);
        if (!project?.project_id) {
          throw new Error('Ambassador Wallet project was not found');
        }

        const { transactions } = await getAllTransactions(project.project_id);
        const distributionsArray = await txDenormalizer(transactions);
        const exportRows = buildSpendingExportRows(distributionsArray).sort(
          (a, b) => parseTaskDate(b.date) - parseTaskDate(a.date)
        );
        const dashboardData = processDashboardData(
          DASHBOARD_MONTHS,
          DASHBOARD_WORKGROUPS,
          DASHBOARD_TOKENS,
          DASHBOARD_LABELS,
          distributionsArray,
          project.budgets || {}
        );
        const subgroups = await getWorkgroups(project.project_id);

        if (!cancelled) {
          setRows(exportRows);
          setDistributions(distributionsArray);
          setTable1(dashboardData.table1 || []);
          setProcessedData(dashboardData);
          setWorkgroupsBudgets(subgroups);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load spending data');
          setRows([]);
          setDistributions([]);
          setTable1([]);
          setProcessedData(null);
          setWorkgroupsBudgets([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadExportRows();
    return () => {
      cancelled = true;
    };
  }, [authState]);

  const totalAgix = sumSpendingExportAgix(rows);
  const workgroupRows = processedData
    ? buildWorkgroupBalanceRows({
        data: processedData,
        months: DASHBOARD_MONTHS,
        workgroupsBudgets,
        selectedWorkgroups: DASHBOARD_WORKGROUPS,
        selectedQuarterFilters: DASHBOARD_QUARTER_FILTERS,
      })
    : [];

  function downloadPaymentsCsv() {
    downloadFile(spendingExportRowsToCsv(rows), 'ambassador-wallet-agix-spending.csv');
  }

  function downloadBalancesCsv() {
    const csv = spendingExportBalancesToCsv({
      paymentsAgixTotal: totalAgix,
      table1,
      workgroupRows,
    });
    downloadFile(csv, 'ambassador-wallet-agix-balances.csv');
  }

  if (authState === 'checking') {
    return (
      <div className={styles.container}>
        <div className={styles.message}>Checking access...</div>
      </div>
    );
  }

  if (authState === 'disconnected') {
    return (
      <div className={styles.container}>
        <div className={styles.message}>Please connect wallet</div>
      </div>
    );
  }

  if (authState === 'unauthorized') {
    return (
      <div className={styles.container}>
        <div className={styles.message}>Not authorized</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Ambassador Wallet AGIX spending</h1>
        <div className={styles.summary}>
          <div className={styles.total}>
            Total AGIX: {totalAgix.toLocaleString(undefined, { maximumFractionDigits: 8 })}
          </div>
          <button
            className={styles.downloadButton}
            onClick={downloadPaymentsCsv}
            disabled={isLoading || rows.length === 0}
          >
            Download payments CSV
          </button>
          <button
            className={styles.downloadButton}
            onClick={downloadBalancesCsv}
            disabled={isLoading || (table1.length === 0 && workgroupRows.length === 0)}
          >
            Download balances CSV
          </button>
        </div>
      </div>

      {isLoading && <div className={styles.message}>Loading valid outgoing AGIX payments...</div>}
      {error && <div className={styles.message}>{error}</div>}

      {!isLoading && !error && (
        <>
          {processedData && workgroupsBudgets.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Workgroup balances</h2>
              <WorkgroupBalances
                data={processedData}
                months={DASHBOARD_MONTHS}
                workgroupsBudgets={workgroupsBudgets}
                selectedWorkgroups={DASHBOARD_WORKGROUPS}
                allDistributions={distributions}
                selectedQuarterFilters={DASHBOARD_QUARTER_FILTERS}
              />
            </section>
          )}

          {table1.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Monthly balances</h2>
              <DynamicTable data={table1} />
            </section>
          )}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Outgoing AGIX payments</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>userId</th>
                    <th className={styles.th}>amount</th>
                    <th className={styles.th}>task</th>
                    <th className={styles.th}>date</th>
                    <th className={styles.th}>workgroup</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.userId}-${row.task}-${row.date}-${row.workgroup}-${index}`}>
                      <td className={styles.td}>{row.userId}</td>
                      <td className={`${styles.td} ${styles.tdAmount}`}>{row.amount}</td>
                      <td className={styles.td}>{row.task}</td>
                      <td className={styles.td}>{row.date}</td>
                      <td className={styles.td}>{row.workgroup}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default SpendingExport;
