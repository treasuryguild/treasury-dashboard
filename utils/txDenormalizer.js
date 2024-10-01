export async function txDenormalizer(txs) {
    async function generateReport() {
        let distributionsArray = [];
        for (let tx of txs) {
            let { transaction_id, transaction_date, tx_type, tx_id, exchange_rate } = tx;

            if (typeof transaction_date === 'string') {
                transaction_date = parseInt(transaction_date, 10);
            }            
            // Transforming Unix timestamp to DD.MM.YY format
            let transformedDate;
            if (transaction_date > 1000000000000) {  // likely in milliseconds
                transformedDate = new Date(transaction_date);
            } else {  // likely in seconds
                transformedDate = new Date(transaction_date * 1000);
            }
            //console.log("transformedDate", transformedDate)
            transformedDate = transformedDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            }).replace(/\//g, '.');

            if (tx.contributions) {
                for (let contribution of tx.contributions) {
                    let { task_date, distributions, task_sub_group, ...otherContributionData } = contribution;

                    // If task_date is null or empty, use transformedDate
                    let taskTransformedDate = task_date || transformedDate;

                    let formattedTaskSubGroup = task_sub_group
                        ? task_sub_group.replace(/ /g, '-').toLowerCase()
                        : '';

                    if (contribution.distributions) {
                        for (let distribution of contribution.distributions) {
                            // Transform task_label into an array of formatted strings
                            let formattedTaskLabels = [];
                            if (contribution.task_label) {
                                formattedTaskLabels = contribution.task_label.split(',').map(label => 
                                    label.trim().replace(/ /g, '-').toLowerCase()
                                );
                            }
                            let formattedTokens = distribution.tokens.map(token => {
                                if (token.toLowerCase() === 'ada') {
                                    return 'ADA';
                                } else if (token.toLowerCase() === 'gimbal') {
                                    return 'GMBL';
                                } else if (token.toLowerCase() === 'minutes') {
                                    return 'MINS';
                                } else {
                                    return token;
                                }
                            });
                            distributionsArray.push({
                                ...distribution,
                                ...otherContributionData,
                                task_sub_group: formattedTaskSubGroup,
                                task_date: taskTransformedDate,
                                transaction_id,
                                transaction_date: transformedDate,
                                tx_type,
                                tx_id,
                                exchange_rate,
                                task_label: formattedTaskLabels,
                                tokens: formattedTokens 
                            });
                        }
                    }
                }
            }
        }
        return distributionsArray;
    }

    let distributionsArray = await generateReport();
    return distributionsArray;
}
