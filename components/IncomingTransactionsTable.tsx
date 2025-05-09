import React from 'react';
import styles from '../styles/WorkgroupBalances.module.css';
import { MyVariable } from '../types/transactions';
import {
    filterIncomingTransactions,
    calculateAgixTotal,
    calculateWorkgroupAgixTotal,
    getCurrentAgixBalance,
    calculateAmbassadorAllocationBalance
} from '../utils/transactionUtils';

interface Distribution {
    amounts: number[];
    contributor_id: string;
    tokens: string[];
}

interface Contribution {
    contribution_id: string;
    distributions: Distribution[];
}

interface Transaction {
    tx_type: string;
    contributions?: Contribution[];
    total_tokens?: string[];
    total_amounts?: number[];
    transaction_date: string;
}

interface WorkgroupData {
    totalAmounts: {
        AGIX?: number;
        MINS?: number;
    };
    labels: Record<string, any>;
    tasks: Record<string, number>;
    contributors: Set<string>;
    totalTasks: number;
}

interface MonthlyBudget {
    AGIX: number;
}

interface ReportData {
    [month: string]: {
        [workgroup: string]: WorkgroupData | MonthlyBudget;
    };
}

interface IncomingTransactionsTableProps {
    myVariable: MyVariable;
}

const IncomingTransactionsTable: React.FC<IncomingTransactionsTableProps> = ({ myVariable }) => {
    const incomingTransactions = filterIncomingTransactions(myVariable.transactions || []);
    const agixTotal = calculateAgixTotal(incomingTransactions);
    const workgroupAgixTotal = calculateWorkgroupAgixTotal(myVariable.report || {});
    const currentAgixBalance = getCurrentAgixBalance(myVariable.balance || []);
    const preTreasurySpending = Number(myVariable.projectInfo?.carry_over_amounts?.pre_treasury_system_spending?.AGIX || 0);
    const ambassadorAllocationBalance = calculateAmbassadorAllocationBalance(
        myVariable.snetTokenAllocation || [],
        workgroupAgixTotal,
        preTreasurySpending
    );

    return (
        <div>
            <div className={styles.numbers}>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>AGIX</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incomingTransactions.map((tx, index) => {
                            const agixIndex = tx.total_tokens?.indexOf('AGIX') ?? -1;
                            const agixAmount = agixIndex >= 0 && Array.isArray(tx.total_amounts)
                                ? tx.total_amounts[agixIndex] ?? 0
                                : 0;
                            return (
                                <tr key={index}>
                                    <td>{new Date(Number(tx.transaction_date)).toLocaleDateString()}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        {Number(agixAmount).toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}
                        <tr>
                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                {agixTotal.toFixed(2)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '40px' }}>
                <h3>SNET Ambassador Program Treasury Summary</h3>
                <div className={styles.numbers}>
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>AGIX</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Total Ambassador Allocation (June 2022 - Present)</td>
                                <td style={{ textAlign: 'right' }}>
                                    {myVariable.snetTokenAllocation?.reduce((acc, allocation) => {
                                        const allocationDate = new Date(allocation.month);
                                        const startDate = new Date('2022-06-01');
                                        const currentDate = new Date();
                                        if (allocationDate >= startDate && allocationDate <= currentDate) {
                                            return acc + allocation.ambassador_allocation;
                                        }
                                        return acc;
                                    }, 0).toFixed(2)}
                                </td>
                            </tr>
                            <tr>
                                <td>Agix received in treasury system</td>
                                <td style={{ textAlign: 'right' }}>{agixTotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Workgroup Distributions Total</td>
                                <td style={{ textAlign: 'right' }}>{workgroupAgixTotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Pre-Treasury System Spending</td>
                                <td style={{ textAlign: 'right' }}>{preTreasurySpending.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Ambassador Allocation Balance</td>
                                <td style={{ textAlign: 'right' }}>{ambassadorAllocationBalance.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 'bold' }}>Balance (AGIX received minus spending)</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                    {(agixTotal - workgroupAgixTotal).toFixed(2)}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 'bold' }}>Amount Still to Receive</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                    {(ambassadorAllocationBalance - (agixTotal - workgroupAgixTotal)).toFixed(2)}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 'bold' }}>Current Wallet Balance</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                    {Number(currentAgixBalance).toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default IncomingTransactionsTable; 