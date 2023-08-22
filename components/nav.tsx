import Link from 'next/link';
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Session } from "@supabase/supabase-js";
import { useRouter } from 'next/router';

const Nav = () => {
  const router = useRouter();
  const { groupName, projectName, txid } = router.query;
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        if (session?.user?.id === process.env.NEXT_PUBLIC_TREASURY_ADMIN) {
          setIsAdmin(true)
        }
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        if (session?.user?.id === process.env.NEXT_PUBLIC_TREASURY_ADMIN) {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
        }
      })
      
      return () => subscription.unsubscribe()
    }, [])

    async function signInWithDiscord() {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
      })
    }
  
    async function signout() {
      const { error } = await supabase.auth.signOut()
    }
   //console.log(session, isAdmin)
  return (
    <nav className="routes">
          <Link href="/" className="navitems">
            Home
          </Link>
          {isAdmin && <Link href='/admin' className="navitems">Admin</Link>}
          {!session && (<button onClick={signInWithDiscord} className="navitems">
          Sign In with Discord
        </button>)}
          {session && (
          <button onClick={signout} className="navitems">
          Sign Out
          </button>)}
    </nav>
  );
};

export default Nav;