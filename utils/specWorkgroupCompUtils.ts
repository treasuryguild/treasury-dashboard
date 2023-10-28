export const formatNumberWithLeadingZero = (num: number): string => {
    return num < 10 ? `0${num}` : `${num}`;
  };
  
  export const getFormattedSelectedMonth = (selectedMonth: string): string => {
    if (selectedMonth === 'All months') return selectedMonth;
    const [rawSelectedMonthNum, selectedYear] = selectedMonth.split('.');
    return `${formatNumberWithLeadingZero(Number(rawSelectedMonthNum))}.${selectedYear}`;
  };
  
  export const filterContributionsByWorkgroupAndMonth = (transactions: any[], workgroup: string, formattedSelectedMonth: string) => {
    const curatedContributions = transactions.flatMap((transaction: any) => 
      transaction.contributions ? transaction.contributions.filter((contribution: any) => {
        // Check if the contribution belongs to the selected workgroup
        const isFromSelectedWorkgroup = contribution.task_sub_group && 
          (contribution.task_sub_group.replace(/ /g, '-').toLowerCase()) === workgroup;
  
        if (formattedSelectedMonth === 'All months') {
          return isFromSelectedWorkgroup; // If "All months" is selected, only check workgroup
        }
  
        let contributionDate = contribution.task_date;
        
        if (!contributionDate && transaction.transaction_date) {
          const transactionDate = new Date(Number(transaction.transaction_date));
          contributionDate = `${formatNumberWithLeadingZero(transactionDate.getDate())}.${formatNumberWithLeadingZero(transactionDate.getMonth() + 1)}.${transactionDate.getFullYear().toString().slice(-2)}`;
        }
        
        if (!contributionDate) {
          return false; 
        }
        
        // Extract month and year from the contribution's date (i.e., "15.09.23")
        const [contributionDay, contributionMonth, contributionYearSuffix] = contributionDate.split('.');
        
        // Format the contribution's date to match the selectedMonth format (i.e., "09.2023")
        const contributionFormattedDate = `${contributionMonth}.${'20' + contributionYearSuffix}`;
        
        // Check if the contribution's date matches the selected month and year
        const isFromSelectedMonth = contributionFormattedDate === formattedSelectedMonth;
  
        return isFromSelectedWorkgroup && isFromSelectedMonth;
      }) : []
    ); 
    return curatedContributions;
  };
  
  export const getUniqueTaskLabels = (contributions: any[]): string[] => {
    const uniqueTaskLabelsSet: Set<string> = new Set();
    contributions.forEach((contribution: any) => {
      contribution.task_label.split(',').forEach((label: string) => {
        uniqueTaskLabelsSet.add(label.trim());
      });
    });
    return Array.from(uniqueTaskLabelsSet);
  };
  
  export const getAggregatedAGIXAmounts = (contributions: any[], uniqueTaskLabels: string[]): { [key: string]: number } => {
   // Calculate aggregated AGIX amounts for each task label
   const aggregatedAGIXAmounts: { [key: string]: number } = {};
   uniqueTaskLabels.forEach((label: string) => {
     aggregatedAGIXAmounts[label] = 0;
   });
   contributions.forEach((contribution: any) => {
    contribution.task_label.split(',').forEach((label: string) => {
      // Get the AGIX amounts from the distributions for the contribution
      const agixAmount = contribution.distributions.reduce((acc: number, distribution: any) => {
        const agixIndex = distribution.tokens.indexOf('AGIX');
        if (agixIndex !== -1) {
          acc += Number(distribution.amounts[agixIndex]);
        }
        return acc;
      }, 0);
      aggregatedAGIXAmounts[label.trim()] += Number(agixAmount);
    });
  });  
    return aggregatedAGIXAmounts;
  };
  
  export const getAllTokens = (contributions: any[]): string[] => {
    const allTokensSet: Set<string> = new Set();
      contributions.forEach((contribution: any) => {
        contribution.distributions.forEach((distribution: any) => {
          distribution.tokens.forEach((token: string) => {
            allTokensSet.add(token);
          });
        });
      });
    
      const allTokens = Array.from(allTokensSet);
    
      // Ensure AGIX appears first in the tokens array
      allTokens.sort((a, b) => {
        if (a === 'AGIX') return -1;
        if (b === 'AGIX') return 1;
        return a.localeCompare(b); // The natural order for the rest of the tokens
      });
      contributions.forEach((contribution: any) => {
        contribution.tokenAmounts = {};
        allTokens.forEach((token: string) => {
          const amountForThisToken = contribution.distributions.reduce((acc: number, distribution: any) => {
            const tokenIndex = distribution.tokens.indexOf(token);
            if (tokenIndex !== -1) {
              acc += Number(distribution.amounts[tokenIndex]);
            }
            return acc;
          }, 0);
          contribution.tokenAmounts[token] = Number(amountForThisToken);
        });
      });
    return allTokens;
  };
  
  export const calculateTokenTotals = (contributions: any[], allTokens: string[]): { [token: string]: number } => {
      const totals: { [token: string]: number } = {};
      // Initialize the totals object with zeros
      allTokens.forEach(token => {
          totals[token] = 0;
      });
      // Sum the token amounts from each contribution
      contributions.forEach((contribution: any) => {
          allTokens.forEach(token => {
              totals[token] += Number(contribution.tokenAmounts[token]);
          });
      });
    return totals;
  };
  
  export const getAggregatedData = (contributions: any[]): { [key: string]: { AGIX: number; GMBL: number } } => {
    const aggregatedData: { [key: string]: { AGIX: number; GMBL: number } } = {};
      contributions.forEach((contribution: any) => {
        contribution.distributions.forEach((distribution: any) => {
          const contributor_id = distribution.contributor_id;
      
          if (!aggregatedData[contributor_id]) {
            aggregatedData[contributor_id] = { AGIX: 0, GMBL: 0 };
          }
      
          const agixIndex = distribution.tokens.indexOf('AGIX');
          const gmblIndex = distribution.tokens.indexOf('GMBL');
          const agixAmount = agixIndex !== -1 ? Number(distribution.amounts[agixIndex]) : 0;
          const gmblAmount = gmblIndex !== -1 ? Number(distribution.amounts[gmblIndex]) : 0;
      
          aggregatedData[contributor_id].AGIX += Number(agixAmount);
          aggregatedData[contributor_id].GMBL += Number(gmblAmount);
        });
      });
    return aggregatedData;
  };
  
  export const formatFinalChartData = (aggregatedData: { [key: string]: { AGIX: number; GMBL: number } }): any => {
    const finalData: any[] = [];
      const contLabels: string[] = [];
      
      Object.keys(aggregatedData).forEach((contributor_id) => {
        finalData.push({
          x: contributor_id,
          AGIX: aggregatedData[contributor_id].AGIX,
          GMBL: aggregatedData[contributor_id].GMBL,
        });
        contLabels.push(contributor_id);
      });
    return { data: finalData, labels: contLabels };
  };