import { MyVariable, Transaction, WorkgroupData } from '../types/transactions';

export const filterIncomingTransactions = (transactions: Transaction[] | undefined): Transaction[] => {
    return (transactions || []).filter(tx =>
        (tx.tx_type === 'Incoming' || tx.tx_type === 'Incoming Reserve' || tx.tx_type === 'Swap Incoming') &&
        tx.contributions?.some(contribution =>
            contribution.distributions?.some(dist => ['msge62', 'vxhl7e'].includes(dist.contributor_id))
        )
    );
};

export const calculateAgixTotal = (transactions: Transaction[]): number => {
    return transactions.reduce((acc, tx) => {
        if (Array.isArray(tx.total_tokens) && Array.isArray(tx.total_amounts)) {
            const agixIndex = tx.total_tokens.indexOf('AGIX');
            if (agixIndex !== -1) {
                acc += Number(tx.total_amounts[agixIndex]) || 0;
            }
        }
        return acc;
    }, 0);
};

export const calculateWorkgroupAgixTotal = (report: MyVariable['report']): number => {
    if (!report) return 0;

    return Object.entries(report).reduce((acc, [_, monthData]) => {
        const totalDistribution = monthData['total-distribution'];
        if (totalDistribution && 'totalAmounts' in totalDistribution) {
            const agixAmount = (totalDistribution as WorkgroupData).totalAmounts?.AGIX || 0;
            return acc + agixAmount;
        }
        return acc;
    }, 0);
};

export const getCurrentAgixBalance = (balance: MyVariable['balance']): string => {
    return balance?.find(token => token.name === 'AGIX')?.amount || '0';
};

export const calculateAmbassadorAllocationBalance = (snetTokenAllocation: any[], workgroupAgixTotal: number, preTreasurySpending: number): number => {
    const startDate = new Date('2022-06-01');
    const currentDate = new Date();

    const totalAllocation = snetTokenAllocation.reduce((acc, allocation) => {
        const allocationDate = new Date(allocation.month);
        if (allocationDate >= startDate && allocationDate <= currentDate) {
            return acc + allocation.ambassador_allocation;
        }
        return acc;
    }, 0);

    return totalAllocation - workgroupAgixTotal - preTreasurySpending;
}; 