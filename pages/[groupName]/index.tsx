import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useMyVariable } from '../../context/MyVariableContext';
import ProjectCard from '../../components/ProjectCard'; // Import the ProjectCard component
import { getOrgs } from '../../utils/getOrgs';

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
        const fetchGroupData = async (groupName: string) => {
            let groupInfo = myVariable.groupInfo;
            // If myVariable.groupInfo is empty, fetch the groupInfo
            if (!groupInfo || groupInfo.length === 0) {
                groupInfo = await getOrgs();
                setMyVariable(prevState => ({ ...prevState, groupInfo: groupInfo }));
            }
    
            // Find the group from the updated groupInfo
            const foundGroup = groupInfo?.find(group => group.group_name === groupName);
            setGroupData(foundGroup || null);
        };
    
        if (groupName) {
            fetchGroupData(groupName as string);
        }
    }, [groupName, myVariable, setMyVariable]);

    const treasuryWalletProjects = groupData?.projects.filter(p => p.project_type === "Treasury Wallet") || [];
    const otherProjects = groupData?.projects.filter(p => p.project_type !== "Treasury Wallet") || [];
    console.log("myVariable", myVariable);
    if (!groupData) return <div>Loading...</div>;
    
    return (
        <div>
            <h1>{groupName}</h1>
            {treasuryWalletProjects.length > 0 && <h2>Treasury wallets</h2>} 
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

            
            {otherProjects.length > 0 && <h2>Proposal wallets</h2>}
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
    );
};

export default GroupPage;
