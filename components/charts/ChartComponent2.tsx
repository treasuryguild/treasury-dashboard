import React, { useEffect, useRef } from 'react';
import { Chart } from "chart.js/auto";
import { Colors } from "chart.js";

Chart.register(Colors);

interface ChartComponent2Props {
  chartData: any;
}

const ChartComponent2: React.FC<ChartComponent2Props> = ({ chartData }) => {
    const labels = chartData.labels;
    const data = chartData.data;
    const chartRef = useRef<Chart | null>(null);
    let backgroundColor = ["rgba(255, 99, 132, 0.2)", "rgba(54, 162, 235, 0.2)", "rgba(255, 206, 86, 0.2)"];
    let borderColor = ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)"];
    
    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.destroy();
        }

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
                        display: false,
                    },
                },
            },
        };
        const ctx: any = document.getElementById("myChart2");
        chartRef.current = new Chart(ctx, config);
    }, [labels, data]);

    return (
        <div>
          <h2>Monthly Distribution</h2>
          <canvas id="myChart2"></canvas>
        </div>
    );
};

export default ChartComponent2;
