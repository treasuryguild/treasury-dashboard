import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.css';
import { useMyVariable } from '../context/MyVariableContext';
import { getReport } from '../utils/getReport';
import { txDenormalizer } from '../utils/txDenormalizer';
import { runningBalanceTableData } from '../utils/curatedDistributionData'
import { createCharts } from '../utils/createCharts';
import ChartComponent1 from '../components/charts/ChartComponent1';
import ChartComponent2 from '../components/charts/ChartComponent2';
import ChartComponent3 from '../components/charts/ChartComponent3';
import DynamicTable from './tables/DynamicTable'
import DataTable from '../components/DataTable';
import DataTable2 from '../components/DataTable2';
import SpecificWorkgroupComponent from'../components/SpecificWorkgroupComponent'

interface ReportProps {
  query: {
    month?: string;
    workgroup?: string;
  };
}
interface DistributionItem {
  date: string;
  incoming: number;
  outgoing: number;
  runningBalance: number;
}

const Dashboard: React.FC<ReportProps> = ({ query }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { myVariable, setMyVariable } = useMyVariable();
  const [uniqueMonths, setUniqueMonths] = useState(['9.2023']);
  const [excludedTokens, setExcludedTokens] = useState<string[]>(['ADA']);
  const [workgroups, setWorkgroups] = useState<string[]>([]);
  const [runningBalanceTab, setRunningBalanceTab] = useState<DistributionItem[]>([]);
  const [testTable, setTestTable] = useState<DistributionItem[]>([]);
  const [selectedMonths, setSelectedMonths] = useState(query.month || 'All months');
  const [selectedWorkgroup, setSelectedWorkgroup] = useState(query.workgroup || 'all workgroups');


  async function generateReport() {
      let report: any = await getReport(myVariable.transactions);
      let distributionsArray: any = await txDenormalizer(myVariable.transactions);
      let table: any = runningBalanceTableData(distributionsArray);
      setRunningBalanceTab(table);
      setTestTable(table);
      setMyVariable(prevState => ({ ...prevState, report }));
      setUniqueMonths(['All months', ...Array.from(new Set(Object.keys(report))).sort((a, b) => b.localeCompare(a))]);
      console.log("report2", distributionsArray, myVariable, table)
  }

  useEffect(() => {
    if (myVariable.transactions) {
      generateReport();
    }     
  }, []);

  useEffect(() => {
    if (myVariable.report && Object.keys(myVariable.report).length > 0) {
        console.log("Loading")
      setLoading(false);
    }

}, [selectedMonths, myVariable.report]);

const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const newMonths = e.target.value;
  setSelectedMonths(newMonths);
  
  const updatedQuery = { ...router.query, month: newMonths };
  router.push({ pathname: router.pathname, query: updatedQuery });
}

const handleWorkgroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const newWorkgroup = e.target.value;
  setSelectedWorkgroup(newWorkgroup);
  
  const updatedQuery = { ...router.query, workgroup: newWorkgroup };
  router.push({ pathname: router.pathname, query: updatedQuery });
}


  return (
    <div className={styles['flex-column']}>
        <h2>Monthly Data</h2> 
        <div className={styles['flex-row']}>
            buttons
        </div>
        <div className={styles['components-conatiner']}>
            <div>
                buttons
            </div>
            <div>
                charts
            </div>
            <div>
                tables
            </div>
        </div>  
    </div>
  );
};

export default Dashboard;
