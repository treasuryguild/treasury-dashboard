import { supabase } from "../lib/supabaseClient";

let contributors = [];

export async function getContributorWallets(wallets) {
  async function getContributors() {
    try {
      const { data, error, status } = await supabase
        .from('contributors')
        .select('*');

      if (error && status !== 406) throw error;
      if (data) {
        contributors = data;
      }
    } catch (error) {
      if (error) {
        contributors = [];
        console.log("error", error.message);
      } else {
        console.error('Unknown error: ', error);
      }
    }
  }

  await getContributors();

  // Find the matching wallet addresses
  const matchingWallets = wallets.filter(wallet =>
    contributors.some(contributor => contributor.wallet === wallet)
  );

  return matchingWallets;
}