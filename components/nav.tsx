import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWallet } from '@meshsdk/react';
import { getConnectedWalletAddresses, isAnyAddressAllowed } from '../utils/parseSpendingExportWallets';

const Nav = () => {
  const router = useRouter();
  const { connected, wallet } = useWallet();
  const [showSpendingExport, setShowSpendingExport] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const walletReady = Boolean(wallet);

  useEffect(() => {
    setMenuOpen(false);
  }, [router.asPath]);

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
    <div className="nav-wrapper">
      <button
        type="button"
        className="nav-toggle"
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        {menuOpen ? '✕' : '☰'}
      </button>
      <nav className={`routes ${menuOpen ? 'routes-open' : ''}`}>
        <Link href="/" className="navitems" onClick={() => setMenuOpen(false)}>
          Groups
        </Link>
        <Link href="/transaction" className="navitems" onClick={() => setMenuOpen(false)}>
          Transaction
        </Link>
        <Link href="/allTxs" className="navitems" onClick={() => setMenuOpen(false)}>
          View all your Txs
        </Link>
        {showSpendingExport && (
          <Link href="/spending-export" className="navitems" onClick={() => setMenuOpen(false)}>
            Spending export
          </Link>
        )}
      </nav>
    </div>
  );
};

export default Nav;
