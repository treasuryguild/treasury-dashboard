import React from 'react';
import styles from '../styles/Report.module.css';

interface Props {
    myVariable: any;
    selectedMonth: string;
    allKeys: string[];
    excludedTokens: string[];
    filteredData4: any;
}

const DataTable2: React.FC<Props> = ({ myVariable, selectedMonth, allKeys, excludedTokens, filteredData4 }) => {
  const totalBalance = filteredData4 ? filteredData4.data.reduce((acc: any, item: any, index: any) => {
    return acc + ((myVariable.report[filteredData4.labels[index]]?.['monthly-budget']?.AGIX || 0) - (item.AGIX || 0));
  }, 0) : 0;
  //console.log("filteredData4", filteredData4)
    return (
        <div className={styles.numbers}>
            <table>
                <thead>
                    <tr>
                        {selectedMonth !== 'All months' && (<th>Workgroup</th>)}
                        {selectedMonth === 'All months' && (<th>Month</th>)}
                        {allKeys.map((key: any) => (
                            <th key={key}>{key}</th>
                        ))}
                        {selectedMonth === 'All months' && (<th>MB Balance</th>)}
                        {selectedMonth === 'All months' && (<th>Incoming Reserve</th> )}
                    </tr>
                </thead>
                <tbody>
                    {filteredData4 && filteredData4.data.map((item: any, index: any) => (
                        <tr key={index}>
                          <td>{filteredData4.labels[index]}</td>
                          {allKeys.map((key: any) => (
                            <td key={key}>
                              {key === 'Monthly Budget' ?
                                myVariable.report[filteredData4.labels[index]]?.['monthly-budget']?.AGIX.toFixed(0) || '0'
                              : item[key] ? parseInt(item[key]) : 0
                              }
                            </td>
                          ))}
                          {selectedMonth === 'All months' && (
                            <td>
                              {((myVariable.report[filteredData4.labels[index]]?.['monthly-budget']?.AGIX || 0) - (item.AGIX || 0)).toFixed(2)}
                            </td>
                          )}
                          {selectedMonth === 'All months' && (<td> 
                            {myVariable.report[filteredData4.labels[index]]?.['incoming-reserve']?.AGIX?.toFixed(0) || '0'}
                          </td>)}
                        </tr>
                      ))}
                      <tr>
                        <td>Total</td>
                        {allKeys.map((key: any) => {
                          if (key === 'Monthly Budget' && selectedMonth === 'All months') {
                            const totalMonthlyBudgets: any = Object.values(myVariable.report).reduce((acc: any, report: any) => {
                              return acc + (report['monthly-budget']?.AGIX || 0);
                            }, 0);
                            return <td key={key}>{totalMonthlyBudgets.toFixed(0)}</td>;
                          } else {
                            return (
                              <td key={key}>
                                {filteredData4?.data.reduce((sum: any, item: any) => sum + (excludedTokens.includes(key) ? 0 : (item[key] || 0)), 0).toFixed(0)}
                              </td>
                            );
                          }
                        })}
                        {selectedMonth === 'All months' && (
                          <td>{totalBalance.toFixed(2)}</td>
                        )}
                        {selectedMonth === 'All months' && (<td>
                          {Object.values(myVariable.report as Record<string, any>).reduce((acc: any, report: any) => {
                            return acc + (report['incoming-reserve']?.AGIX || 0);
                          }, 0).toFixed(0)}
                        </td>)}
                      </tr>
                      {selectedMonth != 'All months' && (
                        <tr>
                          <td>Monthly Budget</td>
                          {allKeys.map((key: any) => (
                            <td key={key}>
                              {key === 'AGIX' ? 
                                myVariable.report[selectedMonth]['monthly-budget'].AGIX.toFixed(0) 
                                : 'N/A'}
                            </td>
                          ))}
                        </tr>
                      )}
                      {selectedMonth != 'All months' && (<tr>
                        <td>Balance</td>
                        {allKeys.map((key: any) => (
                          <td key={key}>
                            {key === 'AGIX' ? 
                              (myVariable.report[selectedMonth]['monthly-budget'].AGIX -
                              filteredData4?.data.reduce((sum: any, item: any) => sum + (excludedTokens.includes(key) ? 0 : (item[key] || 0)), 0)).toFixed(0) 
                              : 'N/A'}
                          </td>
                        ))}
                      </tr>)}
                      {selectedMonth === 'All months' && (
                        <tr>
                          <td>Balance</td>
                          {allKeys.map((key: any) => {
                            if (key === 'AGIX') {
                              const totalBudget: any = Object.values(myVariable.report).reduce((acc: any, report: any) => {
                                return acc + ((report['monthly-budget']?.AGIX) || 0) + ((report['incoming-reserve']?.AGIX) || 0);  // Added optional chaining here
                              }, 0);
                              const totalExpenses = filteredData4?.data.reduce((sum: any, item: any) => sum + (item.AGIX || 0), 0) || 0;
                              return <td key={key}>{(totalBudget - totalExpenses).toFixed(0)}</td>;
                            } else {
                              return <td key={key}>N/A</td>;
                            }
                          })}
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default DataTable2;
