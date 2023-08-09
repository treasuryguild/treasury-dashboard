import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useMyVariable } from '../../../context/MyVariableContext';
import { getOrgs } from '../../../utils/getOrgs';
import { getMonthlyBudget } from '../../../utils/getMonthlyBudget';
import { getTransactions } from '../../../utils/getTransactions';
import Link from 'next/link';
import styles from '../../../styles/Transactions.module.css';

interface Project {
    project_id: string;
    project_name: string;
    project_type: string;
}

const ProjectPage = () => {
    const { myVariable, setMyVariable } = useMyVariable();
    const router = useRouter();
    const { groupName, projectName } = router.query;
    
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
            let projectInfo = myVariable.projectInfo;
            let transactions = myVariable.transactions;
    
            // If foundProject exists, fetch the monthly budget
            if (projectData) {
                projectInfo = await getMonthlyBudget(projectData.project_id);
                transactions = await getTransactions(projectData.project_id);
                setMyVariable(prevState => ({ ...prevState, projectInfo, transactions }));
            }
        };
    
        fetchProjectData();
    }, [projectData]);    
    
    const formatDate = (timestamp: string) => {
        const date = new Date(Number(timestamp));
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const renderTableHeaders = () => {
        const baseHeaders = ['Date', 'Tx Type', 'Recipients', 'Metadata', 'txView', 'Fee', 'Wallet Balance'];
        const tokenHeaders = myVariable.transactions?.[0]?.total_tokens || [];
        
        // Define alignment classes for each header
        const headerAlignments = [
            styles['header-align-left'], // Date
            styles['header-align-center'], // Tx Type
            styles['header-align-center'], // Recipients
            styles['header-align-center'], // Metadata
            styles['header-align-center'], // txView
            styles['header-align-center'], // Fee
            styles['header-align-right'], // Wallet Balance
        ];
    
        const headersWithAlignment = [...baseHeaders, ...tokenHeaders].map((header, index) => {
            const alignmentClass = headerAlignments[index] || styles['header-align-right']; // Default to right align
            return <th key={header} className={alignmentClass}>{header}</th>;
        });
    
        return headersWithAlignment;
    };
    
    const renderTokenColumns = (transaction: any) => {
        const tokenHeaders = myVariable.transactions?.[0]?.total_tokens || [];
        const totalTokenColumns = tokenHeaders.length;
    
        return Array.from({ length: totalTokenColumns }, (_, i) => {
            if (transaction.total_tokens?.[i]) {
                return (
                    <td key={i} className={styles['align-right']}>
                        {transaction.total_tokens[i] === 'ADA' ? Number(transaction.total_amounts[i]).toFixed(2) : transaction.total_amounts[i] || '\u00A0'}
                    </td>
                );
            }
            return <td key={i} className={styles['align-right']}>&nbsp;</td>; // Placeholder for missing token
        });
    };

    const uniqueTokenNames = Array.from(new Set(myVariable.transactions?.flatMap((transaction: any) => transaction.total_tokens) || []));
    console.log("myVariable", myVariable);
    if (!projectData) return <div>Loading...</div>;

    return (
        <div>
            <div>
              <h1>{projectData.project_name}</h1>
            </div>
            <div>
                <table className={styles['styled-table']}> {/* Added class for overall table styling */}
                    <thead>
                        <tr>
                            {renderTableHeaders()}
                        </tr>
                    </thead>
                    <tbody>
                    {myVariable.transactions?.sort((a, b) => Number(b.transaction_date) - Number(a.transaction_date)).map((transaction: any, index: any) => (
                            <tr key={index} className={transaction.tx_type === 'Incoming' ? styles['incoming-row'] : ''}>
                                <td className={styles['align-left']}>{formatDate(transaction.transaction_date)}</td> {/* Center align */}
                                <td className={styles['align-center']}>{transaction.tx_type}</td> {/* Right align */}
                                <td className={styles['align-center']}>{transaction.recipients}</td> {/* Left align */}
                                <td className={styles['align-center']}><a href={transaction.tx_json_url} target="_blank" rel="noopener noreferrer">Link</a></td>
                                <td className={styles['align-center']}><Link href={`/${groupName}/${projectName}/${transaction.transaction_id}`}>View</Link></td>
                                <td className={styles['align-center']}>{transaction.fee}</td>
                                <td className={styles['align-right']}>{Number(transaction.wallet_balance_after).toFixed(2)}</td>
                                {uniqueTokenNames.map((tokenName, i) => {
                                    // Find the index of the token in the current transaction
                                    const tokenIndex = transaction.total_tokens?.indexOf(tokenName);
                                    // If the token is found in the current transaction, render its value
                                    if (tokenIndex !== -1 && tokenIndex !== undefined) {
                                        return (
                                            <td key={i} className={styles['align-right']}>
                                                {tokenName === 'ADA' ? Number(transaction.total_amounts[tokenIndex]).toFixed(2) : transaction.total_amounts[tokenIndex] || '\u00A0'}
                                            </td>
                                        );
                                    }
                                    // If the token is not found in the current transaction, render a placeholder
                                    return <td key={i} className={styles['align-right']}>&nbsp;</td>;
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectPage;