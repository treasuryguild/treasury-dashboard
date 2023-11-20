import React, { useEffect, useRef } from 'react';
import { Chart } from "chart.js/auto";

const ChartComponentX: React.FC<{ chartData: any }> = ({ chartData }) => {
    const chartRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        // Define color arrays
        const backgroundColors = ["rgba(255, 99, 132, 0.2)", "rgba(54, 162, 235, 0.2)", "rgba(255, 206, 86, 0.2)"];
        const borderColors = ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)"];

        // Counter for cycling through colors
        let colorIndex = 0;

        // Asserting the type of the datasets array
        const datasets = [] as {
            label: string;
            data: any[];
            parsing: any;
            backgroundColor: string;
            borderColor: string;
            borderWidth: number;
        }[];

        Object.keys(chartData.data[0]).forEach((key) => {
            if (key !== 'x') {
                const backgroundColor = backgroundColors[colorIndex];
                const borderColor = borderColors[colorIndex];

                datasets.push({
                    label: key,
                    data: chartData.data.map((item: any) => item[key]),
                    backgroundColor: backgroundColor,
                    parsing: {
                        yAxisKey: key
                    },
                    borderColor: borderColor,
                    borderWidth: 1,
                });

                // Increment and reset color index if necessary
                colorIndex = (colorIndex + 1) % backgroundColors.length;
            }
        });

        const config: any = {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets,
            },
            options: {
                scales: {
                    y: {
                        ticks: {
                            color: "rgba(255, 255, 255, 0.87)",
                        },
                    },
                    x: {
                        ticks: {
                            color: "rgba(255, 255, 255, 0.87)",
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                    },
                    datalabels: {
                        color: 'white',
                        display: true,
                        align: 'end',
                        anchor: 'end',
                        font: {
                            size: 8
                        },
                        formatter: (value: any, context: any) => {
                            return value[context.dataset.parsing.yAxisKey]; 
                          }
                    }
                },
            },
        };
        
        const ctx: any = document.getElementById("myChartX");
        chartRef.current = new Chart(ctx, config);
    }, [chartData]);

    return (
        <div>
          <h2>Workgroup Distribution</h2>
          <canvas id="myChartX"></canvas>
        </div>
    );
};

export default ChartComponentX;
