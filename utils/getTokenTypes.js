import { supabase } from "../lib/supabaseClient";
  export async function getTokenTypes() {
    let tone_types = [];
    async function getTokens() {
      try {
        let query = supabase
          .from('tokens')
          .select('asset_name, unit, asset_type, policy_id, ticker, fingerprint, decimals')
  
        const { data, error, status } = await query;
  
        if (error && status !== 406) throw error;
        if (data) {
          tone_types = data;
        }
      } catch (error) {
        if (error) {
          tone_types = [];
          console.log("error", error.message);
        } else {
          console.error('Unknown error: ', error);
        }
      }
    }
    await getTokens();
  
    return tone_types;
  }
  