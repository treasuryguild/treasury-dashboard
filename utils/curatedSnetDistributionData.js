export const runningBalanceTableData = (distributionsArray) => {
  const agixTransactions = distributionsArray.filter((item) => item.tokens.includes('AGIX'));

  const monthlyData = {};

  agixTransactions.forEach((item) => {
    const { tx_type, amounts, task_date, transaction_date } = item;
    const lowerTxType = tx_type.toLowerCase();
    const isIncoming = lowerTxType.startsWith('incoming');
    let dateToUse = isIncoming ? transaction_date : task_date;

    let [day, month, year] = dateToUse.split('.');
    day = parseInt(day);
    month = parseInt(month);
    year = parseInt(year);

    // If incoming transaction and within last 10 days of the month, and not "Incoming reserve", move to next month
    if (isIncoming && day > 20 && lowerTxType !== "incoming reserve") {
      if (month === 12) {
        month = 1;
        year++;
      } else {
        month++;
      }
    }

    const monthYear = `${String(month).padStart(2, '0')}.${year}`;

    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = {
        incoming: 0,
        outgoing: 0,
      };
    }

    const agixIndex = item.tokens.indexOf('AGIX');
    const amount = agixIndex !== -1 ? Number(amounts[agixIndex]) : 0;

    if (isIncoming) {
      monthlyData[monthYear].incoming += amount;
    } else {
      monthlyData[monthYear].outgoing += amount;
    }
  });

  const result = [];
  let runningBalance = 0;

  Object.keys(monthlyData).sort().forEach((monthYear) => {
    runningBalance += monthlyData[monthYear].incoming - monthlyData[monthYear].outgoing;
    result.push({
      date: monthYear,
      incoming: (monthlyData[monthYear].incoming).toFixed(0),
      outgoing: (monthlyData[monthYear].outgoing).toFixed(0),
      runningBalance: (runningBalance).toFixed(0),
    });
  });

  return result.reverse();
};
  
export const monthlyNumbersTableData = (distributionsArray) => {
  
  return [];
};

export const workgroupsTableData = (distributionsArray, month) => {
  
  return [];
};

export const workgroupMonthlyDataTable = (distributionsArray, workgroup, month) => {
  
  return [];
};

export const workgroupAllMonthsDataTable = (distributionsArray, workgroup) => {
  
  return [];
};