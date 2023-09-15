import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useWallet } from '@meshsdk/react';
import { useMyVariable } from '../../../../context/MyVariableContext'; 
import { getOrgs } from '../../../../utils/getOrgs';
import { getSingleTransaction } from '../../../../utils/getSingleTransaction';
import styles from '../../../../styles/Txid.module.css';

interface Project {
    project_id: string;
    project_name: string;
    project_type: string;
}

interface Contribution {
  contribution_id: string;
  task_name: string;
  task_label: string;
  task_description: string | null;
  task_type: string;
  distributions?: Distribution[];
}

interface Distribution {
  contributor_id: string;
  tx_id: string;
  tokens: string[];
  amounts: number[];
}

const TxidPage = () => {
    const { myVariable, setMyVariable } = useMyVariable();
    const router = useRouter();
    const { connected, wallet } = useWallet();
    const { groupName, projectName, txid } = router.query;
    const [loading, setLoading] = useState<boolean>(true);
    const [projectData, setProjectData] = useState<Project | null>(null);
    const [txidData, setTxidData] = useState<Contribution[] | null>(null);
    const [wallets, setWallets] = useState<string[]>([]);
    const [totalTokensReceived, setTotalTokensReceived] = useState({});

    useEffect(() => {
        if(txidData) {
          const aggregatedTokens = aggregateTokens(txidData, wallets);
          setTotalTokensReceived(aggregatedTokens);
        }
    }, [txidData, wallets]);
    

    async function getWallets() {
        if (connected) {
            const usedAddresses = await wallet.getUsedAddresses();
            setWallets(usedAddresses);
            //console.log("Connected", usedAddresses)
        } 
      }
      
      useEffect(() => {
          if (connected) {
              getWallets()
          }
          //console.log("useEffect", connected)
      }, [connected]);

    useEffect(() => {
        const fetchGroupData = async (groupName: string, projectName: string) => {
            let groupInfo = myVariable.groupInfo;
            
            if (!groupInfo || groupInfo.length === 0) {
                groupInfo = await getOrgs();
                setMyVariable(prevState => ({ ...prevState, groupInfo: groupInfo }));
            }
    
            const foundGroup = groupInfo?.find(group => group.group_name === groupName);
            const foundProject = foundGroup?.projects.find(project => project.project_name === projectName);
            setProjectData(foundProject || null);
        };
    
        if (groupName && projectName) {
          fetchGroupData(groupName as string, projectName as string);
        }
    }, [groupName, projectName]);  
    
    useEffect(() => {
        const fetchProjectData = async () => {
            let transactions = myVariable.transactions;
            if (projectData) {
                setLoading(true);
                transactions = await getSingleTransaction(txid, projectData.project_id);
                setMyVariable(prevState => ({ ...prevState, projectInfo: projectData }));
                //console.log("TEst", transactions[0].contributions)
                setTxidData(transactions[0].contributions)
                setLoading(false);
            }
        };
    
        fetchProjectData();
    }, [projectData]);    

    const filterContributions = (ids: string[]): Contribution[] | null => {
    if (!txidData) return null;

    if (ids.length === 0) return txidData;

    return txidData.filter((contribution: Contribution) => {
        return contribution.distributions?.some((distribution: Distribution) => {
            return ids.some(id => {
                const walletSuffix = id.slice(-6);
                return distribution.contributor_id.endsWith(walletSuffix);
            });
        });
    });
};       

const renderCards = (filteredContributions: Contribution[] | null) => {
  //console.log("test", filteredContributions);
  if (!filteredContributions) return null;

  return filteredContributions.map((contribution, index) => (
      <div key={index} className={styles.taskCard}>
          <h3 className={styles.taskName}>{contribution.task_name}</h3>
          {contribution.distributions?.map((distribution, index) => (
              <p key={index} 
                 className={wallets.some(wallet => wallet.slice(-6) === distribution.contributor_id) ? styles.highlight : ''}>
                  ID: {distribution.contributor_id} -&nbsp;
                  {distribution.amounts.map((amount, idx) => (
                      `${amount} ${distribution.tokens[idx]}`
                  )).join(', ')}
              </p>
          ))}
      </div>
  ));
};

function aggregateTokens(txidData: Contribution[] | null, walletIds: string[]) {
    const tokenAggregates: { [key: string]: number } = {};
  
    txidData?.forEach((contribution) => {
      contribution.distributions?.forEach((distribution) => {
        const walletSuffix = distribution.contributor_id.slice(-6);
        if(walletIds.length === 0 || walletIds.some(walletId => walletId.slice(-6) === walletSuffix)) {
          distribution.tokens.forEach((token, index) => {
            if (tokenAggregates[token]) {
              tokenAggregates[token] += distribution.amounts[index];
            } else {
              tokenAggregates[token] = distribution.amounts[index];
            }
          });
        }
      });
    });
  
    return tokenAggregates;
}

    if (!groupName || !projectName) return <div className={styles['main']}>Loading...</div>;
    
    return (
        <div className={styles['main']}>
          <div>
            <div className={styles.navbar}>
              <button onClick={() => router.back()} className={styles.backButton}>Go Back</button>
            </div>
          </div>
          <div className={styles.txWindow}>
            <div>
              {!connected && (<h2>Connect your wallet to view your rewards</h2>)}    
              {connected && (<h2>Rewards sent to this wallet in this transaction</h2>)}
              <p>txid: {txid}</p>
                <div className={styles.taskCard}>
                    {!connected && (<h2>Total rewards distributed</h2>)} 
                    {connected && (<h2>Total rewards received</h2>)} 
                    <p className={styles.highlight}>
                      {Object.entries(totalTokensReceived).map(([token, amount]) => `${amount} ${token}`).join(', ')}
                    </p>
                </div>
              <div>
                {!loading && renderCards(filterContributions(wallets))} 
              </div>
            </div>
          </div>  
        </div>
      );
    };
    
    export default TxidPage;