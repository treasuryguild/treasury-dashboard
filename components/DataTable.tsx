import React from 'react';
import styles from '../styles/Report.module.css';

interface Props {
    myVariable: any;
    selectedMonth: string;
    allKeys: string[];
    excludedTokens: string[];
    filteredData4: any;
}

const generateTableRows = (report: any) => {
  let runningBalance = 0;
  const rows: any = [];

  // Make sure the months are in descending order
  const months = Object.keys(report).sort(); 

  months.forEach((month) => {
      const monthlyReport = report[month];
      const outgoing = monthlyReport['total-distribution']?.totalAmounts?.AGIX || 0;
      const incoming = (monthlyReport['monthly-budget']?.AGIX || 0) + (monthlyReport['incoming-reserve']?.AGIX || 0);
      runningBalance += (incoming - outgoing);

      const row = (
          <tr key={month}>
              <td>{month}</td>
              <td>{outgoing.toFixed(0)}</td>
              <td>{incoming.toFixed(0)}</td>
              <td>{runningBalance.toFixed(0)}</td>
          </tr>
      );

      rows.unshift(row); // Adds each new row to the top
  });

  return rows;
};


const DataTable: React.FC<Props> = ({ myVariable, selectedMonth, allKeys, excludedTokens, filteredData4 }) => {

    const tableRows = generateTableRows(myVariable.report);

    return (
        <div className={styles.numbers}>
            <table>
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Outgoing</th>
                        <th>Incoming</th>
                        <th>Running Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {tableRows}
                </tbody>
            </table>
        </div>
    );
}

export default DataTable;
