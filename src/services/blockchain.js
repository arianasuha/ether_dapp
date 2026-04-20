import { ethers } from "ethers";
import ConflictZoneAid from "@/contracts/ConflictZoneAid.json";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export const getContract = async () => {
  if (!contractAddress) {
    throw new Error("Contract address not found in environment variables");
  }

  // Checking whether Metamask is installed
  if (typeof window !== "undefined" && window.ethereum) {
    // Connect to metamask
    const provider = new ethers.BrowserProvider(window.ethereum);
    // Sign the transaction using private key of user
    const signer = await provider.getSigner();

    // Return the contract to be used by JS
    return new ethers.Contract(contractAddress, ConflictZoneAid.abi, signer);
  } else {
    throw new Error("MetaMask not found.");
  }
};
