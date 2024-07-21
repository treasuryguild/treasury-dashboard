import React from 'react';
import styles from '../styles/Report.module.css';

interface WorkgroupBalancesProps {
  data: Record<string, any>[];
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
          return quarterTotal + (quarterData?.final.AGIX || 0);
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

  const getSpentForWorkgroup = (workgroupName: string) => {
    const workgroupData = data.find((row) => row.Workgroup === workgroupName);
    return workgroupData ? workgroupData.AGIX : 0;
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

  const getCumulativeRemainingForWorkgroup = (workgroupName: string, quarters: string[], years: string[]) => {
    const { latestQuarter, latestYear } = getLatestQuarterAndYear(quarters, years);
    const workgroup = workgroupsBudgets.find((wg) => wg.sub_group === workgroupName);
    
    if (workgroup && workgroup.sub_group_data) {
      const totalBudget = Object.entries(workgroup.sub_group_data.budgets).reduce((totalBudget, [year, yearData]: [string, any]) => {
        return totalBudget + Object.entries(yearData).reduce((yearBudget, [quarter, quarterData]: [string, any]) => {
          const currentQuarter = parseInt(quarter.slice(1));
          const currentYear = parseInt(year);
          if (isQuarterBeforeOrEqual(currentYear, currentQuarter, latestYear, latestQuarter)) {
            return yearBudget + (quarterData?.final.AGIX || 0);
          }
          return yearBudget;
        }, 0);
      }, 0);

      const totalSpent = allDistributions
        .filter(dist => {
          if (dist.tx_type !== 'Outgoing' || dist.task_sub_group !== workgroupName) return false;
          const [day, month, year] = dist.task_date.split('.');
          const distQuarter = Math.ceil(parseInt(month) / 3);
          const distYear = parseInt(year) + 2000;  // Assuming two-digit year
          return isQuarterBeforeOrEqual(distYear, distQuarter, latestYear, latestQuarter);
        })
        .reduce((total, dist) => {
          const agixIndex = dist.tokens.findIndex((token: any) => token === 'AGIX');
          return total + (agixIndex !== -1 ? Number(dist.amounts[agixIndex]) : 0);
        }, 0);

      const totalReallocation = getCumulativeReallocationForWorkgroup(workgroupName, quarters, years);
      return totalBudget - totalSpent + totalReallocation;
    }
    return 0;
  };

  const { quarters, years } = getQuartersAndYearsFromMonths(months);

  let workgroupsToRender: string[] = [];
  if (workgroupsBudgets) {
    workgroupsToRender = selectedWorkgroups.includes('All workgroups')
      ? workgroupsBudgets.map((wg: any) => wg.sub_group)
      : selectedWorkgroups;
  }

  const totalBudget = workgroupsToRender.reduce((sum, workgroupName) => sum + getBudgetForWorkgroup(workgroupName, quarters, years), 0);
  const totalSpent = workgroupsToRender.reduce((sum, workgroupName) => sum + getSpentForWorkgroup(workgroupName), 0);
  const totalIncomingReallocation = workgroupsToRender.reduce((sum, workgroupName) => sum + getReallocationForWorkgroup(workgroupName, quarters, years, 'incoming'), 0);
  const totalOutgoingReallocation = workgroupsToRender.reduce((sum, workgroupName) => sum + getReallocationForWorkgroup(workgroupName, quarters, years, 'outgoing'), 0);
  const totalRemaining = totalBudget - totalSpent + totalIncomingReallocation - totalOutgoingReallocation;
  const totalCumulativeReallocation = workgroupsToRender.reduce((sum, workgroupName) => sum + getCumulativeReallocationForWorkgroup(workgroupName, quarters, years), 0);
  const totalCumulativeRemaining = workgroupsToRender.reduce((sum, workgroupName) => sum + getCumulativeRemainingForWorkgroup(workgroupName, quarters, years), 0);

  return (
    <div className={styles.numbers}>
      <table>
        <thead>
          <tr>
            <th>Workgroup</th>
            <th>Budget {months.includes('All months') ? '(All Quarters)' : `(${quarters.join(', ')} ${years.join(', ')})`}</th>
            <th>Spent</th>
            <th>Incoming Reallocation</th>
            <th>Outgoing Reallocation</th>
            <th>Current Remaining</th>
            <th>Cumulative Reallocation</th>
            <th>Cumulative Remaining</th>
          </tr>
        </thead>
        <tbody>
          {workgroupsToRender.map((workgroupName, rowIndex) => {
            const budget = Math.round(getBudgetForWorkgroup(workgroupName, quarters, years));
            const spent = Math.round(getSpentForWorkgroup(workgroupName));
            const incomingReallocation = Math.round(getReallocationForWorkgroup(workgroupName, quarters, years, 'incoming'));
            const outgoingReallocation = Math.round(getReallocationForWorkgroup(workgroupName, quarters, years, 'outgoing'));
            const remaining = budget - spent + incomingReallocation - outgoingReallocation;
            const cumulativeReallocation = Math.round(getCumulativeReallocationForWorkgroup(workgroupName, quarters, years));
            const cumulativeRemaining = Math.round(getCumulativeRemainingForWorkgroup(workgroupName, quarters, years));

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