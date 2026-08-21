import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@meshsdk/react';
import { getConnectedWalletAddresses, isAnyAddressAllowed } from '../utils/parseSpendingExportWallets';

const Nav = () => {
  const { connected, wallet } = useWallet();
  const [showSpendingExport, setShowSpendingExport] = useState(false);
  const walletReady = Boolean(wallet);

  useEffect(() => {
    if (!connected || !wallet) {
      setShowSpendingExport(false);
      return;
    }

    let cancelled = false;

    async function checkAccess() {
      const addresses = await getConnectedWalletAddresses(wallet);
      if (!cancelled) {
        setShowSpendingExport(isAnyAddressAllowed(addresses));
      }
    }

    checkAccess();
    return () => {
      cancelled = true;
    };
  }, [connected, walletReady]);

  return (
    <nav className="routes">
      <Link href="/" className="navitems">
        Groups
      </Link>
      <Link href="/transaction" className="navitems">
        Transaction
      </Link>
      <Link href="/allTxs" className="navitems">
        View all your Txs
      </Link>
      {showSpendingExport && (
        <Link href="/spending-export" className="navitems">
          Spending export
        </Link>
      )}
    </nav>
  );
};

export default Nav;
