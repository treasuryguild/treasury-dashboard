import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Report.module.css';
import { useMyVariable } from '../context/MyVariableContext';
import { getReport } from '../utils/getReport';
import { createCharts } from '../utils/createCharts';
import ChartComponent1 from '../components/charts/ChartComponent1';
import ChartComponent2 from '../components/charts/ChartComponent2';
import ChartComponent3 from '../components/charts/ChartComponent3';
import DataTable from '../components/DataTable';
import SpecificWorkgroupComponent from'../components/SpecificWorkgroupComponent';

interface FilteredDataType {
  data: number[];
  labels: string[];
}
interface FilteredDataType2 {
  data: any;
  labels: string[];
}

interface ReportProps {
  query: {
    month?: string;
    workgroup?: string;
  };
}

const Report: React.FC<ReportProps> = ({ query }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { myVariable, setMyVariable } = useMyVariable();
  //const [selectedMonth, setSelectedMonth] = useState('All months');
  const [filteredData, setFilteredData] = useState<FilteredDataType | null>(null);
  const [filteredData2, setFilteredData2] = useState<FilteredDataType | null>(null);
  const [filteredData3, setFilteredData3] = useState<FilteredDataType | null>(null);
  const [filteredData4, setFilteredData4] = useState<FilteredDataType2 | null>(null);
  const [uniqueMonths, setUniqueMonths] = useState(['9.2023']);
  const [excludedTokens, setExcludedTokens] = useState<string[]>(['ADA']);
  const [totalReportData, setTotalReportData] = useState<{totalTasks: number, totalAGIX: number} | null>(null);
  const [workgroups, setWorkgroups] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(query.month || 'All months');
  const [selectedWorkgroup, setSelectedWorkgroup] = useState(query.workgroup || 'all workgroups');


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
      //console.log("chartData1", chartData1)
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
    if (myVariable.report) {
      setWorkgroups(extractWorkgroups(myVariable.report, selectedMonth));
    }
    //console.log(filteredData)
    //console.log("myVariable", myVariable)
}, [selectedMonth, myVariable.report]);

const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const newMonth = e.target.value;
  setSelectedMonth(newMonth);
  
  const updatedQuery = { ...router.query, month: newMonth };
  router.push({ pathname: router.pathname, query: updatedQuery });
}

const handleWorkgroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const newWorkgroup = e.target.value;
  setSelectedWorkgroup(newWorkgroup);
  
  const updatedQuery = { ...router.query, workgroup: newWorkgroup };
  router.push({ pathname: router.pathname, query: updatedQuery });
}


function extractWorkgroups(report: any, month: string): string[] {
  if (month === 'All months') {
    // If "All months" is selected, combine all workgroup names across all months
    const allWorkgroups = Object.values(report).flatMap((monthData: any) => Object.keys(monthData));
    const uniqueWorkgroups = Array.from(new Set(allWorkgroups));  // Remove duplicates

    // Filtering out specific keys and only leaving the workgroup names
    return uniqueWorkgroups.filter(key => key !== 'monthly-budget' && key !== 'total-distribution' && key !== 'not-recorded' && key !== 'IncomingFromReserve');
  }

  const monthData = report[month];
  if (!monthData) return [];

  // Filtering out specific keys and only leaving the workgroup names for a specific month
  return Object.keys(monthData).filter(key => key !== 'monthly-budget' && key !== 'total-distribution' && key !== 'not-recorded' && key !== 'IncomingFromReserve');
}

function getAllKeys(data: any): string[] {
  return Array.from(new Set(data.flatMap(Object.keys)));
}

let allKeys: string[] = [];

if (selectedMonth === 'All months') {
  allKeys = ['AGIX'];  // Replace with any specific keys you want
} else {
  allKeys = filteredData4?.data 
    ? getAllKeys(filteredData4.data).filter((key: any) => !excludedTokens.includes(key)) 
    : [];
}

if (selectedMonth === 'All months') {
  allKeys.push('Monthly Budget');
}
//console.log("filteredData3", filteredData3)
  return (
    <div className={styles.main}>
        <h2>Monthly Data</h2>
        <div className={styles.dropdownContainer}>
          <div className={styles.dropdownbox}>
          <p>Select the date</p>
            <div className={styles.dropdown}>
              <select className={styles.dropdownSelect} value={selectedMonth} onChange={handleMonthChange}>
                {uniqueMonths.map((month: any) => <option key={month} value={month}>{month}</option>)}
              </select>
            </div> 
          </div>
          <div className={styles.dropdownbox}>
            <p>Select the workgroup</p>
            <div className={styles.dropdown}>
            <select className={styles.dropdownSelect} value={selectedWorkgroup} onChange={handleWorkgroupChange}>
              <option value="all workgroups">all workgroups</option>
              {workgroups.map(workgroup => <option key={workgroup} value={workgroup}>{workgroup}</option>)}
            </select>
            </div> 
          </div>
        </div>
        <div className={styles.chartsContainer}>
          {loading ? (
            <p>Loading...</p>  
          ) : selectedWorkgroup === "all workgroups" ? (
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
                  <DataTable 
                    myVariable={myVariable}
                    selectedMonth={selectedMonth}
                    allKeys={allKeys}
                    excludedTokens={excludedTokens}
                    filteredData4={filteredData4}
                  />
                </div>
              )}
            </>
          ) : (
            <SpecificWorkgroupComponent workgroup={selectedWorkgroup} myVariable={myVariable} selectedMonth={selectedMonth}/>
          )}
        </div>
    </div>
  );
};

export default Report;
