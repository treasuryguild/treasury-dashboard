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

  async function getWallets() {
    if (connected) {
        const usedAddresses = await wallet.getUsedAddresses();
        const matchingWallet = await getContributorWallets(usedAddresses);
        const transactions = await getWalletTxs(matchingWallet);
        if (matchingWallet) {
            console.log(`Matching wallet found: ${matchingWallet}`);
            console.log("transactions", transactions)
          } else {
            console.log('No matching wallet found');
          }
        setWallets(usedAddresses);
        //console.log("Connected", usedAddresses, matchingWallet)
    } 
  }

  async function getTransactions() {
    if (wallets.length > 0) {
        const transactions = await getWalletTxs(wallets);
    }
  }

  useEffect(() => {
    setMyVariable(prevState => ({ ...prevState, groupInfo: groupInfo, transactions: [] }));
    console.log("Please connect wallet", groupInfo)
  }, [groupInfo, setMyVariable]);

  useEffect(() => {
    if (connected) {
        getWallets()
    }
    console.log("Wallet connected")
  }, [connected]);

  return (
    <div className={styles.container}>
      {!connected  && (<>
        <div>Please connect wallet</div>
      </>)}
      {connected  && (<>
        <div>Connected</div>
      </>)}
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