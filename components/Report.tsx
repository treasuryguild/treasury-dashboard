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
  const [selectedMonth, setSelectedMonth] = useState('9.2023');
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
      generateReport();
  }, []);

  useEffect(() => {
    if (myVariable.report) {
      let { chartData1, chartData2, chartData3, tokenData }: any = createCharts(myVariable.report, selectedMonth);
      setFilteredData(chartData1);
      setFilteredData2(chartData2);
      setFilteredData3(chartData3);
      setFilteredData4(tokenData);
      console.log("tokenData", tokenData)
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
}, [selectedMonth, myVariable.report]);

function getAllKeys(data: any) {
  return Array.from(new Set(data.flatMap(Object.keys)));
}
const allKeys = filteredData4?.data ? getAllKeys(filteredData4.data).filter((key: any) => !excludedTokens.includes(key)) : [];
     
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
                      <th>Workgroup</th>
                      {allKeys.map((key: any) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                    <tbody>
                      {filteredData4 && filteredData4.data.map((item: any, index: any) => (
                        <tr key={index}>
                          <td>{filteredData4.labels[index]}</td>
                          {allKeys.map((key: any) => (
                            <td key={key}>{item[key] ? parseInt(item[key]) : 0}</td>
                          ))}
                        </tr>
                      ))}
                      <tr>
                      <td>Total</td>
                      {allKeys.map((key: any) => (
                          <td key={key}>
                              {filteredData4?.data.reduce((sum: any, item: any) => sum + (excludedTokens.includes(key) ? 0 : (item[key] || 0)), 0).toFixed(0)}
                          </td>
                      ))}
                    </tr>
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
