import { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import { useMyVariable } from '../context/MyVariableContext';
import styles from '../styles/GroupCard.module.css';

const NewEmptyWallet: NextPage = () => {
  const { myVariable, setMyVariable } = useMyVariable();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  return (
    <div>
      <div>
        This is a new wallet and its still empty. Please have at least 1 ADA in here to view on this dashboard
      </div>
    </div>
  );
};

export default NewEmptyWallet;
