import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {  project_id } = req.body;

    if (!project_id) {
      return res.status(400).json({ error: "Project_id missing" });
    }

    try {
      const workgroups = await getSubGroups(project_id);
      return res.status(200).json({ workgroups });
    } catch (error) {
      console.error("Error getting SubGroups:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}

async function getSubGroups( project_id) {
  let workgroups = {};

  // Fetch all existing SubGroups from the database
  const { data: existingSubGroups, error: fetchError } = await supabase
    .from("subgroups")
    .select("sub_group, budgets, sub_group_data")
    .eq('project_id', project_id);

  if (fetchError) throw fetchError;

  workgroups = existingSubGroups;
  return workgroups;
}