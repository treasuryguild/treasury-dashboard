// ../utils/parseContributions.js
import { handleSubgroupsAndRewards } from './subGroupUtils';

export function parseContributions(tx_json) {
    const contributions = [];
    const mdVersion = tx_json.mdVersion ? tx_json.mdVersion[0] : '1.0';
  
    if (tx_json.contributions) {
      tx_json.contributions.forEach((contribution) => {
        let taskLabel;
        if (contribution.arrayMap?.label) {
          taskLabel = Array.isArray(contribution.arrayMap.label) 
            ? contribution.arrayMap.label.join(',') 
            : String(contribution.arrayMap.label);
        } else if (contribution.label) {
          taskLabel = Array.isArray(contribution.label)
            ? contribution.label.join(',')
            : String(contribution.label);
        } else {
          taskLabel = '';
        }
  
        let taskSubGroup = (contribution.arrayMap?.subGroup?.[0] || '')
          .toLowerCase()
          .replace(/\s+/g, '-')
          .trim();
        
        console.log("Original taskSubGroup", taskSubGroup);
        
        // If still empty after all processing, set to "ambassador-program"
        if (taskSubGroup === "mindplex") {
          taskSubGroup = "mindplex,ambassador-translator";
        }

        // If still empty after all processing, set to "ambassador-program"
        if (taskSubGroup === "" || taskSubGroup === "ambasador-program") {
          taskSubGroup = "ambassador-program";
        }
        
        const parsedContribution = {
          contribution_id: crypto.randomUUID(),
          task_name: contribution.name || (Array.isArray(contribution.description) ? contribution.description.join(' ') : String(contribution.description || '')),
          task_label: taskLabel,
          task_description: Array.isArray(contribution.description) ? contribution.description.join(' ') : String(contribution.description || ''),
          task_type: contribution.arrayMap?.type?.[0] || '',
          task_sub_group: taskSubGroup,
          task_date: contribution.arrayMap?.date?.[0] || null,
          distributions: []
        };
  
        if (contribution.contributors) {
          Object.entries(contribution.contributors).forEach(([contributor_id, tokens]) => {
            Object.entries(tokens).forEach(([token, amount]) => {
              parsedContribution.distributions.push({
                contributor_id,
                tokens: [token],
                amounts: [amount]
              });
            });
          });
        }
  
        // Use the utility function to handle subgroups renaming, splitting, and rewards
        const processedContributions = handleSubgroupsAndRewards(parsedContribution);
        contributions.push(...processedContributions);
        
        console.log("Processed contributions:", processedContributions);
      });
    }
    console.log("All contributions:", contributions);
    return contributions;
  }