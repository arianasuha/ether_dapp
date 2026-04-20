"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useWeb3 } from "@/context/Web3Context";
import { getMission, bidOnMission, getMissionBids, fundMission, resolveDispute } from "@/services/api";
import styles from "./missionDetails.module.css";

export default function MissionDetailsPage({ params }) {
  const resolvedParams = use(params);
  const missionId = resolvedParams.id;
  const router = useRouter();
  const { account, user, loading: web3Loading } = useWeb3();

  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bids, setBids] = useState([]);
  const [showPledges, setShowPledges] = useState(false);
  const [activeBidIndex, setActiveBidIndex] = useState(null);
  const [fundAmount, setFundAmount] = useState("");
  const [isFunding, setIsFunding] = useState(false);
  const [fundStatus, setFundStatus] = useState({ type: "", text: "" });

  const [showResolveForm, setShowResolveForm] = useState(false);
  const [agencyAtFault, setAgencyAtFault] = useState(true); // Boolean for Radio
  const [isResolving, setIsResolving] = useState(false);
  const [resolveStatus, setResolveStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!account) {
      router.push("/");
    }
  }, [account]);

  useEffect(() => {
    async function loadData() {
      const missionData = await getMission(missionId);
      if (!missionData.error) setMission(missionData);
      
      if (user?.role === 1) {
        const bidData = await getMissionBids(missionId);
        if (!bidData.error) setBids(bidData);
      }
      
      setLoading(false);
    }
    if (missionId) loadData();
  }, [missionId]);

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setIsResolving(true);
    setResolveStatus({ type: "", text: "" });

    const result = await resolveDispute(missionId, agencyAtFault);

    if (result.success) {
      setResolveStatus({ type: "success", text: "Success" });
      setTimeout(() => window.location.reload(), 2000);
    } else {
      setResolveStatus({ type: "error", text: "Error" });
    }
    setIsResolving(false);
  };

  const handleFundSubmit = async (e, bidIndex, bidAmount) => {
    e.preventDefault();
    setIsFunding(true);
    setFundStatus({ type: "", text: "" });

    const result = await fundMission(missionId, bidIndex, fundAmount);

    if (result.success) {
      setFundStatus({ type: "success", text: "Successfully funded. Transaction hash: " + result.transactionHash });
      setTimeout(() => window.location.reload(), 2000); // Reload to reflect In_Transit status
    } else {
      setFundStatus({ type: "error", text: result.error || "Transaction failed" });
    }
    setIsFunding(false);
  };

  const calculateExcess = (bidAmount) => {
    const val = parseFloat(fundAmount) - parseFloat(bidAmount);
    return val > 0 ? val.toFixed(4) : 0;
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg({ type: "", text: "" });

    const result = await bidOnMission(missionId, bidAmount);

    if (result.success) {
      setStatusMsg({ type: "success", text: `Successfully bid. Transaction hash: ${result.transactionHash}` });
      setBidAmount("");
      setTimeout(() => {
        setShowBidForm(false);
        setStatusMsg({ type: "", text: "" });
      }, 2000);
    } else {
      setStatusMsg({ type: "error", text: result.error || "Transaction failed" });
    }
    setIsSubmitting(false);
  };

  const hasLowReputation = (user?.reputationScore || 0) < 40;
  const isNotPending = mission?.current_status !== 0;
  const isOverBudget = parseFloat(bidAmount) > parseFloat(mission?.max_budget || 0);
  const isDisputed = mission?.current_status === 3;

  if (web3Loading || loading) return <div className={styles.loader}>Loading...</div>;

  return (
    <main className={styles.container}>
      <div className={styles.headerLine} />
      
      <button onClick={() => router.back()} className={styles.backBtn}>
        <span className={styles.arrow}></span> Back
      </button>

      <div className={styles.reportBar}>
        <div className={styles.missionInfo}>
          <div className={styles.missionIdLabel}>Mission ID: {missionId}</div>
          <div className={styles.statusLabel}>
            Current Status: {mission.current_status === 0 ? "Pending" : mission.current_status === 1 ? "In Transit" : mission.current_status === 2 ? "Delivered" : mission.current_status === 3 ? "Disputed" : "Resolved"}
          </div>

          <div className={styles.detailsList}>
            <p className={styles.detailItem}>Category: {mission?.category}</p>
            <p className={styles.detailItem}>Max Budget: {mission?.max_budget} ETH</p>
            <p className={styles.detailItem}>Region: {mission?.region}</p>
            <p className={styles.detailItem}>Donor Address: {mission?.donor_wallet?.substring(0,6)}...{mission?.donor_wallet?.slice(-5)}</p>
            <p className={styles.detailItem}>Assigned Provider Address: {mission?.assigned_provider?.substring(0,6)}...{mission?.assigned_provider?.slice(-5)}</p>
            <p className={styles.detailItem}>Agreed Cost: {mission?.agreed_cost} ETH</p>
            <p className={styles.detailItem}>Mission Delivered: {mission?.agency_marked_complete ? "True" : "False"}</p>
          </div>

          {user?.role === 1 && (
            <button 
              className={styles.viewPledgesBtn} 
              onClick={() => setShowPledges(!showPledges)}
            >
              View Pledges
            </button>
          )}

          {/* Only show Submit Pledge button for Relief Agencies (Role 2) */}
          {user?.role === 2 && (
            <div style={{ position: 'absolute', left: '861px', top: '103px' }}>
              <button 
                className={styles.submitPledgeBtn} 
                onClick={() => setShowBidForm(!showBidForm)}
                disabled={hasLowReputation || isNotPending}
                title={hasLowReputation ? "Reputation too low" : isNotPending ? "Mission closed" : ""}
                style={{ opacity: (hasLowReputation || isNotPending) ? 0.5 : 1, position: 'static' }}
              >
                {showBidForm ? "Close Form" : "Submit Pledge"}
              </button>
              {hasLowReputation && <p className={styles.warningText}>Reputation &lt; 40</p>}
            </div>
          )}

          {showBidForm && (
            <div className={styles.bidFormContainer}>
              <form onSubmit={handleBidSubmit}>
                <div className={styles.inputWrapper} style={{ borderColor: isOverBudget ? '#980000' : '#ECECEC' }}>
                  <label className={styles.inputLabel}>Amount</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    className={styles.bidInput} 
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className={styles.submitBidBtn}
                  disabled={isSubmitting || isOverBudget || !bidAmount}
                >
                  {isOverBudget ? "Exceeds Budget" : isSubmitting ? "Processing..." : "Submit Bid"}
                </button>
              </form>
              
              {statusMsg.text && (
                <div className={statusMsg.type === "success" ? styles.successText : styles.errorText}>
                  {statusMsg.text}
                </div>
              )}
            </div>
          )}

          {user?.role === 3 && isDisputed && (
            <>
              <button 
                className={styles.resolveDisputeBtn} 
                onClick={() => setShowResolveForm(!showResolveForm)}
              >
                Resolve Dispute
              </button>

              {showResolveForm && (
                <div className={styles.resolveFormContainer}>
                  <form onSubmit={handleResolveSubmit}>
                    <div className={styles.radioGroup} onClick={() => setAgencyAtFault(true)}>
                      <div className={styles.radioCircle} style={{ background: agencyAtFault ? '#FFFFFF' : 'transparent' }} />
                      <span className={styles.radioLabel}>Agency At Fault</span>
                    </div>

                    <div className={styles.radioGroup} onClick={() => setAgencyAtFault(false)}>
                      <div className={styles.radioCircle} style={{ background: !agencyAtFault ? '#FFFFFF' : 'transparent' }} />
                      <span className={styles.radioLabel}>Agency Not At Fault</span>
                    </div>

                    <button type="submit" className={styles.resolveSubmitBtn} disabled={isResolving}>
                      {isResolving ? "Processing..." : "Resolve"}
                    </button>
                  </form>
                  
                  {resolveStatus.text && (
                    <div className={resolveStatus.type === "success" ? styles.successTextArbiter : styles.errorTextArbiter}>
                      {resolveStatus.text}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {user?.role === 1 && showPledges && (
        <div className={styles.pledgeSectionContainer}>
          {bids.length === 0 ? (
            <div className={styles.pledgeBar}><p className={styles.detailItem}>No pledges found for this mission.</p></div>
          ) : (
            bids.map((bid, index) => (
              <div key={index} className={styles.pledgeBar}>
                <div className={styles.pledgeTitle}>Pledges</div>
                <p className={styles.bidNumber}>Bid Number: {index}</p>
                <p className={styles.bidAgency}>Agency: {bid.agency.substring(0,10)}...</p>
                <p className={styles.bidAmount}>Amount: {bid.amount} ETH</p>

                {!isNotPending && <button 
                  className={styles.acceptPledgeBtn}
                  onClick={() => {
                    setActiveBidIndex(activeBidIndex === index ? null : index);
                    setFundAmount(bid.amount); // Default input to bid amount
                  }}
                >
                  Accept Pledge
                </button>}

                {activeBidIndex === index && (
                  <div className={styles.fundFormBox}>
                    <form onSubmit={(e) => handleFundSubmit(e, index, bid.amount)}>
                      <div className={styles.fundInputWrapper}>
                        <label className={styles.fundLabel}>Amount</label>
                        <input 
                          type="number" 
                          step="0.0001"
                          value={fundAmount}
                          onChange={(e) => setFundAmount(e.target.value)}
                          className={styles.fundInput}
                          required
                        />
                      </div>
                      <button type="submit" className={styles.fundMissionBtn} disabled={isFunding}>
                        {isFunding ? "Processing..." : "Fund Mission"}
                      </button>
                    </form>
                    
                    {calculateExcess(bid.amount) > 0 && (
                      <p className={styles.excessNote}>
                        Note: Excess {calculateExcess(bid.amount)} ETH will be refunded.
                      </p>
                    )}
                    {fundStatus.text && (
                      <p className={fundStatus.type === "success" ? styles.successText : styles.errorText}>
                        {fundStatus.text}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}