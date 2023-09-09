import React, { useEffect, useState } from 'react';
import styles from '../styles/Report.module.css';
import { useMyVariable } from '../context/MyVariableContext';
import { getReport } from '../utils/getReport';
import { createCharts } from '../utils/createCharts';
import ChartComponent1 from '../components/charts/ChartComponent1';
import ChartComponent2 from '../components/charts/ChartComponent2';

interface FilteredDataType {
  data: number[];
  labels: string[];
}

const Report = () => {
  const [loading, setLoading] = useState(true);
  const { myVariable, setMyVariable } = useMyVariable();
  const [selectedMonth, setSelectedMonth] = useState('9.2023');
  const [filteredData, setFilteredData] = useState<FilteredDataType | null>(null);
  const [filteredData2, setFilteredData2] = useState<FilteredDataType | null>(null);
  const [uniqueMonths, setUniqueMonths] = useState(['9.2023']);
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
      let { chartData1, chartData2, chartData3, chartData4 }: any = createCharts(myVariable.report, selectedMonth);
      setFilteredData(chartData1);
      setFilteredData2(chartData2);

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
    console.log(filteredData)
}, [selectedMonth, myVariable.report]);

     
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
                <h3>Charts</h3>
                <div className={styles.chart}>
                  <ChartComponent1 chartData={filteredData} />
                </div>
                <div className={styles.chart}>
                  <ChartComponent2 chartData={filteredData2} />
                </div>
              </div>
            )}
            {filteredData && filteredData2 && (
              <div className={styles.chartType2}>
                <h3>Numbers</h3>
                <div className={styles.numbers}>
                  <table>
                    <thead>
                      <tr>
                        <th>Workgroup</th>
                        <th>AGIX</th>
                        <th>Tasks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.data.map((amount, index) => (
                        <tr key={index}>
                          <td>{filteredData.labels[index]}</td>
                          <td>{amount}</td>
                          <td>{filteredData2.data[index]}</td>
                        </tr>
                      ))}
                      {totalReportData && (
                        <tr>
                          <td>Total</td>
                          <td>{totalReportData.totalAGIX}</td>
                          <td>{totalReportData.totalTasks}</td>
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
