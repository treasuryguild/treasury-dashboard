import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useMyVariable } from '../../../context/MyVariableContext';
import { getOrgs } from '../../../utils/getOrgs';
import { getMonthlyBudget } from '../../../utils/getMonthlyBudget';
import { getTransactions } from '../../../utils/getTransactions';
import { getWalletBalance } from '../../../utils/getWalletBalance';
import Link from 'next/link';
import styles from '../../../styles/Transactions.module.css';
import TransactionsTable from '../../../components/TransactionsTable'; 
import Signup from '../../../components/Signup';
import Report from '../../../components/Report';

interface Project {
    project_id: string;
    project_name: string;
    project_type: string;
    wallet: string;
}

const ProjectPage = () => {
    const [activeTab, setActiveTab] = useState<'transactions' | 'signup' | 'report'>('transactions');
    const { myVariable, setMyVariable } = useMyVariable();
    const router = useRouter();
    const { groupName, projectName } = router.query;
    const [loading, setLoading] = useState<boolean>(false);
    const [projectData, setProjectData] = useState<Project | null>(null);

    useEffect(() => {
        const fetchGroupData = async (groupName: string, projectName: string) => {
            let groupInfo = myVariable.groupInfo;
            // If myVariable.groupInfo is empty, fetch the groupInfo
            if (!groupInfo || groupInfo.length === 0) {
                groupInfo = await getOrgs();
                setMyVariable(prevState => ({ ...prevState, groupInfo: groupInfo }));
            }
    
            // Find the project from the updated groupInfo
            const foundGroup = groupInfo?.find(group => group.group_name === groupName);
            const foundProject = foundGroup?.projects.find(project => project.project_name === projectName);
            setProjectData(foundProject || null);
        };
    
        if (groupName && projectName) {
            fetchGroupData(groupName as string, projectName as string);
        }
    }, [groupName, projectName]);  // Removed myVariable and setMyVariable from the dependency array
    
    useEffect(() => {
        const fetchProjectData = async () => {
            let budgetInfo = myVariable.projectInfo;
            let transactions = myVariable.transactions;
    
            // If foundProject exists, fetch the monthly budget
            if (projectData) {
                setLoading(true);
                budgetInfo = await getMonthlyBudget(projectData.project_id);
                transactions = await getTransactions(projectData.project_id);
                let balance = await getWalletBalance(projectData.wallet) || {};
                console.log(balance)
                setMyVariable(prevState => ({ ...prevState, budgetInfo, projectInfo: projectData, transactions, balance }));
                setLoading(false);
            }
        };
    
        fetchProjectData();
    }, [projectData]);    
    
    // Function to scroll to top
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Function to scroll to bottom
    const scrollToBottom = () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    console.log("myVariable", myVariable);
    if (!projectData) return <div className={styles['main']}>Loading...</div>;

    return (
        <div className={styles['main']}>
            <div>
                <div className={styles.navbar}>
                    <button onClick={() => router.back()} className={styles.backButton}>Go Back</button>
                    <button onClick={() => setActiveTab('transactions')} className={activeTab === 'transactions' ? styles.active : styles.notactive}>Transactions</button>
                    <button onClick={() => setActiveTab('signup')} className={activeTab === 'signup' ? styles.active : styles.notactive}>Signup</button>
                    {projectName == "Singularity Net Ambassador Wallet" && (<button onClick={() => setActiveTab('report')} className={activeTab === 'report' ? styles.active : styles.notactive}>Report</button>)}
                    {!loading && activeTab === 'transactions' && (
                        <>
                            {myVariable.balance && (
                            <>
                            <div className={styles.walletDetails}>
                              <div>Wallet Balance</div>
                              <table className={styles.tokenTable}>
                                <tbody>
                                  <tr>
                                    <td style={{ textAlign: 'left' }}>ADA</td>
                                    <td style={{ textAlign: 'right' }}>{(myVariable.balance.lovelaces/10**6).toFixed(2)}</td>
                                  </tr>
                                  {
                                    myVariable.balance.tokens
                                      .filter((token: any) => token.minted_quantity > 1)
                                      .map((token: any) => {
                                        const decimals = token.metadata.decimals || 0;
                                        const name = token.metadata.ticker || token.name;
                                        const quantity = token.quantity / (10 ** decimals);
                                  
                                        return (
                                          <tr key={token.fingerprint}>
                                            <td style={{ textAlign: 'left' }}>{name}</td>
                                            <td style={{ textAlign: 'right' }}>{quantity.toFixed(2)}</td>
                                          </tr>
                                        );
                                      })
                                  }
                                </tbody>
                              </table>
                            </div>
                            </>
                            )}
                            <div>Table buttons</div>
                            <button className={styles.notactive} onClick={scrollToTop}>Scroll to Top</button>
                            <button className={styles.notactive} onClick={scrollToBottom}>Scroll to Bottom</button>
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
                    <TransactionsTable transactions={myVariable.transactions} groupName={groupName as string} projectName={projectName as string} />
                ) : activeTab === 'signup' ? (
                    <Signup />
                ) : activeTab === 'report' ? (
                    <Report />
                ) : (
                    <div>nothing selected</div> 
                )
            )}
        </div>
    );
};

export default ProjectPage;