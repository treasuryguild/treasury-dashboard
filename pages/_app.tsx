import "../styles/globals.css";
import type { AppProps } from "next/app";
import { MeshProvider } from "@meshsdk/react";
import { CardanoWallet } from '@meshsdk/react';
import Nav from '../components/nav'
import { MeshBadge } from '@meshsdk/react';
import { MyVariableProvider } from '../context/MyVariableContext';
import { useRouter } from 'next/router';
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Session } from "@supabase/supabase-js";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { groupName, projectName, txid } = router.query;
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithDiscord() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: 'https://treasuryguild.com/Singularity%20Net/Singularity%20Net%20Ambassador%20Wallet?tab=signup&months=All+months&workgroups=All+workgroups&tokens=AGIX&labels=All+labels',
      },
    })
  }

  async function signout() {
    const { error } = await supabase.auth.signOut()
  }

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
            <div className="walletbutton" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {!session && router.asPath.startsWith('/Singularity%20Net/Singularity%20Net%20Ambassador%20Wallet?tab=signup') && (
                <button onClick={signInWithDiscord} className="navitems">
                  Sign In with Discord
                </button>
              )}
              {session && (
                <button onClick={signout} className="navitems">
                  Sign Out
                </button>
              )}
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
