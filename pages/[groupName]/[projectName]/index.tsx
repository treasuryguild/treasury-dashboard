// pages/[groupName]/[projectName].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useMyVariable } from '../../../context/MyVariableContext';
import { getOrgs } from '../../../utils/getOrgs';

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

const ProjectPage = () => {
    const { myVariable, setMyVariable } = useMyVariable();
    const router = useRouter();
    const { groupName, projectName } = router.query;
    
    const [projectData, setProjectData] = useState<Project | null>(null);

    useEffect(() => {
        const fetchProjectData = async (groupName: string, projectName: string) => {
            // If myVariable is empty, fetch the groupInfo
            if (myVariable.length === 0) {
                const groupInfo = await getOrgs();
                setMyVariable(groupInfo);
            }
            
            // Find the project from the updated myVariable
            const foundGroup = myVariable.find(group => group.group_name === groupName);
            const foundProject = foundGroup?.projects.find(project => project.project_name === projectName);
            setProjectData(foundProject || null);
        };

        if (groupName && projectName) {
            fetchProjectData(groupName as string, projectName as string);
        }
    }, [groupName, projectName, myVariable, setMyVariable]);

    if (!projectData) return <div>Loading...</div>;

    return (
        <div>
            <h1>{projectData.project_name}</h1>
        </div>
    );
};

export default ProjectPage;
