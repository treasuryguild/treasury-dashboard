// ../pages/[groupName]/[projectName]/index.tsx
import { useRouter } from 'next/router';
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
  const [previousTab, setPreviousTab] = useState<'transactions' | 'signup' | 'report'>('transactions');
  const [balance2, setBalance2] = useState<TokenBalance[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedWorkgroup, setSelectedWorkgroup] = useState<string[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab) {
        setActiveTab(tab as 'transactions' | 'signup' | 'report');
      }
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
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab) {
      setActiveTab(tab as 'transactions' | 'signup' | 'report');
    }
    const queryParams = new URLSearchParams(window.location.search);
    const months: any = queryParams.get('months')?.split(',') || ['All months'];
    const workgroups: any = queryParams.get('workgroups')?.split(',') || ['All workgroups'];
    const tokens: any = queryParams.get('tokens')?.split(',') || (projectName === "Singularity Net Ambassador Wallet" ? ['AGIX'] : selectedTokens);
    const labels: any = queryParams.get('labels')?.split(',') || ['All labels'];

    setSelectedMonths(months);
    setSelectedWorkgroup(workgroups);
    setSelectedTokens(tokens);
    setSelectedLabels(labels);
  }, []);


  // Hook to fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      let groupInfo = myVariable.groupInfo;
      if (!groupInfo || groupInfo.length === 0) {
        groupInfo = await getOrgs();
        setMyVariable(prevState => ({ ...prevState, groupInfo: groupInfo }));
      }

      const foundGroup = groupInfo?.find(group => group.group_name === groupName);
      const foundProject = foundGroup?.projects.find(project => project.project_name === projectName);
      setProjectData(foundProject || null);
      //console.log("foundProject", foundProject?.core_token)
      const coreToken: any = foundProject?.core_token ? foundProject?.core_token : selectedTokens
      setSelectedTokens([coreToken]);
    };

    if (groupName && projectName) {
      fetchGroupData();
    }
  }, [groupName, projectName]);

  // Hook to fetch project data
  useEffect(() => {
    const fetchProjectData = async () => {
      let budgetInfo = myVariable.projectInfo;

      if (projectData) {
        setLoading(true);
        budgetInfo = await getMonthlyBudget(projectData.project_id);
        let { transactions, originalTransactions } = await getAllTransactions(projectData.project_id);
        let balance = await getAssetList(projectData.wallet);
        let toke_types = await getTokenTypes() as TokenType[];

        // Fetch snet token allocation data if it's the Singularity Net Ambassador Wallet
        let snetTokenAllocation: SnetTokenAllocation[] = [];
        if (projectName === "Singularity Net Ambassador Wallet") {
          snetTokenAllocation = await getSnetTokenAllocation();
        }

        setBalance2(balance);
        setMyVariable(prevState => ({
          ...prevState,
          budgetInfo,
          projectInfo: projectData,
          transactions,
          originalTransactions,
          balance,
          toke_types,
          snetTokenAllocation
        }));
        setLoading(false);
      }
    };

    if (projectData && (!myVariable.budgetInfo || myVariable.transactions.length == 0) && (activeTab === 'transactions' || activeTab === 'report')) {
      fetchProjectData();
    }
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
          {!loading && (activeTab === 'transactions' || activeTab === 'report') && (
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
      {loading && (
        <div>
          <div className={styles.loading}>Loading...</div>
        </div>
      )}
      {!loading && (
        activeTab === 'transactions' ? (
          <TransactionsTable myVariable={myVariable} groupName={groupName as string} projectName={projectName as string} />
        ) : activeTab === 'signup' ? (
          <Signup />
        ) : activeTab === 'report' ? (
          <>
            {projectName === "Singularity Net Ambassador Wallet" && (<SnetDashboard query={router.query} />)}
            {projectName != "Singularity Net Ambassador Wallet" && (<Dashboard query={router.query} />)}
          </>
        ) : (
          <div>nothing selected</div>
        )
      )}
    </div>
  );
};

export default ProjectPage;