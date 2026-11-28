import React, { useEffect, useRef } from 'react';
import { Chart } from "chart.js/auto";
import { useTheme } from '../../context/ThemeContext';

const ChartComponentY: React.FC<{ chartData: any }> = ({ chartData }) => {
    const { resolvedTheme } = useTheme();
    const isLight = resolvedTheme === 'light';
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

        const tickColor = isLight ? '#334155' : 'rgba(255, 255, 255, 0.87)';
        const gridColor = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)';
        const legendColor = isLight ? '#1e293b' : 'rgba(255, 255, 255, 0.87)';
        const datalabelColor = isLight ? '#0f172a' : 'white';

        const config: any = {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets,
            },
            options: {
                scales: {
                    y: {
                        grid: { color: gridColor },
                        ticks: {
                            color: tickColor,
                        },
                    },
                    x: {
                        grid: { color: gridColor },
                        ticks: {
                            color: tickColor,
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: legendColor },
                    },
                    datalabels: {
                        color: datalabelColor,
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
        
        const ctx: any = document.getElementById("myChartY");
        chartRef.current = new Chart(ctx, config);
    }, [chartData, isLight]);

    return (
        <div>
          <h2>Monthly Distribution</h2>
          <canvas id="myChartY"></canvas>
        </div>
    );
};

export default ChartComponentY;
