import { useState } from "react";
import type { NextPage } from "next";
import { getOrgs } from '../utils/getOrgs'
import { useMyVariable } from '../context/MyVariableContext';

const Home: NextPage = () => {

  const { myVariable, setMyVariable } = useMyVariable();
  async function prepPage() {
    const orgs = await getOrgs();
  }
  prepPage();
  
  return (
    <div>
      <h1>Home</h1>
    </div>
  );
};

export default Home;