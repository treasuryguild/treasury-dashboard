import { supabase } from "../lib/supabaseClient";

export async function getMonthlyBudget(project_id) {
    let monthly_budget = {};

    async function getBudget() {
      try {
        const { data, error, status } = await supabase
        .from('transactions')
        .select('monthly_budget_balance, created_at')
        .eq('project_id', project_id)
        .order('created_at', { ascending: false })
        .limit(1);
        
        if (error && status !== 406) throw error
        if (data && data.length > 0) {
            monthly_budget = data[0].monthly_budget_balance
        } else {
            monthly_budget = {"ADA": 0}
        }
      } catch (error) {
        if (error) {
          monthly_budget = {"ADA": 0}
          console.log("error", error.message)
          //alert(error.message);
        } else {
          console.error('Unknown error: ', error);
        }
      }
    }
  await getBudget();

  return monthly_budget;
}