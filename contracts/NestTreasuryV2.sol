// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Like {
    function allowance(address owner, address spender) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title Nest Treasury V2
/// @notice An onchain group ledger with deterministic net settlement and spend-capped agents.
/// @dev One deployment represents one treasury. All money values use Arc USDC's 6-decimal interface.
contract NestTreasuryV2 {
    uint256 public constant VERSION = 2;
    uint256 public constant MAX_MEMBERS = 64;
    uint256 public constant MAX_PARTICIPANTS = 32;
    uint256 private constant PERIOD = 30 days;

    IERC20Like public immutable usdc;
    address public owner;
    string public treasuryName;
    uint64 public immutable createdAt;

    uint256 public obligationCount;
    uint256 public settlementCount;
    uint256 public agentRunCount;

    uint256 private unlocked = 1;

    enum ActivityKind {
        TreasuryCreated,
        MemberAdded,
        ProfileUpdated,
        ObligationAdded,
        Settlement,
        AgentPolicyUpdated,
        AgentRun
    }

    struct Member {
        address account;
        string displayName;
        uint64 joinedAt;
        bool active;
        bool admin;
    }

    struct Obligation {
        uint256 id;
        address payer;
        uint256 totalAmount;
        string category;
        string title;
        bytes32 referenceId;
        uint64 createdAt;
    }

    struct ObligationView {
        uint256 id;
        address payer;
        uint256 totalAmount;
        string category;
        string title;
        bytes32 referenceId;
        uint64 createdAt;
        address[] participants;
        uint256[] shares;
    }

    struct Settlement {
        uint256 id;
        address debtor;
        uint256 totalAmount;
        bytes32 memoId;
        uint64 createdAt;
        bool executedByAgent;
        uint256 agentRunId;
    }

    struct SettlementView {
        uint256 id;
        address debtor;
        uint256 totalAmount;
        bytes32 memoId;
        uint64 createdAt;
        bool executedByAgent;
        uint256 agentRunId;
        address[] creditors;
        uint256[] amounts;
    }

    struct AgentPolicy {
        address executor;
        uint96 maxPerRun;
        uint96 maxPerPeriod;
        uint96 spentThisPeriod;
        uint64 periodIndex;
        uint64 validUntil;
        uint64 lastRunAt;
        uint32 minInterval;
        uint256 agentId;
        bool enabled;
    }

    struct AgentRun {
        uint256 id;
        uint256 agentId;
        address executor;
        address account;
        uint256 amount;
        uint256 paymentCount;
        bytes32 memoId;
        uint64 createdAt;
    }

    struct ActivityView {
        ActivityKind kind;
        uint256 refId;
        address actor;
        address counterparty;
        uint256 amount;
        bytes32 memoId;
        uint64 timestamp;
    }

    address[] private memberAccounts;
    mapping(address => Member) private members;
    mapping(address => int256) private netBalance;

    mapping(uint256 => Obligation) private obligations;
    mapping(uint256 => address[]) private obligationParticipants;
    mapping(uint256 => uint256[]) private obligationShares;

    mapping(uint256 => Settlement) private settlements;
    mapping(uint256 => address[]) private settlementCreditors;
    mapping(uint256 => uint256[]) private settlementAmounts;

    mapping(address => AgentPolicy) private agentPolicies;
    mapping(uint256 => AgentRun) private agentRuns;
    ActivityView[] private activityLog;

    event TreasuryCreated(address indexed treasury, address indexed owner, string name);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event MemberAdded(address indexed account, bool indexed admin, string displayName);
    event MemberRemoved(address indexed account);
    event ProfileUpdated(address indexed account, string displayName);
    event ObligationAdded(
        uint256 indexed obligationId,
        address indexed payer,
        uint256 amount,
        bytes32 indexed referenceId
    );
    event NetSettlement(
        uint256 indexed settlementId,
        address indexed debtor,
        uint256 amount,
        bytes32 indexed memoId,
        bool executedByAgent
    );
    event AgentPolicyUpdated(
        address indexed account,
        address indexed executor,
        uint256 indexed agentId,
        bool enabled,
        uint256 maxPerRun,
        uint256 maxPerPeriod
    );
    event AgentRunRecorded(
        uint256 indexed runId,
        uint256 indexed agentId,
        address indexed account,
        address executor,
        uint256 amount,
        uint256 paymentCount,
        bytes32 memoId
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "owner only");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == owner || members[msg.sender].admin, "admin only");
        _;
    }

    modifier onlyMember() {
        require(members[msg.sender].active, "member only");
        _;
    }

    modifier nonReentrant() {
        require(unlocked == 1, "reentrant call");
        unlocked = 2;
        _;
        unlocked = 1;
    }

    constructor(address usdcAddress, string memory name, string memory ownerName) {
        require(usdcAddress != address(0), "invalid USDC");
        require(bytes(name).length > 0 && bytes(name).length <= 80, "invalid name");
        usdc = IERC20Like(usdcAddress);
        owner = msg.sender;
        treasuryName = name;
        createdAt = uint64(block.timestamp);
        _addMember(msg.sender, ownerName, true);
        _log(ActivityKind.TreasuryCreated, 0, msg.sender, address(0), 0, bytes32(0));
        emit TreasuryCreated(address(this), msg.sender, name);
    }

    // ---------------------------------------------------------------- treasury

    function setTreasuryName(string calldata name) external onlyOwner {
        require(bytes(name).length > 0 && bytes(name).length <= 80, "invalid name");
        treasuryName = name;
    }

    function transferOwnership(address nextOwner) external onlyOwner {
        require(members[nextOwner].active, "owner must be member");
        address previous = owner;
        owner = nextOwner;
        members[nextOwner].admin = true;
        emit OwnershipTransferred(previous, nextOwner);
    }

    function addMember(address account, string calldata displayName, bool admin) external onlyAdmin {
        _addMember(account, displayName, admin);
    }

    function _addMember(address account, string memory displayName, bool admin) internal {
        require(account != address(0), "invalid member");
        require(!members[account].active, "already a member");
        require(memberAccounts.length < MAX_MEMBERS, "member limit");
        require(bytes(displayName).length <= 60, "name too long");

        if (members[account].account == address(0)) memberAccounts.push(account);
        members[account] = Member(account, displayName, uint64(block.timestamp), true, admin);
        _log(ActivityKind.MemberAdded, 0, msg.sender, account, 0, bytes32(0));
        emit MemberAdded(account, admin, displayName);
    }

    function removeMember(address account) external onlyAdmin {
        require(account != owner, "cannot remove owner");
        require(members[account].active, "not a member");
        require(netBalance[account] == 0, "balance must be zero");
        members[account].active = false;
        members[account].admin = false;
        emit MemberRemoved(account);
    }

    function setAdmin(address account, bool admin) external onlyOwner {
        require(members[account].active, "not a member");
        members[account].admin = admin;
    }

    function setDisplayName(string calldata displayName) external onlyMember {
        require(bytes(displayName).length > 0 && bytes(displayName).length <= 60, "invalid name");
        members[msg.sender].displayName = displayName;
        _log(ActivityKind.ProfileUpdated, 0, msg.sender, address(0), 0, bytes32(0));
        emit ProfileUpdated(msg.sender, displayName);
    }

    function isMember(address account) external view returns (bool) {
        return members[account].active;
    }

    function getMember(address account) external view returns (Member memory) {
        return members[account];
    }

    function getMembers() external view returns (Member[] memory out) {
        out = new Member[](memberAccounts.length);
        for (uint256 i; i < memberAccounts.length; ++i) out[i] = members[memberAccounts[i]];
    }

    function getBalances() external view returns (address[] memory accounts, int256[] memory balances) {
        accounts = memberAccounts;
        balances = new int256[](accounts.length);
        for (uint256 i; i < accounts.length; ++i) balances[i] = netBalance[accounts[i]];
    }

    function balanceOf(address account) external view returns (int256) {
        return netBalance[account];
    }

    // --------------------------------------------------------------- obligations

    function addObligation(
        address[] calldata participants,
        uint256[] calldata shares,
        string calldata category,
        string calldata title,
        bytes32 referenceId
    ) external onlyMember returns (uint256 obligationId) {
        uint256 length = participants.length;
        require(length > 0 && length <= MAX_PARTICIPANTS && length == shares.length, "invalid split");
        require(bytes(category).length <= 40, "category too long");
        require(bytes(title).length > 0 && bytes(title).length <= 120, "invalid title");

        uint256 total;
        uint256 owedToPayer;
        for (uint256 i; i < length; ++i) {
            address participant = participants[i];
            uint256 share = shares[i];
            require(members[participant].active, "participant not active");
            require(share > 0, "zero share");
            for (uint256 j; j < i; ++j) require(participants[j] != participant, "duplicate participant");
            total += share;
            if (participant != msg.sender) {
                netBalance[participant] -= int256(share);
                owedToPayer += share;
            }
        }
        require(total > 0 && owedToPayer > 0, "nothing to settle");
        netBalance[msg.sender] += int256(owedToPayer);

        obligationId = ++obligationCount;
        obligations[obligationId] = Obligation(
            obligationId,
            msg.sender,
            total,
            category,
            title,
            referenceId,
            uint64(block.timestamp)
        );
        for (uint256 i; i < length; ++i) {
            obligationParticipants[obligationId].push(participants[i]);
            obligationShares[obligationId].push(shares[i]);
        }

        _log(ActivityKind.ObligationAdded, obligationId, msg.sender, address(0), total, referenceId);
        emit ObligationAdded(obligationId, msg.sender, total, referenceId);
    }

    function getObligation(uint256 obligationId) public view returns (ObligationView memory view_) {
        Obligation storage item = obligations[obligationId];
        require(item.id != 0, "unknown obligation");
        view_ = ObligationView(
            item.id,
            item.payer,
            item.totalAmount,
            item.category,
            item.title,
            item.referenceId,
            item.createdAt,
            obligationParticipants[obligationId],
            obligationShares[obligationId]
        );
    }

    function getRecentObligations(uint256 limit) external view returns (ObligationView[] memory out) {
        uint256 count = obligationCount < limit ? obligationCount : limit;
        out = new ObligationView[](count);
        for (uint256 i; i < count; ++i) out[i] = getObligation(obligationCount - i);
    }

    // --------------------------------------------------------------- settlement

    function previewSettlement(address debtor, uint256 requestedAmount)
        public
        view
        returns (address[] memory creditors, uint256[] memory amounts, uint256 total)
    {
        int256 position = netBalance[debtor];
        if (position >= 0) return (new address[](0), new uint256[](0), 0);

        uint256 remaining = uint256(-position);
        if (requestedAmount > 0 && requestedAmount < remaining) remaining = requestedAmount;

        uint256 count;
        uint256 scanRemaining = remaining;
        for (uint256 i; i < memberAccounts.length && scanRemaining > 0; ++i) {
            int256 credit = netBalance[memberAccounts[i]];
            if (credit <= 0) continue;
            uint256 payment = uint256(credit) < scanRemaining ? uint256(credit) : scanRemaining;
            scanRemaining -= payment;
            ++count;
        }

        creditors = new address[](count);
        amounts = new uint256[](count);
        uint256 cursor;
        for (uint256 i; i < memberAccounts.length && remaining > 0; ++i) {
            address creditor = memberAccounts[i];
            int256 credit = netBalance[creditor];
            if (credit <= 0) continue;
            uint256 payment = uint256(credit) < remaining ? uint256(credit) : remaining;
            creditors[cursor] = creditor;
            amounts[cursor] = payment;
            total += payment;
            remaining -= payment;
            ++cursor;
        }
    }

    function settleMyBalance(uint256 requestedAmount, bytes32 memoId)
        external
        onlyMember
        nonReentrant
        returns (uint256 settlementId, uint256 amount)
    {
        return _settle(msg.sender, requestedAmount, memoId, false, 0);
    }

    function _settle(
        address debtor,
        uint256 requestedAmount,
        bytes32 memoId,
        bool executedByAgent,
        uint256 runId
    ) internal returns (uint256 settlementId, uint256 total) {
        (address[] memory creditors, uint256[] memory amounts, uint256 previewTotal) =
            previewSettlement(debtor, requestedAmount);
        require(previewTotal > 0, "nothing to settle");

        settlementId = ++settlementCount;
        settlements[settlementId] = Settlement(
            settlementId,
            debtor,
            previewTotal,
            memoId,
            uint64(block.timestamp),
            executedByAgent,
            runId
        );

        for (uint256 i; i < creditors.length; ++i) {
            address creditor = creditors[i];
            uint256 payment = amounts[i];
            netBalance[debtor] += int256(payment);
            netBalance[creditor] -= int256(payment);
            settlementCreditors[settlementId].push(creditor);
            settlementAmounts[settlementId].push(payment);
            _safeTransferFrom(debtor, creditor, payment);
            total += payment;
        }

        _log(ActivityKind.Settlement, settlementId, debtor, address(0), total, memoId);
        emit NetSettlement(settlementId, debtor, total, memoId, executedByAgent);
    }

    function getSettlement(uint256 settlementId) public view returns (SettlementView memory view_) {
        Settlement storage item = settlements[settlementId];
        require(item.id != 0, "unknown settlement");
        view_ = SettlementView(
            item.id,
            item.debtor,
            item.totalAmount,
            item.memoId,
            item.createdAt,
            item.executedByAgent,
            item.agentRunId,
            settlementCreditors[settlementId],
            settlementAmounts[settlementId]
        );
    }

    function getRecentSettlements(uint256 limit) external view returns (SettlementView[] memory out) {
        uint256 count = settlementCount < limit ? settlementCount : limit;
        out = new SettlementView[](count);
        for (uint256 i; i < count; ++i) out[i] = getSettlement(settlementCount - i);
    }

    // ------------------------------------------------------------------- agents

    function setAgentPolicy(
        address executor,
        uint256 agentId,
        uint96 maxPerRun,
        uint96 maxPerPeriod,
        uint32 minInterval,
        uint64 validUntil,
        bool enabled
    ) external onlyMember {
        if (enabled) {
            require(executor != address(0), "executor required");
            require(maxPerRun > 0 && maxPerPeriod >= maxPerRun, "invalid caps");
            require(validUntil == 0 || validUntil > block.timestamp, "policy expired");
        }

        AgentPolicy storage current = agentPolicies[msg.sender];
        uint64 periodIndex = uint64(block.timestamp / PERIOD);
        uint96 spent = current.periodIndex == periodIndex ? current.spentThisPeriod : 0;
        agentPolicies[msg.sender] = AgentPolicy(
            executor,
            maxPerRun,
            maxPerPeriod,
            spent,
            periodIndex,
            validUntil,
            current.lastRunAt,
            minInterval,
            agentId,
            enabled
        );

        _log(ActivityKind.AgentPolicyUpdated, agentId, msg.sender, executor, maxPerRun, bytes32(0));
        emit AgentPolicyUpdated(msg.sender, executor, agentId, enabled, maxPerRun, maxPerPeriod);
    }

    function getAgentPolicy(address account) external view returns (AgentPolicy memory policy) {
        policy = agentPolicies[account];
        uint64 periodIndex = uint64(block.timestamp / PERIOD);
        if (policy.periodIndex != periodIndex) {
            policy.periodIndex = periodIndex;
            policy.spentThisPeriod = 0;
        }
    }

    function agentAllowanceRemaining(address account) external view returns (uint256) {
        AgentPolicy memory policy = agentPolicies[account];
        if (!policy.enabled || (policy.validUntil != 0 && policy.validUntil < block.timestamp)) return 0;
        uint256 spent = policy.periodIndex == uint64(block.timestamp / PERIOD) ? policy.spentThisPeriod : 0;
        return policy.maxPerPeriod > spent ? policy.maxPerPeriod - spent : 0;
    }

    function runAgent(address account, uint256 requestedAmount, bytes32 memoId)
        external
        nonReentrant
        returns (uint256 runId, uint256 settlementId, uint256 amount)
    {
        require(members[account].active, "account not active");
        AgentPolicy storage policy = agentPolicies[account];
        require(policy.enabled && policy.executor == msg.sender, "agent not authorised");
        require(policy.validUntil == 0 || policy.validUntil >= block.timestamp, "policy expired");
        require(
            policy.lastRunAt == 0 || block.timestamp >= uint256(policy.lastRunAt) + policy.minInterval,
            "cooldown active"
        );

        uint64 periodIndex = uint64(block.timestamp / PERIOD);
        if (policy.periodIndex != periodIndex) {
            policy.periodIndex = periodIndex;
            policy.spentThisPeriod = 0;
        }

        uint256 periodRemaining = policy.maxPerPeriod > policy.spentThisPeriod
            ? policy.maxPerPeriod - policy.spentThisPeriod
            : 0;
        uint256 limit = requestedAmount == 0 || requestedAmount > policy.maxPerRun ? policy.maxPerRun : requestedAmount;
        if (limit > periodRemaining) limit = periodRemaining;
        require(limit > 0, "period cap reached");

        runId = ++agentRunCount;
        (settlementId, amount) = _settle(account, limit, memoId, true, runId);
        policy.spentThisPeriod += uint96(amount);
        policy.lastRunAt = uint64(block.timestamp);

        uint256 paymentCount = settlementCreditors[settlementId].length;
        agentRuns[runId] = AgentRun(
            runId,
            policy.agentId,
            msg.sender,
            account,
            amount,
            paymentCount,
            memoId,
            uint64(block.timestamp)
        );
        settlements[settlementId].agentRunId = runId;
        _log(ActivityKind.AgentRun, runId, msg.sender, account, amount, memoId);
        emit AgentRunRecorded(runId, policy.agentId, account, msg.sender, amount, paymentCount, memoId);
    }

    function getAgentRun(uint256 runId) external view returns (AgentRun memory) {
        return agentRuns[runId];
    }

    function getRecentAgentRuns(uint256 limit) external view returns (AgentRun[] memory out) {
        uint256 count = agentRunCount < limit ? agentRunCount : limit;
        out = new AgentRun[](count);
        for (uint256 i; i < count; ++i) out[i] = agentRuns[agentRunCount - i];
    }

    // ---------------------------------------------------------------- activity

    function _log(
        ActivityKind kind,
        uint256 refId,
        address actor,
        address counterparty,
        uint256 amount,
        bytes32 memoId
    ) internal {
        activityLog.push(ActivityView(kind, refId, actor, counterparty, amount, memoId, uint64(block.timestamp)));
    }

    function getActivity(uint256 limit) external view returns (ActivityView[] memory out) {
        uint256 count = activityLog.length < limit ? activityLog.length : limit;
        out = new ActivityView[](count);
        for (uint256 i; i < count; ++i) out[i] = activityLog[activityLog.length - 1 - i];
    }

    function activityCount() external view returns (uint256) {
        return activityLog.length;
    }

    // ----------------------------------------------------------------- helpers

    function usdcAllowance(address account) external view returns (uint256) {
        return usdc.allowance(account, address(this));
    }

    function _safeTransferFrom(address from, address to, uint256 amount) internal {
        (bool success, bytes memory result) = address(usdc).call(
            abi.encodeWithSelector(IERC20Like.transferFrom.selector, from, to, amount)
        );
        require(success && (result.length == 0 || abi.decode(result, (bool))), "USDC transfer failed");
    }
}
