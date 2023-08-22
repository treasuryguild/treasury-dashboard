import "../styles/globals.css";
import type { AppProps } from "next/app";
import { MeshProvider } from "@meshsdk/react";
import { CardanoWallet } from '@meshsdk/react';
import Nav from '../components/nav'
import { MeshBadge } from '@meshsdk/react';
import { MyVariableProvider } from '../context/MyVariableContext';  
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { groupName, projectName, txid } = router.query;
  return (
    <MyVariableProvider>  
      <MeshProvider>
        <div className="main">
          <div className="nav">
            <div>
              <Nav />
            </div>
            <div>
              {projectName && (
              <h2 className="page">{projectName}</h2>)}
              {!projectName && (
              <h2 className="page">{groupName}</h2>)}
            </div>
            <div className="walletbutton">
              <CardanoWallet />  
            </div>
          </div>
          <div className="component">
            <Component {...pageProps} />
          </div>
        </div>
        <div className="mesh-badge">
            <div className="mesh-badge-item">Powered by</div>
            <div className="mesh-badge-item">
              <MeshBadge dark={true} />
            </div>
        </div>
      </MeshProvider>
    </MyVariableProvider>  
  );
}

export default MyApp;
