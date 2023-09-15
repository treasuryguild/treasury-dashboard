import { supabase } from "../lib/supabaseClient";

export async function updateWallet(username, wallet, user_id, project, full_username) {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .upsert([
        { username: username, wallet: wallet, user_id: user_id, project: project, full_username: full_username }
      ])

    if (error) {
      throw error;
    }
    if (data) {
        return username;
    }
  } catch (error) {
    console.log("Upload error: ", error.message);
    return null;
  }
}
