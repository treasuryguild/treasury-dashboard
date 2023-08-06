import { supabase } from "../lib/supabaseClient";
  let group = []
  let groupname = ''
  let groupInfo = []
export async function getOrgs() {
    async function getGroups() {
      try {
        const { data, error, status } = await supabase
        .from("groups")
        .select('group_name, logo_url, group_id, projects(project_name, project_type, project_id)')
        
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
  await getGroups();
  
  groupInfo = group
  
  return groupInfo
}