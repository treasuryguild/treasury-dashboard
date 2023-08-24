let report = {}
export async function getReport(txs) {

  async function generateReport() {
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

  await generateReport();

  return report;
}
