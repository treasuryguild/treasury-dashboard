import { useState, useEffect, FC } from 'react';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import { useMyVariable } from '../../context/MyVariableContext';
import { useWallet } from '@meshsdk/react';
import { getOrgs } from '../../utils/getOrgs';
import { getContributorWallets } from '../../utils/getContributorWallets';
import { getWalletTxs } from '../../utils/getWalletTxs';
import { getTransactions } from '../../utils/getTransactions';
import { txDenormalizer } from '../../utils/txDenormalizer';
import WalletProjectCard from '../../components/WalletProjectCard';
import styles from '../../styles/Tx.module.css';

interface Project {
  project_id: string;
  project_name: string;
  project_type: string;
  wallet: string;
  group_name?: string;
}

interface Group {
  group_name: string;
  projects: Project[];
}

type AllTxsProps = {
  groupInfo: any;
};

const AllTxs: NextPage<AllTxsProps> = ({ groupInfo }) => {
  const { myVariable, setMyVariable } = useMyVariable();
  const router = useRouter();
  const { connected, wallet } = useWallet();
  const [wallets, setWallets] = useState<string[]>([]);
  const [txId, setTxId] = useState<string>('');
  const [AllTxsDetails, setAllTxsDetails] = useState<any[]>([]);
  const [projectOptions, setProjectOptions] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>({});
  const [flattenedTransactions, setFlattenedTransactions] = useState<any>({});

  const handleSelectProject = (project: any) => {
    setSelectedProject(project);
  };

  async function getWallets() {
    if (connected) {
      const usedAddresses = await wallet.getUsedAddresses();
      const matchingWallet = await getContributorWallets(usedAddresses);
      if (matchingWallet) {
        const transactions = await getWalletTxs(matchingWallet);
        console.log(`Matching wallet found: ${matchingWallet}`);

        // Flatten and group the transactions data by project_id
        const flattenedTransactionsData: any = {};
        for (const walletObj of transactions) {
          const { wallet, contributions, distributions } = walletObj;

          for (const contributionObj of contributions) {
            const { contribution_id, task_date, task_name, task_description, project_id, ...otherContributionFields } = contributionObj;
            const distributionObj = distributions.find(
              (obj: any) => obj.contribution_id === contribution_id
            );

            if (distributionObj) {
              const { tokens, amounts, ...otherDistributionFields } = distributionObj;
              const tokenAmounts = tokens.reduce((acc: any, token: any, index: any) => {
                acc[token] = amounts[index];
                return acc;
              }, {});

              if (!flattenedTransactionsData[project_id]) {
                flattenedTransactionsData[project_id] = [];
              }

              flattenedTransactionsData[project_id].push({
                wallet,
                contribution_id,
                task_date,
                task_name,
                task_description,
                project_id,
                ...otherContributionFields,
                ...otherDistributionFields,
                ...tokenAmounts,
              });
            }
          }
        }

        setFlattenedTransactions(flattenedTransactionsData);
        console.log("Flattened and grouped transactions", flattenedTransactionsData);
      } else {
        console.log('No matching wallet found');
      }
      setWallets(usedAddresses);
    }
  }

  async function getTransactions() {
    if (wallets.length > 0) {
      const transactions = await getWalletTxs(wallets);
    }
  }

  useEffect(() => {
    setMyVariable(prevState => ({ ...prevState, groupInfo: groupInfo, transactions: [] }));
    console.log("Please connect wallet", groupInfo);
  }, [groupInfo, setMyVariable]);

  useEffect(() => {
    if (connected) {
      getWallets();
    }
    console.log("Wallet connected");
  }, [connected]);

  return (
    <div className={styles.container}>
      {!connected && (
        <>
          <div>Please connect wallet</div>
        </>
      )}
      {connected && (
        <>
          <div>Connected</div>
          <div className="project-cards">
            {
              groupInfo.flatMap((group: any) =>
                group.projects.filter((project: any) => flattenedTransactions[project.project_id])
                  .map((project: any) => (
                    <WalletProjectCard
                      key={project.project_id}
                      project={project}
                      logoUrl={group.logo_url}
                      onSelectProject={handleSelectProject}
                    />
                  ))
              )
            }
          </div>
          {selectedProject && (
            <div className="project-contributions">
              <h2>{selectedProject?.project_name}</h2>
              <table>
                <thead>
                  <tr>
                    <th>Task Date</th>
                    <th>Task Name/Description</th>
                    {/* Dynamically render token headers */}
                    {selectedProject && flattenedTransactions[selectedProject?.project_id] &&
                      Object.keys(flattenedTransactions[selectedProject?.project_id][0])
                        .filter(key => key !== 'contribution_id' && key !== 'task_date' && key !== 'task_name' && key !== 'task_description' && key !== 'wallet' && key !== 'project_id')
                        .map(key => <th key={key}>{key}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {flattenedTransactions[selectedProject.project_id]?.map(
                    (contribution: any) => (
                      <tr key={contribution.contribution_id}>
                        <td>{contribution.task_date || '-'}</td>
                        <td>
                          {contribution.task_name || contribution.task_description || '-'}
                        </td>
                        {/* Dynamically render token amounts */}
                        {Object.keys(contribution)
                          .filter(key => key !== 'contribution_id' && key !== 'task_date' && key !== 'task_name' && key !== 'task_description' && key !== 'wallet' && key !== 'project_id' && key !== 'task_array_map')
                          .map(key => <td key={`${contribution.contribution_id}-${key}`}>{contribution[key] || '-'}</td>)}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllTxs;

export async function getServerSideProps() {
  const groupInfo = await getOrgs();

  const sortedGroupInfo = groupInfo.sort((a: any, b: any) => {
    return a.group_name.localeCompare(b.group_name);
  });

  return {
    props: { groupInfo: sortedGroupInfo }
  };
}