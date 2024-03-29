import React from 'react';
import styles from '../../styles/Report.module.css';

// Utility function to transform camelCase to Capitalized Words
const formatCamelCase = (str: string): string => {
  if (str !== "month" && str !== "monthlyBudget" && str !== "mbBalance" && str !== "incomingReserve") {
    str = `Outgoing ${str}`
  }
  const result = str.replace(/([a-z])([A-Z])/g, '$1 $2');
  return result
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface DynamicTableProps {
  data: Record<string, any>[];
}

const DynamicTable: React.FC<DynamicTableProps> = ({ data }) => {
  if (!data.length) return null;

  const columnHeaders = Object.keys(data[0]);

  return (
    <div className={styles.numbers}>
      <table>
        <thead>
          <tr>
            {columnHeaders.map((header, index) => (
              <th key={index}>{formatCamelCase(header)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columnHeaders.map((header, colIndex) => (
                <td key={colIndex}>{row[header]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DynamicTable;
