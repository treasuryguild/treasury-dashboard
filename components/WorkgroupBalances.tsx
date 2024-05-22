import React from 'react';
import styles from '../styles/Report.module.css';

// Utility function to transform camelCase to Capitalized Words
const formatCamelCase = (str: string): string => {
  const result = str.replace(/([a-z])([A-Z])/g, '$1 $2');
  return result
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface WorkgroupBalancesProps {
  data: Record<string, any>[];
  months: string[];
  workgroupsBudgets: any;
  selectedWorkgroups: string[];
}

const WorkgroupBalances: React.FC<WorkgroupBalancesProps> = ({ data, months, workgroupsBudgets, selectedWorkgroups }) => {
  const getQuartersFromMonths = (months: string[]) => {
    if (months.includes('All months')) {
      return ['Q1', 'Q2', 'Q3', 'Q4'];
    }
    const quarters: string[] = [];
    months.forEach((month) => {
      const monthNumber = parseInt(month.split('.')[0], 10);
      const quarter = `Q${Math.ceil(monthNumber / 3)}`;
      if (!quarters.includes(quarter)) {
        quarters.push(quarter);
      }
    });
    return quarters;
  };

  const getBudgetForWorkgroup = (workgroupName: string, quarters: string[]) => {
    if (!workgroupsBudgets || !workgroupsBudgets.workgroups) {
      return 0;
    }
    const workgroup = workgroupsBudgets.workgroups.find(
      (wg: any) => wg.sub_group === workgroupName
    );
    if (workgroup && workgroup.budgets) {
      const budgetKeys = Object.keys(workgroup.budgets);
      const latestBudgetKey = budgetKeys[budgetKeys.length - 1];
      const latestBudget = workgroup.budgets[latestBudgetKey];
      return quarters.reduce((total, quarter) => total + (latestBudget[quarter]?.AGIX || 0), 0);
    }
    return 0;
  };

  const getSpentForWorkgroup = (workgroupName: string) => {
    const workgroupData = data.find((row) => row.Workgroup === workgroupName);
    return workgroupData ? workgroupData.AGIX : 0;
  };

  const quarters = getQuartersFromMonths(months);

  // Determine the workgroups to render based on selectedWorkgroups
  let workgroupsToRender: string[] = [];
  if (workgroupsBudgets && workgroupsBudgets.workgroups) {
    workgroupsToRender = selectedWorkgroups.includes('All workgroups')
      ? workgroupsBudgets.workgroups.map((wg: any) => wg.sub_group)
      : selectedWorkgroups;
  }

  // Calculate totals
  const totalBudget = workgroupsToRender.reduce((sum: any, workgroupName: any) => sum + getBudgetForWorkgroup(workgroupName, quarters), 0);
  const totalSpent = workgroupsToRender.reduce((sum: any, workgroupName: any) => sum + getSpentForWorkgroup(workgroupName), 0);
  const totalRemaining = totalBudget - totalSpent;

  //console.log("data, months, workgroupsBudgets, selectedWorkgroups", data, months, workgroupsBudgets, selectedWorkgroups);

  return (
    <div className={styles.numbers}>
      <table>
        <thead>
          <tr>
            <th>Workgroup</th>
            {!months.includes('All months') && <th>Budget ({quarters.join(', ')})</th>}
            <th>Spent</th>
            {!months.includes('All months') && <th>Remaining</th>}
          </tr>
        </thead>
        <tbody>
          {workgroupsToRender.map((workgroupName: any, rowIndex: any) => {
            const budget = getBudgetForWorkgroup(workgroupName, quarters);
            const spent = getSpentForWorkgroup(workgroupName);
            const remaining = budget - spent;

            return (
              <tr key={rowIndex}>
                <td>{workgroupName}</td>
                {!months.includes('All months') && <td>{budget}</td>}
                <td>{spent}</td>
                {!months.includes('All months') && <td>{remaining}</td>}
              </tr>
            );
          })}
          <tr>
            <td>Totals</td>
            {!months.includes('All months') && <td>{totalBudget}</td>}
            <td>{totalSpent}</td>
            {!months.includes('All months') && <td>{totalRemaining}</td>}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default WorkgroupBalances;