import React from 'react';

interface Props {
  workgroup: string;
  myVariable: any;
  selectedMonth: string;
}

const SpecificWorkgroupComponent: React.FC<Props> = ({ workgroup, myVariable, selectedMonth }) => {

  const formatNumberWithLeadingZero = (num: number): string => {
    return num < 10 ? `0${num}` : `${num}`;
  };

  // Only re-format the selectedMonth if it's not "All months"
  let formattedSelectedMonth = selectedMonth;
  if (selectedMonth !== 'All months') {
    const [rawSelectedMonthNum, selectedYear] = selectedMonth.split('.');
    formattedSelectedMonth = `${formatNumberWithLeadingZero(Number(rawSelectedMonthNum))}.${selectedYear}`;
  }

  const curatedContributions = myVariable.transactions.flatMap((transaction: any) => 
    transaction.contributions ? transaction.contributions.filter((contribution: any) => {
      // Check if the contribution belongs to the selected workgroup
      const isFromSelectedWorkgroup = contribution.task_sub_group && 
        (contribution.task_sub_group.replace(/ /g, '-').toLowerCase()) === workgroup;

      if (formattedSelectedMonth === 'All months') {
        return isFromSelectedWorkgroup; // If "All months" is selected, only check workgroup
      }

      let contributionDate = contribution.task_date;
      
      if (!contributionDate && transaction.transaction_date) {
        const transactionDate = new Date(Number(transaction.transaction_date));
        contributionDate = `${formatNumberWithLeadingZero(transactionDate.getDate())}.${formatNumberWithLeadingZero(transactionDate.getMonth() + 1)}.${transactionDate.getFullYear().toString().slice(-2)}`;
      }
      
      if (!contributionDate) {
        return false; // If both task_date and transaction_date are missing, filter out this contribution
      }
      
      // Extract month and year from the contribution's date (i.e., "15.09.23")
      const [contributionDay, contributionMonth, contributionYearSuffix] = contributionDate.split('.');
      
      // Format the contribution's date to match the selectedMonth format (i.e., "09.2023")
      const contributionFormattedDate = `${contributionMonth}.${'20' + contributionYearSuffix}`;
      
      // Check if the contribution's date matches the selected month and year
      const isFromSelectedMonth = contributionFormattedDate === formattedSelectedMonth;

      return isFromSelectedWorkgroup && isFromSelectedMonth;
    }) : []
  ); 

  return (
    <div>
        <h1>Work in Progress. To view charts again, select All workgroups</h1>
      <h3>Details for {workgroup} {formattedSelectedMonth !== 'All months' ? 'in ' + formattedSelectedMonth : ''}</h3>
      <p>Total Transactions for {workgroup}: {curatedContributions.length}</p> 
      <ul>
        {curatedContributions.map((contribution: any, index: any) => (
          <li key={index}>
            Task Name: {contribution.task_name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SpecificWorkgroupComponent;
