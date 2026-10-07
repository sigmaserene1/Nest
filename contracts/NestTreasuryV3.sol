// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITreasuryUSDC {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title Nest Treasury V3
/// @notice Advanced shared-USDC treasury controls for teams and high-trust groups.
/// @dev Deployed separately from legacy ExpenseManager / Business V2 so existing homes are never migrated implicitly.
contract NestTreasuryV3 {
    ITreasuryUSDC public immutable usdc;

    uint256 public workspaceCount;
    uint256 public proposalCount;
    uint256 public recurringCount;
    uint256 public milestoneCount;

    struct Workspace {
        uint256 id;
        string name;
        address owner;
        uint64 createdAt;
        uint16 approvalThreshold;
        uint16 managerCount;
        uint256 availableTreasury;
        uint256 reservedTreasury;
    }

    struct PaymentProposal {
        uint256 id;
        uint256 workspaceId;
        address proposer;
        address recipient;
        uint256 amount;
        string memo;
        uint64 createdAt;
        uint64 expiresAt;
        uint16 approvals;
        bool executed;
        bool cancelled;
    }

    struct RecurringPayment {
        uint256 id;
        uint256 workspaceId;
        address recipient;
        uint256 amount;
        uint64 intervalSeconds;
        uint64 nextExecutionAt;
        uint32 remainingExecutions; // 0 = unlimited
        string memo;
        bool active;
    }

    struct Milestone {
        uint256 id;
        uint256 workspaceId;
        address recipient;
        uint256 amount;
        string description;
        uint64 createdAt;
        uint16 approvals;
        bool released;
        bool cancelled;
    }

    struct BudgetPolicy {
        bool active;
        uint64 periodSeconds;
        uint64 periodStartedAt;
        uint256 limit;
        uint256 spent;
    }

    mapping(uint256 => Workspace) private workspaces;
    mapping(uint256 => address[]) private members;
    mapping(uint256 => mapping(address => bool)) public isMember;
    mapping(uint256 => mapping(address => bool)) public isManager;
    mapping(address => uint256[]) private userWorkspaces;

    mapping(uint256 => PaymentProposal) private proposals;
    mapping(uint256 => mapping(address => bool)) public proposalApprovedBy;
    mapping(uint256 => uint256[]) private workspaceProposals;

    mapping(uint256 => RecurringPayment) private recurringPayments;
    mapping(uint256 => uint256[]) private workspaceRecurring;

    mapping(uint256 => Milestone) private milestones;
    mapping(uint256 => mapping(address => bool)) public milestoneApprovedBy;
    mapping(uint256 => uint256[]) private workspaceMilestones;

    mapping(uint256 => mapping(address => BudgetPolicy)) private budgets;

    event WorkspaceCreated(uint256 indexed workspaceId, address indexed owner, string name);
    event MemberAdded(uint256 indexed workspaceId, address indexed member);
    event ManagerSet(uint256 indexed workspaceId, address indexed manager, bool enabled);
    event ApprovalThresholdSet(uint256 indexed workspaceId, uint16 threshold);
    event TreasuryDeposited(uint256 indexed workspaceId, address indexed from, uint256 amount);
    event TreasuryWithdrawn(uint256 indexed workspaceId, address indexed to, uint256 amount);

    event ProposalCreated(uint256 indexed proposalId, uint256 indexed workspaceId, address indexed recipient, uint256 amount);
    event ProposalApproved(uint256 indexed proposalId, address indexed manager, uint16 approvals);
    event ProposalExecuted(uint256 indexed proposalId, address indexed recipient, uint256 amount);
    event ProposalCancelled(uint256 indexed proposalId);

    event RecurringPaymentCreated(uint256 indexed recurringId, uint256 indexed workspaceId, address indexed recipient, uint256 amount, uint64 intervalSeconds);
    event RecurringPaymentExecuted(uint256 indexed recurringId, address indexed recipient, uint256 amount, uint64 nextExecutionAt);
    event RecurringPaymentCancelled(uint256 indexed recurringId);

    event MilestoneCreated(uint256 indexed milestoneId, uint256 indexed workspaceId, address indexed recipient, uint256 amount);
    event MilestoneApproved(uint256 indexed milestoneId, address indexed manager, uint16 approvals);
    event MilestoneReleased(uint256 indexed milestoneId, address indexed recipient, uint256 amount);
    event MilestoneCancelled(uint256 indexed milestoneId);

    event BudgetPolicySet(uint256 indexed workspaceId, address indexed spender, uint256 limit, uint64 periodSeconds);
    event BudgetSpent(uint256 indexed workspaceId, address indexed spender, address indexed recipient, uint256 amount, string memo);
    event BudgetPolicyRevoked(uint256 indexed workspaceId, address indexed spender);

    modifier onlyMember(uint256 workspaceId) {
        require(isMember[workspaceId][msg.sender], "not a member");
        _;
    }

    modifier onlyManager(uint256 workspaceId) {
        require(isManager[workspaceId][msg.sender], "not a manager");
        _;
    }

    modifier onlyOwner(uint256 workspaceId) {
        require(workspaces[workspaceId].owner == msg.sender, "only owner");
        _;
    }

    constructor(address usdcAddress) {
        require(usdcAddress != address(0), "USDC required");
        usdc = ITreasuryUSDC(usdcAddress);
    }

    // --------------------------------------------------------------- workspace

    function createWorkspace(string calldata name) external returns (uint256 workspaceId) {
        require(bytes(name).length > 0 && bytes(name).length <= 80, "invalid name");
        workspaceId = ++workspaceCount;
        workspaces[workspaceId] = Workspace({
            id: workspaceId,
            name: name,
            owner: msg.sender,
            createdAt: uint64(block.timestamp),
            approvalThreshold: 1,
            managerCount: 1,
            availableTreasury: 0,
            reservedTreasury: 0
        });
        _addMember(workspaceId, msg.sender);
        isManager[workspaceId][msg.sender] = true;
        emit WorkspaceCreated(workspaceId, msg.sender, name);
        emit ManagerSet(workspaceId, msg.sender, true);
    }

    function addMember(uint256 workspaceId, address member) external onlyManager(workspaceId) {
        require(member != address(0) && !isMember[workspaceId][member], "invalid member");
        _addMember(workspaceId, member);
    }

    function _addMember(uint256 workspaceId, address member) internal {
        isMember[workspaceId][member] = true;
        members[workspaceId].push(member);
        userWorkspaces[member].push(workspaceId);
        emit MemberAdded(workspaceId, member);
    }

    function setManager(uint256 workspaceId, address manager, bool enabled) external onlyOwner(workspaceId) {
        require(isMember[workspaceId][manager], "manager must be member");
        bool current = isManager[workspaceId][manager];
        if (current == enabled) return;

        Workspace storage w = workspaces[workspaceId];
        if (enabled) {
            isManager[workspaceId][manager] = true;
            w.managerCount += 1;
        } else {
            require(manager != w.owner, "owner stays manager");
            require(w.managerCount > 1, "need a manager");
            require(w.approvalThreshold < w.managerCount, "lower threshold first");
            isManager[workspaceId][manager] = false;
            w.managerCount -= 1;
        }
        emit ManagerSet(workspaceId, manager, enabled);
    }

    function setApprovalThreshold(uint256 workspaceId, uint16 threshold) external onlyOwner(workspaceId) {
        Workspace storage w = workspaces[workspaceId];
        require(threshold > 0 && threshold <= w.managerCount, "invalid threshold");
        w.approvalThreshold = threshold;
        emit ApprovalThresholdSet(workspaceId, threshold);
    }

    function getWorkspace(uint256 workspaceId) external view returns (Workspace memory) {
        return workspaces[workspaceId];
    }

    function getWorkspaceMembers(uint256 workspaceId) external view returns (address[] memory) {
        return members[workspaceId];
    }

    function getUserWorkspaces(address user) external view returns (Workspace[] memory out) {
        uint256[] storage ids = userWorkspaces[user];
        out = new Workspace[](ids.length);
        for (uint256 i; i < ids.length; i++) out[i] = workspaces[ids[i]];
    }

    // ---------------------------------------------------------------- treasury

    function deposit(uint256 workspaceId, uint256 amount) external onlyMember(workspaceId) {
        require(amount > 0, "amount required");
        require(usdc.transferFrom(msg.sender, address(this), amount), "transfer failed");
        workspaces[workspaceId].availableTreasury += amount;
        emit TreasuryDeposited(workspaceId, msg.sender, amount);
    }

    /// @notice Owner emergency withdrawal. Normal treasury payments should use proposals.
    function ownerWithdraw(uint256 workspaceId, address to, uint256 amount) external onlyOwner(workspaceId) {
        require(to != address(0) && amount > 0, "invalid withdrawal");
        Workspace storage w = workspaces[workspaceId];
        require(w.availableTreasury >= amount, "insufficient treasury");
        w.availableTreasury -= amount;
        require(usdc.transfer(to, amount), "transfer failed");
        emit TreasuryWithdrawn(workspaceId, to, amount);
    }

    // ---------------------------------------------------------- approvals/payments

    function createPaymentProposal(
        uint256 workspaceId,
        address recipient,
        uint256 amount,
        string calldata memo,
        uint64 expiresAt
    ) external onlyManager(workspaceId) returns (uint256 proposalId) {
        require(recipient != address(0) && amount > 0, "invalid payment");
        require(expiresAt > block.timestamp, "invalid expiry");
        require(bytes(memo).length <= 200, "memo too long");

        proposalId = ++proposalCount;
        PaymentProposal storage p = proposals[proposalId];
        p.id = proposalId;
        p.workspaceId = workspaceId;
        p.proposer = msg.sender;
        p.recipient = recipient;
        p.amount = amount;
        p.memo = memo;
        p.createdAt = uint64(block.timestamp);
        p.expiresAt = expiresAt;

        workspaceProposals[workspaceId].push(proposalId);
        _approveProposal(proposalId, msg.sender);
        emit ProposalCreated(proposalId, workspaceId, recipient, amount);
    }

    function approveProposal(uint256 proposalId) external {
        PaymentProposal storage p = proposals[proposalId];
        require(p.id != 0, "proposal not found");
        require(isManager[p.workspaceId][msg.sender], "not a manager");
        _approveProposal(proposalId, msg.sender);
    }

    function _approveProposal(uint256 proposalId, address manager) internal {
        PaymentProposal storage p = proposals[proposalId];
        require(!p.executed && !p.cancelled && block.timestamp <= p.expiresAt, "proposal inactive");
        require(!proposalApprovedBy[proposalId][manager], "already approved");
        proposalApprovedBy[proposalId][manager] = true;
        p.approvals += 1;
        emit ProposalApproved(proposalId, manager, p.approvals);
    }

    function executeProposal(uint256 proposalId) external {
        PaymentProposal storage p = proposals[proposalId];
        require(p.id != 0 && !p.executed && !p.cancelled, "proposal inactive");
        require(block.timestamp <= p.expiresAt, "proposal expired");
        Workspace storage w = workspaces[p.workspaceId];
        require(p.approvals >= w.approvalThreshold, "more approvals required");
        require(w.availableTreasury >= p.amount, "insufficient treasury");

        p.executed = true;
        w.availableTreasury -= p.amount;
        require(usdc.transfer(p.recipient, p.amount), "transfer failed");
        emit ProposalExecuted(proposalId, p.recipient, p.amount);
    }

    function cancelProposal(uint256 proposalId) external {
        PaymentProposal storage p = proposals[proposalId];
        require(p.id != 0 && !p.executed && !p.cancelled, "proposal inactive");
        require(msg.sender == p.proposer || workspaces[p.workspaceId].owner == msg.sender, "cannot cancel");
        p.cancelled = true;
        emit ProposalCancelled(proposalId);
    }

    function getProposal(uint256 proposalId) external view returns (PaymentProposal memory) {
        return proposals[proposalId];
    }

    function getWorkspaceProposalIds(uint256 workspaceId) external view returns (uint256[] memory) {
        return workspaceProposals[workspaceId];
    }

    // ------------------------------------------------------------- recurring pay

    function createRecurringPayment(
        uint256 workspaceId,
        address recipient,
        uint256 amount,
        uint64 intervalSeconds,
        uint64 firstExecutionAt,
        uint32 executions,
        string calldata memo
    ) external onlyManager(workspaceId) returns (uint256 recurringId) {
        require(recipient != address(0) && amount > 0, "invalid payment");
        require(intervalSeconds >= 1 hours, "interval too short");
        require(firstExecutionAt >= block.timestamp, "invalid first execution");
        require(bytes(memo).length <= 200, "memo too long");

        recurringId = ++recurringCount;
        recurringPayments[recurringId] = RecurringPayment({
            id: recurringId,
            workspaceId: workspaceId,
            recipient: recipient,
            amount: amount,
            intervalSeconds: intervalSeconds,
            nextExecutionAt: firstExecutionAt,
            remainingExecutions: executions,
            memo: memo,
            active: true
        });
        workspaceRecurring[workspaceId].push(recurringId);
        emit RecurringPaymentCreated(recurringId, workspaceId, recipient, amount, intervalSeconds);
    }

    /// @notice Anyone may trigger a due schedule; funds always go to the pre-approved recipient.
    function executeRecurringPayment(uint256 recurringId) external {
        RecurringPayment storage r = recurringPayments[recurringId];
        require(r.id != 0 && r.active, "schedule inactive");
        require(block.timestamp >= r.nextExecutionAt, "not due");
        Workspace storage w = workspaces[r.workspaceId];
        require(w.availableTreasury >= r.amount, "insufficient treasury");

        w.availableTreasury -= r.amount;
        if (r.remainingExecutions > 0) {
            r.remainingExecutions -= 1;
            if (r.remainingExecutions == 0) r.active = false;
        }
        r.nextExecutionAt = uint64(uint256(r.nextExecutionAt) + r.intervalSeconds);
        require(usdc.transfer(r.recipient, r.amount), "transfer failed");
        emit RecurringPaymentExecuted(recurringId, r.recipient, r.amount, r.nextExecutionAt);
    }

    function cancelRecurringPayment(uint256 recurringId) external {
        RecurringPayment storage r = recurringPayments[recurringId];
        require(r.id != 0, "schedule not found");
        require(isManager[r.workspaceId][msg.sender], "not a manager");
        r.active = false;
        emit RecurringPaymentCancelled(recurringId);
    }

    function getRecurringPayment(uint256 recurringId) external view returns (RecurringPayment memory) {
        return recurringPayments[recurringId];
    }

    function getWorkspaceRecurringIds(uint256 workspaceId) external view returns (uint256[] memory) {
        return workspaceRecurring[workspaceId];
    }

    // ------------------------------------------------------------- milestone escrow

    function createMilestone(
        uint256 workspaceId,
        address recipient,
        uint256 amount,
        string calldata description
    ) external onlyManager(workspaceId) returns (uint256 milestoneId) {
        require(recipient != address(0) && amount > 0, "invalid milestone");
        require(bytes(description).length > 0 && bytes(description).length <= 200, "invalid description");

        Workspace storage w = workspaces[workspaceId];
        require(w.availableTreasury >= amount, "insufficient treasury");
        w.availableTreasury -= amount;
        w.reservedTreasury += amount;

        milestoneId = ++milestoneCount;
        Milestone storage m = milestones[milestoneId];
        m.id = milestoneId;
        m.workspaceId = workspaceId;
        m.recipient = recipient;
        m.amount = amount;
        m.description = description;
        m.createdAt = uint64(block.timestamp);

        workspaceMilestones[workspaceId].push(milestoneId);
        _approveMilestone(milestoneId, msg.sender);
        emit MilestoneCreated(milestoneId, workspaceId, recipient, amount);
    }

    function approveMilestone(uint256 milestoneId) external {
        Milestone storage m = milestones[milestoneId];
        require(m.id != 0, "milestone not found");
        require(isManager[m.workspaceId][msg.sender], "not a manager");
        _approveMilestone(milestoneId, msg.sender);
    }

    function _approveMilestone(uint256 milestoneId, address manager) internal {
        Milestone storage m = milestones[milestoneId];
        require(!m.released && !m.cancelled, "milestone inactive");
        require(!milestoneApprovedBy[milestoneId][manager], "already approved");
        milestoneApprovedBy[milestoneId][manager] = true;
        m.approvals += 1;
        emit MilestoneApproved(milestoneId, manager, m.approvals);
    }

    function releaseMilestone(uint256 milestoneId) external {
        Milestone storage m = milestones[milestoneId];
        require(m.id != 0 && !m.released && !m.cancelled, "milestone inactive");
        Workspace storage w = workspaces[m.workspaceId];
        require(m.approvals >= w.approvalThreshold, "more approvals required");

        m.released = true;
        w.reservedTreasury -= m.amount;
        require(usdc.transfer(m.recipient, m.amount), "transfer failed");
        emit MilestoneReleased(milestoneId, m.recipient, m.amount);
    }

    function cancelMilestone(uint256 milestoneId) external onlyOwner(milestones[milestoneId].workspaceId) {
        Milestone storage m = milestones[milestoneId];
        require(m.id != 0 && !m.released && !m.cancelled, "milestone inactive");
        Workspace storage w = workspaces[m.workspaceId];
        m.cancelled = true;
        w.reservedTreasury -= m.amount;
        w.availableTreasury += m.amount;
        emit MilestoneCancelled(milestoneId);
    }

    function getMilestone(uint256 milestoneId) external view returns (Milestone memory) {
        return milestones[milestoneId];
    }

    function getWorkspaceMilestoneIds(uint256 workspaceId) external view returns (uint256[] memory) {
        return workspaceMilestones[workspaceId];
    }

    // --------------------------------------------------------------- budgets

    function setBudgetPolicy(
        uint256 workspaceId,
        address spender,
        uint256 limit,
        uint64 periodSeconds
    ) external onlyManager(workspaceId) {
        require(isMember[workspaceId][spender], "spender must be member");
        require(limit > 0 && periodSeconds >= 1 hours, "invalid budget");
        budgets[workspaceId][spender] = BudgetPolicy({
            active: true,
            periodSeconds: periodSeconds,
            periodStartedAt: uint64(block.timestamp),
            limit: limit,
            spent: 0
        });
        emit BudgetPolicySet(workspaceId, spender, limit, periodSeconds);
    }

    function revokeBudgetPolicy(uint256 workspaceId, address spender) external onlyManager(workspaceId) {
        delete budgets[workspaceId][spender];
        emit BudgetPolicyRevoked(workspaceId, spender);
    }

    function spendFromBudget(
        uint256 workspaceId,
        address recipient,
        uint256 amount,
        string calldata memo
    ) external onlyMember(workspaceId) {
        require(recipient != address(0) && amount > 0, "invalid spend");
        require(bytes(memo).length <= 200, "memo too long");

        BudgetPolicy storage b = budgets[workspaceId][msg.sender];
        require(b.active, "no budget");
        if (block.timestamp >= uint256(b.periodStartedAt) + b.periodSeconds) {
            b.periodStartedAt = uint64(block.timestamp);
            b.spent = 0;
        }
        require(b.spent + amount <= b.limit, "budget exceeded");

        Workspace storage w = workspaces[workspaceId];
        require(w.availableTreasury >= amount, "insufficient treasury");
        b.spent += amount;
        w.availableTreasury -= amount;
        require(usdc.transfer(recipient, amount), "transfer failed");
        emit BudgetSpent(workspaceId, msg.sender, recipient, amount, memo);
    }

    function getBudgetPolicy(uint256 workspaceId, address spender) external view returns (BudgetPolicy memory) {
        return budgets[workspaceId][spender];
    }
}
