import { supabase } from "../lib/supabaseClient";
import { parseContributions } from "./parseContributions"; // Import the new utility function

export async function getAllTransactions(project_id) {
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

      const transactions = transactionsData.map((transaction) => {
        let tx_json;
        try {
          tx_json = typeof transaction.tx_json === 'string' ? JSON.parse(transaction.tx_json) : transaction.tx_json;
        } catch (error) {
          console.error('Error parsing tx_json:', error);
          tx_json = {};
        }

        const contributions = parseContributions(tx_json); // Use the new utility function

        return { ...transaction, contributions };
      });

      return transactions;
    } catch (error) {
      console.error('Unknown error:', error);
      return [];
    }
  }

  const transactions = await getAllData(project_id);
  console.log("transactions", transactions);
  return transactions;
}