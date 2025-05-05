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
    const [notification, setNotification] = useState("");
    const router = useRouter();
    const { groupName, projectName } = router.query;

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
        setNotification("")
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
        if (data.success) {
            setNotification(data?.message);
        } else {
            setNotification("Failed to update. Please try again.");
        }
    }

    return (
        <div className={styles.container}>
            <h2>To register or update your wallet address:</h2>
            <br />
            <p>Click on the Sign In with Discord button in the top navigation bar</p>
            <p>Connect your wallet in the top right of the Navigation bar</p>
            <p>Hit the submit button</p>
            <br />
            <div className={styles.supportedWallets}>
                <p>Supported wallets: Eternl, Typhon, Lace, Yoroi, Gero</p>
                <p>Please make sure you have one of these wallets installed in your browser</p>
            </div>
            <br />
            {!notification && (<h3>Steps left to do</h3>)}
            {!session && (<p>Please sign into Discord</p>)}
            {!connected && (<p>Please connect your wallet</p>)}
            {session && connected && !notification && (<p>Click Submit</p>)}
            {session && connected && notification && (
                <div className={styles.notification}>
                    <p>{notification}</p>
                    <p>Future rewards will be sent to this wallet</p>
                </div>
            )}
            <button className={styles.button} onClick={handleSubmit} disabled={!connected || !session}>Submit</button>
        </div>
    );
};

export default Signup;
