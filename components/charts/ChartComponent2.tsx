import React, { useEffect, useRef } from 'react';
import { Chart } from "chart.js/auto";
import { Colors } from "chart.js";

Chart.register(Colors);

interface ChartComponent2Props {
  chartData?: any;
}

const ChartComponent2: React.FC<ChartComponent2Props> = ({ chartData }) => {
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
                        label: 'Tasks Created',
                        data,
                        parsing: {
                            yAxisKey: 'created'
                        }
                    },
                    {
                        label: 'Tasks Done',
                        data,
                        parsing: {
                            yAxisKey: 'done'
                        }
                    },
                    {
                        label: 'Task Movements',
                        data,
                        parsing: {
                            yAxisKey: 'moved'
                        }
                    },
                    {
                        label: 'Idle Tasks',
                        data,
                        parsing: {
                            yAxisKey: 'not_moved'
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
        
        const ctx: any = document.getElementById("myChart4");
        chartRef.current = new Chart(ctx, config);
    }, [labels, data]);

    return (
            <canvas id="myChart4"></canvas>
    );
};

export default ChartComponent2;
