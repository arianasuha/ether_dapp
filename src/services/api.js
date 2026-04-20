import { getContract } from "./blockchain";
import { ethers } from "ethers";

const handleContractError = (err) => {
  console.error("Blockchain Error:", err);
  if (err.reason) return {error: err.reason};
  if (err.data?.message) return {error: err.data.message};
  return {error: err.message || "An unknown error occurred"};
};

export const getUnArbiterAdmin = async () => {
  try {
    const contract = await getContract();
    const data = await contract.un_arbiter_admin();
    return {un_arbiter_admin: data};
  } catch (err) {
    return handleContractError(err);
  }
};

export const getMissionCount = async () => {
  try {
    const contract = await getContract();
    const data = await contract.mission_count();
    return {mission_count: Number(data)};
  } catch (err) {
    return handleContractError(err);
  }
}

export const getTotalFeesCollected = async () => {
  try {
    const contract = await getContract();
    const data = await contract.totalFeesCollected();
    return {total_fees_collected: ethers.formatEther(data)};
  } catch (err) {
    return handleContractError(err);
  }
}

export const getUserProfile = async (address) => {
  try {
    const contract = await getContract();
    const user = await contract.users(address);

    return {
      name: user.name,
      role: Number(user.role),
      reputationScore: Number(user.reputationScore),
      isRegistered: user.isRegistered
    };
  } catch (err) {
    return handleContractError(err);
  }
};

export const getMissions = async () => {
  try {
    const contract = await getContract();
    const missions = await contract.getAllMissions();

    return missions.map((mission) => ({
      mission_id: Number(mission.mission_id),
      category: mission.category,
      max_budget: ethers.formatEther(mission.max_budget), 
      region: mission.region,
      current_status: Number(mission.current_status),
      donor_wallet: mission.donor_wallet,
      assigned_provider: mission.assigned_provider,
      agreed_cost: ethers.formatEther(mission.agreed_cost),
      agency_marked_complete: mission.agency_marked_complete
    }));
  } catch (err) {
    return handleContractError(err);
  }
};

export const getMission = async (missionId) => {
  try {
    const contract = await getContract();
    const mission = await contract.missions(missionId);

    return {
      mission_id: mission.mission_id,
      category: mission.category,
      max_budget: ethers.formatEther(mission.max_budget),
      region: mission.region,
      current_status: Number(mission.current_status),
      donor_wallet: mission.donor_wallet,
      assigned_provider: mission.assigned_provider,
      agreed_cost: ethers.formatEther(mission.agreed_cost),
      agency_marked_complete: mission.agency_marked_complete
    }
  } catch (err) {
    return handleContractError(err);
  }
};

export const getMissionBids = async (missionId) => {
  try {
    const contract = await getContract();
    const bids = await contract.getMissionBids(missionId);

    return bids.map((bid) => ({
      agency: bid.agency,
      amount: ethers.formatEther(bid.amount)
    }));
  } catch (err) {
    return handleContractError(err);
  }
};

export const registerAccount = async (name, role) => {
  try {
    const contract = await getContract();
    const tx = await contract.registerAccount(name, role);
    const receipt = await tx.wait();

    return { success: true, transactionHash: receipt.hash };
  } catch (err) {
    return handleContractError(err);
  }
};

export const postMission = async (category, max_budget, region) => {
  try {
    const contract = await getContract();
    const tx = await contract.postMission(category, ethers.parseEther(max_budget), region);
    const receipt = await tx.wait();

    return { success: true, transactionHash: receipt.hash };
  } catch (err) {
    return handleContractError(err);
  }
};

export const bidOnMission = async (missionId, bidAmount) => {
  try {
    const contract = await getContract();
    const tx = await contract.submitBid(missionId, ethers.parseEther(bidAmount));
    const receipt = await tx.wait();

    return { success: true, transactionHash: receipt.hash };
  } catch (err) {
    return handleContractError(err);
  }
};

export const fundMission = async (missionId, bidIndex, amountInEth) => {
  try {
    const contract = await getContract();
    const tx = await contract.fundMission(missionId, bidIndex, {
      value: ethers.parseEther(amountInEth.toString())
    });
    const receipt = await tx.wait();

    return { success: true, transactionHash: receipt.hash };
  } catch (err) {
    return handleContractError(err);
  }
};

export const markMissionDelivered = async (missionId) => {
  try {
    const contract = await getContract();
    const tx = await contract.markMissionDelivered(missionId);
    const receipt = await tx.wait();

    return { success: true, transactionHash: receipt.hash };
  } catch (err) {
    return handleContractError(err);
  }
};

export const approveAndPay = async (missionId) => {
  try {
    const contract = await getContract();
    const tx = await contract.approveAndPay(missionId);
    const receipt = await tx.wait();

    return { success: true, transactionHash: receipt.hash };
  } catch (err) {
    return handleContractError(err);
  }
};

export const initiateDispute = async (missionId) => {
  try {
    const contract = await getContract();
    const tx = await contract.initiateDispute(missionId);
    const receipt = await tx.wait();

    return { success: true, transactionHash: receipt.hash };
  } catch (err) {
    return handleContractError(err);
  }
};

export const resolveDispute = async (missionId, agencyAtFault) => {
  try {
    const contract = await getContract();
    const tx = await contract.resolveDispute(missionId, agencyAtFault);
    const receipt = await tx.wait();

    return { success: true, transactionHash: receipt.hash };
  } catch (err) {
    return handleContractError(err);
  }
};
