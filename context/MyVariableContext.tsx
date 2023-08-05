import React, { createContext, useState, useContext, ReactNode } from 'react';

interface MyVariable {
  group: string;
  project: string;
  project_id: string;
  project_website: string;
  project_type:string;
  logo_url: string;
  wallet: string;
  txHash: string;
  monthly_budget_balance: any;
  monthly_wallet_budget_string: string;
  totalAmountsString: string;
  txamounts: any;
  fee: any;
  totalAmounts: any;
  walletTokens: any;
  walletBalanceAfterTx: any;
  balanceString: string;
  txdescription: string;
  formattedDate: string;
  tokenRates: any;
  txtype: string;
  budget_month: string;
  send_message: boolean;
  // other properties of myVariable...
}

interface MyVariableContextProps {
  myVariable: MyVariable;
  setMyVariable: React.Dispatch<React.SetStateAction<MyVariable>>;
}

export const MyVariableContext = createContext<MyVariableContextProps | undefined>(undefined);

interface MyVariableProviderProps {
  children: ReactNode;
}

export const MyVariableProvider: React.FC<MyVariableProviderProps> = ({ children }) => {
  const [myVariable, setMyVariable] = useState<MyVariable>({ 
  group: '',
  project:'',
  project_id:'',
  project_website:'',
  project_type:'',
  logo_url:'',
  wallet:'',
  txHash:'',
  monthly_budget_balance: {},
  monthly_wallet_budget_string:'',
  totalAmountsString:'',
  txamounts:{},
  fee:'',
  totalAmounts:{},
  walletTokens:{},
  walletBalanceAfterTx:{},
  balanceString:'',
  txdescription:'',
  formattedDate:'',
  tokenRates:{},
  txtype:'',
  budget_month: new Date().toISOString().slice(0, 7),
  send_message:true,
   /* initialize other properties as needed */ 
  });

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
