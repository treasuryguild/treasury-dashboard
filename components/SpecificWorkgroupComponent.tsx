import React from 'react';
import ChartComponent1 from '../components/charts/ChartComponent1'
import ChartComponent5 from '../components/charts/ChartComponent5'
import styles from '../styles/Report.module.css';
import {
  formatNumberWithLeadingZero,
  getFormattedSelectedMonth,
  filterContributionsByWorkgroupAndMonth,
  getUniqueTaskLabels,
  getAggregatedAGIXAmounts,
  getAllTokens,
  calculateTokenTotals,
  getAggregatedData,
  formatFinalChartData
} from '../utils/specWorkgroupCompUtils';

interface Props {
  workgroup: string;
  myVariable: any;
  selectedMonth: string;
}

const SpecificWorkgroupComponent: React.FC<Props> = ({ workgroup, myVariable, selectedMonth }) => {

  const formattedSelectedMonth = getFormattedSelectedMonth(selectedMonth);
  const curatedContributions = filterContributionsByWorkgroupAndMonth(myVariable.transactions, workgroup, formattedSelectedMonth);
  const uniqueTaskLabels = getUniqueTaskLabels(curatedContributions);
  const aggregatedAGIXAmounts = getAggregatedAGIXAmounts(curatedContributions, uniqueTaskLabels);
  const allTokens = getAllTokens(curatedContributions);
  const tokenTotals = calculateTokenTotals(curatedContributions, allTokens);
  const aggregatedData = getAggregatedData(curatedContributions);
  const chartData2 = formatFinalChartData(aggregatedData); 
 
   // Structure the data in the required format
   const chartData = {
     labels: uniqueTaskLabels,
     data: uniqueTaskLabels.map((label: string) => aggregatedAGIXAmounts[label].toString())
   };

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
