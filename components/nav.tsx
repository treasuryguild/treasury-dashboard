import Link from 'next/link';
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Session } from "@supabase/supabase-js";
import { useRouter } from 'next/router';

const Nav = () => {
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
   //console.log(session, isAdmin)
  return (
    <nav className="routes">
          <Link href="/" className="navitems">
            Groups
          </Link>
          <Link href="/transaction" className="navitems">
            Transaction
          </Link>
          <Link href="/allTxs" className="navitems">
            View all your Txs
          </Link>
          {!session && router.asPath.startsWith('/Singularity%20Net/Singularity%20Net%20Ambassador%20Wallet?tab=signup') && (
            <button onClick={signInWithDiscord} className="navitems">
              Sign In with Discord
            </button>
          )}
          {session && (
          <button onClick={signout} className="navitems">
          Sign Out
          </button>)}
    </nav>
  );
};

export default Nav;