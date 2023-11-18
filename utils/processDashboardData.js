export function processDashboardData(selectedMonths, selectedWorkgroups, selectedTokens, selectedLabels, distributionsArray) {

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
    
    function extractAndSortTaskMonths(distributionsArray) {
        let months = new Set();
    
        distributionsArray.forEach(item => {
            if (item.task_date) {
                let [day, month, year] = item.task_date.split(".");
                months.add(month + '.' + '20' + year);
            }
        });
    
        return Array.from(months).sort(descendingMonthSort);
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
            labels = new Set(Array.from(labels).sort(descendingMonthSort));
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
    
    // Function to sort months in descending order
    function descendingMonthSort(a, b) {
        let [monthA, yearA] = a.split('.').map(Number);
        let [monthB, yearB] = b.split('.').map(Number);
    
        // Compare by year, then by month if the years are equal
        if (yearA === yearB) {
            return monthB - monthA;
        }
        return yearB - yearA;
    }

    function generateChartData(filteredDistributions, groupBy) {
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
            let groupValue = groupBy === 'workgroup' ? distribution.task_sub_group : getFormattedTaskDate(distribution.task_date);
            groups.add(groupValue);
            if (!dataByGroup[groupValue]) {
                dataByGroup[groupValue] = {};
                allTokens.forEach(token => {
                    dataByGroup[groupValue][token] = 0;
                });
            }
        }
    });

    // Aggregate token amounts by group
    filteredDistributions.forEach(distribution => {
        if (distribution.tx_type === "Outgoing") {
            let groupValue = groupBy === 'workgroup' ? distribution.task_sub_group : getFormattedTaskDate(distribution.task_date);
            distribution.tokens.forEach((token, index) => {
                if (allTokens.has(token)) {
                    dataByGroup[groupValue][token] += Number(parseFloat(distribution.amounts[index]).toFixed(0));
                }
            });
        }
    });

    // Prepare data for chart
    let labelsArray = Array.from(groups);
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

const chart1Data = generateChartData(filteredDistributions, 'workgroup');
const chart2Data = generateChartData(filteredDistributions, 'month');
console.log("chart1Data, chart2Data", chart1Data, chart2Data)

    function table1(filteredDistributions) {
        return {};
    }
    function table2(filteredDistributions) {
        return {};
    }

    const output = {
        chart1: generateChartData(filteredDistributions, 'workgroup'), 
        chart2: generateChartData(filteredDistributions, 'month'), 
        chart3: chart3(filteredDistributions), 
        table1: table1(filteredDistributions), 
        table2: table2(filteredDistributions), 
        filteredDistributions: filteredDistributions
    };
    console.log(output)
    return output;
}