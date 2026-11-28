import React, { useEffect, useRef } from 'react';
import { Chart } from "chart.js/auto";
import { Colors } from "chart.js";
import { useTheme } from '../../context/ThemeContext';

Chart.register(Colors);

interface ChartComponent2Props {
  chartData: any;
}

const ChartComponent2: React.FC<ChartComponent2Props> = ({ chartData }) => {
    const { resolvedTheme } = useTheme();
    const isLight = resolvedTheme === 'light';
    const labels = chartData.labels;
    const data = chartData.data;
    const chartRef = useRef<Chart | null>(null);
    let backgroundColor = ["rgba(255, 99, 132, 0.2)", "rgba(54, 162, 235, 0.2)", "rgba(255, 206, 86, 0.2)"];
    let borderColor = ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)"];
    
    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const tickColor = isLight ? '#334155' : 'rgba(255, 255, 255, 0.87)';
        const gridColor = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)';
        const datalabelColor = isLight ? '#0f172a' : 'white';

        const chartData = {
            labels,
            datasets: [
                {
                    label: "total AGIX",
                    data,
                    backgroundColor,
                    borderColor,
                    borderWidth: 1,
                },
            ],
        };
        const config: any = {
            type: "bar",
            data: chartData,
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
                        display: false,
                    },
                    datalabels: {
                        color: datalabelColor,
                    },
                },
            },
        };
        const ctx: any = document.getElementById("myChart2");
        chartRef.current = new Chart(ctx, config);
    }, [labels, data, isLight]);

    return (
        <div>
          <h2>Monthly Distribution</h2>
          <canvas id="myChart2"></canvas>
        </div>
    );
};

export default ChartComponent2;
