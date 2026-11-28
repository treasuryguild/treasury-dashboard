import React, { useEffect, useRef } from 'react';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { useTheme } from '../../context/ThemeContext';

export interface BarDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

interface DashboardBarChartProps {
  title: string;
  subtitle?: string;
  labels: string[];
  datasets: BarDataset[];
  horizontal?: boolean;
  stacked?: boolean;
  height?: number;
  valueSuffix?: string;
  emptyMessage?: string;
}

const DEFAULT_PALETTE = [
  { bg: 'rgba(56, 189, 248, 0.72)', border: 'rgba(56, 189, 248, 1)' },
  { bg: 'rgba(52, 211, 153, 0.72)', border: 'rgba(52, 211, 153, 1)' },
  { bg: 'rgba(251, 146, 60, 0.72)', border: 'rgba(251, 146, 60, 1)' },
  { bg: 'rgba(167, 139, 250, 0.72)', border: 'rgba(167, 139, 250, 1)' },
  { bg: 'rgba(244, 114, 182, 0.72)', border: 'rgba(244, 114, 182, 1)' },
  { bg: 'rgba(250, 204, 21, 0.72)', border: 'rgba(250, 204, 21, 1)' },
];

const DashboardBarChart: React.FC<DashboardBarChartProps> = ({
  title,
  subtitle,
  labels,
  datasets,
  horizontal = false,
  stacked = false,
  height = 280,
  valueSuffix = '',
  emptyMessage = 'No data for the current filter selection.',
}) => {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const hasData =
    labels.length > 0 &&
    datasets.length > 0 &&
    datasets.some((ds) => ds.data.some((v) => Number(v) !== 0));

  useEffect(() => {
    if (!canvasRef.current || !hasData) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const tickColor = isLight ? '#475569' : 'rgba(255, 255, 255, 0.8)';
    const gridColor = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)';
    const legendColor = isLight ? '#1e293b' : 'rgba(255, 255, 255, 0.88)';

    const styledDatasets = datasets.map((ds, idx) => {
      const palette = DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];
      return {
        ...ds,
        backgroundColor: ds.backgroundColor || palette.bg,
        borderColor: ds.borderColor || palette.border,
        borderWidth: ds.borderWidth ?? 1,
        borderRadius: 4,
        maxBarThickness: horizontal ? 26 : 42,
      };
    });

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: styledDatasets,
      },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            stacked,
            grid: {
              color: gridColor,
            },
            ticks: {
              color: tickColor,
              font: { size: 11 },
              maxRotation: horizontal ? 0 : 45,
              autoSkip: true,
            },
          },
          y: {
            stacked,
            beginAtZero: true,
            grid: {
              color: gridColor,
            },
            ticks: {
              color: tickColor,
              font: { size: 11 },
            },
          },
        },
        plugins: {
          legend: {
            display: datasets.length > 1,
            labels: {
              color: legendColor,
              boxWidth: 12,
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: isLight ? 'rgba(15, 23, 42, 0.94)' : 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(148, 163, 184, 0.35)',
            borderWidth: 1,
            callbacks: {
              label: (ctx: any) => {
                const rawVal = horizontal ? ctx.parsed.x : ctx.parsed.y;
                const formatted = Number(rawVal ?? 0).toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                });
                const suffix = valueSuffix ? ` ${valueSuffix}` : '';
                return `${ctx.dataset.label}: ${formatted}${suffix}`;
              },
            },
          },
          // Explicitly disable globally registered chartjs-plugin-datalabels
          datalabels: {
            display: false,
          },
        } as any,
      },
    };

    chartInstanceRef.current = new Chart(canvasRef.current, config);

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [labels, datasets, horizontal, stacked, valueSuffix, hasData, isLight]);

  const computedHeight = horizontal
    ? Math.max(height, Math.min(540, labels.length * 30 + 60))
    : height;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '10px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>
      {hasData ? (
        <div style={{ position: 'relative', width: '100%', height: `${computedHeight}px` }}>
          <canvas ref={canvasRef} />
        </div>
      ) : (
        <div
          style={{
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}
        >
          {emptyMessage}
        </div>
      )}
    </div>
  );
};

export default DashboardBarChart;
