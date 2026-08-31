// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBusinessUSDC {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title Nest Business V2
/// @notice New business workspaces with collateralized USDC credit and narrowly-scoped settlement agents.
/// @dev This contract intentionally does not migrate or modify legacy ExpenseManager rooms.
contract NestBusinessV2 {
    IBusinessUSDC public immutable usdc;
    uint256 public constant MAX_LTV_BPS = 5_000;
    uint256 public constant BORROW_APR_BPS = 800;
    uint256 public constant MAX_BATCH_COUNTERPARTIES = 32;
    uint256 public constant MAX_EXPENSE_PARTICIPANTS = 64;
    uint256 private constant BPS = 10_000;
    uint256 private constant YEAR = 365 days;

    error InvalidSplits();
    error TooManyParticipants();
    error DuplicateParticipant();
    error InvalidExpense();
    error SharesMismatch();
    error NotAMember();
    error EmptyBatch();
    error BatchTooLarge();
    error DuplicateCreditor();
    error NothingToSettle();
    error TransferFailed();


    struct Room {
        uint256 id;
        string name;
        address creator;
        uint64 createdAt;
    }

    struct Expense {
        uint256 id;
        uint256 roomId;
        address payer;
        uint256 totalAmount;
        string category;
        string description;
        uint64 createdAt;
    }

    struct ExpenseView {
        uint256 id;
        uint256 roomId;
        address payer;
        uint256 totalAmount;
        string category;
        string description;
        uint64 createdAt;
        address[] participants;
        uint256[] shares;
        bool[] settled;
    }

    struct AgentPolicy {
        bool active;
        uint64 validAfter;
        uint64 validUntil;
        uint64 periodSeconds;
        uint64 periodStartedAt;
        uint256 maxPerRun;
        uint256 maxPerPeriod;
        uint256 spentThisPeriod;
    }

    struct CreditPosition {
        uint256 supplied;
        uint256 borrowed;
        uint256 borrowInterest;
        uint256 debt;
        uint256 borrowLimit;
        uint256 available;
        uint256 poolLiquidity;
    }

    uint256 public roomCount;
    uint256 public expenseCount;
    uint256 public totalSupplied;
    uint256 public totalBorrowed;

    mapping(uint256 => Room) private rooms;
    mapping(uint256 => address[]) private roomMembers;
    mapping(uint256 => mapping(address => bool)) public isMember;
    mapping(uint256 => mapping(address => bool)) public isManager;
    mapping(address => uint256[]) private userRooms;
    mapping(uint256 => Expense) private expenses;
    mapping(uint256 => address[]) private expenseParticipants;
    mapping(uint256 => mapping(address => uint256)) private expenseShare;
    mapping(uint256 => mapping(address => bool)) private expenseSettled;
    mapping(uint256 => uint256[]) private roomExpenses;
    mapping(uint256 => mapping(address => mapping(address => AgentPolicy))) private agentPolicies;

    struct CreditAccount {
        uint256 supplied;
        uint256 borrowed;
        uint256 accruedInterest;
        uint64 interestUpdatedAt;
    }
    mapping(address => CreditAccount) private creditAccounts;

    event BusinessRoomCreated(uint256 indexed roomId, address indexed creator, string name);
    event MemberInvited(uint256 indexed roomId, address indexed member, address indexed operator);
    event ManagerSet(uint256 indexed roomId, address indexed manager, bool enabled);
    event ExpenseAdded(uint256 indexed expenseId, uint256 indexed roomId, address indexed payer, uint256 amount);
    event SplitSettled(uint256 indexed expenseId, address indexed from, address indexed to, uint256 amount);
    event AgentPolicySet(uint256 indexed roomId, address indexed owner, address indexed agent, uint64 validUntil, uint256 maxPerRun, uint256 maxPerPeriod, uint64 periodSeconds);
    event AgentPolicyRevoked(uint256 indexed roomId, address indexed owner, address indexed agent);
    event AgentSettlement(uint256 indexed roomId, address indexed debtor, address indexed creditor, address agent, uint256 amount);
    event Supplied(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event Borrowed(address indexed account, uint256 amount);
    event Repaid(address indexed account, uint256 amount, uint256 interestPaid);

    modifier onlyMember(uint256 roomId) {
        require(isMember[roomId][msg.sender], "not a workspace member");
        _;
    }

    modifier onlyOperator(uint256 roomId) {
        require(isManager[roomId][msg.sender], "not a workspace manager");
        _;
    }

    constructor(address usdcAddress) {
        require(usdcAddress != address(0), "USDC required");
        usdc = IBusinessUSDC(usdcAddress);
    }

    function createBusinessRoom(string calldata name) external returns (uint256 roomId) {
        require(bytes(name).length > 0 && bytes(name).length <= 80, "invalid workspace name");
        roomId = ++roomCount;
        rooms[roomId] = Room(roomId, name, msg.sender, uint64(block.timestamp));
        isMember[roomId][msg.sender] = true;
        isManager[roomId][msg.sender] = true;
        roomMembers[roomId].push(msg.sender);
        userRooms[msg.sender].push(roomId);
        emit BusinessRoomCreated(roomId, msg.sender, name);
    }

    function setManager(uint256 roomId, address manager, bool enabled) external {
        require(rooms[roomId].creator == msg.sender, "only workspace owner");
        require(isMember[roomId][manager], "manager must be a member");
        isManager[roomId][manager] = enabled;
        emit ManagerSet(roomId, manager, enabled);
    }

    function inviteMember(uint256 roomId, address member) external onlyOperator(roomId) {
        require(member != address(0) && !isMember[roomId][member], "invalid member");
        isMember[roomId][member] = true;
        roomMembers[roomId].push(member);
        userRooms[member].push(roomId);
        emit MemberInvited(roomId, member, msg.sender);
    }

    function getRooms(address user) external view returns (Room[] memory out) {
        uint256[] memory ids = userRooms[user];
        out = new Room[](ids.length);
        for (uint256 i; i < ids.length; i++) out[i] = rooms[ids[i]];
    }

    function getRoomMembers(uint256 roomId) external view returns (address[] memory) {
        return roomMembers[roomId];
    }

    function addExpense(
        uint256 roomId,
        address[] calldata participants,
        uint256[] calldata shares,
        string calldata category,
        string calldata description,
        uint256 totalAmount
    ) external onlyMember(roomId) returns (uint256 expenseId) {
        if (participants.length == 0 || participants.length != shares.length) revert InvalidSplits();
        if (participants.length > MAX_EXPENSE_PARTICIPANTS) revert TooManyParticipants();
        if (totalAmount == 0 || bytes(description).length == 0 || bytes(description).length > 200) {
            revert InvalidExpense();
        }
        uint256 sum;
        for (uint256 i; i < participants.length; i++) {
            if (!isMember[roomId][participants[i]]) revert NotAMember();
            for (uint256 j = i + 1; j < participants.length; j++) {
                if (participants[i] == participants[j]) revert DuplicateParticipant();
            }
            sum += shares[i];
        }
        if (sum != totalAmount) revert SharesMismatch();

        expenseId = ++expenseCount;
        expenses[expenseId] = Expense(expenseId, roomId, msg.sender, totalAmount, category, description, uint64(block.timestamp));
        for (uint256 i; i < participants.length; i++) {
            address participant = participants[i];
            expenseParticipants[expenseId].push(participant);
            expenseShare[expenseId][participant] = shares[i];
            if (participant == msg.sender) expenseSettled[expenseId][participant] = true;
        }
        roomExpenses[roomId].push(expenseId);
        emit ExpenseAdded(expenseId, roomId, msg.sender, totalAmount);
    }

    function openShare(uint256 expenseId, address user) public view returns (uint256) {
        Expense storage expense = expenses[expenseId];
        if (expenseSettled[expenseId][user] || expense.payer == user) return 0;
        return expenseShare[expenseId][user];
    }

    function owedBetween(uint256 roomId, address debtor, address creditor) public view returns (uint256 total) {
        uint256[] storage ids = roomExpenses[roomId];
        for (uint256 i; i < ids.length; i++) {
            if (expenses[ids[i]].payer == creditor) total += openShare(ids[i], debtor);
        }
    }

    function getExpenses(uint256 roomId) external view returns (ExpenseView[] memory out) {
        uint256[] storage ids = roomExpenses[roomId];
        out = new ExpenseView[](ids.length);
        for (uint256 i; i < ids.length; i++) out[i] = _expenseView(ids[i]);
    }

    function _expenseView(uint256 expenseId) internal view returns (ExpenseView memory view_) {
        Expense storage expense = expenses[expenseId];
        address[] storage participants = expenseParticipants[expenseId];
        uint256[] memory shares = new uint256[](participants.length);
        bool[] memory settled = new bool[](participants.length);
        for (uint256 i; i < participants.length; i++) {
            shares[i] = expenseShare[expenseId][participants[i]];
            settled[i] = expenseSettled[expenseId][participants[i]];
        }
        view_ = ExpenseView(expense.id, expense.roomId, expense.payer, expense.totalAmount, expense.category, expense.description, expense.createdAt, participants, shares, settled);
    }

    function settleWith(uint256 roomId, address creditor) external onlyMember(roomId) returns (uint256 amount) {
        amount = _settleWith(roomId, msg.sender, creditor);
    }

    function setAgentPolicy(
        uint256 roomId,
        address agent,
        uint64 validAfter,
        uint64 validUntil,
        uint256 maxPerRun,
        uint256 maxPerPeriod,
        uint64 periodSeconds
    ) external onlyMember(roomId) {
        require(agent != address(0) && validUntil > validAfter && validUntil > block.timestamp, "invalid policy");
        require(maxPerRun > 0 && maxPerPeriod >= maxPerRun && periodSeconds >= 1 hours, "invalid limits");
        agentPolicies[roomId][msg.sender][agent] = AgentPolicy(true, validAfter, validUntil, periodSeconds, uint64(block.timestamp), maxPerRun, maxPerPeriod, 0);
        emit AgentPolicySet(roomId, msg.sender, agent, validUntil, maxPerRun, maxPerPeriod, periodSeconds);
    }

    function revokeAgentPolicy(uint256 roomId, address agent) external onlyMember(roomId) {
        delete agentPolicies[roomId][msg.sender][agent];
        emit AgentPolicyRevoked(roomId, msg.sender, agent);
    }

    function getAgentPolicy(uint256 roomId, address owner, address agent) external view returns (AgentPolicy memory) {
        return agentPolicies[roomId][owner][agent];
    }

    function settleWithFor(uint256 roomId, address debtor, address creditor) external returns (uint256 amount) {
        AgentPolicy storage policy = agentPolicies[roomId][debtor][msg.sender];
        require(policy.active && block.timestamp >= policy.validAfter && block.timestamp <= policy.validUntil, "agent not authorised");
        amount = owedBetween(roomId, debtor, creditor);
        require(amount > 0 && amount <= policy.maxPerRun, "outside run cap");
        if (block.timestamp >= uint256(policy.periodStartedAt) + policy.periodSeconds) {
            policy.periodStartedAt = uint64(block.timestamp);
            policy.spentThisPeriod = 0;
        }
        require(policy.spentThisPeriod + amount <= policy.maxPerPeriod, "outside period cap");
        policy.spentThisPeriod += amount;
        amount = _settleWith(roomId, debtor, creditor);
        emit AgentSettlement(roomId, debtor, creditor, msg.sender, amount);
    }

    /// @notice Marks every open share owed by `debtor` to `creditor` as settled and returns the total.
    /// @dev State-only: the caller performs the single USDC transfer afterwards (checks-effects-interactions).
    function _collect(uint256 roomId, address debtor, address creditor) internal returns (uint256 total) {
        if (!isMember[roomId][debtor] || !isMember[roomId][creditor]) revert NotAMember();
        uint256[] storage ids = roomExpenses[roomId];
        for (uint256 i; i < ids.length; i++) {
            uint256 expenseId = ids[i];
            if (expenses[expenseId].payer != creditor) continue;
            uint256 amount = openShare(expenseId, debtor);
            if (amount == 0) continue;
            expenseSettled[expenseId][debtor] = true;
            total += amount;
            emit SplitSettled(expenseId, debtor, creditor, amount);
        }
    }

    function _settleWith(uint256 roomId, address debtor, address creditor) internal returns (uint256 total) {
        total = _collect(roomId, debtor, creditor);
        if (total == 0) revert NothingToSettle();
        if (!usdc.transferFrom(debtor, creditor, total)) revert TransferFailed();
    }

    /// @notice Settles every open obligation with up to 32 creditors in one transaction.
    /// @dev One aggregated USDC transferFrom per creditor. Reverts the whole batch on any failure.
    function settleBatch(uint256 roomId, address[] calldata creditors)
        external
        onlyMember(roomId)
        returns (uint256 total)
    {
        uint256 count = creditors.length;
        if (count == 0) revert EmptyBatch();
        if (count > MAX_BATCH_COUNTERPARTIES) revert BatchTooLarge();

        uint256[] memory amounts = new uint256[](count);
        for (uint256 i; i < count; i++) {
            for (uint256 j = i + 1; j < count; j++) {
                if (creditors[i] == creditors[j]) revert DuplicateCreditor();
            }
            uint256 amount = _collect(roomId, msg.sender, creditors[i]);
            amounts[i] = amount;
            total += amount;
        }
        if (total == 0) revert NothingToSettle();

        for (uint256 i; i < count; i++) {
            if (amounts[i] == 0) continue;
            if (!usdc.transferFrom(msg.sender, creditors[i], amounts[i])) revert TransferFailed();
        }
        emit BatchSettled(roomId, msg.sender, msg.sender, total, count);
    }


    function supply(uint256 amount) external {
        require(amount > 0, "amount required");
        _accrue(msg.sender);
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        creditAccounts[msg.sender].supplied += amount;
        totalSupplied += amount;
        emit Supplied(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        _accrue(msg.sender);
        CreditAccount storage account = creditAccounts[msg.sender];
        require(amount > 0 && amount <= account.supplied, "amount exceeds supply");
        uint256 remaining = account.supplied - amount;
        require((remaining * MAX_LTV_BPS) / BPS >= _debt(account), "would exceed credit limit");
        require(usdc.balanceOf(address(this)) >= amount, "insufficient pool liquidity");
        account.supplied = remaining;
        totalSupplied -= amount;
        require(usdc.transfer(msg.sender, amount), "USDC transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    function borrow(uint256 amount) external {
        require(amount > 0, "amount required");
        _accrue(msg.sender);
        CreditAccount storage account = creditAccounts[msg.sender];
        uint256 limit = (account.supplied * MAX_LTV_BPS) / BPS;
        require(_debt(account) + amount <= limit, "exceeds credit limit");
        require(usdc.balanceOf(address(this)) >= amount, "insufficient pool liquidity");
        account.borrowed += amount;
        totalBorrowed += amount;
        require(usdc.transfer(msg.sender, amount), "USDC transfer failed");
        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external {
        require(amount > 0, "amount required");
        _accrue(msg.sender);
        CreditAccount storage account = creditAccounts[msg.sender];
        uint256 debt = _debt(account);
        require(debt > 0, "nothing to repay");
        uint256 paid = amount > debt ? debt : amount;
        require(usdc.transferFrom(msg.sender, address(this), paid), "USDC transfer failed");
        uint256 interestPaid = paid > account.accruedInterest ? account.accruedInterest : paid;
        account.accruedInterest -= interestPaid;
        uint256 principalPaid = paid - interestPaid;
        account.borrowed -= principalPaid;
        totalBorrowed -= principalPaid;
        emit Repaid(msg.sender, paid, interestPaid);
    }

    function getCreditPosition(address account) external view returns (CreditPosition memory position) {
        CreditAccount storage credit = creditAccounts[account];
        uint256 interest = credit.accruedInterest + _interest(credit.borrowed, block.timestamp - credit.interestUpdatedAt);
        uint256 debt = credit.borrowed + interest;
        uint256 limit = (credit.supplied * MAX_LTV_BPS) / BPS;
        uint256 liquidity = usdc.balanceOf(address(this));
        position = CreditPosition(credit.supplied, credit.borrowed, interest, debt, limit, limit > debt ? _min(limit - debt, liquidity) : 0, liquidity);
    }

    function _accrue(address account) internal {
        CreditAccount storage credit = creditAccounts[account];
        if (credit.interestUpdatedAt == 0) {
            credit.interestUpdatedAt = uint64(block.timestamp);
            return;
        }
        credit.accruedInterest += _interest(credit.borrowed, block.timestamp - credit.interestUpdatedAt);
        credit.interestUpdatedAt = uint64(block.timestamp);
    }

    function _debt(CreditAccount storage credit) internal view returns (uint256) {
        return credit.borrowed + credit.accruedInterest;
    }

    function _interest(uint256 principal, uint256 elapsed) internal pure returns (uint256) {
        return principal == 0 || elapsed == 0 ? 0 : (principal * BORROW_APR_BPS * elapsed) / (BPS * YEAR);
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
