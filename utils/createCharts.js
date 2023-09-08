export function createCharts(report, month) {
  
  function createChartData1() { 
    let chartData1 = {
      labels: [],
      data: []
    };

    for (let [key, value] of Object.entries(report[month])) {
      if(value.totalAmounts && key != "total-distribution") {
        chartData1.labels.push(key);
        chartData1.data.push(value.totalAmounts.AGIX);
      }
    }

    return chartData1;
  }

  function createChartData2() { 
    let chartData2 = {
      labels: [],
      data: []
    };

    for (let [key, value] of Object.entries(report[month])) {
      if(value.totalAmounts && key != "total-distribution") {
        chartData2.labels.push(key);
        chartData2.data.push(value.totalTasks);
      }
    }

    return chartData2;
  }

  function createChartData3() { 
    let chartData3 = {};
    return chartData3;
  }

  function createChartData4() { 
    let chartData4 = {};
    return chartData4;
  }

  let chartData1 = {};
  let chartData2 = {};
  let chartData3 = {};
  let chartData4 = {};

  if (month != 'All months') {
    chartData1 = createChartData1();
    chartData2 = createChartData2();
    chartData3 = createChartData3();
    chartData4 = createChartData4();
  } else {
    chartData1 = {};
    chartData2 = {};
    chartData3 = {};
    chartData4 = {};
  }
  
  console.log("createCharts", month, chartData1, chartData2)
  return { chartData1, chartData2, chartData3, chartData4 };
}
