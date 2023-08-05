import "../styles/globals.css";
import type { AppProps } from "next/app";
import { MeshProvider } from "@meshsdk/react";
import { CardanoWallet } from '@meshsdk/react';
import Nav from '../components/nav'
import { MeshBadge } from '@meshsdk/react';
import { MyVariableProvider } from '../context/MyVariableContext';  // Add this line

function MyApp({ Component, pageProps }: AppProps) {

  return (
    <MyVariableProvider>  
      <MeshProvider>
        <div className="main">
          <div className="nav">
            <div>
              <Nav />
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
