import React from 'react';
import { useRouter } from 'next/router';
import { useState, useEffect } from "react";
import { useWallet } from '@meshsdk/react';
import { supabase } from '../lib/supabaseClient';
import { Session } from "@supabase/supabase-js";
import styles from '../styles/Signup.module.css';
import { updateWallet } from '../utils/updateWallet'



const Signup = () => {
    const { connected, wallet } = useWallet();
    const [session, setSession] = useState<Session | null>(null)
    const [firstWallet, setFirstWallet] = useState("");
    const router = useRouter();
    const { groupName, projectName } = router.query;
    //let firstWallet = '';

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

    useEffect(() => {
        if (connected) {
          getWalletAddress()
          console.log(firstWallet);
        }
      }, [connected]);

    async function getWalletAddress() {
        const usedAddresses = await wallet.getUsedAddresses();
        setFirstWallet(usedAddresses[0])
    }

    const handleSubmit = async () => {
        let username = session?.user?.user_metadata.custom_claims.global_name
        let wallet = firstWallet;
        let user_id = session?.user?.id
        let project = projectName;
        let full_username = session?.user?.user_metadata.name
        let data = await updateWallet(username, wallet, user_id, project, full_username);
        console.log("Testing values", session, data)
        //update wallets table with wallet
    }

    return (
        <div className={styles.container}>
            <h2>To sign up and receive rewards from this group, you need to:</h2>
            <br />
                <p>Click on the Sign In with Discord button in the top navigation bar</p>
                <p>Connect your wallet in the top right of the Navigation bar</p>
                <p>Hit the submit button</p>
            <br />
            <h3>Steps left to do</h3>
            {!connected && (<p>Please connect your wallet</p>)}
            {!session && (<p>Please Sign in to Discord</p>)}
            {session && connected && (<p>Click Submit</p>)}
            <button className={styles.button} onClick={handleSubmit} disabled={!connected || !session}>Submit</button>
        </div>
    );
};

export default Signup;
