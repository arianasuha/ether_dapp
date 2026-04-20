"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getContract } from "@/services/blockchain";
import { getUserProfile } from "@/services/api";

// Radio Frequency, Creating the Context
const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchProfile = useCallback(async (address) => {
    try {
      const profile = await getUserProfile(address);
      if (profile && profile.isRegistered) {
        setUser(profile);
        return profile;
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      console.error("Profile fetch failed", err);
      return null;
    }
  }, []);

  // Wallet connection
  const connectWallet = async () => {
    try {
      setLoading(true);
      // Call the smart contract
      const contract = await getContract();
      // Address fetched from metamask
      const address = await contract.runner.getAddress();
      setAccount(address);
      
      await fetchProfile(address);
    } catch (err) {
      console.error("MetaMask connection failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Checking whether Metamask is installed
    if (typeof window !== "undefined" && window.ethereum) {
      // Triggered only when page is refreshed
      // If address is the same just set the states again
      window.ethereum.request({ method: "eth_accounts" }).then(async (accounts) => {
        if (accounts.length > 0) {
          const address = accounts[0];
          setAccount(address);
          await fetchProfile(address);
        }
        setLoading(false);
      }).catch((err) => {
        console.error("Initial account fetch failed", err);
        setLoading(false);
      });

      // Handle new account change
      const handleAccounts = async (accounts) => {
        setLoading(true);
        
        if (accounts.length > 0) {
          const newAddress = accounts[0];
          setAccount(newAddress);
          
          const updatedProfile = await fetchProfile(newAddress);
          
          // If user is not registered, redirect to home
          if (!updatedProfile) {
            router.push("/");
          }
        } else {
          setAccount(null);
          setUser(null);
          router.push("/");
        }
        setLoading(false);
      };

      // Event listener listening to metamask account change
      window.ethereum.on("accountsChanged", handleAccounts);

      // Removed only at refresh or tab close
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccounts);
      };
    } else {
      setLoading(false);
    }
  }, [fetchProfile, router]);
  
  // Trasmitter: transmitting the values to the whole web
  return (
    <Web3Context.Provider value={{ account, user, loading, connectWallet, fetchProfile }}>
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook to listen to the transmission
export const useWeb3 = () => useContext(Web3Context);