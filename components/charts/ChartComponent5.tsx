import React, { useEffect, useRef } from 'react';
import { Chart } from "chart.js/auto";
import { Colors } from "chart.js";

Chart.register(Colors);

interface ChartComponent5Props {
  chartData?: any;
}

const ChartComponent5: React.FC<ChartComponent5Props> = ({ chartData }) => {
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
                        }
                    },
                    {
                        label: 'Contributors',
                        data,
                        parsing: {
                            yAxisKey: 'contributors'
                        }
                    }
                ]
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
                },
            },
        };
        
        const ctx: any = document.getElementById("myChart5");
        chartRef.current = new Chart(ctx, config);
    }, [labels, data]);

    return (
        <div>
          <h2>Tasks</h2>
          <canvas id="myChart5"></canvas>
        </div>
    );
};

export default ChartComponent5;
