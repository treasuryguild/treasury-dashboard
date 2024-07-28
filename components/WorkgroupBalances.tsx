import React from 'react';
import styles from '../styles/WorkgroupBalances.module.css';

interface WorkgroupBalancesProps {
  data: {
    monthlyTotals: {
      totalMonthly: Record<string, Record<string, number>>;
      workgroupMonthly: Record<string, Record<string, Record<string, number>>>;
    };
  };
  months: string[];
  workgroupsBudgets: any[];
  selectedWorkgroups: string[];
  allDistributions: any[];
}

const WorkgroupBalances: React.FC<WorkgroupBalancesProps> = ({ 
  data, 
  months, 
  workgroupsBudgets, 
  selectedWorkgroups, 
  allDistributions, 
}) => {
  //console.log('WorkgroupBalances', { data, months, workgroupsBudgets, selectedWorkgroups, allDistributions });

  const getQuartersAndYearsFromMonths = (months: string[]) => {
    if (months.includes('All months')) {
      return { quarters: ['Q1', 'Q2', 'Q3', 'Q4'], years: ['2023', '2024'] };
    }
    const quarters: string[] = [];
    const years: string[] = [];
    months.forEach((month) => {
      const [monthNum, year] = month.split('.');
      const quarterNum = Math.ceil(parseInt(monthNum) / 3);
      const quarter = `Q${quarterNum}`;
      if (!quarters.includes(quarter)) {
        quarters.push(quarter);
      }
      if (!years.includes(year)) {
        years.push(year);
      }
    });
    return { quarters, years };
  };

  const getLatestQuarterAndYear = (quarters: string[], years: string[]) => {
    const latestYear = Math.max(...years.map(Number));
    const latestQuarter = Math.max(...quarters.map(q => parseInt(q.slice(1))));
    return { latestQuarter, latestYear };
  };

  const isQuarterBeforeOrEqual = (year: number, quarter: number, latestYear: number, latestQuarter: number) => {
    return year < latestYear || (year === latestYear && quarter <= latestQuarter);
  };

  const getBudgetForWorkgroup = (workgroupName: string, quarters: string[], years: string[]) => {
    const workgroup = workgroupsBudgets.find((wg) => wg.sub_group === workgroupName);
    if (workgroup && workgroup.sub_group_data) {
      return years.reduce((yearTotal, year) => {
        return yearTotal + quarters.reduce((quarterTotal, quarter) => {
          const quarterData = workgroup.sub_group_data.budgets[year]?.[quarter];
          return quarterTotal + (quarterData?.initial.AGIX || 0);
        }, 0);
      }, 0);
    }
    return 0;
  };

  const getReallocationForWorkgroup = (workgroupName: string, quarters: string[], years: string[], type: 'incoming' | 'outgoing') => {
    const workgroup = workgroupsBudgets.find((wg) => wg.sub_group === workgroupName);
    if (workgroup && workgroup.sub_group_data) {
      return years.reduce((yearTotal, year) => {
        return yearTotal + quarters.reduce((quarterTotal, quarter) => {
          const quarterData = workgroup.sub_group_data.budgets[year]?.[quarter];
          return quarterTotal + (quarterData?.reallocations[type].AGIX || 0);
        }, 0);
      }, 0);
    }
    return 0;
  };

  const getCumulativeReallocationForWorkgroup = (workgroupName: string, quarters: string[], years: string[]) => {
    const { latestQuarter, latestYear } = getLatestQuarterAndYear(quarters, years);
    const workgroup = workgroupsBudgets.find((wg) => wg.sub_group === workgroupName);
    
    if (workgroup && workgroup.sub_group_data) {
      return Object.entries(workgroup.sub_group_data.budgets).reduce((totalReallocation, [year, yearData]: [string, any]) => {
        return totalReallocation + Object.entries(yearData).reduce((yearReallocation, [quarter, quarterData]: [string, any]) => {
          const currentQuarter = parseInt(quarter.slice(1));
          const currentYear = parseInt(year);
          if (isQuarterBeforeOrEqual(currentYear, currentQuarter, latestYear, latestQuarter)) {
            return yearReallocation + (quarterData?.reallocations.incoming.AGIX || 0) - (quarterData?.reallocations.outgoing.AGIX || 0);
          }
          return yearReallocation;
        }, 0);
      }, 0);
    }
    return 0;
  };

  const getLatestSelectedMonth = (months: string[]) => {
    if (months.includes('All months') || months.length === 0) {
      return getLatestMonth(Object.keys(data.monthlyTotals.totalMonthly));
    }
    return getLatestMonth(months);
  };

  const getLatestMonth = (months: string[]): string => {
    if (months.includes('All months') || months.length === 0) {
      // If 'All months' is selected or no months are selected, return the latest month from all available data
      const allMonths = Object.keys(data.monthlyTotals.totalMonthly);
      return allMonths.reduce((latest, current) => {
        const [latestMonth, latestYear] = latest.split('.').map(Number);
        const [currentMonth, currentYear] = current.split('.').map(Number);
        if (currentYear > latestYear || (currentYear === latestYear && currentMonth > latestMonth)) {
          return current;
        }
        return latest;
      }, allMonths[0] || 'All months'); // Provide a default value if allMonths is empty
    }
  
    return months.reduce((latest, current) => {
      const [latestMonth, latestYear] = latest.split('.').map(Number);
      const [currentMonth, currentYear] = current.split('.').map(Number);
      if (currentYear > latestYear || (currentYear === latestYear && currentMonth > latestMonth)) {
        return current;
      }
      return latest;
    }, months[0]);
  };
  

  const isMonthBeforeOrEqual = (month: string, latestMonth: string) => {
    const [monthNum, year] = month.split('.').map(Number);
    const [latestMonthNum, latestYear] = latestMonth.split('.').map(Number);
    return year < latestYear || (year === latestYear && monthNum <= latestMonthNum);
  };

  const getMonthsInQuarter = (quarter: string, year: string) => {
    const quarterNum = parseInt(quarter.slice(1));
    const startMonth = (quarterNum - 1) * 3 + 1;
    return [
      `${String(startMonth).padStart(2, '0')}.${year}`,
      `${String(startMonth + 1).padStart(2, '0')}.${year}`,
      `${String(startMonth + 2).padStart(2, '0')}.${year}`,
    ];
  };

  const getCumulativeRemainingForWorkgroup = (workgroupName: string, selectedMonths: string[]) => {
    const workgroup = workgroupsBudgets.find((wg) => wg.sub_group === workgroupName);
    const workgroupData = data.monthlyTotals.workgroupMonthly[workgroupName];
    //console.log("test", workgroupData);
    if (workgroup && workgroup.sub_group_data && workgroupData) {
      const latestMonth = getLatestSelectedMonth(selectedMonths);
      
      const totalBudget = Object.entries(workgroup.sub_group_data.budgets).reduce((total, [year, yearData]: [string, any]) => {
        return total + Object.entries(yearData).reduce((yearTotal, [quarter, quarterData]: [string, any]) => {
          const monthsInQuarter = getMonthsInQuarter(quarter, year);
          if (monthsInQuarter.some(month => isMonthBeforeOrEqual(month, latestMonth))) {
            return yearTotal + (quarterData?.final.AGIX || 0);
          }
          return yearTotal;
        }, 0);
      }, 0);

      const totalSpent = workgroupData.AGIX 
        ? Object.entries(workgroupData.AGIX).reduce((total, [month, amount]) => {
            if (isMonthBeforeOrEqual(month, latestMonth)) {
              return total + amount;
            }
            return total;
          }, 0)
        : 0;

      const totalReallocation = Object.entries(workgroup.sub_group_data.budgets).reduce((total, [year, yearData]: [string, any]) => {
        return total + Object.entries(yearData).reduce((yearTotal, [quarter, quarterData]: [string, any]) => {
          const monthsInQuarter = getMonthsInQuarter(quarter, year);
          if (monthsInQuarter.some(month => isMonthBeforeOrEqual(month, latestMonth))) {
            return yearTotal + (quarterData?.reallocations.incoming.AGIX || 0) - (quarterData?.reallocations.outgoing.AGIX || 0);
          }
          return yearTotal;
        }, 0);
      }, 0);

      return totalBudget - totalSpent + totalReallocation;
    }
    return 0;
  };

  const getSpentForWorkgroup = (workgroupName: string, selectedMonths: string[]) => {
    const workgroupData = data.monthlyTotals.workgroupMonthly[workgroupName];
    if (!workgroupData || !workgroupData.AGIX) return 0;

    if (selectedMonths.includes('All months') || selectedMonths.length === 0) {
      return Object.values(workgroupData.AGIX).reduce((sum, amount) => sum + amount, 0);
    }

    return selectedMonths.reduce((sum, month) => {
      return sum + (workgroupData.AGIX[month] || 0);
    }, 0);
  };

  const { quarters, years } = getQuartersAndYearsFromMonths(months);

  let workgroupsToRender: string[] = [];
  if (workgroupsBudgets) {
    workgroupsToRender = selectedWorkgroups.includes('All workgroups')
      ? workgroupsBudgets.map((wg: any) => wg.sub_group)
      : selectedWorkgroups;
    // Sort the workgroups alphabetically
    workgroupsToRender.sort((a, b) => a.localeCompare(b));
  }

  const totalBudget = workgroupsToRender.reduce((sum, workgroupName) => sum + getBudgetForWorkgroup(workgroupName, quarters, years), 0);
  const totalSpent = workgroupsToRender.reduce((sum, workgroupName) => sum + getSpentForWorkgroup(workgroupName, months), 0);
  const totalIncomingReallocation = workgroupsToRender.reduce((sum, workgroupName) => sum + getReallocationForWorkgroup(workgroupName, quarters, years, 'incoming'), 0);
  const totalOutgoingReallocation = workgroupsToRender.reduce((sum, workgroupName) => sum + getReallocationForWorkgroup(workgroupName, quarters, years, 'outgoing'), 0);
  const totalRemaining = totalBudget - totalSpent + totalIncomingReallocation - totalOutgoingReallocation;
  const totalCumulativeReallocation = workgroupsToRender.reduce((sum, workgroupName) => sum + getCumulativeReallocationForWorkgroup(workgroupName, quarters, years), 0);
  const totalCumulativeRemaining = workgroupsToRender.reduce((sum, workgroupName) => sum + getCumulativeRemainingForWorkgroup(workgroupName, months), 0);

  return (
    <div className={styles.numbers}>
      <table>
        <thead>
          <tr>
            <th>Workgroup</th>
            <th>Budget {months.includes('All months') ? '(All Quarters)' : `(${quarters.join(', ')} ${years.join(', ')})`}</th>
            <th>Spent {months.includes('All months') ? '(All Quarters)' : `(${quarters.join(', ')} ${years.join(', ')})`}</th>
            <th>Incoming Reallocation</th>
            <th>Outgoing Reallocation</th>
            <th>{months.includes('All months') ? '(All Quarters)' : `(${quarters.join(', ')} ${years.join(', ')})`} Remaining</th>
            <th>Cumulative Reallocation</th>
            <th>Cumulative Remaining</th>
          </tr>
        </thead>
        <tbody>
          {workgroupsToRender.map((workgroupName, rowIndex) => {
            const budget = Math.round(getBudgetForWorkgroup(workgroupName, quarters, years));
            const spent = Math.round(getSpentForWorkgroup(workgroupName, months));
            const incomingReallocation = Math.round(getReallocationForWorkgroup(workgroupName, quarters, years, 'incoming'));
            const outgoingReallocation = Math.round(getReallocationForWorkgroup(workgroupName, quarters, years, 'outgoing'));
            const remaining = budget - spent + incomingReallocation - outgoingReallocation;
            const cumulativeReallocation = Math.round(getCumulativeReallocationForWorkgroup(workgroupName, quarters, years));
            const cumulativeRemaining = Math.round(getCumulativeRemainingForWorkgroup(workgroupName, months));

            return (
              <tr key={rowIndex}>
                <td>{workgroupName}</td>
                <td>{budget}</td>
                <td>{spent}</td>
                <td>{incomingReallocation}</td>
                <td>{outgoingReallocation}</td>
                <td>{remaining}</td>
                <td>{cumulativeReallocation}</td>
                <td>{cumulativeRemaining}</td>
              </tr>
            );
          })}
          <tr>
            <td>Totals</td>
            <td>{Math.round(totalBudget)}</td>
            <td>{Math.round(totalSpent)}</td>
            <td>{Math.round(totalIncomingReallocation)}</td>
            <td>{Math.round(totalOutgoingReallocation)}</td>
            <td>{Math.round(totalRemaining)}</td>
            <td>{Math.round(totalCumulativeReallocation)}</td>
            <td>{Math.round(totalCumulativeRemaining)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default WorkgroupBalances;