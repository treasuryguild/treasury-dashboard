import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useMyVariable } from '../../../../context/MyVariableContext'; 
import { getOrgs } from '../../../../utils/getOrgs';
import styles from '../../../../styles/Txid.module.css';

const TxidPage = () => {
    const { myVariable, setMyVariable } = useMyVariable();
    const router = useRouter();
    const { groupName, projectName, txid } = router.query;
    
    const [txidData, setTxidData] = useState(null);

    
    //if (!txidData) return <div>Loading...</div>;
    
    return (
        <div className={styles['main']}>
            <div>
                <div className={styles.navbar}>
                    <button onClick={() => router.back()} className={styles.backButton}>Go Back</button>
                </div>
            </div>
            <div>
              <h3>{txid}</h3>
            </div>
        </div>
    );
};

export default TxidPage;
