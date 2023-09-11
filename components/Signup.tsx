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
                <p>Login with Discord</p>
                <p>Connect the wallet where you want to receive the rewards</p>
                <p>Hit the submit button</p>
            <br />
            <button className={styles.button} onClick={handleSubmit} disabled={!connected || !session}>Submit</button>
        </div>
    );
};

export default Signup;
