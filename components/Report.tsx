import React, { useEffect, useState } from 'react';
import styles from '../styles/Report.module.css';
import { useMyVariable } from '../context/MyVariableContext';
import { getReport } from '../utils/getReport';
import ChartComponent1 from '../components/charts/ChartComponent1';
import ChartComponent2 from '../components/charts/ChartComponent2';

const Report = () => {
  const { myVariable, setMyVariable } = useMyVariable();
  const [reportData, setReportData] = useState(/* Your report data */);
  const [selectedMonth, setSelectedMonth] = useState('All months');
  const [filteredData, setFilteredData] = useState(null);
  const [filteredData2, setFilteredData2] = useState(null);
  const [uniqueMonths, setUniqueMonths] = useState(['All months']);

  async function generateReport() {
      let report: any = await getReport(myVariable.transactions);
      setMyVariable(prevState => ({ ...prevState, report }));
      setUniqueMonths(['All months', ...Array.from(new Set(Object.keys(report)))]);
      console.log("contributions", report);
  }

  useEffect(() => {
      generateReport();
  }, []);

    const projectLabelsData1 = [12, 23, 14];
    const label1 = ["test1", "test2", "test3"];
    const projectLabelsData3 = [32, 13, 34];
    const label3 = ["test1", "test2", "test3"];

    const projectLabelsData2: any = [
        { x: "Project1", created: 20, done: 15, moved: 5, not_moved: 10 },
        { x: "Project2", created: 30, done: 20, moved: 8, not_moved: 12 },
    ];
    const label2 = ['Project 1', 'Project 2'];

    useEffect(() => {
      if (selectedMonth === 'All months') {
        let chartData: any = {}
        let chartData2: any = {}
        chartData['labels'] = label3
        chartData['data'] = projectLabelsData3
        chartData2['labels'] = label2
        chartData2['data'] = projectLabelsData2
          // Prepare data to show charts for all months
          setFilteredData(chartData);
          setFilteredData2(chartData2);
      } else {
        let chartData: any = {}
        let chartData2: any = {}
        chartData['labels'] = label1
        chartData['data'] = projectLabelsData1
        chartData2['labels'] = label2
        chartData2['data'] = projectLabelsData2
          // Prepare data to show charts for all months
          setFilteredData(chartData);
          setFilteredData2(chartData2);
      }
  }, [selectedMonth]);

  return (
    <div className={styles.main}>
        <h2>This is the Report component</h2>
        <p>Content for the report goes here.</p>

        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {uniqueMonths.map((month: any) => <option key={month} value={month}>{month}</option>)}
        </select>

        <div className={styles.chartsContainer}>
            {filteredData && (
                <div className={styles.chartType1}>
                    <h3>Test</h3>
                    <div className={styles.chart1}>
                        <ChartComponent1 chartData={filteredData} />
                    </div>
                </div>
            )}
            {filteredData2 && (
                <div className={styles.chartType2}>
                    <h3>Test</h3>
                    <div className={styles.chart2}>
                        <ChartComponent2 chartData={filteredData2} />
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default Report;
