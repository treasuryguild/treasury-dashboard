import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.css';
import { useMyVariable } from '../context/MyVariableContext';
import { getReport } from '../utils/getReport';
import { txDenormalizer } from '../utils/txDenormalizer';
import { runningBalanceTableData } from '../utils/curatedDistributionData';
import { extractDistributionData } from '../utils/extractDistributionData';
import { processDashboardData } from '../utils/processDashboardData';
import { createCharts } from '../utils/createCharts';
import ChartComponent1 from '../components/charts/ChartComponent1';
import ChartComponentX from '../components/charts/ChartComponentX';
import ChartComponentY from '../components/charts/ChartComponentY';
import ChartComponentZ from '../components/charts/ChartComponentZ';
import DynamicTable from './tables/DynamicTable'
import DataTable from '../components/DataTable';
import DataTable2 from '../components/DataTable2';
import SpecificWorkgroupComponent from'../components/SpecificWorkgroupComponent'

interface DashboardProps {
  query: {
    month?: string;
    workgroup?: string;
    token?: string;
    label?: string;
  };
}
interface DistributionItem {
  date: string;
  incoming: number;
  outgoing: number;
  runningBalance: number;
}

interface ProcessedDataType {
  chart1: {
    labels: any[], 
    data: any[]; 
  };
  chart2: {
    labels: any[],
    data: any[]; 
  };
  chart3: {
    labels: any[],
    data: any[]; 
  };
  filteredDistributions: any[]; 
  table1: Record<string, any>; 
  table2: Record<string, any>; 
}

const Dashboard: React.FC<DashboardProps> = ({ query }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { myVariable, setMyVariable } = useMyVariable();
  const [uniqueMonths, setUniqueMonths] = useState(['9.2023']);
  const [uniqueTokens, setUniqueTokens] = useState<string[]>(['ADA']);
  const [uniqueLabels, setUniqueLabels] = useState<string[]>(['All labels']);
  const [workgroups, setWorkgroups] = useState<string[]>([]);
  const [runningBalanceTab, setRunningBalanceTab] = useState<DistributionItem[]>([]);
  const [testTable, setTestTable] = useState<DistributionItem[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>(query.month ? query.month.split(',') : []);
  const [selectedWorkgroups, setSelectedWorkgroups] = useState<string[]>(query.workgroup ? query.workgroup.split(',') : []);
  const [selectedTokens, setSelectedTokens] = useState<string[]>(query.token ? query.token.split(',') : []);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(query.label ? query.label.split(',') : []);
  const [processedData, setProcessedData] = useState<ProcessedDataType>({
    chart1: { labels: [], data: [] },
    chart2: { labels: [], data: [] },
    chart3: { labels: [], data: [] },
    filteredDistributions: [],
    table1: {},
    table2: {}
  });

  async function generateReport() {
      let report: any = await getReport(myVariable.transactions);
      let distributionsArray: any = await txDenormalizer(myVariable.transactions);
      let distData: any = extractDistributionData(distributionsArray);
      setUniqueMonths(['All months', ...distData.months]);
      setWorkgroups(['All workgroups', ...distData.workgroups])
      setUniqueTokens(['All tokens', ...distData.tokens])
      setUniqueLabels(['All labels', ...distData.labels])
      let table: any = runningBalanceTableData(distributionsArray);
      setRunningBalanceTab(table);
      setTestTable(table);
      setMyVariable(prevState => ({ ...prevState, report }));
      console.log("report2", distributionsArray, myVariable, table, distData)
  }

  useEffect(() => {
    if (myVariable.transactions) {
      generateReport();
    }     
  }, []);

  useEffect(() => {
    if (myVariable.report && Object.keys(myVariable.report).length > 0) {
        console.log("Loading")
        //setWorkgroups(extractWorkgroups(myVariable.report, 'All months'));
      setLoading(false);
    }
}, [myVariable.report]);

useEffect(() => {
  // Function to set the initial state based on URL parameters
  const initializeStateFromQuery = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const months = urlParams.get('months')?.split(',').map(decodeURIComponent) || [];
    const workgroups = urlParams.get('workgroups')?.split(',').map(decodeURIComponent) || [];
    const tokens = urlParams.get('tokens')?.split(',').map(decodeURIComponent) || [];
    const labels = urlParams.get('labels')?.split(',').map(decodeURIComponent) || [];

    // Update state based on URL parameters
    setSelectedMonths(months.length > 0 ? months : ['All months']);
    setSelectedWorkgroups(workgroups.length > 0 ? workgroups : ['All workgroups']);
    setSelectedTokens(tokens.length > 0 ? tokens : ['All tokens']);
    setSelectedLabels(labels.length > 0 ? labels : ['All labels']);

    setLoading(false); // Set loading to false after initialization
  };

  // Call the function
  if (router.isReady) {
    initializeStateFromQuery();
  }
}, [router.query, router.isReady]);

const selectItem = (item: any, allItem: any, selectedItem: any, setSelectedItem: Function, queryKey: any) => {
  let updatedItems: any;
  if (item === allItem) {
    updatedItems = [allItem];
  } else {
    updatedItems = selectedItem.includes(item)
      ? selectedItem.filter((i: any) => i !== item)
      : [...selectedItem.filter((i: any) => i !== allItem), item];
  }
  // Update state and then update the URL
  setSelectedItem(updatedItems);
  updateUrlParam(queryKey, updatedItems);
};

const updateUrlParam = (key: any, values: any) => {
  const newQuery = { ...router.query };
  if (values.length === 0 || values.includes(`All ${key}`)) {
    newQuery[key] = `All ${key}`; 
  } else {
    newQuery[key] = values.join(','); 
  }
  router.push({
    pathname: router.pathname,
    query: newQuery,
  }, undefined, { shallow: true });
}
const handleMonthChange = (months: any) => {
  selectItem(months, 'All months', selectedMonths, setSelectedMonths, 'months');
};

const handleWorkgroupChange = (workgroup: any) => {
  selectItem(workgroup, 'All workgroups', selectedWorkgroups, setSelectedWorkgroups, 'workgroups');
};

const handleTokenChange = (tokens: any) => {
  selectItem(tokens, 'All tokens', selectedTokens, setSelectedTokens, 'tokens');
};

const handleLabelChange = (labels: any) => {
  selectItem(labels, 'All labels', selectedLabels, setSelectedLabels, 'labels');
};

const processData = async () => {
  const distArr = await txDenormalizer(myVariable.transactions)
  const data: any = processDashboardData(selectedMonths, selectedWorkgroups, selectedTokens, selectedLabels, distArr);
  setProcessedData(data);
  console.log("processedData", processedData)
};

// Call processData when selected values change
useEffect(() => {
  if (myVariable.transactions) {processData();}
}, [selectedMonths, selectedWorkgroups, selectedTokens, selectedLabels]);

  return (
    <div className={styles['flex-column']}>
    <h2>Monthly Data</h2> 
    <div className={styles['flex-row']}>
      {uniqueMonths && uniqueMonths.map((month: string) => (
        <button 
          key={month} 
          onClick={() => handleMonthChange(month)}
          className={selectedMonths.includes(month) ? styles.selected : ''}
        >
          {month}
        </button>
      ))}
    </div>
    <div className={styles['flex-row']}>
      {uniqueTokens && uniqueTokens.map((token: string) => (
        <button 
          key={token} 
          onClick={() => handleTokenChange(token)}
          className={selectedTokens.includes(token) ? styles.selected : ''}
        >
          {token}
        </button>
      ))}
    </div>
    <div className={styles['flex-row']}>
      {uniqueLabels && uniqueLabels.map((label: string) => (
        <button 
          key={label} 
          onClick={() => handleLabelChange(label)}
          className={selectedLabels.includes(label) ? styles.selected : ''}
        >
          {label}
        </button>
      ))}
    </div>
    <div className={styles['components-conatiner']}>
      {/* Workgroup Buttons */}
      <div className={styles['flex-column']}>
        {workgroups && workgroups.map((workgroup: string) => (
          <button 
            key={workgroup} 
            onClick={() => handleWorkgroupChange(workgroup)}
            className={selectedWorkgroups.includes(workgroup) ? styles.selected : ''}
          >
            {workgroup}
          </button>
        ))}
      </div>
      <div className={styles['flex-column']}>
        <div className={styles['chartX']}>
          {processedData.chart2 && processedData.chart2.data[0]?.x && (<ChartComponentX chartData={processedData.chart2} />)}
        </div>
        <div className={styles['chartX']}>
          {processedData.chart2.labels.length > 1 && !processedData.chart2.data[0].x && (<ChartComponent1 chartData={processedData.chart2} />)}
          {processedData.chart2 && processedData.chart2.data[0]?.x && (<ChartComponentY chartData={processedData.chart2} />)}
        </div>
        <div className={styles['chartX']}>
          {processedData.chart3 && processedData.chart3.data[0]?.x && (<ChartComponentZ chartData={processedData.chart3} />)}
        </div>
      </div>
      <div className={styles['flex-column']}>
        {/* tables */}
      </div>
    </div>  
  </div>
  );
};

export default Dashboard;
