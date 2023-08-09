import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useMyVariable } from '../../../../context/MyVariableContext'; 
import { getOrgs } from '../../../../utils/getOrgs';

const TxidPage = () => {
    const { myVariable, setMyVariable } = useMyVariable();
    const router = useRouter();
    const { groupName, projectName, txid } = router.query;
    
    const [txidData, setTxidData] = useState(null);

    
    //if (!txidData) return <div>Loading...</div>;
    
    return (
        <div>
            <h1>{txid}</h1>
        </div>
    );
};

export default TxidPage;
