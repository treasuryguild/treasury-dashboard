import { supabase } from "../lib/supabaseClient";

export async function updateWallet(username, wallet, user_id, project, full_username) {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .upsert([
        { username: username, wallet: wallet, user_id: user_id, project: project, full_username: full_username }
      ], { onConflict: ['project', 'user_id'] })

    if (error) {
      throw error;
    }
    
    return { success: true, data: data, message: "Wallet update successful!" };
    
  } catch (error) {
    console.log("Upload error: ", error.message);
    return { success: false, data: null, message: "Upload failed!" };
  }
}
