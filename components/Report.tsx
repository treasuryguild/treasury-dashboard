import React, { useEffect, useState } from 'react';
import styles from '../styles/Report.module.css';
import { useMyVariable } from '../context/MyVariableContext';
import { getReport } from '../utils/getReport';
import { createCharts } from '../utils/createCharts';
import ChartComponent1 from '../components/charts/ChartComponent1';
import ChartComponent2 from '../components/charts/ChartComponent2';

const Report = () => {
  const [loading, setLoading] = useState(true);
  const { myVariable, setMyVariable } = useMyVariable();
  const [selectedMonth, setSelectedMonth] = useState('9.2023');
  const [filteredData, setFilteredData] = useState(null);
  const [filteredData2, setFilteredData2] = useState(null);
  const [uniqueMonths, setUniqueMonths] = useState(['9.2023']);

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
          setLoading(false);
        }
      }, [selectedMonth, myVariable.report]);
     
  return (
    <div className={styles.main}>
        <h2>This is the Report component</h2>
        <p>Content for the report goes here.</p>

        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {uniqueMonths.map((month: any) => <option key={month} value={month}>{month}</option>)}
        </select>

        <div className={styles.chartsContainer}>
        {loading ? (
          <p>Loading...</p>  
        ) : (
          <>
            {filteredData && (
              <div className={styles.chartType1}>
                <h3>Test</h3>
                <div className={styles.chart}>
                  <ChartComponent1 chartData={filteredData} />
                </div>
              </div>
            )}
            {filteredData2 && (
              <div className={styles.chartType2}>
                <h3>Test</h3>
                <div className={styles.chart}>
                  <ChartComponent2 chartData={filteredData2} />
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
