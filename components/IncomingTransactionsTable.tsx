import React from 'react';
import styles from '../styles/WorkgroupBalances.module.css';

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

interface MyVariable {
    report?: ReportData;
    balance?: Array<{
        id: string;
        name: string;
        displayname: string;
        amount: string;
        unit: string;
    }>;
    transactions?: Transaction[];
}

interface IncomingTransactionsTableProps {
    myVariable: MyVariable;
}

const IncomingTransactionsTable: React.FC<IncomingTransactionsTableProps> = ({ myVariable }) => {
    // Filter for incoming transactions from msge62
    const incomingTransactions = (myVariable.transactions || []).filter(tx =>
        (tx.tx_type === 'Incoming' || tx.tx_type === 'Incoming Reserve') &&
        tx.contributions?.some(contribution =>
            contribution.distributions?.some(dist => dist.contributor_id === 'msge62')
        )
    );

    // Calculate total for AGIX token from incoming transactions
    const agixTotal = incomingTransactions.reduce((acc, tx) => {
        if (Array.isArray(tx.total_tokens) && Array.isArray(tx.total_amounts)) {
            const agixIndex = tx.total_tokens.indexOf('AGIX');
            if (agixIndex !== -1) {
                acc += Number(tx.total_amounts[agixIndex]) || 0;
            }
        }
        return acc;
    }, 0);

    // Calculate total AGIX from all workgroups across all months using total-distribution
    const workgroupAgixTotal = myVariable.report ? Object.entries(myVariable.report).reduce((acc, [month, monthData]) => {
        // Get the total-distribution amount for this month
        const totalDistribution = monthData['total-distribution'];
        if (totalDistribution && 'totalAmounts' in totalDistribution) {
            const agixAmount = (totalDistribution as WorkgroupData).totalAmounts?.AGIX || 0;
            return acc + agixAmount;
        }
        return acc;
    }, 0) : 0;

    // Get current AGIX balance
    const currentAgixBalance = myVariable.balance?.find(token => token.name === 'AGIX')?.amount || '0';

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
                <h3>Summary</h3>
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
                                <td>Incoming Transactions Total</td>
                                <td style={{ textAlign: 'right' }}>{agixTotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Workgroup Distributions Total</td>
                                <td style={{ textAlign: 'right' }}>{workgroupAgixTotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 'bold' }}>Balance</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                    {(agixTotal - workgroupAgixTotal).toFixed(2)}
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