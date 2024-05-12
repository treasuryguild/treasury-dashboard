import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { inputSubGroups, project_id } = req.body;

    if (!inputSubGroups || !Array.isArray(inputSubGroups)) {
      return res.status(400).json({ error: "Invalid input data" });
    }

    try {
      const status = await updateSubGroups(inputSubGroups, project_id);
      return res.status(200).json({ status });
    } catch (error) {
      console.error("Error updating SubGroups:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}

async function updateSubGroups(inputSubGroups , project_id) {
  let status = "started";

  // Fetch all existing SubGroups from the database
  const { data: existingSubGroups, error: fetchError } = await supabase
    .from("subgroups")
    .select("sub_group");

  if (fetchError) throw fetchError;

  // Convert the existing SubGroups to a Set for faster lookup
  const existingSubGroupsSet = new Set(
    existingSubGroups.map((item) => item.sub_group)
  );

  // Filter out the SubGroups that already exist
  const newSubGroups = inputSubGroups.filter(
    (sub_group) => !existingSubGroupsSet.has(sub_group)
  );

  // Insert new labels
  for (const sub_group of newSubGroups) {
    const updates = {
      sub_group,
      project_id
    };
    const { data, error } = await supabase
      .from("subgroups")
      .upsert(updates)
      .select("*");

    if (error) throw error;
    if (!data) {
      throw new Error("Failed to update the label");
    }
  }

  status = "done";
  return status;
}