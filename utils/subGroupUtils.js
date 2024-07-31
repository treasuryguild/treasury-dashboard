// ../utils/subGroupUtils.js

const subgroupConfig = {
    // Configuration for splitting
    'mindplex,translator-workgroup': {
      split: true,
      percentages: {
        'mindplex': 0,
        'translator-workgroup': 100
      }
    },
    'onboarding-workgroup,video-workgroup': {
      split: true,
      percentages: {
        'onboarding-workgroup': 50,
        'video-workgroup': 50
      }
    },
    // Configuration for renaming
    renameRules: {
      'ambassador-translator': 'translator-workgroup'
      // Add more renaming rules as needed
    },
    // New configuration for date-based renaming
    dateBasedRenameRules: [
      {
        subgroup: 'strategy-guild',
        newName: 'strategy-guild-v2',
        startDate: '31.06.24', // Format: YYYY-MM-DD
        endDate: ''    // Optional, if not provided, it will apply from startDate onwards
      }
      // Add more date-based renaming rules as needed
    ],
    // Default configuration
    default: {
      split: false,
      percentages: {
        'default': 100
      }
    }
  };
  
  function parseDate(dateString) {
    const [day, month, year] = dateString.split('.');
    return new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Utility function to rename a single subgroup
  function renameSubgroup(subgroup, taskDate) {
    // First, check for date-based renaming
    if (taskDate) {
      const dateBasedRule = subgroupConfig.dateBasedRenameRules.find(rule => {
        const date = parseDate(taskDate);
        const startDate = parseDate(rule.startDate);
        const endDate = rule.endDate ? parseDate(rule.endDate) : new Date('9999-12-31');
        return rule.subgroup === subgroup && date >= startDate && date <= endDate;
      });
  
      if (dateBasedRule) {
        return dateBasedRule.newName;
      }
    }
  
    // If no date-based rule applies, use the original renaming logic
    return subgroupConfig.renameRules[subgroup] || subgroup;
  }
  
  // Utility function to handle subgroup renaming, splitting, and reward distribution
  function handleSubgroupsAndRewards(parsedContribution) {
    // First, rename all subgroups
    const renamedSubgroups = parsedContribution.task_sub_group
      .split(',')
      .map(subgroup => renameSubgroup(subgroup.trim(), parsedContribution.task_date));
  
  
    // Join the renamed subgroups back into a string
    const renamedTaskSubGroup = renamedSubgroups.join(',');
  
    // Check if the renamed subgroup combination needs to be split
    const config = subgroupConfig[renamedTaskSubGroup] || subgroupConfig.default;
  
    if (config.split && renamedSubgroups.length > 1) {
      return renamedSubgroups.map(subgroup => {
        const newContribution = { ...parsedContribution };
        newContribution.contribution_id = crypto.randomUUID();
        newContribution.task_sub_group = subgroup;
  
        // Adjust distributions based on percentages
        newContribution.distributions = parsedContribution.distributions.map(dist => {
          const adjustedDist = { ...dist };
          adjustedDist.amounts = dist.amounts.map(amount => 
            amount * (config.percentages[subgroup] / 100)
          );
          return adjustedDist;
        });
  
        return newContribution;
      });
    } else {
      // For single subgroup or no split needed, just update the task_sub_group
      const newContribution = { ...parsedContribution };
      newContribution.task_sub_group = renamedTaskSubGroup;
      return [newContribution];
    }
  }
  
  export { subgroupConfig, handleSubgroupsAndRewards, renameSubgroup };