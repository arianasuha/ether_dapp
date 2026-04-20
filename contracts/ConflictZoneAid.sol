// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ConflictZoneAid {
    enum Role { None, Donor, Relief_Agency, UN_Arbiter }
    enum Status { Pending, In_Transit, Delivered, Disputed, Resolved }

    struct User {
        string name;
        Role role;
        uint256 reputationScore;
        bool isRegistered;
    }

    struct Bid {
        address agency;
        uint256 amount;
    }

    struct Mission {
        uint256 mission_id;      
        string category;
        uint256 max_budget;     
        string region;         
        Status current_status;   
        address donor_wallet;    
        address assigned_provider; 
        uint256 agreed_cost;
        bool agency_marked_complete;
    }

    address public un_arbiter_admin;
    uint256 public mission_count;
    uint256 public totalFeesCollected;

    mapping(address => User) public users;
    mapping(uint256 => Mission) public missions;
    mapping(uint256 => Bid[]) public missionBids;

    event MissionUpdated(uint256 indexed missionId, Status status);
    event NewBid(uint256 indexed missionId, address agency, uint256 amount);

    constructor() {
        un_arbiter_admin = msg.sender;
        users[msg.sender] = User("UN Admin", Role.UN_Arbiter, 1000, true);
    }

    function registerAccount(string memory _name, Role _role) external {
        require(!users[msg.sender].isRegistered, "Wallet address cannot be registered twice");
        require(_role != Role.None, "Must select a valid role");

        uint256 initialRep = 0;
        if (_role == Role.Relief_Agency) {
            initialRep = 100;
        }

        users[msg.sender] = User({
            name: _name,
            role: _role,
            reputationScore: initialRep,
            isRegistered: true
        });
    }

    function getAllMissions() public view returns (Mission[] memory) {
        Mission[] memory allMissions = new Mission[](mission_count);
        for (uint256 i = 1; i <= mission_count; i++) {
            allMissions[i - 1] = missions[i];
        }
        return allMissions;
    }

    function postMission(string memory _cat, uint256 _budgetInWei, string memory _region) external {
        require(users[msg.sender].role == Role.Donor, "Only Donor accounts can post missions");
        mission_count++;
        Mission storage m = missions[mission_count];
        m.mission_id = mission_count;
        m.category = _cat;
        m.max_budget = _budgetInWei; 
        m.region = _region;
        m.current_status = Status.Pending;
        m.donor_wallet = msg.sender;
        emit MissionUpdated(mission_count, Status.Pending);
    }

    function submitBid(uint256 _mId, uint256 _bidAmount) external {
        require(users[msg.sender].role == Role.Relief_Agency, "Only Relief Agencies can pledge");
        require(users[msg.sender].reputationScore >= 40, "Reputation Score below 40"); 
        require(_bidAmount <= missions[_mId].max_budget, "Bid exceeds Max Budget");
        require(missions[_mId].current_status == Status.Pending, "Mission is not accepting bids");

        missionBids[_mId].push(Bid(msg.sender, _bidAmount));

        emit NewBid(_mId, msg.sender, _bidAmount);
    }

    function getMissionBids(uint256 _mId) public view returns (Bid[] memory) {
        Mission storage m = missions[_mId];
        require(
            msg.sender == m.donor_wallet || msg.sender == un_arbiter_admin,
            "Only the Donor or Admin can view these bids"
        );

        return missionBids[_mId];
    }

    function fundMission(uint256 _mId, uint256 _bidIndex) external payable {
        Mission storage m = missions[_mId];
        require(m.current_status == Status.Pending, "Mission already funded or completed");
        
        Bid memory selected = missionBids[_mId][_bidIndex];
        require(msg.sender == m.donor_wallet, "Only the Donor can select a pledge"); 
        require(msg.value >= selected.amount, "Insufficient Ether sent"); 

        m.assigned_provider = selected.agency;
        m.agreed_cost = selected.amount;
        m.current_status = Status.In_Transit; 

        uint256 excess = msg.value - selected.amount;
        if (excess > 0) {
            (bool success, ) = payable(msg.sender).call{value: excess}("");
            require(success, "Refund failed");
        }
        emit MissionUpdated(_mId, Status.In_Transit);
    }

    function markMissionDelivered(uint256 _mId) external {
        require(msg.sender == missions[_mId].assigned_provider, "Not the assigned agency");
        missions[_mId].agency_marked_complete = true;
    }

    function approveAndPay(uint256 _mId) external {
        Mission storage m = missions[_mId];
        require(msg.sender == m.donor_wallet, "Donor must approve delivery"); 
        require(m.agency_marked_complete, "Agency hasn't marked delivery");
        require(m.current_status == Status.In_Transit, "Mission not in transit");

        m.current_status = Status.Delivered;
        users[m.assigned_provider].reputationScore += 15; 

        _processPayment(m);
        emit MissionUpdated(_mId, Status.Delivered);
    }

    function _processPayment(Mission storage m) internal {
        uint256 fee;
        if (m.agreed_cost < 2 ether) {
            fee = (m.agreed_cost * 2) / 100;
        } else {
            fee = (m.agreed_cost * 1) / 100;
        }
        
        totalFeesCollected += fee;
        uint256 agencyPayout = m.agreed_cost - fee;

        (bool feeSuccess, ) = payable(un_arbiter_admin).call{value: fee}(""); 
        require(feeSuccess, "Fee transfer failed");

        (bool paySuccess, ) = payable(m.assigned_provider).call{value: agencyPayout}(""); 
        require(paySuccess, "Agency payout failed");
    }

    function initiateDispute(uint256 _mId) external {
        require(msg.sender == missions[_mId].donor_wallet, "Only Donor can dispute");
        missions[_mId].current_status = Status.Disputed;
        emit MissionUpdated(_mId, Status.Disputed);
    }

    function resolveDispute(uint256 _mId, bool _agencyAtFault) external {
        require(msg.sender == un_arbiter_admin, "Only UN Arbiter can resolve");
        Mission storage m = missions[_mId];
        require(m.current_status == Status.Disputed, "Mission is not disputed");

        m.current_status = Status.Resolved;

        if (_agencyAtFault) {
            if (users[m.assigned_provider].reputationScore >= 30) {
                users[m.assigned_provider].reputationScore -= 30;
            } else {
                users[m.assigned_provider].reputationScore = 0;
            }

            (bool success, ) = payable(m.donor_wallet).call{value: m.agreed_cost}("");
            require(success, "Refund failed");
        } else {
            _processPayment(m);
        }
        emit MissionUpdated(_mId, Status.Resolved);
    }
}
