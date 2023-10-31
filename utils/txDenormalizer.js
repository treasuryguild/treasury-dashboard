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
                    let { task_date, distributions, ...otherContributionData } = contribution;

                    // If task_date is null or empty, use transformedDate
                    let taskTransformedDate = task_date || transformedDate;

                    if (contribution.distributions) {
                        for (let distribution of contribution.distributions) {
                            distributionsArray.push({
                                ...distribution,
                                ...otherContributionData,
                                task_date: taskTransformedDate,
                                transaction_id,
                                transaction_date: transformedDate,
                                tx_type,
                                tx_id,
                                exchange_rate
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
