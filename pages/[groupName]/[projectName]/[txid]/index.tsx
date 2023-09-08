import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useMyVariable } from '../../../../context/MyVariableContext'; 
import { getOrgs } from '../../../../utils/getOrgs';
import { getSingleTransaction } from '../../../../utils/getSingleTransaction';
import styles from '../../../../styles/Txid.module.css';

interface Project {
    project_id: string;
    project_name: string;
    project_type: string;
}

const TxidPage = () => {
    const { myVariable, setMyVariable } = useMyVariable();
    const router = useRouter();
    const { groupName, projectName, txid } = router.query;
    const [loading, setLoading] = useState<boolean>(true);
    const [projectData, setProjectData] = useState<Project | null>(null);
    const [txidData, setTxidData] = useState(null);

    useEffect(() => {
        const fetchGroupData = async (groupName: string, projectName: string) => {
            let groupInfo = myVariable.groupInfo;
            
            if (!groupInfo || groupInfo.length === 0) {
                groupInfo = await getOrgs();
                setMyVariable(prevState => ({ ...prevState, groupInfo: groupInfo }));
            }
    
            const foundGroup = groupInfo?.find(group => group.group_name === groupName);
            const foundProject = foundGroup?.projects.find(project => project.project_name === projectName);
            setProjectData(foundProject || null);
        };
    
        if (groupName && projectName) {
            fetchGroupData(groupName as string, projectName as string);
        }
    }, [groupName, projectName]);  
    
    useEffect(() => {
        const fetchProjectData = async () => {
            let transactions = myVariable.transactions;
            if (projectData) {
                setLoading(true);
                transactions = await getSingleTransaction(projectData.project_id, txid);
                setMyVariable(prevState => ({ ...prevState, projectInfo: projectData, transactions }));
                setLoading(false);
            }
        };
    
        fetchProjectData();
    }, [projectData]);    
    
    console.log("myVariable", myVariable.transactions?myVariable:0);
    if (!myVariable.transactions) return <div className={styles['main']}>Loading...</div>;
    
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
