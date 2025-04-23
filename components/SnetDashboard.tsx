// ../components/SnetDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.css';
import { useMyVariable } from '../context/MyVariableContext';
import { getReport } from '../utils/getReport';
import { txDenormalizer } from '../utils/txDenormalizer';
import { runningBalanceTableData } from '../utils/curatedDistributionData';
import { extractDistributionData } from '../utils/extractDistributionData';
import { processDashboardData } from '../utils/processSnetDashboardData';
import { createCharts } from '../utils/createCharts';
import ChartComponent1 from '../components/charts/ChartComponent1';
import ChartComponent2 from '../components/charts/ChartComponent2';
import ChartComponent4 from '../components/charts/ChartComponent4';
import ChartComponentX from '../components/charts/ChartComponentX';
import ChartComponentY from '../components/charts/ChartComponentY';
import ChartComponentZ from '../components/charts/ChartComponentZ';
import ChartComponentC from '../components/charts/ChartComponentC';
import DynamicTable from './tables/DynamicTable'
import WorkgroupBalances from '../components/WorkgroupBalances';
import DataTable from '../components/DataTable';
import DataTable2 from '../components/DataTable2';
import SpecificWorkgroupComponent from '../components/SpecificWorkgroupComponent'
import IncomingTransactionsTable from '../components/IncomingTransactionsTable';

interface SnetDashboardProps {
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
  chart4: {
    labels: any[],
    data: any[];
  };
  filteredDistributions: any[];
  monthlyTotals: {
    totalMonthly: Record<string, Record<string, number>>;
    workgroupMonthly: Record<string, Record<string, Record<string, number>>>;
  };
  table1: any[];
  table2: any[];
  table3: any[];
}

interface WorkgroupBudget {
  sub_group: string;
  sub_group_data: {
    budgets: Record<string, Record<string, {
      initial: { AGIX: number };
      final: { AGIX: number };
      reallocations: {
        incoming: { AGIX: number };
        outgoing: { AGIX: number };
      };
    }>>;
  };
}

const SnetDashboard: React.FC<SnetDashboardProps> = ({ query }) => {
  const router = useRouter();
  const { groupName, projectName } = router.query;
  const [loading, setLoading] = useState(true);
  const { myVariable, setMyVariable } = useMyVariable();
  const [uniqueMonths, setUniqueMonths] = useState(['9.2023']);
  const [uniqueTokens, setUniqueTokens] = useState<string[]>(['ADA']);
  const [uniqueLabels, setUniqueLabels] = useState<string[]>(['All labels']);
  const [workgroups, setWorkgroups] = useState<string[]>([]);
  const [workgroupsBudgets, setWorkgroupsBudgets] = useState<WorkgroupBudget[]>([]);
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
    chart4: { labels: [], data: [] },
    filteredDistributions: [],
    monthlyTotals: {
      totalMonthly: {},
      workgroupMonthly: {}
    },
    table1: [],
    table2: [],
    table3: []
  });
  const [hoverStatus, setHoverStatus] = useState({
    months: false,
    tokens: false,
    workgroups: false,
    labels: false,
    quarters: false,
    quarterFilters: false
  });
  const [currentQuarterBalance, setCurrentQuarterBalance] = useState(0);
  const [previousQuarterBalance, setPreviousQuarterBalance] = useState(0);
  const [allDistributions, setAllDistributions] = useState<any[]>([]);
  const [uniqueQuarters, setUniqueQuarters] = useState<string[]>([]);
  const [selectedQuarters, setSelectedQuarters] = useState<string[]>(["All quarters"]);
  const [selectedQuarterFilters, setSelectedQuarterFilters] = useState<string[]>(["No Quarters"]);

  const handleHover = (box: string, status: boolean) => {
    setHoverStatus(prev => ({ ...prev, [box]: status }));
  };

  async function postWorkgroupsToSubgroups(workgroups: string[], projectId: string) {
    //console.log('Posting workgroups to subgroups table', workgroups);
    const response = await fetch('/api/setSubgroups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputSubGroups: workgroups,
        project_id: projectId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to post workgroups to subgroups table');
    }
  }

  async function getWorkgroups(projectId: string) {
    try {
      const response = await fetch('/api/getSubgroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workgroups from subgroups table');
      }

      const data = await response.json();
      //console.log('Raw data from getSubgroups:', data);

      if (data && Array.isArray(data.workgroups)) {
        //console.log('Processing workgroups array');
        const processedData = data.workgroups.map((item: any) => {
          //console.log('Processing item:', item);
          return {
            ...item,
            sub_group_data: typeof item.sub_group_data === 'string'
              ? JSON.parse(item.sub_group_data)
              : item.sub_group_data
          };
        });
        //console.log('Processed data:', processedData);
        return processedData;
      } else {
        console.error('Unexpected data format from getSubgroups:', data);
        return [];
      }
    } catch (error) {
      console.error('Error in getWorkgroups:', error);
      return [];
    }
  }

  async function generateReport() {
    try {
      let report: any = await getReport(myVariable.transactions);
      let distributionsArray: any = await txDenormalizer(myVariable.transactions);
      setAllDistributions(distributionsArray);
      let distData: any = extractDistributionData(distributionsArray);
      //console.log("distData", distData)
      // Sort the months in descending order
      const sortedMonths = distData.months.sort((a: any, b: any) => {
        const [monthA, yearA] = a.split('.').map(Number);
        const [monthB, yearB] = b.split('.').map(Number);

        if (yearA !== yearB) {
          return yearB - yearA; // Descending order of year
        }
        return monthB - monthA; // Descending order of month
      });

      setUniqueMonths(['All months', ...sortedMonths]);
      setWorkgroups(['All workgroups', ...distData.workgroups.sort((a: string, b: string) => a.localeCompare(b))])
      setUniqueTokens(['All tokens', ...distData.tokens])
      setUniqueLabels(['All labels', ...distData.labels])

      setMyVariable(prevState => ({ ...prevState, report }));

      if (distributionsArray && distributionsArray.length > 0) {
        calculateQuarterBalances(distributionsArray);
      }

      // Post workgroups to subgroups table
      //console.log('Posting workgroups to subgroups table');
      await postWorkgroupsToSubgroups(distData.workgroups, myVariable.projectInfo.project_id);

      //console.log('Fetching subgroups');
      const subgroups = await getWorkgroups(myVariable.projectInfo.project_id);
      //console.log('Fetched subgroups:', subgroups);

      if (Array.isArray(subgroups) && subgroups.length > 0) {
        //console.log('Setting workgroupsBudgets');
        setWorkgroupsBudgets(subgroups);
        //console.log('workgroupsBudgets set to:', subgroups);
      } else {
        console.warn('No subgroups data returned or empty array');
      }
    } catch (error) {
      console.error('Error in generateReport:', error);
    }
  }

  useEffect(() => {
    if (myVariable.transactions) {
      generateReport();
    }
  }, []);

  useEffect(() => {
    if (myVariable.report && Object.keys(myVariable.report).length > 0) {
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
      if (projectName === "Singularity Net Ambassador Wallet") {
        setSelectedTokens(tokens.length > 0 ? tokens : ['AGIX']);
      } else {
        setSelectedTokens(tokens.length > 0 ? tokens : ['All tokens']);
      }
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

  const updateUrlParam = (key: string, values: string | string[]) => {
    const newQuery = { ...router.query };
    if (Array.isArray(values)) {
      if (values.length === 0 || values.includes(`All ${key}`)) {
        newQuery[key] = `All ${key}`;
      } else {
        newQuery[key] = values.join(',');
      }
    } else {
      newQuery[key] = values;
    }
    router.push({
      pathname: router.pathname,
      query: newQuery,
    }, undefined, { shallow: true });
  };

  const generateQuarters = (months: string[]) => {
    const quarters = new Set<string>();
    months.forEach(month => {
      if (month !== 'All months') {
        const [m, y] = month.split('.');
        const quarterNum = Math.ceil(parseInt(m) / 3);
        quarters.add(`Q${quarterNum} ${y}`);
      }
    });
    return Array.from(quarters).sort((a, b) => {
      const [aq, ay] = a.split(' ');
      const [bq, by] = b.split(' ');
      return parseInt(by) - parseInt(ay) || b.localeCompare(a);
    });
  };

  const getQuarterMonths = (quarter: string): string[] => {
    const [q, year] = quarter.split(' ');
    const quarterNum = parseInt(q.slice(1));
    const startMonth = (quarterNum - 1) * 3 + 1;
    return [
      `${startMonth.toString().padStart(2, '0')}.${year}`,
      `${(startMonth + 1).toString().padStart(2, '0')}.${year}`,
      `${(startMonth + 2).toString().padStart(2, '0')}.${year}`
    ].filter(month => uniqueMonths.includes(month));
  };

  const handleQuarterChange = (quarter: string) => {
    let updatedQuarters: string[];
    let updatedMonths: string[];

    if (quarter === "All quarters") {
      updatedQuarters = ["All quarters"];
      updatedMonths = ["All months"];
    } else {
      if (selectedQuarters.includes(quarter)) {
        // Remove the quarter if it's already selected
        updatedQuarters = selectedQuarters.filter(q => q !== quarter);
        if (updatedQuarters.length === 0) {
          updatedQuarters = ["All quarters"];
          updatedMonths = ["All months"];
        } else {
          // Get months for remaining selected quarters
          updatedMonths = updatedQuarters
            .filter(q => q !== "All quarters")
            .flatMap(q => getQuarterMonths(q));
        }
      } else {
        // Add the new quarter
        updatedQuarters = [...selectedQuarters.filter(q => q !== "All quarters"), quarter];
        // Get months for all selected quarters
        updatedMonths = updatedQuarters.flatMap(q => getQuarterMonths(q));
      }
    }

    setSelectedQuarters(updatedQuarters);
    setSelectedMonths(updatedMonths);
    updateUrlParam('months', updatedMonths);
  };

  useEffect(() => {
    if (uniqueMonths.length > 1) {
      const quarters = generateQuarters(uniqueMonths);
      setUniqueQuarters(['All quarters', ...quarters]);
    }
  }, [uniqueMonths]);

  useEffect(() => {
    if (selectedMonths.length > 0 && selectedMonths[0] !== 'All months') {
      const selectedQuartersSet = new Set(selectedMonths.map(month => {
        const [m, y] = month.split('.');
        const quarterNum = Math.ceil(parseInt(m) / 3);
        return `Q${quarterNum} ${y}`;
      }));

      const quartersArray = Array.from(selectedQuartersSet);
      if (quartersArray.length === 0) {
        setSelectedQuarters(["All quarters"]);
      } else {
        setSelectedQuarters(quartersArray);
      }
    } else {
      setSelectedQuarters(["All quarters"]);
    }
  }, [selectedMonths]);

  const handleMonthChange = (month: string) => {
    let updatedMonths: string[];
    if (month === 'All months') {
      updatedMonths = ['All months'];
      setSelectedQuarters(["All quarters"]);
    } else {
      if (selectedMonths.includes(month)) {
        updatedMonths = selectedMonths.filter(m => m !== month);
        if (updatedMonths.length === 0) {
          updatedMonths = ['All months'];
        }
      } else {
        updatedMonths = [...selectedMonths.filter(m => m !== 'All months'), month];
      }
    }
    setSelectedMonths(updatedMonths);
    updateUrlParam('months', updatedMonths);
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

  const handleQuarterFilterChange = (quarter: string) => {
    let updatedFilters: string[];
    if (quarter === "No Quarters") {
      updatedFilters = ["No Quarters"];
    } else if (quarter === "All quarters") {
      updatedFilters = uniqueQuarters.filter(q => q !== "All quarters");
    } else {
      if (selectedQuarterFilters.includes(quarter)) {
        updatedFilters = selectedQuarterFilters.filter(q => q !== quarter);
      } else {
        updatedFilters = [...selectedQuarterFilters.filter(q => q !== "No Quarters"), quarter];
      }

      if (updatedFilters.length === 0) {
        updatedFilters = ["No Quarters"];
      } else if (updatedFilters.length === uniqueQuarters.length - 1) {
        // If all quarters except "All quarters" are selected, change to "All quarters"
        updatedFilters = uniqueQuarters.filter(q => q !== "All quarters");
      }
    }

    // Remove duplicates and "All quarters" from the array
    updatedFilters = Array.from(new Set(updatedFilters)).filter(q => q !== "All quarters");

    setSelectedQuarterFilters(updatedFilters);
  };

  const processData = async () => {
    const data: any = processDashboardData(selectedMonths, selectedWorkgroups, selectedTokens, selectedLabels, allDistributions, myVariable.projectInfo.budgets);
    setProcessedData(data);
    //console.log("processedData", processedData)
  };

  const getQuarters = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    let currentQuarter, previousQuarter, previousYear;

    if (currentMonth <= 3) {
      currentQuarter = ['01', '02', '03'];
      previousQuarter = ['10', '11', '12'];
      previousYear = currentYear - 1;
    } else if (currentMonth <= 6) {
      currentQuarter = ['04', '05', '06'];
      previousQuarter = ['01', '02', '03'];
      previousYear = currentYear;
    } else if (currentMonth <= 9) {
      currentQuarter = ['07', '08', '09'];
      previousQuarter = ['04', '05', '06'];
      previousYear = currentYear;
    } else {
      currentQuarter = ['10', '11', '12'];
      previousQuarter = ['07', '08', '09'];
      previousYear = currentYear;
    }

    return { currentQuarter, currentYear, previousQuarter, previousYear };
  };

  const calculateQuarterBalances = (distributionsArray: any) => {
    const { currentQuarter, currentYear, previousQuarter, previousYear } = getQuarters();

    const calculateBalance = (quarter: any, year: any) => {
      // Ensure year is a number for consistent comparison
      const yearAsNumber = Number(year);

      // Aggregate the budget for the quarter
      const quarterBudget = quarter.reduce((total: any, month: any) => {
        const budgetKey = `${month.padStart(2, '0')}.${yearAsNumber}`;
        const monthlyBudget = Number(myVariable.projectInfo.budgets[budgetKey] || 0);
        return total + monthlyBudget;
      }, 0);

      // Calculate the balance
      return quarterBudget - distributionsArray
        .filter((distribution: any) => {
          if (distribution.tx_type !== 'Outgoing') return false;
          const [day, month, distributionYear] = distribution.task_date.split('.');
          // Handle both YY and YYYY formats and convert to number
          const fullYear = Number(distributionYear.length === 2 ? `20${distributionYear}` : distributionYear);
          return quarter.includes(month) && fullYear === yearAsNumber;
        })
        .reduce((acc: any, curr: any) => {
          const agixIndex = curr.tokens.findIndex((token: any) => token === 'AGIX');
          const agixAmount = Number(agixIndex !== -1 ? curr.amounts[agixIndex] : 0);
          return acc + agixAmount;
        }, 0);
    };


    setCurrentQuarterBalance(calculateBalance(currentQuarter, currentYear));
    setPreviousQuarterBalance(calculateBalance(previousQuarter, previousYear));
  };

  // Call processData when selected values change
  useEffect(() => {
    if (myVariable.transactions) { processData(); }
  }, [selectedMonths, selectedWorkgroups, selectedTokens, selectedLabels]);
   //console.log("myVariable", myVariable)
  return (
    <div className={styles['flex-column']}>
      <div className={styles['flex-column']}>
        <div className={styles['flex-row']}>
          <div
            className={styles['flex-row-half']}
            onMouseEnter={() => handleHover('quarters', true)}
            onMouseLeave={() => handleHover('quarters', false)}
          >
            <span className={styles['selection-label']}>Select Quarters</span>
            {(hoverStatus.quarters || selectedQuarters.includes("All quarters")) ?
              uniqueQuarters.map((quarter) => (
                <button
                  key={quarter}
                  onClick={() => handleQuarterChange(quarter)}
                  className={selectedQuarters.includes(quarter) ? styles.selected : styles['filter-btn']}
                >
                  {quarter}
                </button>
              )) :
              selectedQuarters.map((quarter) => (
                <button key={quarter} className={styles.selected}>{quarter}</button>
              ))
            }
          </div>
          <div className={styles['flex-row-half']}
            onMouseEnter={() => handleHover('quarterFilters', true)}
            onMouseLeave={() => handleHover('quarterFilters', false)}>
            <span className={styles['selection-label']}>Filter Out Reallocations by Quarter</span>
            {(hoverStatus.quarterFilters || selectedQuarterFilters.includes('No Quarters')) ?
              ["No Quarters", "All quarters", ...uniqueQuarters.filter(q => q !== "All quarters")].map((quarter) => (
                <button
                  key={quarter}
                  onClick={() => handleQuarterFilterChange(quarter)}
                  className={
                    quarter === "All quarters"
                      ? (selectedQuarterFilters.length === uniqueQuarters.length - 1 ? styles.selected : styles['filter-btn'])
                      : (selectedQuarterFilters.includes(quarter) ? styles.selected : styles['filter-btn'])
                  }
                >
                  {quarter}
                </button>
              )) :
              (selectedQuarterFilters.length === uniqueQuarters.length - 1
                ? [<button key="All quarters" className={styles.selected}>All quarters</button>]
                : selectedQuarterFilters.map((quarter) => (
                  <button key={quarter} className={styles.selected}>{quarter}</button>
                ))
              )
            }
          </div>
        </div>
        <div className={styles['flex-row']}>
          <div
            className={styles['flex-row-half']}
            onMouseEnter={() => handleHover('months', true)}
            onMouseLeave={() => handleHover('months', false)}
          >
            <span className={styles['selection-label']}>Select Months</span>
            {(hoverStatus.months || selectedMonths.includes('All months')) ?
              uniqueMonths.map((month) => (
                <button
                  key={month}
                  onClick={() => handleMonthChange(month)}
                  className={selectedMonths.includes(month) ? styles.selected : styles['filter-btn']}
                >
                  {month}
                </button>
              )) :
              selectedMonths.map((month) => (
                <button key={month} className={styles.selected}>{month}</button>
              ))
            }
          </div>
          <div className={styles['flex-row-half']}
            onMouseEnter={() => handleHover('tokens', true)}
            onMouseLeave={() => handleHover('tokens', false)}>
            <span className={styles['selection-label']}>Select Tokens</span>
            {(hoverStatus.tokens || selectedTokens.includes('All tokens')) ?
              uniqueTokens.map((token) => (
                <button key={token} onClick={() => handleTokenChange(token)}
                  className={selectedTokens.includes(token) ? styles.selected : styles['filter-btn']}>
                  {token}
                </button>
              )) :
              selectedTokens.map((token) => (
                <button key={token} className={styles.selected}>{token}</button>
              ))
            }
          </div>
        </div>
        <div className={styles['flex-row']}>
          <div className={styles['flex-row-half']}
            onMouseEnter={() => handleHover('workgroups', true)}
            onMouseLeave={() => handleHover('workgroups', false)}>
            <span className={styles['selection-label']}>Select Workgroups</span>
            {(hoverStatus.workgroups || selectedWorkgroups.includes('All workgroups')) ?
              workgroups.map((workgroup) => (
                <button key={workgroup} onClick={() => handleWorkgroupChange(workgroup)}
                  className={selectedWorkgroups.includes(workgroup) ? styles.selected : styles['filter-btn']}>
                  {workgroup}
                </button>
              )) :
              selectedWorkgroups.map((workgroup) => (
                <button key={workgroup} className={styles.selected}>{workgroup}</button>
              ))
            }
          </div>
          <div className={styles['flex-row-half']}
            onMouseEnter={() => handleHover('labels', true)}
            onMouseLeave={() => handleHover('labels', false)}>
            <span className={styles['selection-label']}>Select Labels</span>
            {(hoverStatus.labels || selectedLabels.includes('All labels')) ?
              uniqueLabels.map((label) => (
                <button key={label} onClick={() => handleLabelChange(label)}
                  className={selectedLabels.includes(label) ? styles.selected : styles['filter-btn']}>
                  {label}
                </button>
              )) :
              selectedLabels.map((label) => (
                <button key={label} className={styles.selected}>{label}</button>
              ))
            }
          </div>
        </div>
        <div className={styles['flex-row']}>
          <div className={styles['flex-row-half']}>
            <span className={styles['selection-label']}>AGIX Balance of current Quarter: {currentQuarterBalance}</span>
          </div>
          <div className={styles['flex-row-half']}>
            <span className={styles['selection-label']}>AGIX Balance of previous Quarter: {previousQuarterBalance}</span>
          </div>
        </div>
        <div className={styles['flex-row']}>
          {selectedWorkgroups.length > 0 && processedData.table3 && workgroupsBudgets.length > 0
            && (
              <WorkgroupBalances
                data={processedData}
                months={selectedMonths}
                workgroupsBudgets={workgroupsBudgets}
                selectedWorkgroups={selectedWorkgroups}
                allDistributions={allDistributions}
                selectedQuarterFilters={selectedQuarterFilters}
              />
            )}
        </div>
        <div className={styles['components-conatiner']}>
          <div className={styles['flex-column']}>
            <div className={styles['chartX']}>
              {processedData.chart1.labels.length > 1 && !processedData.chart1.data[0].x && (<ChartComponent1 chartData={processedData.chart1} />)}
              {processedData.chart1 && processedData.chart1.data[0]?.x && (<ChartComponentX chartData={processedData.chart1} />)}
            </div>
            <div className={styles['chartX']}>
              {processedData.chart2.labels.length > 1 && !processedData.chart2.data[0].x && (<ChartComponent2 chartData={processedData.chart2} />)}
              {processedData.chart2 && processedData.chart2.data[0]?.x && (<ChartComponentY chartData={processedData.chart2} />)}
            </div>
            <div className={styles['chartX']}>
              {processedData.chart3 && processedData.chart3.data[0]?.x && (<ChartComponentZ chartData={processedData.chart3} />)}
            </div>
            <div className={styles['chartX']}>
              {processedData.chart4.labels.length > 1 && !processedData.chart4.data[0].x && (<ChartComponent4 chartData={processedData.chart4} />)}
              {processedData.chart4 && processedData.chart4.data[0]?.x && (<ChartComponentC chartData={processedData.chart4} />)}
            </div>
          </div>
          <div className={styles['flex-column']}>
            <div className={styles['tables']}>
              {selectedLabels.includes('All labels') && selectedWorkgroups.includes('All workgroups') && processedData.table1 && (<DynamicTable data={processedData.table1} />)}
            </div>
            <div className={styles['tables']}>
              {(selectedWorkgroups.includes('All workgroups') || selectedWorkgroups.length > 1) && (selectedTokens.length > 1) && processedData.table3 && (<DynamicTable data={processedData.table3} />)}
            </div>
            <div className={styles['tables']}>
              {processedData.table2 && !(selectedWorkgroups.includes('All workgroups') || selectedWorkgroups.length > 1) && (<DynamicTable data={processedData.table2} />)}
            </div>
            <div className={styles['tables']}>
              <h3>Incoming Transactions from msge62 wallet</h3>
              <IncomingTransactionsTable myVariable={myVariable} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnetDashboard;
