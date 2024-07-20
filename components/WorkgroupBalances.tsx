import React from 'react';
import styles from '../styles/Report.module.css';

interface WorkgroupBalancesProps {
  data: Record<string, any>[];
  months: string[];
  workgroupsBudgets: any[];
  selectedWorkgroups: string[];
}

const WorkgroupBalances: React.FC<WorkgroupBalancesProps> = ({ data, months, workgroupsBudgets, selectedWorkgroups }) => {
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
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {workgroupsToRender.map((workgroupName, rowIndex) => {
            const budget = Math.round(getBudgetForWorkgroup(workgroupName, quarters, years));
            const spent = Math.round(getSpentForWorkgroup(workgroupName));
            const incomingReallocation = Math.round(getReallocationForWorkgroup(workgroupName, quarters, years, 'incoming'));
            const outgoingReallocation = Math.round(getReallocationForWorkgroup(workgroupName, quarters, years, 'outgoing'));
            const remaining = budget - spent + incomingReallocation - outgoingReallocation;

            return (
              <tr key={rowIndex}>
                <td>{workgroupName}</td>
                <td>{budget}</td>
                <td>{spent}</td>
                <td>{incomingReallocation}</td>
                <td>{outgoingReallocation}</td>
                <td>{remaining}</td>
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
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default WorkgroupBalances;