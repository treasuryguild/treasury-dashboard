import { supabase } from "../lib/supabaseClient";
  export async function getSingleTransaction(transaction_id, project_id) {
    let transactions = [];
    async function getTxs() {
      try {
        let query = supabase
          .from('transactions')
          .select('tx_id, created_at, transaction_date, transaction_id, project_id, wallet_balance_after, tx_json_url, exchange_rate, recipients, fee, tx_type, total_tokens, total_amounts, monthly_budget_balance, contributions(contribution_id, task_name, task_label, task_description, task_type, tx_id, task_sub_group, task_date, distributions(contributor_id, tx_id, tokens, amounts))')
          .eq('transaction_id', transaction_id)
          .order('created_at', { ascending: false });
  
        if (project_id) {
          query = query.eq('project_id', project_id);
        }
  
        const { data, error, status } = await query;
  
        if (error && status !== 406) throw error;
        if (data) {
          transactions = data;
        }
      } catch (error) {
        if (error) {
          transactions = [];
          console.log("error", error.message);
        } else {
          console.error('Unknown error: ', error);
        }
      }
    }
    await getTxs();
  
    return transactions;
  }
  