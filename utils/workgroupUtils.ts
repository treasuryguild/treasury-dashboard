// ../utils/workgroupUtils.ts

export interface WorkgroupData {
  monthlyTotals: {
    totalMonthly: Record<string, Record<string, number>>;
    workgroupMonthly: Record<string, Record<string, Record<string, number>>>;
  };
}

export interface WorkgroupBudget {
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

export const getQuartersAndYearsFromMonths = (months: string[]) => {
  if (months.includes('All months')) {
    return { quarters: ['Q1', 'Q2', 'Q3', 'Q4'], years: ['2022','2023', '2024', '2025'] };
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

export const getLatestQuarterAndYear = (quarters: string[], years: string[]) => {
  const latestYear = Math.max(...years.map(Number));
  const latestQuarter = Math.max(...quarters.map(q => parseInt(q.slice(1))));
  return { latestQuarter, latestYear };
};

export const isQuarterBeforeOrEqual = (year: number, quarter: number, latestYear: number, latestQuarter: number) => {
  return year < latestYear || (year === latestYear && quarter <= latestQuarter);
};

export const getBudgetForWorkgroup = (workgroup: WorkgroupBudget, quarters: string[], years: string[]) => {
  if (workgroup.sub_group_data) {
    return years.reduce((yearTotal, year) => {
      return yearTotal + quarters.reduce((quarterTotal, quarter) => {
        const quarterData = workgroup.sub_group_data.budgets[year]?.[quarter];
        return quarterTotal + (quarterData?.initial.AGIX || 0);
      }, 0);
    }, 0);
  }
  return 0;
};

const shouldIncludeReallocation = (quarter: string, year: string, selectedQuarterFilters: string[]) => {
  return selectedQuarterFilters.includes('No Quarters') || 
         selectedQuarterFilters.includes('All quarters') || 
         !selectedQuarterFilters.includes(`${quarter} ${year}`);
};

export const getReallocationForWorkgroup = (
  workgroup: WorkgroupBudget, 
  quarters: string[], 
  years: string[], 
  type: 'incoming' | 'outgoing',
  selectedQuarterFilters: string[]
) => {
  if (workgroup.sub_group_data) {
    return years.reduce((yearTotal, year) => {
      return yearTotal + quarters.reduce((quarterTotal, quarter) => {
        const quarterData = workgroup.sub_group_data.budgets[year]?.[quarter];
        if (shouldIncludeReallocation(quarter, year, selectedQuarterFilters)) {
          return quarterTotal + (quarterData?.reallocations[type].AGIX || 0);
        }
        return quarterTotal;
      }, 0);
    }, 0);
  }
  return 0;
};

export const getCumulativeReallocationForWorkgroup = (
  workgroup: WorkgroupBudget, 
  quarters: string[], 
  years: string[],
  selectedQuarterFilters: string[]
) => {
  const { latestQuarter, latestYear } = getLatestQuarterAndYear(quarters, years);
  
  if (workgroup.sub_group_data) {
    return Object.entries(workgroup.sub_group_data.budgets).reduce((totalReallocation, [year, yearData]) => {
      return totalReallocation + Object.entries(yearData).reduce((yearReallocation, [quarter, quarterData]) => {
        const currentQuarter = parseInt(quarter.slice(1));
        const currentYear = parseInt(year);
        if (isQuarterBeforeOrEqual(currentYear, currentQuarter, latestYear, latestQuarter)) {
          if (shouldIncludeReallocation(quarter, year, selectedQuarterFilters)) {
            return yearReallocation + (quarterData?.reallocations.incoming.AGIX || 0) - (quarterData?.reallocations.outgoing.AGIX || 0);
          }
        }
        return yearReallocation;
      }, 0);
    }, 0);
  }
  return 0;
};

export const getCumulativeRemainingForWorkgroup = (
  workgroup: WorkgroupBudget, 
  selectedMonths: string[], 
  data: WorkgroupData,
  selectedQuarterFilters: string[]
) => {
  const workgroupData = data.monthlyTotals.workgroupMonthly[workgroup.sub_group];
  if (workgroup.sub_group_data && workgroupData) {
    const latestMonth = getLatestSelectedMonth(selectedMonths, data);
    
    const totalBudget = Object.entries(workgroup.sub_group_data.budgets).reduce((total, [year, yearData]) => {
      return total + Object.entries(yearData).reduce((yearTotal, [quarter, quarterData]) => {
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

    const totalReallocation = Object.entries(workgroup.sub_group_data.budgets).reduce((total, [year, yearData]) => {
      return total + Object.entries(yearData).reduce((yearTotal, [quarter, quarterData]) => {
        const monthsInQuarter = getMonthsInQuarter(quarter, year);
        if (monthsInQuarter.some(month => isMonthBeforeOrEqual(month, latestMonth))) {
          if (shouldIncludeReallocation(quarter, year, selectedQuarterFilters)) {
            return yearTotal + (quarterData?.reallocations.incoming.AGIX || 0) - (quarterData?.reallocations.outgoing.AGIX || 0);
          }
        }
        return yearTotal;
      }, 0);
    }, 0);

    return totalBudget - totalSpent + totalReallocation;
  }
  return 0;
};

export const getLatestSelectedMonth = (months: string[], data: WorkgroupData) => {
  if (months.includes('All months') || months.length === 0) {
    return getLatestMonth(Object.keys(data.monthlyTotals.totalMonthly));
  }
  return getLatestMonth(months);
};

export const getLatestMonth = (months: string[]): string => {
  return months.reduce((latest, current) => {
    const [latestMonth, latestYear] = latest.split('.').map(Number);
    const [currentMonth, currentYear] = current.split('.').map(Number);
    if (currentYear > latestYear || (currentYear === latestYear && currentMonth > latestMonth)) {
      return current;
    }
    return latest;
  }, months[0] || 'All months');
};

export const isMonthBeforeOrEqual = (month: string, latestMonth: string) => {
  const [monthNum, year] = month.split('.').map(Number);
  const [latestMonthNum, latestYear] = latestMonth.split('.').map(Number);
  return year < latestYear || (year === latestYear && monthNum <= latestMonthNum);
};

export const getMonthsInQuarter = (quarter: string, year: string) => {
  const quarterNum = parseInt(quarter.slice(1));
  const startMonth = (quarterNum - 1) * 3 + 1;
  return [
    `${String(startMonth).padStart(2, '0')}.${year}`,
    `${String(startMonth + 1).padStart(2, '0')}.${year}`,
    `${String(startMonth + 2).padStart(2, '0')}.${year}`,
  ];
};

export const getSpentForWorkgroup = (workgroupName: string, selectedMonths: string[], data: WorkgroupData) => {
  const workgroupData = data.monthlyTotals.workgroupMonthly[workgroupName];
  if (!workgroupData || !workgroupData.AGIX) return 0;

  if (selectedMonths.includes('All months') || selectedMonths.length === 0) {
    return Object.values(workgroupData.AGIX).reduce((sum, amount) => sum + amount, 0);
  }

  return selectedMonths.reduce((sum, month) => {
    return sum + (workgroupData.AGIX[month] || 0);
  }, 0);
};

