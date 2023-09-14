import React from 'react';
import { useState, useEffect } from "react";
import { useWallet } from '@meshsdk/react';
import { supabase } from '../lib/supabaseClient';
import { Session } from "@supabase/supabase-js";
import styles from '../styles/Signup.module.css';

const Signup = () => {
    const { connected, wallet } = useWallet();
    const [session, setSession] = useState<Session | null>(null)
    const [username, setUsername] = useState("");

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

    const handleSubmit = () => {
        console.log(session);
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
