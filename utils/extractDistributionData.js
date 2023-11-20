export function extractDistributionData(distributions) {
    const tokensSet = new Set();
    const monthsSet = new Set();
    const workgroupsSet = new Set();
    const labelsSet = new Set();

    distributions.forEach(distribution => {
        // Add tokens
        distribution.tokens.forEach(token => {
                tokensSet.add(token);
        });

        // Add month (extracted from task_date or transaction_date)
        const dateString = distribution.task_date || distribution.transaction_date;
        if (dateString) {
            const dateParts = dateString.split('.');
            const monthYear = `${dateParts[1]}.${'20' + dateParts[2]}`; // Assuming year is in YY format and needs conversion to YYYY
            monthsSet.add(monthYear);
        }

        // Add workgroup
        if (distribution.task_sub_group) {
            workgroupsSet.add(distribution.task_sub_group);
        }       

        // Add labels (splitting the task_label string into individual labels)
        if (distribution.task_label) {
            distribution.task_label.forEach(label => {
                const trimmedLabel = label.trim();
                if (trimmedLabel && trimmedLabel !== "incoming" && trimmedLabel !== "staking" && trimmedLabel !== "swap" && trimmedLabel !== "internal-transfer" && trimmedLabel !== "minting") {
                    labelsSet.add(trimmedLabel);
                }
            });
        }
    });

    // Convert sets to arrays
    return {
        tokens: Array.from(tokensSet),
        months: Array.from(monthsSet).sort((a, b) => b.localeCompare(a)),
        workgroups: Array.from(workgroupsSet),
        labels: Array.from(labelsSet)
    };
}
