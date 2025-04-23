import { supabase } from '../lib/supabaseClient';

export const getSnetTokenAllocation = async () => {
    try {
        const { data, error } = await supabase
            .from('snet_sc_token_allocation')
            .select('*');

        if (error) {
            console.error('Error fetching snet token allocation:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getSnetTokenAllocation:', error);
        return [];
    }
}; 