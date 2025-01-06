// ../utils/processSnetDashboardData.js
export function processDashboardData(selectedMonths, selectedWorkgroups, selectedTokens, selectedLabels, distributionsArray, budgets) {

    const filteredDistributions = distributionsArray.filter(distribution => {
        // Convert task_date to "MM.YYYY" format with a four-digit year
        const [day, month, year] = distribution.task_date.split('.');
        const fullYear = year.length === 2 ? '20' + year : year; // Adjust this line based on your data's year format
        const formattedTaskDate = month + '.' + fullYear;

        // Check if the distribution matches the selected months
        const isMonthMatch = selectedMonths.includes('All months') || selectedMonths.includes(formattedTaskDate);

        // Check if the distribution matches the selected workgroups
        const isWorkgroupMatch = selectedWorkgroups.includes('All workgroups') || selectedWorkgroups.includes(distribution.task_sub_group);

        // Check if the distribution matches the selected tokens
        const isTokenMatch = selectedTokens.includes('All tokens') || distribution.tokens.some(token => selectedTokens.includes(token));

        // Check if the distribution matches the selected labels
        const isLabelMatch = selectedLabels.includes('All labels') || distribution.task_label.some(label => selectedLabels.includes(label));

        return isMonthMatch && isWorkgroupMatch && isTokenMatch && isLabelMatch;
    });

    function aggregateMonthlyIncomingTokens(distributionsArray) {
        let monthlyIncoming = {};
    
        distributionsArray.forEach(distribution => {
            // Consider only incoming transactions
            if (distribution.tx_type === "Incoming") {
                // Adjust the month based on the transaction date
                const adjustedTaskDate = getAdjustedMonth(distribution.task_date);
    
                // Initialize month entry if it doesn't exist
                if (!monthlyIncoming[adjustedTaskDate]) {
                    monthlyIncoming[adjustedTaskDate] = {};
                }
    
                // Add the token amounts for the month
                distribution.tokens.forEach((token, index) => {
                    if (!monthlyIncoming[adjustedTaskDate][token]) {
                        monthlyIncoming[adjustedTaskDate][token] = 0;
                    }
                    monthlyIncoming[adjustedTaskDate][token] += Number(distribution.amounts[index]);
                });
            }
        });
    
        // Convert the object to an array of objects
        return Object.keys(monthlyIncoming).map(month => {
            return {
                month: month,
                tokens: monthlyIncoming[month]
            };
        });
    }
    
    function extractAndSortTaskMonths(distributionsArray) {
        let months = new Set();
    
        distributionsArray.forEach(item => {
            if (item.task_date) {
                let [day, month, year] = item.task_date.split(".");
                months.add(month + '.' + '20' + year);
            }
        });
    
        return Array.from(months).sort(ascendingMonthSort);
    }
    
    
    function chart3(filteredDistributions) {
        let labels = new Set();
        let monthData = {};
    
        // Handle selected months
        if (selectedMonths.includes('All months')) {
            labels = new Set(extractAndSortTaskMonths(distributionsArray));
        } else {
            // Add specified selected months to labels and sort
            selectedMonths.forEach(month => labels.add(month));
            labels = new Set(Array.from(labels).sort(ascendingMonthSort));
        }
    
        // Initialize monthData with labels
        labels.forEach(label => {
            monthData[label] = { tasks: new Set(), contributors: new Set() };
        });
    
        // Process filtered distributions
        filteredDistributions.forEach(distribution => {
            const [day, month, year] = distribution.task_date.split('.');
            const fullYear = year.length === 2 ? '20' + year : year;
            const formattedTaskDate = month + '.' + fullYear;
    
            if (labels.has(formattedTaskDate)) {
                monthData[formattedTaskDate].tasks.add(distribution.contribution_id);
                monthData[formattedTaskDate].contributors.add(distribution.contributor_id);
            }
        });
    
        // Convert Sets to counts and prepare data for chart
        let data = [];
        labels.forEach(label => {
            data.push({
                x: label,
                tasks: monthData[label].tasks.size,
                contributors: monthData[label].contributors.size
            });
        });
    
        return { labels: Array.from(labels), data };
    }
    
    // Function to sort months in ascending order
    function ascendingMonthSort(a, b) {
        let [monthA, yearA] = a.split('.').map(Number);
        let [monthB, yearB] = b.split('.').map(Number);
    
        // Compare by year first, then by month if years are equal
        if (yearA === yearB) {
            return monthA - monthB;
        }
        return yearA - yearB;
    }    

    function isDateString(str) {
        const regex = /^\d{2}\.\d{4}$/; // Regex to match "MM.YYYY" format
        return regex.test(str);
    }

    function generateChartData(filteredDistributions, groupBy, aggregationKey = 'amounts') {
        let dataByGroup = {};
        let allTokens = new Set();
        let groups = new Set();

        // Identify all unique tokens
        if (selectedTokens.includes('All tokens')) {
            filteredDistributions.forEach(distribution => {
                if (distribution.tx_type === "Outgoing") {
                    distribution.tokens.forEach(token => allTokens.add(token));
                }
            });
        } else {
            selectedTokens.forEach(token => allTokens.add(token));
        }

        // Initialize groups and dataByGroup
        filteredDistributions.forEach(distribution => {
            if (distribution.tx_type === "Outgoing") {
                let groupValue;
                switch(groupBy) {
                    case 'workgroup':
                        groupValue = distribution.task_sub_group;
                        break;
                    case 'month':
                        groupValue = getFormattedTaskDate(distribution.task_date);
                        break;
                    case 'contributor':
                        groupValue = distribution.contributor_id;
                        break;
                    default:
                        groupValue = distribution[groupBy];
                }
                groups.add(groupValue);
                if (!dataByGroup[groupValue]) {
                    dataByGroup[groupValue] = {};
                    allTokens.forEach(token => {
                        dataByGroup[groupValue][token] = 0;
                    });
                }
            }
        });

        // Aggregate data by group
        filteredDistributions.forEach(distribution => {
            if (distribution.tx_type === "Outgoing") {
                let groupValue;
                switch(groupBy) {
                    case 'workgroup':
                        groupValue = distribution.task_sub_group;
                        break;
                    case 'month':
                        groupValue = getFormattedTaskDate(distribution.task_date);
                        break;
                    case 'contributor':
                        groupValue = distribution.contributor_id;
                        break;
                    default:
                        groupValue = distribution[groupBy];
                }

                distribution[aggregationKey].forEach((amount, index) => {
                    if (allTokens.has(distribution.tokens[index])) {
                        dataByGroup[groupValue][distribution.tokens[index]] += Number(parseFloat(amount).toFixed(0));
                    }
                });
            }
        });

        // Prepare data for chart
        let labelsArray = Array.from(groups);
        if (labelsArray.length > 0 && isDateString(labelsArray[0])) {
            labelsArray.sort(ascendingMonthSort); // Sorts in ascending order by month and year
        } else {
            labelsArray.sort(); 
        }

        let data;
        if (allTokens.size > 1) {
            data = labelsArray.map(groupValue => {
                let groupData = { x: groupValue };
                allTokens.forEach(token => {
                    groupData[token] = dataByGroup[groupValue][token];
                });
                return groupData;
            });
        } else {
            // When there is only one token
            const token = allTokens.values().next().value;
            data = labelsArray.map(groupValue => dataByGroup[groupValue][token]);
        }

        return { labels: labelsArray, data };
    }

// Helper function to format task date
function getFormattedTaskDate(taskDate) {
    const [day, month, year] = taskDate.split('.');
    const fullYear = year.length === 2 ? '20' + year : year;
    return month + '.' + fullYear;
}

function getFormattedTaskDate(taskDate) {
    const [day, month, year] = taskDate.split('.');
    const fullYear = year.length === 2 ? '20' + year : year;
    return `${month}.${fullYear}`;
}

function getAdjustedMonth(taskDate) {
    const [day, month, year] = taskDate.split('.').map(Number);
    const fullYear = year < 100 ? 2000 + year : year; // Ensure the year is in four-digit format
    let adjustedMonth = month;
    let adjustedYear = fullYear;

    // Check if date is within the last 10 days of the month
    const daysInMonth = new Date(fullYear, month, 0).getDate();
    if (day > daysInMonth - 10) {
        // Increment month
        adjustedMonth++;
        if (adjustedMonth > 12) {
            adjustedMonth = 1;
            adjustedYear++;
        }
    }

    return `${adjustedMonth < 10 ? '0' + adjustedMonth : adjustedMonth}.${adjustedYear}`;
}

function createTable1Data(filteredDistributions) {
    // Get the incoming amounts for all months
    const allIncomingAmounts = aggregateMonthlyIncomingTokens(distributionsArray);

    // Convert it into a more accessible format
    let incomingTotalsByMonth = {};
    allIncomingAmounts.forEach(monthData => {
        incomingTotalsByMonth[monthData.month] = monthData.tokens;
    });

    // Find the last month with outgoing transactions
    let lastOutgoingMonth = null;
    filteredDistributions.forEach(distribution => {
        if (distribution.tx_type === "Outgoing") {
            const formattedDate = getFormattedTaskDate(distribution.task_date);
            if (!lastOutgoingMonth) {
                lastOutgoingMonth = formattedDate;
            } else {
                // Compare dates to find the latest
                const [currentMonth, currentYear] = formattedDate.split('.').map(Number);
                const [lastMonth, lastYear] = lastOutgoingMonth.split('.').map(Number);
                if (currentYear > lastYear || (currentYear === lastYear && currentMonth > lastMonth)) {
                    lastOutgoingMonth = formattedDate;
                }
            }
        }
    });

    let monthlyData = {};

    // If there are no outgoing transactions, show all months from budgets
    if (!lastOutgoingMonth) {
        for (const month in budgets) {
            monthlyData[month] = {
                month: month,
                agix: 0,
                monthlyBudget: budgets[month],
                mbBalance: budgets[month], // Balance will be equal to budget when no transactions
                incomingReserve: 0
            };
        }
    } else {
        // Initialize data for all relevant months from budgets
        // Only include months up to and including the last outgoing month
        for (const month in budgets) {
            const [budgetMonth, budgetYear] = month.split('.').map(Number);
            const [lastMonth, lastYear] = lastOutgoingMonth.split('.').map(Number);
            
            // Only include this month if it's before or equal to the last outgoing month
            if (budgetYear < lastYear || (budgetYear === lastYear && budgetMonth <= lastMonth)) {
                monthlyData[month] = {
                    month: month,
                    agix: 0,
                    monthlyBudget: budgets[month],
                    mbBalance: 0,
                    incomingReserve: 0
                };
            }
        }

        // Process all distributions
        filteredDistributions.forEach(distribution => {
            let formattedTaskDate = getFormattedTaskDate(distribution.task_date);

            if (distribution.tx_type === "Incoming") {
                formattedTaskDate = getAdjustedMonth(distribution.task_date);
            }

            // Only process if this month is before or equal to the last outgoing month
            const [currentMonth, currentYear] = formattedTaskDate.split('.').map(Number);
            const [lastMonth, lastYear] = lastOutgoingMonth.split('.').map(Number);
            
            if (currentYear < lastYear || (currentYear === lastYear && currentMonth <= lastMonth)) {
                // Initialize monthly data if not already initialized from budgets
                if (!monthlyData[formattedTaskDate]) {
                    monthlyData[formattedTaskDate] = {
                        month: formattedTaskDate,
                        agix: 0,
                        monthlyBudget: budgets[formattedTaskDate] || 0,
                        mbBalance: 0,
                        incomingReserve: 0
                    };
                }

                // Aggregate data based on tx_type
                if (distribution.tx_type === "Outgoing" && distribution.tokens.includes('AGIX')) {
                    monthlyData[formattedTaskDate].agix += Number(parseFloat(distribution.amounts[distribution.tokens.indexOf('AGIX')]).toFixed(0));
                } else if (distribution.tx_type === "Incoming Reserve" && distribution.tokens.includes('AGIX')) {
                    monthlyData[formattedTaskDate].incomingReserve += Number(parseFloat(distribution.amounts[distribution.tokens.indexOf('AGIX')]).toFixed(0));
                }
            }
        });

        // Calculate MB Balance for each month
        for (const month in monthlyData) {
            monthlyData[month].mbBalance = monthlyData[month].monthlyBudget - monthlyData[month].agix;
        }
    }

    let sortedData = Object.values(monthlyData).sort((a, b) => {
        const [monthA, yearA] = a.month.split('.').map(Number);
        const [monthB, yearB] = b.month.split('.').map(Number);

        // First compare by year, then by month
        if (yearA !== yearB) {
            return yearB - yearA; // Descending order of year
        }
        return monthB - monthA; // Descending order of month
    });

    // Calculate totals
    let totals = {
        month: "Totals",
        agix: 0,
        monthlyBudget: 0,
        mbBalance: 0,
        incomingReserve: 0
    };

    sortedData.forEach(row => {
        totals.agix += row.agix;
        totals.monthlyBudget += row.monthlyBudget;
        totals.mbBalance += row.mbBalance;
        totals.incomingReserve += row.incomingReserve;
    });

    // Append the totals row to the sorted data
    sortedData.push(totals);

    let balanceRow = {
        month: "Balance",
        agix: '', 
        monthlyBudget: '', 
        mbBalance: totals.monthlyBudget - totals.agix + totals.incomingReserve,
        incomingReserve: '' 
    };
    sortedData.push(balanceRow);

    return sortedData;
}

    function createTable2Data(filteredDistributions) {
        let taskData = {};
        let tokenTotals = {};
    
        // Initialize token totals
        selectedTokens.forEach(token => tokenTotals[token] = 0);
    
        filteredDistributions.forEach(distribution => {
            let taskNameOrDescription = distribution.task_name || distribution.task_description;
            if (Array.isArray(taskNameOrDescription)) {
                taskNameOrDescription = taskNameOrDescription.join(" ");
            }
    
            let uniqueTaskKey = taskNameOrDescription + '_' + distribution.task_date;
    
            // Initialize task data
            if (!taskData[uniqueTaskKey]) {
                taskData[uniqueTaskKey] = {
                    'Task name': taskNameOrDescription,
                    'Date': distribution.task_date
                };
                selectedTokens.forEach(token => taskData[uniqueTaskKey][token] = 0);
            }
    
            // Aggregate token amounts for the task
            distribution.tokens.forEach((token, index) => {
                if (selectedTokens.includes(token)) {
                    const amount = Number(parseFloat(distribution.amounts[index]).toFixed(0));
                    taskData[uniqueTaskKey][token] += amount;
                    tokenTotals[token] += amount; // Add to token totals
                }
            });
        });
    
        // Convert to array of objects
        let sortedData = Object.values(taskData);
    
        sortedData.sort((a, b) => {
            const dateA = a.Date.split('.').map(Number); // Convert date to [day, month, year]
            const dateB = b.Date.split('.').map(Number);
            const fullYearA = dateA[2] < 100 ? 2000 + dateA[2] : dateA[2];
            const fullYearB = dateB[2] < 100 ? 2000 + dateB[2] : dateB[2];
            const dateObjA = new Date(fullYearA, dateA[1] - 1, dateA[0]);
            const dateObjB = new Date(fullYearB, dateB[1] - 1, dateB[0]);
            return dateObjB - dateObjA;
        });
    
        // Append the totals row to the sorted data
        let totalsRow = { 'Task name': 'Totals', 'Date': '' };
        Object.keys(tokenTotals).forEach(token => {
            totalsRow[token] = tokenTotals[token];
        });
        sortedData.push(totalsRow);
    
        return sortedData;
    }
    
    function createTable3Data(filteredDistributions, selectedWorkgroups) {
        if (selectedWorkgroups.length <= 0 && !selectedWorkgroups.includes('All workgroups')) {
            return []; // Return an empty array if the condition is not met
        }
    
        let workgroupData = {};
        let tokenTotals = {};
    
        // Initialize token totals
        selectedTokens.forEach(token => tokenTotals[token] = 0);
    
        filteredDistributions.forEach(distribution => {
            const workgroup = distribution.task_sub_group;
            
            // Skip empty workgroup names
            if (!workgroup || workgroup.trim() === '') {
                return;
            }
    
            // Initialize workgroup data
            if (!workgroupData[workgroup]) {
                workgroupData[workgroup] = { 'Workgroup': workgroup };
                selectedTokens.forEach(token => workgroupData[workgroup][token] = 0);
            }
    
            // Aggregate token amounts for the workgroup
            distribution.tokens.forEach((token, index) => {
                if (selectedTokens.includes(token)) {
                    const amount = Number(parseFloat(distribution.amounts[index]).toFixed(0));
                    workgroupData[workgroup][token] += amount;
                    tokenTotals[token] += amount; // Add to token totals
                }
            });
        });
    
        // Convert to array of objects
        let sortedData = Object.values(workgroupData);
    
        // Append the totals row to the sorted data
        let totalsRow = { 'Workgroup': 'Totals' };
        Object.keys(tokenTotals).forEach(token => {
            totalsRow[token] = tokenTotals[token];
        });
        sortedData.push(totalsRow);
    
        return sortedData;
    }

    function calculateMonthlyTotals(distributionsArray, selectedMonths, selectedWorkgroups, selectedTokens) {
        let monthlyTotals = {};
        let workgroupTotals = {};
        
        // Sort all unique months from the entire distributionsArray
        let allMonths = [...new Set(distributionsArray.map(d => getFormattedTaskDate(d.task_date)))];
        allMonths.sort((a, b) => {
            const [monthA, yearA] = a.split('.').map(Number);
            const [monthB, yearB] = b.split('.').map(Number);
            return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
        });
    
        // Find the latest selected month
        let latestSelectedMonth = selectedMonths.includes('All months') 
            ? allMonths[allMonths.length - 1] 
            : selectedMonths.sort((a, b) => {
                const [monthA, yearA] = a.split('.').map(Number);
                const [monthB, yearB] = b.split('.').map(Number);
                return new Date(yearB, monthB - 1) - new Date(yearA, monthA - 1);
              })[0];
    
        // Initialize monthly and workgroup totals for all months
        allMonths.forEach(month => {
            monthlyTotals[month] = {};
            selectedTokens.forEach(token => monthlyTotals[month][token] = 0);
        });
    
        let allWorkgroups = [...new Set(distributionsArray.map(d => d.task_sub_group).filter(group => group && group.trim() !== ''))];
        allWorkgroups.forEach(workgroup => {
            if (workgroup !== 'All workgroups') {
                workgroupTotals[workgroup] = {};
                selectedTokens.forEach(token => {
                    workgroupTotals[workgroup][token] = {};
                    allMonths.forEach(month => {
                        workgroupTotals[workgroup][token][month] = 0;
                    });
                });
            }
        });
    
        // Calculate monthly and workgroup totals
        distributionsArray.forEach(distribution => {
            if (distribution.tx_type === "Outgoing") {
                const month = getFormattedTaskDate(distribution.task_date);
                const workgroup = distribution.task_sub_group;
    
                distribution.tokens.forEach((token, index) => {
                    if (selectedTokens.includes(token) || selectedTokens.includes('All tokens')) {
                        const amount = Number(distribution.amounts[index]);
                        monthlyTotals[month][token] = (Number(monthlyTotals[month][token]) || 0) + amount;
    
                        if (workgroup && (selectedWorkgroups.includes(workgroup) || selectedWorkgroups.includes('All workgroups'))) {
                            if (!workgroupTotals[workgroup]) {
                                workgroupTotals[workgroup] = {};
                            }
                            if (!workgroupTotals[workgroup][token]) {
                                workgroupTotals[workgroup][token] = {};
                                allMonths.forEach(m => {
                                    workgroupTotals[workgroup][token][m] = 0;
                                });
                            }
                            workgroupTotals[workgroup][token][month] = (Number(workgroupTotals[workgroup][token][month]) || 0) + amount;
                        }
                    }
                });
            }
        });
    
        // Filter months up to and including the latest selected month
        let relevantMonths = allMonths.filter(month => {
            const [monthNum, year] = month.split('.').map(Number);
            const [latestMonthNum, latestYear] = latestSelectedMonth.split('.').map(Number);
            return (year < latestYear) || (year === latestYear && monthNum <= latestMonthNum);
        });
    
        // Filter the results to include only relevant months
        let filteredMonthlyTotals = {};
        relevantMonths.forEach(month => {
            filteredMonthlyTotals[month] = monthlyTotals[month];
        });
    
        let filteredWorkgroupTotals = {};
        Object.keys(workgroupTotals).forEach(workgroup => {
            filteredWorkgroupTotals[workgroup] = {};
            Object.keys(workgroupTotals[workgroup]).forEach(token => {
                filteredWorkgroupTotals[workgroup][token] = {};
                relevantMonths.forEach(month => {
                    filteredWorkgroupTotals[workgroup][token][month] = workgroupTotals[workgroup][token][month];
                });
            });
        });
    
        return {
            totalMonthly: filteredMonthlyTotals,
            workgroupMonthly: filteredWorkgroupTotals
        };
    }

    const output = {
        chart1: generateChartData(filteredDistributions, 'workgroup'), 
        chart2: generateChartData(filteredDistributions, 'month'), 
        chart3: chart3(filteredDistributions), 
        chart4: generateChartData(filteredDistributions, 'contributor'),
        table1: createTable1Data(filteredDistributions), 
        table2: createTable2Data(filteredDistributions),
        table3: createTable3Data(filteredDistributions, selectedWorkgroups),
        filteredDistributions: filteredDistributions,
        monthlyTotals: calculateMonthlyTotals(distributionsArray, selectedMonths, selectedWorkgroups, selectedTokens),
    };
    //console.log("output", output)
    return output;
}