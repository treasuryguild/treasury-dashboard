import { supabase } from "../lib/supabaseClient";
  let wallets = []
export async function getWallets() {
    
    async function getAllWallets() {
      try {
        const { data, error, status } = await supabase
        .from('wallets')
        .select('username, wallet, user_id')
        .order('created_at', { ascending: false })
        
        if (error && status !== 406) throw error
        if (data) {
            wallets = data;
        }
      } catch (error) {
        if (error) {
            wallets = []
          console.log("error", error.message)
          //alert(error.message);
        } else {
          console.error('Unknown error: ', error);
        }
      }
    }
  await getAllWallets();

  return wallets;
}