import { supabase } from "../lib/supabaseClient";

export async function getTransactions(project_id) {
  async function getTransactionsData(projectId, page, limit) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const { data, error, status } = await supabase
        .from('transactions')
        .select('tx_id, created_at, transaction_date, transaction_id, project_id, wallet_balance_after, tx_json_url, exchange_rate, recipients, fee, tx_type, total_tokens, total_amounts, monthly_budget_balance')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error && status !== 406) throw error;
      return data || [];
    } catch (error) {
      console.log("Error fetching transactions:", error.message);
      return [];
    }
  }

  async function getContributionsData(transactionIds) {
    const batchSize = 100;
    let allContributions = [];

    for (let i = 0; i < transactionIds.length; i += batchSize) {
      const batch = transactionIds.slice(i, i + batchSize);

      try {
        const { data, error, status } = await supabase
          .from('contributions')
          .select('contribution_id, task_name, task_label, task_description, task_type, tx_id, task_sub_group, task_date')
          .in('tx_id', batch);

        if (error && status !== 406) throw error;
        allContributions = [...allContributions, ...(data || [])];
      } catch (error) {
        console.log("Error fetching contributions:", error.message);
      }
    }

    return allContributions;
  }

  async function getDistributionsData(contributionIds) {
    const batchSize = 100;
    let allDistributions = [];

    for (let i = 0; i < contributionIds.length; i += batchSize) {
      const batch = contributionIds.slice(i, i + batchSize);

      try {
        const { data, error, status } = await supabase
          .from('distributions')
          .select('contributor_id, contribution_id, tokens, amounts')
          .in('contribution_id', batch);

        if (error && status !== 406) throw error;
        allDistributions = [...allDistributions, ...(data || [])];
      } catch (error) {
        console.log("Error fetching distributions:", error.message);
      }
    }

    return allDistributions;
  }

  async function getAllData(projectId, limit = 1000) {
    try {
      let transactionsData = [];
      let page = 1;

      while (true) {
        const transactionsPage = await getTransactionsData(projectId, page, limit);
        transactionsData = [...transactionsData, ...transactionsPage];

        if (transactionsPage.length < limit) break;
        page++;
      }

      const transactionIds = transactionsData.map((transaction) => transaction.tx_id);

      const contributionsData = await getContributionsData(transactionIds);

      const contributionIds = contributionsData.map((contribution) => contribution.contribution_id);

      const distributionsData = await getDistributionsData(contributionIds);

      const transactions = transactionsData.map((transaction) => {
        const contributions = contributionsData
          .filter((contribution) => contribution.tx_id === transaction.tx_id)
          .map((contribution) => {
            const distributions = distributionsData.filter(
              (distribution) => distribution.contribution_id === contribution.contribution_id
            );
            return { ...contribution, distributions };
          });

        return { ...transaction, contributions };
      });

      return transactions;
    } catch (error) {
      console.error('Unknown error:', error);
      return [];
    }
  }

  const transactions = await getAllData(project_id);
  //console.log("transactions", transactions);
  return transactions;
}