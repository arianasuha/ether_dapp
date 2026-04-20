"use client";
import { useWeb3 } from "@/context/Web3Context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

  if (loading) return <div>Syncing with Ganache...</div>;

  return (
    <main>
      <h1>Conflict Zone Aid Platform</h1>
      
      {!account && (
        <div>
          <button onClick={connectWallet}>
            Connect MetaMask
          </button>
        </div>
      )}
    </main>
  );
}