let report = {};
export async function getReport(txs) {

  async function generateReport() {
    report = {};
    txs.forEach(tx => {
      if (tx.tx_type === "Outgoing") { // Only process Outgoing transactions
        tx.contributions.forEach(contribution => {
          const workgroup = contribution.task_sub_group || "not-recorded";
          let taskDate;
          if (contribution.task_date) {
            const [day, month, year] = contribution.task_date.split('.');
            taskDate = new Date(`20${year}`, month - 1, day);
          } else {
            taskDate = new Date(parseInt(tx.transaction_date));
          }

          const monthYear = `${taskDate.getMonth() + 1}.${taskDate.getFullYear()}`;

          // Initialize the month if not already present
          if (!report[monthYear]) {
            report[monthYear] = {};
          }

          // Initialize the workgroup if not already present
          if (!report[monthYear][workgroup]) {
            report[monthYear][workgroup] = {};
          }

          // Iterate through the distributions and add the amounts
          contribution.distributions.forEach(distribution => {
            distribution.tokens.forEach((token, index) => {
              const amount = distribution.amounts[index];

              if (!report[monthYear][workgroup][token]) {
                report[monthYear][workgroup][token] = 0;
              }

              report[monthYear][workgroup][token] += amount;
            });
          });
        });
      }
    });
    console.log("Report", report);
  }

  function processIncomingTransactions(txs, report) {
    txs.forEach(tx => {
      if (tx.tx_type === "Incoming") { // Only process Incoming transactions
  
        // Check if the incoming amount is bigger than 10 AGIX
        const AGIXIndex = tx.total_tokens.indexOf('AGIX');
        if (AGIXIndex >= 0 && tx.total_amounts[AGIXIndex] > 10) {
  
          // Determine the task date
          const transactionDate = new Date(parseInt(tx.transaction_date));
          let taskDate;
  
          // Check if the transaction happened 10 days before the end of the month
          if (transactionDate.getDate() > (new Date(transactionDate.getFullYear(), transactionDate.getMonth() + 1, 0).getDate() - 10)) {
            // Add one month if within 10 days of the end of the month
            taskDate = new Date(transactionDate.getFullYear(), transactionDate.getMonth() + 1, 1);
          } else {
            taskDate = transactionDate;
          }
  
          const monthYear = `${taskDate.getMonth() + 1}.${taskDate.getFullYear()}`;
  
          // Initialize the month if not already present
          if (!report[monthYear]) {
            report[monthYear] = {};
          }
  
          // Initialize the monthly budget if not already present
          if (!report[monthYear]['monthly-budget']) {
            report[monthYear]['monthly-budget'] = {};
          }
  
          // Add the amount to the monthly budget
          if (!report[monthYear]['monthly-budget']['AGIX']) {
            report[monthYear]['monthly-budget']['AGIX'] = 0;
          }
  
          report[monthYear]['monthly-budget']['AGIX'] += tx.total_amounts[AGIXIndex];
        }
      }
    });
  }  
  
  await generateReport();
  processIncomingTransactions(txs, report);

  return report;
}
