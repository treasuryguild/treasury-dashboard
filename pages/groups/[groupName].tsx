// pages/groups/[groupName].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// This is a mock function. Replace it with your actual data fetching logic.
const fetchGroupData = async (groupName: string) => {
    // Fetch the group data by groupName
    // For example:
    // const data = await fetch(`/api/groups?name=${groupName}`).then(res => res.json());
    // return data;
};

const GroupPage = () => {
    const router = useRouter();
    const { groupName } = router.query;
    
    const [groupData, setGroupData] = useState<any>(null);

    useEffect(() => {
        if (groupName) {
            fetchGroupData(groupName as string).then(data => setGroupData(data));
        }
    }, [groupName]);

    if (!groupData) return <div>Loading...</div>;

    return (
        <div>
            <h1>{groupName}</h1>
            {groupData.projects.map((project: any) => (
                <div key={project.project_id}>
                    <h2>{project.project_name}</h2>
                    <p>Type: {project.project_type}</p>
                </div>
            ))}
        </div>
    );
};

export default GroupPage;
