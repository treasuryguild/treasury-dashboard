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

        // Convert the Set to an Array and sort in descending order
        return Array.from(months).sort((a, b) => {
            let [monthA, yearA] = a.split('.').map(Number);
            let [monthB, yearB] = b.split('.').map(Number);

            // Compare by year, then by month if the years are equal
            if (yearA === yearB) {
                return monthB - monthA;
            }
            return yearB - yearA;
        });
    }

    function chart1(filteredDistributions) {
        return {};
    }

    function chart2(filteredDistributions) {
        let dataByMonth = {};
        let labels = new Set();
        let allTokens = new Set();
    
        // Identify all unique tokens
        if (selectedTokens.includes('All tokens')) {
            filteredDistributions.forEach(distribution => {
                distribution.tokens.forEach(token => allTokens.add(token));
            });
        } else {
            selectedTokens.forEach(token => allTokens.add(token));
        }
    
        // Initialize labels for selected months
        if (selectedMonths.includes('All months')) {
            labels = extractAndSortTaskMonths(distributionsArray);
        } else {
            // Add specified selected months to labels
            selectedMonths.forEach(month => labels.add(month));
        }
    
        // Initialize dataByMonth for each month in labels for all tokens
        labels.forEach(label => {
            dataByMonth[label] = {};
            allTokens.forEach(token => {
                dataByMonth[label][token] = 0;
            });
        });
    
        // Process filtered distributions
        filteredDistributions.forEach(distribution => {
            if (distribution.tx_type === "Outgoing") {
                const [day, month, year] = distribution.task_date.split('.');
                const fullYear = year.length === 2 ? '20' + year : year;
                const formattedTaskDate = month + '.' + fullYear;
            
                distribution.tokens.forEach((token, index) => {
                    if (allTokens.has(token)) {
                        // Ensure the date and token keys exist in dataByMonth
                        if (!dataByMonth[formattedTaskDate]) {
                            dataByMonth[formattedTaskDate] = {};
                        }
                        if (!dataByMonth[formattedTaskDate][token]) {
                            dataByMonth[formattedTaskDate][token] = 0;
                        }
                        // Then proceed with the operation
                        dataByMonth[formattedTaskDate][token] += Number(parseFloat(distribution.amounts[index]).toFixed(0));
                    }
                });
            }
        });
    
        let labelsArray = Array.from(labels);
    
        let data = [];
        if (allTokens.size > 1) {
            labelsArray.forEach(label => {
                let tokenData = { x: label };
                allTokens.forEach(token => {
                    tokenData[token] = dataByMonth[label][token];
                });
                data.push(tokenData);
            });
        } else {
            labelsArray.forEach(label => {
                const token = allTokens.values().next().value;
                data.push(dataByMonth[label][token]);
            });
        }
    
        return { labels: labelsArray, data };
    }
    
    function chart3(filteredDistributions) {
        let labels = new Set();
        let monthData = {};
    
        // Handle selected months
        if (selectedMonths.includes('All months')) {
            labels = new Set(extractAndSortTaskMonths(distributionsArray));
        } else {
            selectedMonths.forEach(month => labels.add(month));
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

    function table1(filteredDistributions) {
        return {};
    }
    function table2(filteredDistributions) {
        return {};
    }

    const output = {
        chart1: chart1(filteredDistributions), 
        chart2: chart2(filteredDistributions), 
        chart3: chart3(filteredDistributions), 
        table1: table1(filteredDistributions), 
        table2: table2(filteredDistributions), 
        filteredDistributions: filteredDistributions
    };
    console.log(output)
    return output;
}