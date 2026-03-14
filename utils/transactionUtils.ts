import { MyVariable, Transaction, WorkgroupData } from '../types/transactions';

const ALWAYS_INCLUDED_CONTRIBUTOR_IDS = new Set(['msge62', 'vxhl7e']);
const ALWAYS_SPECIAL_RETURNED_CONTRIBUTOR_IDS = new Set(['vxhl7e']);

// Add contributor ids here when they should only be counted on specific transaction hashes.
export const CONTRIBUTOR_IDS_BY_TRANSACTION_HASH: Record<string, Set<string>> = {
    // Replace this key with the real transaction hash that should include 7lnpzs.
    '699f345671391d299bceeaf638807eb10d152919db821fc8deccba6e54f60a5a': new Set(['7lnpzs']),
    // Future examples:
    // 'another-transaction-hash': new Set(['some-id', 'another-id']),
};

const getTransactionHash = (tx: Transaction): string | undefined => {
    return tx.transaction_id || tx.tx_id;
};

const isContributorIncluded = (contributorId: string, transactionHash?: string): boolean => {
    if (ALWAYS_INCLUDED_CONTRIBUTOR_IDS.has(contributorId)) {
        return true;
    }

    if (!transactionHash) {
        return false;
    }

    return CONTRIBUTOR_IDS_BY_TRANSACTION_HASH[transactionHash]?.has(contributorId) || false;
};

export const isTransactionInSpecialReturnedGroup = (tx: Transaction): boolean => {
    const hasAlwaysSpecialReturnedContributor = tx.contributions?.some(contribution =>
        contribution.distributions?.some(dist => ALWAYS_SPECIAL_RETURNED_CONTRIBUTOR_IDS.has(dist.contributor_id))
    ) || false;

    if (hasAlwaysSpecialReturnedContributor) {
        return true;
    }

    const transactionHash = getTransactionHash(tx);
    if (!transactionHash) {
        return false;
    }

    const contributorIdsForHash = CONTRIBUTOR_IDS_BY_TRANSACTION_HASH[transactionHash];
    if (!contributorIdsForHash) {
        return false;
    }

    return tx.contributions?.some(contribution =>
        contribution.distributions?.some(dist => contributorIdsForHash.has(dist.contributor_id))
    ) || false;
};

export const filterIncomingTransactions = (transactions: Transaction[] | undefined): Transaction[] => {
    return (transactions || []).filter(tx => {
        const transactionHash = getTransactionHash(tx);

        return (
            (tx.tx_type === 'Incoming' || tx.tx_type === 'Incoming Reserve' || tx.tx_type === 'Swap Incoming') &&
            tx.contributions?.some(contribution =>
                contribution.distributions?.some(dist => isContributorIncluded(dist.contributor_id, transactionHash))
            )
        );
    });
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