import { supabase } from "../lib/supabaseClient";
  let group = []
  let groupname = ''
  let groupInfo = []
export async function getOrgs() {
    async function getGroups() {
      try {
        const { data, error, status } = await supabase
        .from("groups")
        .select('group_name, logo_url, group_id, projects(project_name, project_type, project_id, wallet, archived, budgets)')
        
        if (error && status !== 406) throw error
        if (data) {
          group = data.map(item => {
            // Filter out the archived projects from each group
            item.projects = item.projects.filter(project => !project.archived);
            return item;
          });
          if (group.length == 0) {
            groupname = ''
            groupInfo = {}
          }
        }
      } catch (error) {
        if (error) {
          console.error('Unknown error:', error);
        }
      }
    }
  await getGroups();
  
  groupInfo = group
  
  return groupInfo
}