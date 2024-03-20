import { supabase } from "../lib/supabaseClient";

export async function getWalletTxs(wallets) {
  const fetchDataForWallets = async (wallets) => {
    const fetchPromises = wallets.map(async (wallet) => {
      const contributorId = wallet.slice(-6); // Extract last 6 digits as contribution_id
      const distributions = await fetchDistributions(contributorId);
      const contributions = await fetchContributions(distributions);
      return { wallet, distributions, contributions };
    });

    const results = await Promise.all(fetchPromises);
    return results;
  };

  const fetchDistributions = async (contributorId) => {
    try {
      const { data, error, status } = await supabase
        .from('distributions')
        .select('contributor_id, contribution_id, tx_id, tokens, amounts, project_id')
        .eq('contributor_id', contributorId)
        .order('created_at', { ascending: false });

      if (error && status !== 406) throw error;
      return data;
    } catch (error) {
      console.log("error", error.message);
      return [];
    }
  };

  const fetchContributions = async (distributions) => {
    try {
      const contributionIds = new Set(distributions.map(distribution => distribution.contribution_id));
      const contributionIdChunks = chunkArray([...contributionIds], 200); // Split into chunks of 1000 ids
      const fetchPromises = contributionIdChunks.map(async (chunk) => {
        const { data, error, status } = await supabase
          .from('contributions')
          .select('*')
          .in('contribution_id', chunk);
        if (error && status !== 406) throw error;
        return data;
      });
    
      const results = await Promise.all(fetchPromises);
      return results.flat();
    } catch (error) {
      console.log("error", error.message);
      return [];
    }
  };
  
  // Helper function to chunk an array into smaller arrays
  function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  const results = await fetchDataForWallets(wallets);
  return results;
}