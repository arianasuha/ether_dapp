"use client";
import { useWeb3 } from "@/context/Web3Context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "@/styles/HomePage.module.css";

export default function Home() {
  const { account, user, loading, connectWallet } = useWeb3();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (account) {
        console.log("Account:", account);
        if (user && user.isRegistered) {
          router.push("/dashboard");
        } else {
          router.push("/register");
        }
      }
    }
  }, [loading, account, user, router]);

  if (loading) return <div className={styles.loader}>Syncing with Ganache...</div>;

  return (
    <main className={styles.background}>
      <h1 className={styles.text}>Conflict Zone Aid Platform</h1>
      
      {!account && (
        <div className={styles.button}>
          <button className={styles.buttontext} onClick={connectWallet}>
            Connect MetaMask
          </button>
        </div>
      )}
    </main>
  );
}