import React, { useEffect, useRef } from 'react';
import { Chart } from "chart.js/auto";
import { Colors } from "chart.js";

Chart.register(Colors);

interface ChartComponent3Props {
  chartData?: any;
}

const ChartComponent3: React.FC<ChartComponent3Props> = ({ chartData }) => {
    const labels = chartData.labels;
    const data = chartData.data;
    const chartRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const config: any = {
            type: 'bar',
            data: {
                labels: data.map((item: any) => item.x),
                datasets: [
                    {
                        label: 'Tasks',
                        data,
                        parsing: {
                            yAxisKey: 'tasks'
                        },
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        borderColor: "rgba(255, 99, 132, 1)",
                        borderWidth: 1
                    },
                    {
                        label: 'Contributors',
                        data,
                        parsing: {
                            yAxisKey: 'contributors'
                        },
                        backgroundColor: "rgba(54, 162, 235, 0.2)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 1
                    }
                ]
            },
            options: {
                scales: {
                    x: {
                        ticks: {
                            color: "rgba(255, 255, 255, 0.87)",
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: 'white', // Change to any color you want
                        }
                    },
                    datalabels: {
                        color: 'white',
                        display: true,
                        align: 'end',
                        anchor: 'end',
                        formatter: (value: any, context: any) => {
                            return value[context.dataset.parsing.yAxisKey]; 
                          }
                    }
                },
            },
        };
        
        const ctx: any = document.getElementById("myChart3");
        chartRef.current = new Chart(ctx, config);
    }, [labels, data]);

    return (
        <div>
          <h2>Tasks and Contributors</h2>
          <canvas id="myChart3"></canvas>
        </div>
    );
};

export default ChartComponent3;
