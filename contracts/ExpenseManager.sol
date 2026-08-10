// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

/// @title Nest ExpenseManager
/// @notice Shared household expenses + USDC settlement, fully onchain.
contract ExpenseManager {
    IERC20 public immutable usdc;

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

    struct ActivityView {
        uint8 kind; // 0 = expense, 1 = settlement, 2 = direct transfer, 3 = member joined
        uint256 refId;
        uint256 roomId;
        address actor;
        address counterparty;
        uint256 amount;
        string text;
        uint64 timestamp;
    }

    uint256 public roomCount;
    uint256 public expenseCount;

    mapping(uint256 => Room) private rooms;
    mapping(uint256 => address[]) private roomMembers;
    mapping(uint256 => mapping(address => bool)) public isMember;
    mapping(address => uint256[]) private userRooms;

    mapping(uint256 => Expense) private expenses;
    mapping(uint256 => address[]) private expenseParticipants;
    mapping(uint256 => mapping(address => uint256)) private expenseShare;
    mapping(uint256 => mapping(address => bool)) private expenseSettled;
    mapping(uint256 => uint256[]) private roomExpenses;

    mapping(address => string) public displayNames;

    ActivityView[] private activityLog;
    mapping(uint256 => uint256[]) private roomActivity;

    event RoomCreated(uint256 indexed roomId, address indexed creator, string name);
    event MemberJoined(uint256 indexed roomId, address indexed member);
    event DisplayNameSet(address indexed user, string name);
    event ExpenseAdded(uint256 indexed expenseId, uint256 indexed roomId, address indexed payer, uint256 amount);
    event SplitSettled(uint256 indexed expenseId, address indexed from, address indexed to, uint256 amount);
    event DirectTransfer(uint256 indexed roomId, address indexed from, address indexed to, uint256 amount, string note);

    modifier onlyMember(uint256 roomId) {
        require(isMember[roomId][msg.sender], "not a room member");
        _;
    }

    constructor(address usdcAddress) {
        usdc = IERC20(usdcAddress);
    }

    // ---------------------------------------------------------------- identity

    /// @notice Write-once display name permanently bound to this address.
    function setDisplayName(string calldata name) external {
        require(bytes(displayNames[msg.sender]).length == 0, "name already claimed");
        require(bytes(name).length > 0 && bytes(name).length <= 60, "invalid name");
        displayNames[msg.sender] = name;
        emit DisplayNameSet(msg.sender, name);
    }

    function getDisplayNames(address[] calldata users) external view returns (string[] memory out) {
        out = new string[](users.length);
        for (uint256 i; i < users.length; i++) out[i] = displayNames[users[i]];
    }

    // ------------------------------------------------------------------- rooms

    function createRoom(string calldata name) external returns (uint256 roomId) {
        require(bytes(name).length > 0, "name required");
        roomId = ++roomCount;
        rooms[roomId] = Room(roomId, name, msg.sender, uint64(block.timestamp));
        _addMember(roomId, msg.sender);
        emit RoomCreated(roomId, msg.sender, name);
    }

    function joinRoom(uint256 roomId) external {
        require(rooms[roomId].id != 0, "no such room");
        require(!isMember[roomId][msg.sender], "already a member");
        _addMember(roomId, msg.sender);
    }

    function inviteMember(uint256 roomId, address member) external onlyMember(roomId) {
        require(member != address(0), "bad address");
        require(!isMember[roomId][member], "already a member");
        _addMember(roomId, member);
    }

    function _addMember(uint256 roomId, address member) internal {
        isMember[roomId][member] = true;
        roomMembers[roomId].push(member);
        userRooms[member].push(roomId);
        _log(3, roomId, roomId, member, address(0), 0, "joined the home");
        emit MemberJoined(roomId, member);
    }

    function getRoom(uint256 roomId) external view returns (Room memory) {
        return rooms[roomId];
    }

    function getRoomMembers(uint256 roomId) external view returns (address[] memory) {
        return roomMembers[roomId];
    }

    function getRooms(address user) external view returns (Room[] memory out) {
        uint256[] memory ids = userRooms[user];
        out = new Room[](ids.length);
        for (uint256 i; i < ids.length; i++) out[i] = rooms[ids[i]];
    }

    // ---------------------------------------------------------------- expenses

    function addExpense(
        uint256 roomId,
        address[] calldata participants,
        uint256[] calldata shares,
        string calldata category,
        string calldata description,
        uint256 totalAmount
    ) external onlyMember(roomId) returns (uint256 expenseId) {
        require(participants.length > 0 && participants.length == shares.length, "bad splits");
        uint256 sum;
        for (uint256 i; i < participants.length; i++) {
            require(isMember[roomId][participants[i]], "participant not member");
            sum += shares[i];
        }
        require(sum == totalAmount && totalAmount > 0, "shares must equal total");

        expenseId = ++expenseCount;
        expenses[expenseId] = Expense(
            expenseId, roomId, msg.sender, totalAmount, category, description, uint64(block.timestamp)
        );
        for (uint256 i; i < participants.length; i++) {
            expenseParticipants[expenseId].push(participants[i]);
            expenseShare[expenseId][participants[i]] = shares[i];
            if (participants[i] == msg.sender) expenseSettled[expenseId][participants[i]] = true;
        }
        roomExpenses[roomId].push(expenseId);
        _log(0, expenseId, roomId, msg.sender, address(0), totalAmount, description);
        emit ExpenseAdded(expenseId, roomId, msg.sender, totalAmount);
    }

    function getExpense(uint256 expenseId) public view returns (ExpenseView memory v) {
        Expense storage e = expenses[expenseId];
        address[] storage p = expenseParticipants[expenseId];
        uint256[] memory s = new uint256[](p.length);
        bool[] memory st = new bool[](p.length);
        for (uint256 i; i < p.length; i++) {
            s[i] = expenseShare[expenseId][p[i]];
            st[i] = expenseSettled[expenseId][p[i]];
        }
        v = ExpenseView(e.id, e.roomId, e.payer, e.totalAmount, e.category, e.description, e.createdAt, p, s, st);
    }

    function getExpenses(uint256 roomId) external view returns (ExpenseView[] memory out) {
        uint256[] storage ids = roomExpenses[roomId];
        out = new ExpenseView[](ids.length);
        for (uint256 i; i < ids.length; i++) out[i] = getExpense(ids[i]);
    }

    function openShare(uint256 expenseId, address user) public view returns (uint256) {
        if (expenseSettled[expenseId][user]) return 0;
        if (expenses[expenseId].payer == user) return 0;
        return expenseShare[expenseId][user];
    }

    // -------------------------------------------------------------- settlement

    function settleSplit(uint256 expenseId) public {
        Expense storage e = expenses[expenseId];
        require(e.id != 0, "no such expense");
        uint256 amount = openShare(expenseId, msg.sender);
        require(amount > 0, "nothing to settle");
        expenseSettled[expenseId][msg.sender] = true;
        require(usdc.transferFrom(msg.sender, e.payer, amount), "USDC transfer failed");
        _log(1, expenseId, e.roomId, msg.sender, e.payer, amount, "settled a share");
        emit SplitSettled(expenseId, msg.sender, e.payer, amount);
    }

    /// @notice Settles every open share the caller owes to `to` in this room.
    function settleWith(uint256 roomId, address to) external onlyMember(roomId) {
        uint256[] storage ids = roomExpenses[roomId];
        uint256 settledCount;
        for (uint256 i; i < ids.length; i++) {
            if (expenses[ids[i]].payer != to) continue;
            if (openShare(ids[i], msg.sender) == 0) continue;
            settleSplit(ids[i]);
            settledCount++;
        }
        require(settledCount > 0, "nothing to settle");
    }

    function directTransfer(uint256 roomId, address to, uint256 amount, string calldata note) external {
        require(to != address(0) && amount > 0, "bad transfer");
        require(usdc.transferFrom(msg.sender, to, amount), "USDC transfer failed");
        _log(2, 0, roomId, msg.sender, to, amount, note);
        emit DirectTransfer(roomId, msg.sender, to, amount, note);
    }

    // ---------------------------------------------------------------- balances

    /// @notice Net position per member: positive = owed to them, negative = they owe.
    function getBalances(uint256 roomId) external view returns (address[] memory members, int256[] memory net) {
        members = roomMembers[roomId];
        net = new int256[](members.length);
        uint256[] storage ids = roomExpenses[roomId];
        for (uint256 i; i < ids.length; i++) {
            Expense storage e = expenses[ids[i]];
            address[] storage p = expenseParticipants[ids[i]];
            for (uint256 j; j < p.length; j++) {
                if (expenseSettled[ids[i]][p[j]] || p[j] == e.payer) continue;
                uint256 amt = expenseShare[ids[i]][p[j]];
                for (uint256 k; k < members.length; k++) {
                    if (members[k] == p[j]) net[k] -= int256(amt);
                    else if (members[k] == e.payer) net[k] += int256(amt);
                }
            }
        }
    }

    /// @notice How much `debtor` still owes `creditor` in this room.
    function owedBetween(uint256 roomId, address debtor, address creditor) external view returns (uint256 total) {
        uint256[] storage ids = roomExpenses[roomId];
        for (uint256 i; i < ids.length; i++) {
            if (expenses[ids[i]].payer != creditor) continue;
            total += openShare(ids[i], debtor);
        }
    }

    // ---------------------------------------------------------------- activity

    function _log(
        uint8 kind, uint256 refId, uint256 roomId,
        address actor, address counterparty, uint256 amount, string memory text
    ) internal {
        activityLog.push(ActivityView(kind, refId, roomId, actor, counterparty, amount, text, uint64(block.timestamp)));
        roomActivity[roomId].push(activityLog.length - 1);
    }

    function getActivity(uint256 roomId, uint256 limit) external view returns (ActivityView[] memory out) {
        uint256[] storage idx = roomActivity[roomId];
        uint256 n = idx.length < limit ? idx.length : limit;
        out = new ActivityView[](n);
        for (uint256 i; i < n; i++) out[i] = activityLog[idx[idx.length - 1 - i]];
    }

    // ----------------------------------------------------------------- lending

    /// Simple USDC lending pool: supply USDC to earn, borrow against your supply.
    /// Interest is linear (no compounding) and accrues per second.

    uint256 public constant BORROW_APR_BPS = 800;   // 8.00% APR paid by borrowers
    uint256 public constant SUPPLY_APR_BPS = 400;   // 4.00% APR earned by suppliers
    uint256 public constant MAX_LTV_BPS = 5000;     // borrow up to 50% of your supply
    uint256 private constant YEAR = 365 days;
    uint256 private constant BPS = 10000;

    struct Loan {
        uint256 supplied;
        uint256 supplyAccrued;
        uint64 supplyUpdatedAt;
        uint256 borrowed;
        uint256 borrowAccrued;
        uint64 borrowUpdatedAt;
    }

    struct LendingPosition {
        uint256 supplied;
        uint256 supplyInterest;
        uint256 borrowed;
        uint256 borrowInterest;
        uint256 debt;
        uint256 borrowLimit;
        uint256 available;
        uint256 poolSupplied;
        uint256 poolBorrowed;
        uint256 liquidity;
    }

    mapping(address => Loan) private loans;
    uint256 public totalSupplied;
    uint256 public totalBorrowed;

    event Supplied(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);

    /// @notice Marker so the app can detect a lending-capable deployment.
    function lendingEnabled() external pure returns (bool) {
        return true;
    }

    function _accrue(address user) internal {
        Loan storage l = loans[user];
        if (l.supplyUpdatedAt == 0) l.supplyUpdatedAt = uint64(block.timestamp);
        if (l.borrowUpdatedAt == 0) l.borrowUpdatedAt = uint64(block.timestamp);
        l.supplyAccrued += _interest(l.supplied, SUPPLY_APR_BPS, block.timestamp - l.supplyUpdatedAt);
        l.borrowAccrued += _interest(l.borrowed, BORROW_APR_BPS, block.timestamp - l.borrowUpdatedAt);
        l.supplyUpdatedAt = uint64(block.timestamp);
        l.borrowUpdatedAt = uint64(block.timestamp);
    }

    function _interest(uint256 principal, uint256 aprBps, uint256 elapsed) internal pure returns (uint256) {
        if (principal == 0 || elapsed == 0) return 0;
        return (principal * aprBps * elapsed) / (BPS * YEAR);
    }

    function supply(uint256 amount) external {
        require(amount > 0, "amount required");
        _accrue(msg.sender);
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        loans[msg.sender].supplied += amount;
        totalSupplied += amount;
        emit Supplied(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        _accrue(msg.sender);
        Loan storage l = loans[msg.sender];
        require(amount > 0 && amount <= l.supplied, "amount exceeds supply");
        uint256 remaining = l.supplied - amount;
        uint256 debt = l.borrowed + l.borrowAccrued;
        require((remaining * MAX_LTV_BPS) / BPS >= debt, "would exceed borrow limit");
        require(usdc.balanceOf(address(this)) >= amount, "insufficient pool liquidity");
        l.supplied = remaining;
        totalSupplied -= amount;
        require(usdc.transfer(msg.sender, amount), "USDC transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Claims accrued supply interest, when the pool has spare liquidity.
    function claimInterest() external {
        _accrue(msg.sender);
        Loan storage l = loans[msg.sender];
        uint256 amount = l.supplyAccrued;
        require(amount > 0, "nothing to claim");
        require(usdc.balanceOf(address(this)) >= amount, "insufficient pool liquidity");
        l.supplyAccrued = 0;
        require(usdc.transfer(msg.sender, amount), "USDC transfer failed");
    }

    function borrow(uint256 amount) external {
        require(amount > 0, "amount required");
        _accrue(msg.sender);
        Loan storage l = loans[msg.sender];
        uint256 limit = (l.supplied * MAX_LTV_BPS) / BPS;
        uint256 debt = l.borrowed + l.borrowAccrued;
        require(debt + amount <= limit, "exceeds borrow limit");
        require(usdc.balanceOf(address(this)) >= amount, "insufficient pool liquidity");
        l.borrowed += amount;
        totalBorrowed += amount;
        require(usdc.transfer(msg.sender, amount), "USDC transfer failed");
        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external {
        require(amount > 0, "amount required");
        _accrue(msg.sender);
        Loan storage l = loans[msg.sender];
        uint256 debt = l.borrowed + l.borrowAccrued;
        require(debt > 0, "nothing to repay");
        uint256 pay = amount > debt ? debt : amount;
        require(usdc.transferFrom(msg.sender, address(this), pay), "USDC transfer failed");
        uint256 toInterest = pay > l.borrowAccrued ? l.borrowAccrued : pay;
        l.borrowAccrued -= toInterest;
        uint256 toPrincipal = pay - toInterest;
        l.borrowed -= toPrincipal;
        totalBorrowed -= toPrincipal;
        emit Repaid(msg.sender, pay);
    }

    function getLendingPosition(address user) external view returns (LendingPosition memory p) {
        Loan storage l = loans[user];
        uint256 sSince = l.supplyUpdatedAt == 0 ? 0 : block.timestamp - l.supplyUpdatedAt;
        uint256 bSince = l.borrowUpdatedAt == 0 ? 0 : block.timestamp - l.borrowUpdatedAt;
        p.supplied = l.supplied;
        p.supplyInterest = l.supplyAccrued + _interest(l.supplied, SUPPLY_APR_BPS, sSince);
        p.borrowed = l.borrowed;
        p.borrowInterest = l.borrowAccrued + _interest(l.borrowed, BORROW_APR_BPS, bSince);
        p.debt = p.borrowed + p.borrowInterest;
        p.borrowLimit = (l.supplied * MAX_LTV_BPS) / BPS;
        uint256 liquidity = usdc.balanceOf(address(this));
        uint256 headroom = p.borrowLimit > p.debt ? p.borrowLimit - p.debt : 0;
        p.available = headroom < liquidity ? headroom : liquidity;
        p.poolSupplied = totalSupplied;
        p.poolBorrowed = totalBorrowed;
        p.liquidity = liquidity;
    }
}
