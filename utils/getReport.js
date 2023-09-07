export async function getReport(txs) {
  
  async function generateReport() {
  let localReport = {};
  txs.forEach(tx => {
    const taskDate = new Date(parseInt(tx.transaction_date));
    const monthYear = `${taskDate.getMonth() + 1}.${taskDate.getFullYear()}`;

    if (!localReport[monthYear]) {
      localReport[monthYear] = {};
    }

    if (tx.tx_type === "Outgoing") {
      tx.contributions.forEach(contribution => {
        let workgroup = contribution.task_sub_group || "not-recorded";
        workgroup = workgroup.replace(/ /g, '-').toLowerCase();
      
        if (!localReport[monthYear][workgroup]) {
          localReport[monthYear][workgroup] = { totalAmounts: {}, labels: {}, tasks: {} };
        }
        if (!localReport[monthYear][workgroup]['totalTasks']) {
          localReport[monthYear][workgroup]['totalTasks'] = 0;
        }
        localReport[monthYear][workgroup]['totalTasks']++;
        const labelsArray = contribution.task_label.split(',');
        
        labelsArray.forEach(label => {
          // Incrementing task count for each label inside workgroup
          if (!localReport[monthYear][workgroup]['tasks'][label]) {
            localReport[monthYear][workgroup]['tasks'][label] = 0;
          }
          localReport[monthYear][workgroup]['tasks'][label]++;
        });
      
        contribution.distributions.forEach(distribution => {
          distribution.tokens.forEach((token, index) => {
            const amount = distribution.amounts[index];
      
            // Aggregating total amounts
            if (!localReport[monthYear][workgroup]['totalAmounts'][token]) {
              localReport[monthYear][workgroup]['totalAmounts'][token] = 0;
            }
            localReport[monthYear][workgroup]['totalAmounts'][token] += Number(amount);
          });
      
          labelsArray.forEach(label => {
            if (!localReport[monthYear][workgroup]['labels'][label]) {
              localReport[monthYear][workgroup]['labels'][label] = {};
            }
      
            distribution.tokens.forEach((token, index) => {
              const amount = distribution.amounts[index];
      
              // Aggregating labels
              if (!localReport[monthYear][workgroup]['labels'][label][token]) {
                localReport[monthYear][workgroup]['labels'][label][token] = 0;
              }
              localReport[monthYear][workgroup]['labels'][label][token] += Number(amount);
            });
          });
        });
      });      
    }

    // Adding total-distribution
    if (tx.tx_type !== "Incoming") {
      if (!localReport[monthYear]['total-distribution']) {
        localReport[monthYear]['total-distribution'] = { totalAmounts: {}, labels: {}, tasks: {} };
      }
      if (!localReport[monthYear]['total-distribution']['totalTasks']) {
        localReport[monthYear]['total-distribution']['totalTasks'] = 0;
      }
      tx.total_tokens.forEach((token, index) => {
        const amount = tx.total_amounts[index];
        
        // Aggregating total amounts
        if (!localReport[monthYear]['total-distribution']['totalAmounts'][token]) {
          localReport[monthYear]['total-distribution']['totalAmounts'][token] = 0;
        }
        localReport[monthYear]['total-distribution']['totalAmounts'][token] += Number(amount);
      });
      
      tx.contributions.forEach(contribution => {
        localReport[monthYear]['total-distribution']['totalTasks']++;
        const labelsArray = contribution.task_label.split(',');
        labelsArray.forEach(label => {
          // Incrementing task count for each label inside total-distribution
          if (!localReport[monthYear]['total-distribution']['tasks'][label]) {
            localReport[monthYear]['total-distribution']['tasks'][label] = 0;
          }
          localReport[monthYear]['total-distribution']['tasks'][label]++;
        });
        
        labelsArray.forEach(label => {
          contribution.distributions.forEach(distribution => {
            distribution.tokens.forEach((token, index) => {
              const amount = distribution.amounts[index];
              
              // Aggregating labels
              if (!localReport[monthYear]['total-distribution']['labels'][label]) {
                localReport[monthYear]['total-distribution']['labels'][label] = {};
              }
              if (!localReport[monthYear]['total-distribution']['labels'][label][token]) {
                localReport[monthYear]['total-distribution']['labels'][label][token] = 0;
              }
              localReport[monthYear]['total-distribution']['labels'][label][token] += Number(amount);
            });
          });
        });
      });
    }
  });
  return localReport;
}


  function processIncomingTransactions(txs, existingReport) {
    let localReport = { ...existingReport };
    txs.forEach(tx => {
      if (tx.tx_type === "Incoming") {
        const AGIXIndex = tx.total_tokens.indexOf('AGIX');
        if (AGIXIndex >= 0 && tx.total_amounts[AGIXIndex] > 10) {
          const transactionDate = new Date(parseInt(tx.transaction_date));
          let taskDate;
          if (transactionDate.getDate() > (new Date(transactionDate.getFullYear(), transactionDate.getMonth() + 1, 0).getDate() - 10)) {
            taskDate = new Date(transactionDate.getFullYear(), transactionDate.getMonth() + 1, 1);
          } else {
            taskDate = transactionDate;
          }

          const monthYear = `${taskDate.getMonth() + 1}.${taskDate.getFullYear()}`;
          if (!localReport[monthYear]) localReport[monthYear] = {};
          if (!localReport[monthYear]['monthly-budget']) localReport[monthYear]['monthly-budget'] = {};
          if (!localReport[monthYear]['monthly-budget']['AGIX']) localReport[monthYear]['monthly-budget']['AGIX'] = 0;
          localReport[monthYear]['monthly-budget']['AGIX'] += Number(tx.total_amounts[AGIXIndex]);
        }
      }
    });
    return localReport;
  }

  let report = await generateReport();
  report = processIncomingTransactions(txs, report);

  return report;
}
