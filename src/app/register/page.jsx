"use client";

import { useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import Form from "next/form"; 
import { useWeb3 } from "@/context/Web3Context";
import { handleRegisterAction } from "@/actions/userActions";
import styles from "@/styles/Register.module.css";

export default function RegisterPage() {
  const { account, user, loading, fetchProfile } = useWeb3();
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(handleRegisterAction, {
    success: false,
    error: null,
    transactionHash: null,
  });

  useEffect(() => {
    if (!account) {
      router.push("/");
    }
  }, []);

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);


  useEffect(() => {
    let timer;
    
    if (state.success && account) {
      fetchProfile(account).then(() => {
        timer = setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      });
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [state.success, account, fetchProfile, router]);

  if (loading) return <div className={styles.loading}>Checking wallet status...</div>;

  return (
    <div className={styles.container}>
      <Form action={formAction} className={styles.card}>
        <h1 className={styles.title}>Register Account</h1>
        {account && (
          <p className={styles.walletInfo}>
            Connected Address: <span>{account.substring(0, 6)}...{account.slice(-4)}</span>
          </p>
        )}

        {state?.error && <p className={styles.errorMessage}>{state.error}</p>}
        
        {state?.success && (
          <p className={styles.successMessage}>
              Registration successful! Tx: {state.transactionHash?.substring(0, 12)}...
          </p>
        )}

        <div className={styles.field}>
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Enter your name"
            disabled={isPending || state.success}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="role">Select Role</label>
          <select id="role" name="role" required disabled={isPending || state.success}>
            <option value="">-- Choose Role --</option>
            <option value="1">Donor</option>
            <option value="2">Relief Agency</option>
          </select>
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isPending || state.success}
        >
          {isPending ? "Confirming in MetaMask..." : "Register Now"}
        </button>
      </Form>
    </div>
  );
}