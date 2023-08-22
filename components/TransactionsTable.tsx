import styles from '../styles/Transactions.module.css';
import Link from 'next/link';

interface TransactionsTableProps {
  transactions: any;
  groupName: string;
  projectName: string;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, groupName, projectName }) => {
  
  const allTokens: string[] = transactions?.flatMap((transaction: any) => transaction.total_tokens.filter((token: string) => token.length <= 5)) || [];
  const tokenHeaders = Array.from(new Set(allTokens));

  const formatDate = (timestamp: string) => {
    const date = new Date(Number(timestamp));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderTableHeaders = () => {
    const baseHeaders = ['Date', 'Tx Type', 'Recipients', 'Metadata', 'txView', 'Fee', 'Wallet Balance', 'NFTs'];
    
    const headerAlignments = [
      styles['header-align-left'],
      styles['header-align-center'],
      styles['header-align-center'],
      styles['header-align-center'],
      styles['header-align-center'],
      styles['header-align-center'],
      styles['header-align-right'],
      styles['header-align-center'],
    ];
  
    const headersWithAlignment = [...baseHeaders, ...tokenHeaders].map((header, index) => {
      const alignmentClass = headerAlignments[index] || styles['header-align-right'];
      return <th key={header} className={alignmentClass}>{header}</th>;
    });

    return headersWithAlignment;
  };

  const renderTokenColumns = (transaction: any) => {
    const nftCount = transaction.total_tokens.filter((token: string) => token.length > 5).length;

    const tokenAmounts = transaction.total_tokens.reduce((acc: any, token: string, i: number) => {
      if (token.length <= 5) {
        acc[token] = transaction.total_amounts[i];
      }
      return acc;
    }, {});

    const tokenColumns = tokenHeaders.map((token: string, i: number) => {
      const amount = tokenAmounts[token] || '\u00A0';
      return (
        <td key={i} className={styles['align-right'] + (transaction.tx_type === 'Incoming' ? ' ' + styles['incoming-row'] : '')}>
          {token === 'ADA' ? Number(amount).toFixed(2) : amount}
        </td>
      );
    });
    return { tokenColumns, nftCount };
  };

  return (
    <div className={styles['table-container']}>
      <table className={styles['styled-table']}>
      <colgroup>
          <col style={{ width: '100px', minWidth: '100px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '100px' }} />
      </colgroup>
        <thead>
          <tr>
            {renderTableHeaders()}
          </tr>
        </thead>
        <tbody>
          {transactions?.sort((a: any, b: any) => Number(b.transaction_date) - Number(a.transaction_date)).map((transaction: any, index: any) => {
            const { tokenColumns, nftCount } = renderTokenColumns(transaction);
            return (
              <tr key={index} className={transaction.tx_type === 'Incoming' ? styles['incoming-row'] : ''}>
                <td className={styles['align-left']}>{formatDate(transaction.transaction_date)}</td>
                <td className={styles['align-center']}>{transaction.tx_type}</td>
                <td className={styles['align-center']}>{transaction.recipients}</td>
                <td className={styles['align-center']}><a href={transaction.tx_json_url} target="_blank" rel="noopener noreferrer"  className={styles['link-as-text']}>Link</a></td>
                <td className={styles['align-center']}><Link href={`/${groupName}/${projectName}/${transaction.transaction_id}`}  className={styles['link-as-text']}>View</Link></td>
                <td className={styles['align-center']}>{transaction.fee}</td>
                <td className={styles['align-right']}>{Number(transaction.wallet_balance_after).toFixed(2)}</td>
                <td className={styles['align-center']}>{nftCount}</td>
                {tokenColumns}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;
