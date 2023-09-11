// /context/MyVariableContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface Project {
  project_id: string;
  project_name: string;
  project_type: string;
  wallet: string;
}

interface Group {
  group_id: string;
  group_name: string;
  logo_url: string;
  projects: Project[];
}

type MyVariable = {
  groupInfo: Group[];
  projectInfo?: any;
  budgetInfo?: any;
  transactions?: any;
  report?: any;
  balance?: any;
  // other keys go here
};

interface MyVariableContextProps {
  myVariable: MyVariable;
  setMyVariable: React.Dispatch<React.SetStateAction<MyVariable>>;
}

export const MyVariableContext = createContext<MyVariableContextProps | undefined>(undefined);

interface MyVariableProviderProps {
  children: ReactNode;
}

export const MyVariableProvider: React.FC<MyVariableProviderProps> = ({ children }) => {
  const [myVariable, setMyVariable] = useState<MyVariable>({ groupInfo: [], projectInfo: undefined, budgetInfo: undefined, transactions: undefined, report: undefined, balance: undefined });

  return (
    <MyVariableContext.Provider value={{ myVariable, setMyVariable }}>
      {children}
    </MyVariableContext.Provider>
  );
};

export const useMyVariable = (): MyVariableContextProps => {
  const context = useContext(MyVariableContext);
  if (!context) {
    throw new Error("useMyVariable must be used within a MyVariableProvider");
  }
  return context;
}
