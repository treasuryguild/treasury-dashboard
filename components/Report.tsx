import React, { useEffect, useState } from 'react';
import styles from '../styles/Report.module.css';
import { useMyVariable } from '../context/MyVariableContext';
import { getReport } from '../utils/getReport';
import { createCharts } from '../utils/createCharts';
import ChartComponent1 from '../components/charts/ChartComponent1';
import ChartComponent2 from '../components/charts/ChartComponent2';
import ChartComponent3 from '../components/charts/ChartComponent3';

interface FilteredDataType {
  data: number[];
  labels: string[];
}
interface FilteredDataType2 {
  data: any;
  labels: string[];
}

const Report = () => {
  const [loading, setLoading] = useState(true);
  const { myVariable, setMyVariable } = useMyVariable();
  const [selectedMonth, setSelectedMonth] = useState('All months');
  const [filteredData, setFilteredData] = useState<FilteredDataType | null>(null);
  const [filteredData2, setFilteredData2] = useState<FilteredDataType | null>(null);
  const [filteredData3, setFilteredData3] = useState<FilteredDataType | null>(null);
  const [filteredData4, setFilteredData4] = useState<FilteredDataType2 | null>(null);
  const [uniqueMonths, setUniqueMonths] = useState(['9.2023']);
  const [excludedTokens, setExcludedTokens] = useState<string[]>(['ADA']);
  const [totalReportData, setTotalReportData] = useState<{totalTasks: number, totalAGIX: number} | null>(null);

  async function generateReport() {
      let report: any = await getReport(myVariable.transactions);
      setMyVariable(prevState => ({ ...prevState, report }));
      setUniqueMonths(['All months', ...Array.from(new Set(Object.keys(report)))]);
  }

  useEffect(() => {
    if (myVariable.transactions) {
      generateReport();
    }     
  }, []);

  useEffect(() => {
    if (myVariable.report && Object.keys(myVariable.report).length > 0) {
      let { chartData1, chartData2, chartData3, tokenData }: any = createCharts(myVariable.report, selectedMonth);
      setFilteredData(chartData1);
      setFilteredData2(chartData2);
      setFilteredData3(chartData3);
      setFilteredData4(tokenData);
      //console.log("tokenData", tokenData)
      const selectedMonthReport = myVariable.report[selectedMonth];
      if (selectedMonthReport) {
        const totalTasks = selectedMonthReport['total-distribution'].totalTasks || 0;
        const totalAGIX = selectedMonthReport['total-distribution'].totalAmounts?.AGIX || 0;
        setTotalReportData({ totalTasks, totalAGIX });
      } else {
        setTotalReportData(null);
      }

      setLoading(false);
    }
    //console.log(filteredData)
    //console.log("myVariable", myVariable)
}, [selectedMonth, myVariable.report]);

function getAllKeys(data: any) {
  return Array.from(new Set(data.flatMap(Object.keys)));
}
const allKeys = filteredData4?.data ? getAllKeys(filteredData4.data).filter((key: any) => !excludedTokens.includes(key)) : [];

if (selectedMonth === 'All months') {
  allKeys.push('Monthly Budget');
}

  return (
    <div className={styles.main}>
        <h2>Monthly Data</h2>
        <p>Select the date</p>
        <div className={styles.dropdown}>
          <select className={styles.dropdownSelect} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {uniqueMonths.map((month: any) => <option key={month} value={month}>{month}</option>)}
          </select>
        </div> 
        <div className={styles.chartsContainer}>
        {loading ? (
          <p>Loading...</p>  
        ) : (
          <>
            {filteredData && filteredData2 && (
              <div className={styles.chartType1}>
                <div className={styles.chart}>
                  <ChartComponent1 chartData={filteredData} />
                </div>
                <div className={styles.chart}>
                  <ChartComponent3 chartData={filteredData3} />
                </div>
              </div>
            )}
            {filteredData && filteredData2 && (
              <div className={styles.chartType2}>
                <h2>Numbers</h2>
                <div className={styles.numbers}>
                  <table>
                  <thead>
                    <tr>
                      {selectedMonth != 'All months' && (<th>Workgroup</th>)}
                      {selectedMonth == 'All months' && (<th>Month</th>)}
                      {allKeys.map((key: any) => (
                        <th key={key}>{key}</th>
                      ))}
                      {selectedMonth === 'All months' && (<th>Balance</th>)}
                    </tr>
                  </thead>
                    <tbody>
                    {filteredData4 && filteredData4.data.map((item: any, index: any) => (
                        <tr key={index}>
                          <td>{filteredData4.labels[index]}</td>
                          {allKeys.map((key: any) => (
                            <td key={key}>
                              {key === 'Monthly Budget' ?
                                myVariable.report[filteredData4.labels[index]]?.['monthly-budget']?.AGIX.toFixed(0) || 'N/A'
                              : item[key] ? parseInt(item[key]) : 0
                              }
                            </td>
                          ))}
                          {selectedMonth === 'All months' && (
                            <td>
                              {((myVariable.report[filteredData4.labels[index]]?.['monthly-budget']?.AGIX || 0) - (item.AGIX || 0)).toFixed(2)}
                            </td>
                          )}
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
                                return acc + ((report['monthly-budget']?.AGIX) || 0);  // Added optional chaining here
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Report;
