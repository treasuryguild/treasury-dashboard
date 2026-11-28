// ../pages/[groupName]/[projectName]/index.tsx
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMyVariable } from '../../../context/MyVariableContext';
import { getOrgs } from '../../../utils/getOrgs';
import { getMonthlyBudget } from '../../../utils/getMonthlyBudget';
import { getTransactions } from '../../../utils/getTransactions';
import { getAllTransactions } from '../../../utils/getAllTransactions';
import { getWalletBalance } from '../../../utils/getWalletBalance';
import { getAssetList } from '../../../utils/getAssetList'
import { getSnetTokenAllocation } from '../../../utils/getSnetTokenAllocation'
import styles from '../../../styles/Transactions.module.css';
import TransactionsTable from '../../../components/TransactionsTable';
import Signup from '../../../components/Signup';
import Report from '../../../components/Report';
import SnetDashboard from '../../../components/SnetDashboard';
import Dashboard from '../../../components/Dashboard';
import { getTokenTypes } from '../../../utils/getTokenTypes'
import { TokenBalance } from '../../../types/transactions';

interface Project {
  project_id: string;
  project_name: string;
  project_type: string;
  wallet: string;
  core_token: string;
  parent_project_id?: string | null;
}

interface TokenType {
  asset_name: string;
  unit: string;
  asset_type: string;
  policy_id: string;
  ticker: string;
  fingerprint: string;
  decimals: number;
}

interface SnetTokenAllocation {
  month: string;
  sc_allocation: number;
  ambassador_allocation: number;
}

const ProjectPage = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'signup' | 'report'>('transactions');
  const { myVariable, setMyVariable } = useMyVariable();
  const router = useRouter();
  const { groupName, projectName } = router.query;
  const [loading, setLoading] = useState<boolean>(false);
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [parentProject, setParentProject] = useState<Project | null>(null);
  const [linkedProjects, setLinkedProjects] = useState<Project[]>([]);
  const [previousTab, setPreviousTab] = useState<'transactions' | 'signup' | 'report'>('transactions');
  const [balance2, setBalance2] = useState<TokenBalance[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedWorkgroup, setSelectedWorkgroup] = useState<string[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const tab = new URLSearchParams(window.location.search).get('tab');
      setActiveTab((tab as 'transactions' | 'signup' | 'report') || 'transactions');
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  useEffect(() => {
    if (activeTab !== 'signup') {
      setPreviousTab(activeTab);
    }
  }, [activeTab]);
  // Hook to set activeTab from URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tab = queryParams.get('tab');
    setActiveTab((tab as 'transactions' | 'signup' | 'report') || 'transactions');
    const months: any = queryParams.get('months')?.split(',') || ['All months'];
    const workgroups: any = queryParams.get('workgroups')?.split(',') || ['All workgroups'];
    const tokens: any = queryParams.get('tokens')?.split(',') || (projectName === "Singularity Net Ambassador Wallet" ? ['AGIX'] : selectedTokens);
    const labels: any = queryParams.get('labels')?.split(',') || ['All labels'];

    setSelectedMonths(months);
    setSelectedWorkgroup(workgroups);
    setSelectedTokens(tokens);
    setSelectedLabels(labels);
  }, [groupName, projectName]);


  // Hook to fetch group data
  useEffect(() => {
    let isCancelled = false;

    const fetchGroupData = async () => {
      let groupInfo = myVariable.groupInfo;
      if (!groupInfo || groupInfo.length === 0) {
        groupInfo = await getOrgs();
        if (isCancelled) return;
        setMyVariable(prevState => ({ ...prevState, groupInfo: groupInfo }));
      }

      if (isCancelled) return;

      const foundGroup = groupInfo?.find(group => group.group_name === groupName);
      const foundProject = foundGroup?.projects.find(project => project.project_name === projectName);
      setProjectData(foundProject || null);
      if (foundGroup && foundProject) {
        const parent = foundProject.parent_project_id
          ? foundGroup.projects.find(p => p.project_id === foundProject.parent_project_id) || null
          : null;
        const children = foundGroup.projects.filter(
          p => p.parent_project_id === foundProject.project_id
        );
        setParentProject(parent);
        setLinkedProjects(children);
      } else {
        setParentProject(null);
        setLinkedProjects([]);
      }
      if (foundProject?.core_token) {
        setSelectedTokens([foundProject.core_token]);
      }
    };

    if (groupName && projectName) {
      fetchGroupData();
    }

    return () => {
      isCancelled = true;
    };
  }, [groupName, projectName]);

  // Hook to fetch project data
  useEffect(() => {
    let isCancelled = false;

    const fetchProjectData = async () => {
      if (!projectData) return;

      setLoading(true);
      setBalance2([]);
      setMyVariable(prevState => ({
        ...prevState,
        loadedProjectId: undefined,
        budgetInfo: undefined,
        projectInfo: projectData,
        transactions: [],
        originalTransactions: [],
        balance: [],
        report: undefined,
        snetTokenAllocation: [],
      }));

      try {
        const budgetInfo = await getMonthlyBudget(projectData.project_id);
        const { transactions, originalTransactions } = await getAllTransactions(projectData.project_id);
        const balance = await getAssetList(projectData.wallet);
        const toke_types = await getTokenTypes() as TokenType[];

        // Fetch snet token allocation data if it's the Singularity Net Ambassador Wallet
        let snetTokenAllocation: SnetTokenAllocation[] = [];
        if (projectData.project_name === "Singularity Net Ambassador Wallet") {
          snetTokenAllocation = await getSnetTokenAllocation();
        }

        if (isCancelled) return;

        setBalance2(balance);
        setMyVariable(prevState => ({
          ...prevState,
          loadedProjectId: projectData.project_id,
          budgetInfo,
          projectInfo: projectData,
          transactions,
          originalTransactions,
          balance,
          toke_types,
          snetTokenAllocation
        }));
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    if (
      projectData &&
      myVariable.loadedProjectId !== projectData.project_id &&
      (activeTab === 'transactions' || activeTab === 'report')
    ) {
      fetchProjectData();
    }

    return () => {
      isCancelled = true;
    };
  }, [projectData, activeTab]);

  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Function to scroll to bottom
  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleTabChange = (tab: 'transactions' | 'signup' | 'report') => {
    setActiveTab(tab);
    const url = new URL(window.location.href);

    url.searchParams.set('tab', tab);

    // Assuming you have state variables like `selectedMonths`, `selectedWorkgroup`
    // Join the arrays into a comma-separated string
    url.searchParams.set('months', selectedMonths.join(','));
    url.searchParams.set('workgroups', selectedWorkgroup.join(','));
    url.searchParams.set('tokens', selectedTokens.join(','));
    url.searchParams.set('labels', selectedLabels.join(','));

    router.push(url.toString(), undefined, { shallow: true });
  };

  if (!projectData) return <div className={styles['main']}>Loading...</div>;
  const isProjectDataReady = !loading && myVariable.loadedProjectId === projectData.project_id;
  //console.log(myVariable)
  return (
    <div className={styles['main']}>
      <div>
        <div className={styles.navbar}>
          <button onClick={() => router.push(`/${groupName}`)} className={styles.backButton}>Go Back</button>
          <button
            onClick={() => handleTabChange('transactions')}
            className={activeTab === 'transactions' ? styles.active : styles.notactive}
          >
            Transactions
          </button>
          {projectName === "Singularity Net Ambassador Wallet" && (<button
            onClick={() => handleTabChange('signup')}
            className={activeTab === 'signup' ? styles.active : styles.notactive}
          >
            Register Wallet
          </button>)}
          {projectName === "Singularity Net Ambassador Wallet" && (
            <button
              onClick={() => handleTabChange('report')}
              className={activeTab === 'report' ? styles.active : styles.notactive}
            >
              Dashboard
            </button>
          )}
          {projectName != "Singularity Net Ambassador Wallet" && (
            <button
              onClick={() => handleTabChange('report')}
              className={activeTab === 'report' ? styles.active : styles.notactive}
            >
              Dashboard
            </button>
          )}
          {isProjectDataReady && (activeTab === 'transactions' || activeTab === 'report') && (
            <>
              {activeTab != 'report' && (<div>Table buttons</div>)}
              {activeTab === 'report' && (<div>Dashboard buttons</div>)}
              <button className={styles.notactive} onClick={scrollToTop}>Scroll to Top</button>
              <button className={styles.notactive} onClick={scrollToBottom}>Scroll to Bottom</button>
              {myVariable?.balance && activeTab != 'report' && (
                <>
                  <div className={styles.walletDetails}>
                    <div>Wallet Balance</div>
                    <table className={styles.tokenTable}>
                      <thead>
                        <tr>
                          <th colSpan={2}>Fungible Tokens</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myVariable.balance
                          .filter((token: TokenBalance) => token.tokenType === 'fungible')
                          .map((token: TokenBalance) => {
                            const decimals = token.decimals || 0;
                            const name = token.displayname || token.name;
                            const amount = parseFloat(token.amount);
                            return (
                              <tr key={token.id}>
                                <td style={{ textAlign: 'left', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</td>
                                <td style={{ textAlign: 'right', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{amount.toFixed(2)}</td>
                              </tr>
                            );
                          })
                        }
                      </tbody>
                      {myVariable.balance.some((token: TokenBalance) => token.tokenType === 'nft') && (
                        <>
                          <thead>
                            <tr>
                              <th colSpan={2}>NFTs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {myVariable.balance
                              .filter((token: TokenBalance) => token.tokenType === 'nft')
                              .map((token: TokenBalance) => {
                                const name = token.displayname || token.name;
                                const amount = token.amount;
                                return (
                                  <tr key={token.id}>
                                    <td style={{ textAlign: 'left', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</td>
                                    <td style={{ textAlign: 'right', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{amount}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </>
                      )}
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <div style={{ width: '100%' }}>
        {(parentProject || linkedProjects.length > 0) && (
          <div className={styles.linkedProjectsBanner}>
            {parentProject && (
              <div>
                <strong>Linked to: </strong>
                <Link
                  href={`/${encodeURIComponent(groupName as string)}/${encodeURIComponent(parentProject.project_name)}`}
                  className={styles['link-as-text']}
                >
                  {parentProject.project_name}
                </Link>
              </div>
            )}
            {linkedProjects.length > 0 && (
              <div>
                <strong>Linked Smart Contracts: </strong>
                {linkedProjects.map((child, idx) => (
                  <span key={child.project_id}>
                    {idx > 0 && ', '}
                    <Link
                      href={`/${encodeURIComponent(groupName as string)}/${encodeURIComponent(child.project_name)}`}
                      className={styles['link-as-text']}
                    >
                      {child.project_name}
                    </Link>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        {(loading || ((activeTab === 'transactions' || activeTab === 'report') && !isProjectDataReady)) && (
          <div>
            <div className={styles.loading}>Loading...</div>
          </div>
        )}
        {!loading && (
          activeTab === 'signup' ? (
            <Signup />
          ) : isProjectDataReady && activeTab === 'transactions' ? (
            <TransactionsTable key={projectData.project_id} myVariable={myVariable} groupName={groupName as string} projectName={projectName as string} />
          ) : isProjectDataReady && activeTab === 'report' ? (
            <>
              {projectName === "Singularity Net Ambassador Wallet" && (<SnetDashboard key={projectData.project_id} query={router.query} />)}
              {projectName != "Singularity Net Ambassador Wallet" && (<Dashboard key={projectData.project_id} query={router.query} />)}
            </>
          ) : activeTab !== 'transactions' && activeTab !== 'report' ? (
            <div>nothing selected</div>
          ) : null
        )}
      </div>
    </div>
  );
};

export default ProjectPage;