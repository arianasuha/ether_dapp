"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/context/Web3Context';
import { getMissions, getTotalFeesCollected, approveAndPay, initiateDispute, markMissionDelivered } from '@/services/api';
import styles from '@/styles/Dashboard.module.css';

const CATEGORIES = ["All", "Medical", "Food", "Shelter", "Logistics", "Education"];
// Ensure these match the strings being sent to the smart contract exactly
const REGIONS = ["All", "Asia", "Europe", "Middle East", "North America", "South America", "Africa", "Oceania", "Antarctica"];

export default function DashboardPage() {
  const { account, user, loading } = useWeb3();
  const router = useRouter();

  const [allMissions, setAllMissions] = useState([]);
  const [error, setError] = useState(null);
  const [treasury, setTreasury] = useState("0");
  const [filterCategory, setFilterCategory] = useState("All");
  // 1. Add Region Filter State
  const [filterRegion, setFilterRegion] = useState("All");
  const [uiLoading, setUiLoading] = useState(false);
  const [activeView, setActiveView] = useState("all");

  const [txStatus, setTxStatus] = useState({ id: null, msg: "", isError: false });

  const loadData = async () => {
    setUiLoading(true);
    const missionsData = await getMissions();

    if (missionsData.error) {
      setError(missionsData.error);
      setUiLoading(false);
      return;
    }

    let processedMissions = [...missionsData].sort((a, b) => {
      return parseFloat(b.max_budget) - parseFloat(a.max_budget);
    });

    setAllMissions(processedMissions);

    const feeData = await getTotalFeesCollected();
    if (!feeData.error) setTreasury(feeData.total_fees_collected);

    setUiLoading(false);
  };

  useEffect(() => {
    if (account) loadData();
  }, [account, user]);

  const handleAction = async (missionId, actionFn) => {
    setTxStatus({ id: missionId, msg: "Processing...", isError: false });
    const result = await actionFn(missionId);

    if (result.success) {
      setTxStatus({ id: missionId, msg: "Success", isError: false });
      loadData(); // Refresh data to update UI
    } else {
      setTxStatus({ id: missionId, msg: "Error", isError: true });
    }

    // Clear status after 3 seconds
    setTimeout(() => setTxStatus({ id: null, msg: "", isError: false }), 3000);
  };

  useEffect(() => {
    if (!loading && !account) {
      router.push("/");
    }
  }, [account, loading, router]);

  const myMissions = useMemo(() => {
    if (!account) return [];
    if (user?.role === 1) return allMissions.filter(m => m.donor_wallet.toLowerCase() === account.toLowerCase());
    if (user?.role === 2) return allMissions.filter(m => m.assigned_provider.toLowerCase() === account.toLowerCase());
    return [];
  }, [allMissions, account, user]);

  const disputedMissions = useMemo(() => {
    return allMissions.filter(m => m.current_status === 3);
  }, [allMissions]);

  const displayedMissions = useMemo(() => {
  let list = [];
  
  if (activeView === "all") {
    list = user?.role === 3 
      ? allMissions 
      : allMissions.filter(m => m.current_status === 0);
  } 
  else if (activeView === "my") {
    list = myMissions;
  } 
  else if (activeView === "disputed") {
    list = disputedMissions;
  }

  // Apply Category and Region filters to the resulting list
  return list.filter(m => {
    const matchCategory = filterCategory === "All" || m.category === filterCategory;
    const matchRegion = filterRegion === "All" || m.region === filterRegion;
    return matchCategory && matchRegion;
  });
}, [activeView, allMissions, myMissions, disputedMissions, filterCategory, filterRegion, user]);

  const getRoleName = (role) => {
    if (role === 1) return "Donor";
    if (role === 2) return "Relief Agency";
    if (role === 3) return "Arbiter";
    return "User";
  };

  if (loading || uiLoading) return <div className={styles.loader}>Syncing with Satellite...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <main className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.mainTitle}>Conflict Zone Aid Platform</h1>

        <div className={styles.profileGrid}>
          <div className={styles.profileStat}>
            <strong>Wallet Address</strong>
            <p>{account?.substring(0, 8)}...{account?.slice(-6)}</p>
          </div>
          <div className={styles.profileStat}>
            <strong>Agent Name</strong>
            <p>{user?.name || "N/A"}</p>
          </div>
          <div className={styles.profileStat}>
            <strong>Role</strong>
            <p>{getRoleName(user?.role)}</p>
          </div>
          {user?.role === 2 && (
            <div className={styles.profileStat}>
              <strong>Reputation Score</strong>
              <p className={styles.repScore}>{user?.reputationScore?.toString() || 0}</p>
            </div>
          )}
          {user?.role === 3 && (
            <div className={styles.profileStat}>
              <strong>Total Fees Collected</strong>
              <p className={styles.repScore}>{treasury || 0} ETH</p>
            </div>
          )}
        </div>
      </header>

      <nav className={styles.navbar}>
        <div className={styles.navGroup}>
          <button
            onClick={() => { setActiveView("all"); setFilterCategory("All"); setFilterRegion("All"); }}
            className={`${styles.navBtn} ${activeView === 'all' ? styles.active : ''}`}
          >
            All Missions
          </button>

          {user?.role === 3 ? (
            <button
              onClick={() => { setActiveView("disputed"); setFilterCategory("All"); setFilterRegion("All"); }}
              className={`${styles.navBtn} ${activeView === 'disputed' ? styles.active : ''}`}
            >
              Disputed Missions
            </button>
          ) : (
            <button
              onClick={() => { setActiveView("my"); setFilterCategory("All"); setFilterRegion("All"); }}
              className={`${styles.navBtn} ${activeView === 'my' ? styles.active : ''}`}
            >
              My Missions
            </button>
          )}
        </div>

        {user?.role === 1 && (
          <button
            className={styles.postBtn}
            onClick={() => router.push("/mission/create")}
          >
            Post Mission
          </button>
        )}
      </nav>

      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <div className={styles.selectWrapper}>
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <label htmlFor="region">Region</label>
            <select
              id="region"
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
            >
              {REGIONS.map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section className={styles.missionList}>
        {displayedMissions.map((mission) => {
          const isPending = mission.current_status === 0;
          const isDelivered = mission.current_status === 2;
          const isDisputed = mission.current_status === 3;
          const isResolved = mission.current_status === 4;
          const isMarkedCompleteByAgency = mission.agency_marked_complete;
          return (
            <div key={mission.mission_id} className={styles.missionCard}>
              <div className={styles.cardHeader}>
                <span className={styles.missionId}>ID: {mission.mission_id}</span>
                <span className={`${styles.statusBadge} ${mission.current_status === 0 ? styles.pending : mission.current_status === 3 ? styles.disputed : styles.progress}`}>
                  Current Status: {mission.current_status === 0 ? "Pending" : mission.current_status === 1 ? "In Transit" : mission.current_status === 2 ? "Delivered" : mission.current_status === 3 ? "Disputed" : "Resolved"}
                </span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <span>Category:</span> <strong>{mission.category}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Max Budget:</span> <strong>{mission.max_budget} ETH</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Region:</span> <strong>{mission.region}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Donor Address:</span> <strong>{mission.donor_wallet.substring(0, 6)}...{mission.donor_wallet.slice(-4)}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Assigned Provider Address:</span> <strong>{mission.assigned_provider.substring(0, 6)}...{mission.assigned_provider.slice(-4)}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Agreed Cost:</span> <strong>{mission.agreed_cost} ETH</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Mission Delivered:</span> <strong>{mission.agency_marked_complete ? "Yes" : "No"}</strong>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button
                  onClick={() => router.push(`/mission/${mission.mission_id}`)}
                  className={styles.detailsBtn}
                >
                  View Details
                </button>
                {activeView === "my" && (
                  <div className={styles.actionButtonGroup}>
                    {user?.role === 1 && isMarkedCompleteByAgency && !isDelivered && !isPending && !isDisputed && !isResolved && (
                      <>
                        <button
                          className={styles.approveBtn}
                          onClick={() => handleAction(mission.mission_id, approveAndPay)}
                        >
                          Approve and Pay
                        </button>
                        <button
                          className={styles.disputeBtn}
                          onClick={() => handleAction(mission.mission_id, initiateDispute)}
                        >
                          Initiate Dispute
                        </button>
                      </>
                    )}
                    {user?.role === 2 && !isMarkedCompleteByAgency && !isDelivered && !isPending && !isDisputed && !isResolved && (
                      <button
                        className={styles.deliveredBtn}
                        onClick={() => handleAction(mission.mission_id, markMissionDelivered)}
                      >
                        Mark As Delivered
                      </button>
                    )}
                  </div>
                )}
                {txStatus.id === mission.mission_id && (
                  <p className={txStatus.isError ? styles.errorMsg : styles.successMsg}>
                    {txStatus.msg}
                  </p>
                )}

              </div>
            </div>
          )
        })}

        {displayedMissions.length === 0 && (
          <div className={styles.emptyState}>No missions match your current filters.</div>
        )}
      </section>
    </main >
  );
}