import React from 'react';
import ChartComponent1 from '../components/charts/ChartComponent1'
import ChartComponent5 from '../components/charts/ChartComponent5'
import styles from '../styles/Report.module.css';

interface Props {
  workgroup: string;
  myVariable: any;
  selectedMonth: string;
}

const SpecificWorkgroupComponent: React.FC<Props> = ({ workgroup, myVariable, selectedMonth }) => {

  const formatNumberWithLeadingZero = (num: number): string => {
    return num < 10 ? `0${num}` : `${num}`;
  };

  // Only re-format the selectedMonth if it's not "All months"
  let formattedSelectedMonth = selectedMonth;
  if (selectedMonth !== 'All months') {
    const [rawSelectedMonthNum, selectedYear] = selectedMonth.split('.');
    formattedSelectedMonth = `${formatNumberWithLeadingZero(Number(rawSelectedMonthNum))}.${selectedYear}`;
  }

  const curatedContributions = myVariable.transactions.flatMap((transaction: any) => 
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

   // Extract unique task labels
   const uniqueTaskLabelsSet: Set<string> = new Set();
   curatedContributions.forEach((contribution: any) => {
     contribution.task_label.split(',').forEach((label: string) => {
       uniqueTaskLabelsSet.add(label.trim());
     });
   });
   
   // Convert Set to Array
   const uniqueTaskLabels = Array.from(uniqueTaskLabelsSet);
 
   // Calculate aggregated AGIX amounts for each task label
   const aggregatedAGIXAmounts: { [key: string]: number } = {};
   uniqueTaskLabels.forEach((label: string) => {
     aggregatedAGIXAmounts[label] = 0;
   });
 
   curatedContributions.forEach((contribution: any) => {
    contribution.task_label.split(',').forEach((label: string) => {
      // Get the AGIX amounts from the distributions for the contribution
      const agixAmount = contribution.distributions.reduce((acc: number, distribution: any) => {
        const agixIndex = distribution.tokens.indexOf('AGIX');
        if (agixIndex !== -1) {
          acc += distribution.amounts[agixIndex];
        }
        return acc;
      }, 0);
      aggregatedAGIXAmounts[label.trim()] += agixAmount;
    });
  });  

  const allTokensSet: Set<string> = new Set();
  curatedContributions.forEach((contribution: any) => {
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

  curatedContributions.forEach((contribution: any) => {
    contribution.tokenAmounts = {};
    allTokens.forEach((token: string) => {
      const amountForThisToken = contribution.distributions.reduce((acc: number, distribution: any) => {
        const tokenIndex = distribution.tokens.indexOf(token);
        if (tokenIndex !== -1) {
          acc += distribution.amounts[tokenIndex];
        }
        return acc;
      }, 0);
      contribution.tokenAmounts[token] = amountForThisToken;
    });
  });
 
   // Structure the data in the required format
   const chartData = {
     labels: uniqueTaskLabels,
     data: uniqueTaskLabels.map((label: string) => aggregatedAGIXAmounts[label].toString())
   };
   const calculateTokenTotals = () => {
    const totals: { [token: string]: number } = {};

    // Initialize the totals object with zeros
    allTokens.forEach(token => {
        totals[token] = 0;
    });

    // Sum the token amounts from each contribution
    curatedContributions.forEach((contribution: any) => {
        allTokens.forEach(token => {
            totals[token] += contribution.tokenAmounts[token];
        });
    });

    return totals;
};

const tokenTotals = calculateTokenTotals();

const aggregatedData: { [key: string]: { AGIX: number; GMBL: number } } = {};

curatedContributions.forEach((contribution: any) => {
  contribution.distributions.forEach((distribution: any) => {
    const contributor_id = distribution.contributor_id;

    if (!aggregatedData[contributor_id]) {
      aggregatedData[contributor_id] = { AGIX: 0, GMBL: 0 };
    }

    const agixIndex = distribution.tokens.indexOf('AGIX');
    const gmblIndex = distribution.tokens.indexOf('GMBL');
    const agixAmount = agixIndex !== -1 ? distribution.amounts[agixIndex] : 0;
    const gmblAmount = gmblIndex !== -1 ? distribution.amounts[gmblIndex] : 0;

    aggregatedData[contributor_id].AGIX += agixAmount;
    aggregatedData[contributor_id].GMBL += gmblAmount;
  });
});

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

const chartData2 = {data: finalData, labels: contLabels};

   //console.log("chartData", chartData2)

   return (
    <div>
      <h2>{workgroup} info for {selectedMonth}</h2>
      <h3>Total contributions: {curatedContributions.length}</h3> 
      <div className={styles.workgroupContainer}>
        <div className={styles.workgroupBox}>
          <div className={styles.chart}>
            <ChartComponent1 chartData={chartData} />
            <p>Please note AGIX distribution reflects tasks that can have overlapping labels</p>
          </div>  
          <div className={styles.chart}>
            <ChartComponent5 chartData={chartData2} />
          </div>  
        </div>
        <div className={styles.workgroupBox}>
          <h2>Tasks</h2>
          <table className={styles.workgroupTable}>
            <thead>
              <tr>
                <th>Task Name</th>
                {allTokens.map((token, index) => (
                  <th key={index}>{token}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {curatedContributions.map((contribution: any, index: any) => {
                return (
                  <tr key={index}>
                    <td>{contribution.task_name}</td>
                    {allTokens.map((token, tokenIndex) => (
                      <td key={tokenIndex} style={{textAlign: 'right'}}>{contribution.tokenAmounts[token]}</td>
                    ))}
                  </tr>
                );
              })}
              <tr>
                  <td>Total</td>
                  {allTokens.map((token, tokenIndex) => (
                      <td key={tokenIndex} style={{textAlign: 'right'}}>{tokenTotals[token]}</td>
                  ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SpecificWorkgroupComponent;
