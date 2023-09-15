import { useState, useEffect, FC } from 'react';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import { useMyVariable } from '../../context/MyVariableContext';
import { getSingleTransaction } from '../../utils/getSingleTransaction';
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

const Transaction: NextPage = () => {
  const { myVariable, setMyVariable } = useMyVariable();
  const router = useRouter();
  const [txId, setTxId] = useState<string>('');
  const [transactionDetails, setTransactionDetails] = useState<any[]>([]);
  const [projectOptions, setProjectOptions] = useState<Project[]>([]);

  useEffect(() => {
    if (transactionDetails && transactionDetails.length > 1) {
      const projects = myVariable.groupInfo.flatMap(group => 
        group.projects.map(project => ({ ...project, group_name: group.group_name }))
      );
      const options = transactionDetails.map(tx => {
        return projects.find(project => project.project_id === tx.project_id);
      }).filter(Boolean);
      setProjectOptions(options as Project[]);
      
    } else if (transactionDetails && transactionDetails.length === 1) {
      const project = myVariable.groupInfo.flatMap(group => 
        group.projects.map(project => ({ ...project, group_name: group.group_name }))
      ).find(project => project.project_id === transactionDetails[0].project_id);
      
      if (project) {
        router.push(`/${project.group_name}/${project.project_name}/${txId}`);
      } else {
        console.log("Handle 1 transaction, but group not found");
      }
    }
  }, [transactionDetails]);

  const getTx = async (txid: string) => {
    let transaction: any[] = await getSingleTransaction(txid);
    setTransactionDetails(transaction);
  
    if (transaction.length === 0) {
      alert('Transaction ID not found. Please try again.');
    }
  };
  

  const handleTxIdSubmit = () => {
    getTx(txId);
  };

  const handleProjectSelection = (project: Project) => {
    router.push(`/${project.group_name}/${project.project_name}/${txId}`);
  };
  

  return (
    <div className={styles.container}>
      <div className={styles.inputSection}>
        <p>Enter transaction ID </p>     
        <input className={styles.input} value={txId} onChange={(e) => setTxId(e.target.value)} />
        <button className={styles.button} onClick={handleTxIdSubmit}>Submit</button>
      </div>
      {projectOptions.length > 0 && (
        <div className={styles.projectOptions}>
          <p>Please select where you want to view this transaction</p>
          {projectOptions.map((project, index) => (
            <button className={styles.projectButton} key={index} onClick={() => handleProjectSelection(project)}>
              {project.project_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );  
};

export default Transaction;
