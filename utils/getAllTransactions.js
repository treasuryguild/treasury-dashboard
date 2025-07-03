// ../utils/getAllTransactions.js
import { supabase } from "../lib/supabaseClient";
import { parseContributions } from "./parseContributions";

let testFaultyTxFilters;

try {
  testFaultyTxFilters = require('../public/testFaultyTxFilters.json');
} catch (error) {
  //console.warn("testFaultyTxFilters.json not found, using empty filters");
  testFaultyTxFilters = [];
}

export async function getAllTransactions(project_id, useTestData = false) {
  async function getAllTransactionsData(projectId, page, limit) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const { data, error, status } = await supabase
        .from('transactions')
        .select('*')
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

  async function getAllData(projectId, limit = 1000) {
    try {
      let transactionsData = [];
      let page = 1;

      while (true) {
        const transactionsPage = await getAllTransactionsData(projectId, page, limit);
        transactionsData = [...transactionsData, ...transactionsPage];

        if (transactionsPage.length < limit) break;
        page++;
      }

      //console.log("Total transactions fetched:", transactionsData.length);

      const originalTransactions = transactionsData.map((transaction) => {
        let tx_json;
        try {
          tx_json = typeof transaction.tx_json === 'string' ? JSON.parse(transaction.tx_json) : transaction.tx_json;
        } catch (error) {
          console.error('Error parsing tx_json:', error);
          tx_json = {};
        }
        const contributions = parseContributions(tx_json);

        return { ...transaction, contributions, original_tx_json: tx_json };
      });

      //console.log("Original transactions after parsing:", originalTransactions.length);

      // Use test data if useTestData is true
      const defaultFilters = [];
      const faultyTxFilters = useTestData
        ? (testFaultyTxFilters || defaultFilters)
        : originalTransactions.filter(t => t.original_tx_json.msg && t.original_tx_json.msg[0] === "FaultyTx-Filter");

      const regularTransactions = originalTransactions.filter(t => !(t.original_tx_json.msg && t.original_tx_json.msg[0] === "FaultyTx-Filter"));

      //console.log("FaultyTx-Filter transactions:", faultyTxFilters.length);
      //console.log("Regular transactions:", regularTransactions.length);

      // Apply filters to regular transactions
      const transactions = regularTransactions.map(transaction => {
        const matchingFilters = faultyTxFilters.filter(filter => filter.original_tx_json.faultyTx === transaction.transaction_id);

        if (matchingFilters.length > 0) {
          //console.log(`Applying ${matchingFilters.length} filters to transaction ${transaction.transaction_id}`);
          //console.log("Before filtering:", JSON.stringify(transaction.contributions, null, 2));

          matchingFilters.forEach(filter => {
            const faultyContributions = filter.original_tx_json.contributions;
            //console.log("Faulty contributions:", JSON.stringify(faultyContributions, null, 2));

            // First, identify all contributors to be removed globally
            const globalContributorsToRemove = faultyContributions
              .filter(fc => !fc.name)
              .flatMap(fc => fc.contributors);

            //console.log("Global contributors to remove:", globalContributorsToRemove);

            // Then, apply filters to all contributions
            transaction.contributions = transaction.contributions.filter(contribution => {
              // Exclude contributions with task_label 'Reimbursement' or 'Donation'
              if (contribution.task_label === 'Reimbursement' || contribution.task_label === 'Donation') {
                return false;
              }

              //console.log(`Processing contribution: ${contribution.task_name}`);

              const matchingFaultyContribution = faultyContributions.find(fc =>
                fc.name && fc.name[0] === contribution.task_name
              );

              // Remove global contributors and specific contributors if there's a match
              const contributorsToRemove = [
                ...globalContributorsToRemove,
                ...(matchingFaultyContribution ? matchingFaultyContribution.contributors : [])
              ];

              //console.log(`Contributors to remove for ${contribution.task_name}:`, contributorsToRemove);

              contribution.distributions = contribution.distributions.filter(dist => {
                const keep = !contributorsToRemove.includes(dist.contributor_id);
                //console.log(`Distribution for ${dist.contributor_id}: ${keep ? 'kept' : 'removed'}`);
                return keep;
              });

              const keep = contribution.distributions.length > 0;
              //console.log(`Contribution ${contribution.task_name}: ${keep ? 'kept' : 'removed'}`);
              return keep;
            });
          });

          //console.log("After filtering:", JSON.stringify(transaction.contributions, null, 2));
        } else {
          // For transactions without matching filters, still filter out Reimbursement and Donation contributions
          transaction.contributions = transaction.contributions.filter(contribution =>
            contribution.task_label !== 'Reimbursement' && contribution.task_label !== 'Donation'
          );
        }

        return transaction;
      });

      //console.log("Fixed Transactions (now 'transactions'):", transactions.length);

      return { originalTransactions, transactions };
    } catch (error) {
      console.error('Unknown error:', error);
      return { originalTransactions: [], transactions: [] };
    }
  }

  const result = await getAllData(project_id);
  console.log("Final originalTransactions count:", result.originalTransactions.length);
  console.log("Final transactions count:", result.transactions.length, result.transactions);
  return result;
}