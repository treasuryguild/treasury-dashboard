import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { getOrgs } from '../utils/getOrgs';
import { useMyVariable } from '../context/MyVariableContext';
import GroupCard from '../components/GroupCard';
import styles from '../styles/GroupCard.module.css';

type HomeProps = {
  groupInfo: any;  
};

const Home: NextPage<HomeProps> = ({ groupInfo }) => {
  const { myVariable, setMyVariable } = useMyVariable();

  useEffect(() => {
    setMyVariable(prevState => ({ ...prevState, groupInfo: groupInfo, transactions: [] }));
  }, [groupInfo, setMyVariable]);

  console.log("Rendering serversideprops", groupInfo);
  return (
    <div>
      <div className={styles.groupscontainer}>
      {groupInfo.map((group: any) => (
        <GroupCard 
          key={group.group_id} 
          groupName={group.group_name} 
          logoUrl={group.logo_url} 
          numberOfWallets={group.projects.length} 
        />
      ))}
      </div>
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
