import Link from 'next/link';
import { useRouter } from 'next/router';

const Nav = () => {
  const router = useRouter();
  const { groupName, projectName, txid } = router.query;

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
    </nav>
  );
};

export default Nav;