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
    const agixData = data.map((item: any) => item.AGIX);
    const gmblData = data.map((item: any) => item.GMBL);
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
                        label: 'AGIX',
                        data: agixData,
                        parsing: {
                            yAxisKey: 'AGIX'
                        },
                        backgroundColor: "rgba(54, 162, 235, 0.2)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 1
                    },
                    {
                        label: 'GMBL',
                        data: gmblData,
                        parsing: {
                            yAxisKey: 'GMBL'
                        },
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        borderColor: "rgba(255, 99, 132, 1)",
                        borderWidth: 1
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
          <h2>Contributors</h2>
          <canvas id="myChart5"></canvas>
        </div>
    );
};

export default ChartComponent5;
