"use client";

import { useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import Form from "next/form";
import { useWeb3 } from "@/context/Web3Context";
import { handlePostMissionAction } from "@/actions/missionActions";
import styles from "@/styles/PostMission.module.css";

const CATEGORIES = ["Medical", "Food", "Shelter", "Logistics", "Education"];

const REGIONS = ["Asia", "Europe", "Middle East", "North America", "South America", "Africa", "Oceania", "Antarctica"];

export default function PostMissionPage() {
  const { account, user, loading } = useWeb3();
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(handlePostMissionAction, {
    success: false,
    error: null,
    transactionHash: null,
  });

  useEffect(() => {
    if (!account && !loading) {
      router.push("/");
    }
  }, [account, loading, router]);

  useEffect(() => {
    if (!loading && user && user.role !== 1) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  if (loading) return <div className={styles.loader}>Initializing Mission Control...</div>;

  return (
    <main className={styles.container}>
      <Form action={formAction} className={styles.card}>
        <div className={styles.header}>
          <button 
            type="button" 
            onClick={() => router.back()} 
            className={styles.backBtn}
          >
            ← Back
          </button>
          <h1 className={styles.title}>Post New Mission</h1>
        </div>

        <p className={styles.description}>
          Define the requirements for your aid mission. Funds will be locked in escrow.
        </p>

        <div className={styles.inputGroup}>
          <label htmlFor="category">Mission Category</label>
          <select 
            id="category" 
            name="category" 
            required 
            disabled={isPending || state.success}
          >
            <option value="">-- Select Category --</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="maxBudget">Maximum Budget (ETH)</label>
          <input
            type="number"
            step="0.001"
            id="maxBudget"
            name="maxBudget"
            placeholder="e.g. 0.5"
            required
            disabled={isPending || state.success}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="region">Target Region / Conflict Zone</label>
          <select 
            id="region" 
            name="region" 
            required 
            disabled={isPending || state.success}
          >
            <option value="">-- Select Target Region --</option>
            {REGIONS.map(reg => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>
        </div>

        {state.error && <div className={styles.errorBanner}>{state.error}</div>}
        
        {state.success && (
          <div className={styles.successBanner}>
            <strong>Mission Published!</strong>
            <p>Hash: {state.transactionHash?.substring(0, 16)}...</p>
          </div>
        )}

        <button 
          type="submit" 
          className={styles.submitBtn} 
          disabled={isPending || state.success}
        >
          {isPending ? "Waiting for MetaMask..." : "Deploy Mission to Blockchain"}
        </button>
      </Form>
    </main>
  );
}