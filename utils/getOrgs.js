import { supabase } from "../lib/supabaseClient";
  let group = []
  let groupname = ''
  let groupWebsite = ''
  let groupId = ''
  let groupInfo = {}
  let monthly_budget = {}
export async function getOrgs() {
    async function getGroups() {
      try {
        const { data, error, status } = await supabase
        .from("groups")
        .select('group_name, logo_url, group_id, projects(project_name, project_type)')
        
        //console.log(data, lastTransaction.data)
        if (error && status !== 406) throw error
        if (data) {
          group = data
          if (group.length == 0) {
            groupname = ''
            groupInfo = {}
          } else {
            console.log(group)
          }
        }
      } catch (error) {
        if (error) {
          alert(error.message);
        } else {
          console.error('Unknown error:', error);
        }
      }
    }
    async function getMonthlyBudget() {
      try {
        const { data, error, status } = await supabase
        .from('transactions')
        .select('monthly_budget_balance, created_at')
        .eq('group_id', groupId)
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
  await getGroups();
  //console.log("getgroup", groupId)
  /*if (groupId.length > 20) {
    await getMonthlyBudget();
    groupInfo["monthly_budget"] = monthly_budget
  }*/
  groupInfo = group
  //console.log(address, "GroupInfo", groupInfo, "monthly_budget", monthly_budget)
  return groupInfo
}