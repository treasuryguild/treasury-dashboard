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
    let chartData3 = {
      labels: [],
      data: []
    };
  
    for (let [key, value] of Object.entries(report[month])) {
      if(value.totalTasks && key !== "total-distribution") {
        chartData3.labels.push(key);
        let contributorsCount = value.contributors ? value.contributors.size : 0;
        chartData3.data.push({ tasks: value.totalTasks, contributors: contributorsCount, x: key });
      }
    }
  
    return chartData3;
  }
  

  function createChartData4() { 
    let chartData4 = {};
    return chartData4;
  }

  function createAllMonthsChartData1() { 
    let chartData1 = {
      labels: [],
      data: []
    };
  
    for (let [key, value] of Object.entries(report)) {
      if(value['total-distribution'] && value['total-distribution'].totalAmounts) {
        chartData1.labels.push(key);
        chartData1.data.push(Number(value['total-distribution'].totalAmounts.AGIX).toFixed(0));
      } else {
        chartData1.labels.push(key);
        chartData1.data.push(0);
      }
    }
  
    return chartData1;
  }
  

  function createAllMonthsChartData2() { 
    let chartData2 = {
      labels: [],
      data: []
    };
  
    for (let [key, value] of Object.entries(report)) {
      if(value['total-distribution'] && value['total-distribution'].totalTasks
      ) {
        chartData2.labels.push(key);
        chartData2.data.push(value['total-distribution'].totalTasks);
      } else {
        chartData2.labels.push(key);
        chartData2.data.push(0);
      }
    }
    return chartData2;
  }

  function createAllMonthsChartData3() { 
    let chartData3 = {
      labels: [],
      data: []
    };
  
    for (let [key, value] of Object.entries(report)) {
      if(value['total-distribution'] && value['total-distribution'].totalTasks
      ) {
        chartData3.labels.push(key);
        let contributorsCount = value['total-distribution'].contributors ? value['total-distribution'].contributors.size : 0;
        chartData3.data.push({ tasks: value['total-distribution'].totalTasks, contributors: contributorsCount, x: key });
      } else {
        chartData3.labels.push(key);
        chartData3.data.push({ tasks: 0, contributors: 0, x: key });
      }
    }
    return chartData3;
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
    chartData1 = createAllMonthsChartData1();
    chartData2 = createAllMonthsChartData2();
    chartData3 = createAllMonthsChartData3();
    chartData4 = {};
  }
  
  //console.log("createCharts", month, chartData1, chartData2)
  return { chartData1, chartData2, chartData3, chartData4 };
}
