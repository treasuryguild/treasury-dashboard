import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useMyVariable } from '../../context/MyVariableContext';
import ProjectCard from '../../components/ProjectCard'; // Import the ProjectCard component
import { getOrgs } from '../../utils/getOrgs';
import styles from '../../styles/ProjectCard.module.css';

interface Project {
    project_id: string;
    project_name: string;
    project_type: string;
}

interface Group {
    group_id: string;
    group_name: string;
    logo_url: string;
    projects: Project[];
}

const GroupPage = () => {
    const { myVariable, setMyVariable } = useMyVariable();
    const router = useRouter();
    const { groupName } = router.query;
    
    const [groupData, setGroupData] = useState<Group | null>(null);

    useEffect(() => {
        const fetchGroupData = async (name: string) => {
            let groupInfo = myVariable.groupInfo;
            if (!groupInfo || groupInfo.length === 0) {
                groupInfo = await getOrgs();
                setMyVariable(prevState => ({ ...prevState, groupInfo }));
            }

            const foundGroup = groupInfo?.find(group => group.group_name === name);
            setGroupData(foundGroup || null);
        };

        if (groupName) {
            fetchGroupData(groupName as string);
        }
    }, [groupName]);

    const treasuryWalletProjects = groupData?.projects.filter(p => p.project_type === "Treasury Wallet") || [];
    const smartContractProjects = groupData?.projects.filter(p => p.project_type === "Smart Contract") || [];
    const otherProjects = groupData?.projects.filter(p => p.project_type !== "Treasury Wallet" && p.project_type !== "Smart Contract") || [];
    //console.log("myVariable", myVariable);
    if (!groupData) return <div className={styles.groupPageContainer}>Loading...</div>;
    
    return (
        <div className={styles.groupPageContainer}>
            <h1 className={styles.groupPageTitle}>{groupName}</h1>
            {treasuryWalletProjects.length > 0 && <h2 className={styles.sectionHeading}>Treasury wallets</h2>}
            {treasuryWalletProjects.length > 0 && (
              <div className={styles.cardGrid}>
                {treasuryWalletProjects.map((project) => (
                    <ProjectCard 
                        key={project.project_id}
                        projectId={project.project_id}
                        projectName={project.project_name}
                        projectType={project.project_type}
                        logoUrl={groupData.logo_url}
                        groupName={groupName as string}
                    />
                ))}
              </div>
            )}

            {smartContractProjects.length > 0 && <h2 className={styles.sectionHeading}>Smart contract treasuries</h2>}
            {smartContractProjects.length > 0 && (
              <div className={styles.cardGrid}>
                {smartContractProjects.map((project) => (
                    <ProjectCard 
                        key={project.project_id}
                        projectId={project.project_id}
                        projectName={project.project_name}
                        projectType={project.project_type}
                        logoUrl={groupData.logo_url}
                        groupName={groupName as string}
                    />
                ))}
              </div>
            )}

            {otherProjects.length > 0 && <h2 className={styles.sectionHeading}>Proposal wallets</h2>}
            {otherProjects.length > 0 && (
              <div className={styles.cardGrid}>
                {otherProjects.map((project) => (
                    <ProjectCard 
                        key={project.project_id}
                        projectId={project.project_id}
                        projectName={project.project_name}
                        projectType={project.project_type}
                        logoUrl={groupData.logo_url}
                        groupName={groupName as string}
                    />
                ))}
              </div>
            )}
        </div>
    );
};

export default GroupPage;
