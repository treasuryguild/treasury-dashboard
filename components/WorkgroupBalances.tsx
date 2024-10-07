// ../components/WorkgroupBalances.tsx
import React from 'react';
import styles from '../styles/WorkgroupBalances.module.css';
import * as WorkgroupUtils from '../utils/workgroupUtils';

interface WorkgroupBalancesProps {
  data: WorkgroupUtils.WorkgroupData;
  months: string[];
  workgroupsBudgets: WorkgroupUtils.WorkgroupBudget[];
  selectedWorkgroups: string[];
  allDistributions: any[];
  selectedQuarterFilters: string[];
}

const WorkgroupBalances: React.FC<WorkgroupBalancesProps> = ({ 
  data, 
  months, 
  workgroupsBudgets, 
  selectedWorkgroups, 
  allDistributions,
  selectedQuarterFilters,
}) => {
  const { quarters, years } = WorkgroupUtils.getQuartersAndYearsFromMonths(months);

  let workgroupsToRender: string[] = [];
  if (workgroupsBudgets) {
    workgroupsToRender = selectedWorkgroups.includes('All workgroups')
      ? workgroupsBudgets.map((wg: WorkgroupUtils.WorkgroupBudget) => wg.sub_group)
      : selectedWorkgroups;
    workgroupsToRender.sort((a, b) => a.localeCompare(b));
  }

  const totalBudget = workgroupsToRender.reduce((sum, workgroupName) => {
    const workgroup = workgroupsBudgets.find(wg => wg.sub_group === workgroupName);
    return sum + (workgroup ? WorkgroupUtils.getBudgetForWorkgroup(workgroup, quarters, years) : 0);
  }, 0);

  const totalSpent = workgroupsToRender.reduce((sum, workgroupName) => sum + WorkgroupUtils.getSpentForWorkgroup(workgroupName, months, data), 0);

  const totalIncomingReallocation = workgroupsToRender.reduce((sum, workgroupName) => {
    const workgroup = workgroupsBudgets.find(wg => wg.sub_group === workgroupName);
    return sum + (workgroup ? WorkgroupUtils.getReallocationForWorkgroup(workgroup, quarters, years, 'incoming', selectedQuarterFilters) : 0);
  }, 0);

  const totalOutgoingReallocation = workgroupsToRender.reduce((sum, workgroupName) => {
    const workgroup = workgroupsBudgets.find(wg => wg.sub_group === workgroupName);
    return sum + (workgroup ? WorkgroupUtils.getReallocationForWorkgroup(workgroup, quarters, years, 'outgoing', selectedQuarterFilters) : 0);
  }, 0);

  const totalRemaining = totalBudget - totalSpent + totalIncomingReallocation - totalOutgoingReallocation;

  const totalCumulativeReallocation = workgroupsToRender.reduce((sum, workgroupName) => {
    const workgroup = workgroupsBudgets.find(wg => wg.sub_group === workgroupName);
    return sum + (workgroup ? WorkgroupUtils.getCumulativeReallocationForWorkgroup(workgroup, quarters, years, selectedQuarterFilters) : 0);
  }, 0);

  const totalCumulativeRemaining = workgroupsToRender.reduce((sum, workgroupName) => {
    const workgroup = workgroupsBudgets.find(wg => wg.sub_group === workgroupName);
    return sum + (workgroup ? WorkgroupUtils.getCumulativeRemainingForWorkgroup(workgroup, months, data, selectedQuarterFilters) : 0);
  }, 0);

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
            const workgroup = workgroupsBudgets.find(wg => wg.sub_group === workgroupName);
            if (!workgroup) return null;

            const budget = Math.round(WorkgroupUtils.getBudgetForWorkgroup(workgroup, quarters, years));
            const spent = Math.round(WorkgroupUtils.getSpentForWorkgroup(workgroupName, months, data));
            const incomingReallocation = Math.round(WorkgroupUtils.getReallocationForWorkgroup(workgroup, quarters, years, 'incoming', selectedQuarterFilters));
            const outgoingReallocation = Math.round(WorkgroupUtils.getReallocationForWorkgroup(workgroup, quarters, years, 'outgoing', selectedQuarterFilters));
            const remaining = budget - spent + incomingReallocation - outgoingReallocation;
            const cumulativeReallocation = Math.round(WorkgroupUtils.getCumulativeReallocationForWorkgroup(workgroup, quarters, years, selectedQuarterFilters));
            const cumulativeRemaining = Math.round(WorkgroupUtils.getCumulativeRemainingForWorkgroup(workgroup, months, data, selectedQuarterFilters));

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