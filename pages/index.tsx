import { useState } from "react";
import type { NextPage } from "next";
import { getOrgs } from '../utils/getOrgs';
import { useMyVariable } from '../context/MyVariableContext';
import GroupCard from '../components/GroupCard';

type HomeProps = {
  groupInfo: any;  
};

const Home: NextPage<HomeProps> = ({ groupInfo }) => {
  const { myVariable, setMyVariable } = useMyVariable();
  console.log("Rendering serversideprops", groupInfo)
  
  return (
    <div>
      <h1>Home</h1>
      {groupInfo.map((group: any) => (
        <GroupCard 
          key={group.group_id} 
          groupName={group.group_name} 
          logoUrl={group.logo_url} 
          numberOfWallets={group.projects.length} 
        />
      ))}
      {/* Render your groupInfo data here */}
    </div>
  );
};

export default Home;

export async function getServerSideProps() {
  const groupInfo = await getOrgs();
  
  return {
    props: { groupInfo }
  };
}
