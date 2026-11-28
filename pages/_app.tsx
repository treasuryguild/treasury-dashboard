import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { MeshProvider } from "@meshsdk/react";
import { CardanoWallet } from '@meshsdk/react';
import Nav from '../components/nav'
import { MeshBadge } from '@meshsdk/react';
import { MyVariableProvider } from '../context/MyVariableContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { useRouter } from 'next/router';
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Session } from "@supabase/supabase-js";

function AppShell({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { groupName, projectName } = router.query;
  const { resolvedTheme, toggleTheme } = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithDiscord() {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: 'https://treasuryguild.com/Singularity%20Net/Singularity%20Net%20Ambassador%20Wallet?tab=signup&months=All+months&workgroups=All+workgroups&tokens=AGIX&labels=All+labels',
      },
    });
  }

  async function signout() {
    await supabase.auth.signOut();
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <MyVariableProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <MeshProvider>
        <div className="main">
          <div className="nav">
            <div className="nav-left">
              <Nav />
            </div>
            <div className="nav-title">
              {projectName && <h2 className="page">{projectName}</h2>}
              {!projectName && <h2 className="page">{groupName}</h2>}
            </div>
            <div className="walletbutton">
              {isClient && (
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="theme-toggle"
                  aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                  title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                  {isDark ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" />
                      <path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="m6.34 17.66-1.41 1.41" />
                      <path d="m19.07 4.93-1.41 1.41" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                    </svg>
                  )}
                  <span className="theme-toggle-label">{isDark ? 'Light' : 'Dark'}</span>
                </button>
              )}
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
              {isClient && (
                <div className="mesh-wallet-wrap">
                  <CardanoWallet isDark={isDark} />
                </div>
              )}
            </div>
          </div>
          <div className="component">
            <Component {...pageProps} />
          </div>
        </div>
        <div className="mesh-badge">
          <div className="mesh-badge-item">Powered by</div>
          <div className="mesh-badge-item">
            {isClient && <MeshBadge dark={isDark} />}
          </div>
        </div>
      </MeshProvider>
    </MyVariableProvider>
  );
}

function MyApp(props: AppProps) {
  return (
    <ThemeProvider>
      <AppShell {...props} />
    </ThemeProvider>
  );
}

export default MyApp;
