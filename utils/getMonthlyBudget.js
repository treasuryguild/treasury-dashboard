import { supabase } from "../lib/supabaseClient";
  let monthly_budget = {}
export async function getMonthlyBudget(project_id) {
    
    async function getBudget() {
      try {
        const { data, error, status } = await supabase
        .from('transactions')
        .select('monthly_budget_balance, created_at')
        .eq('project_id', project_id)
        .order('created_at', { ascending: false })
        .limit(1);
        
        if (error && status !== 406) throw error
        if (data) {
            monthly_budget = data[0].monthly_budget_balance
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