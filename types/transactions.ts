export interface Distribution {
    amounts: number[];
    contributor_id: string;
    tokens: string[];
}

export interface Contribution {
    contribution_id: string;
    distributions: Distribution[];
}

export interface Transaction {
    tx_type: string;
    contributions?: Contribution[];
    total_tokens?: string[];
    total_amounts?: number[];
    transaction_date: string;
}

export interface WorkgroupData {
    totalAmounts: {
        AGIX?: number;
        MINS?: number;
    };
    labels: Record<string, any>;
    tasks: Record<string, number>;
    contributors: Set<string>;
    totalTasks: number;
}

export interface MonthlyBudget {
    AGIX: number;
}

export interface ReportData {
    [month: string]: {
        [workgroup: string]: WorkgroupData | MonthlyBudget;
    };
}

export interface TokenBalance {
    id: string;
    name: string;
    displayname: string;
    amount: string;
    unit: string;
}

export interface MyVariable {
    transactions?: Transaction[];
    report?: ReportData;
    balance?: TokenBalance[];
    pre_treasury_system_spending?: {
        AGIX: string;
    };
    snetTokenAllocation?: Array<{
        month: string;
        sc_allocation: number;
        ambassador_allocation: number;
    }>;
    projectInfo?: {
        project_id: string;
        project_name: string;
        project_type: string;
        wallet: string;
        budgets: any;
        core_token: string;
        carry_over_amounts?: {
            pre_treasury_system_spending?: {
                AGIX: string;
            };
        };
    };
    groupInfo?: any[];
    budgetInfo?: any;
    originalTransactions?: any;
    toke_types?: any;
} 