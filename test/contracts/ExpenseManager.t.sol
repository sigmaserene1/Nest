// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../contracts/ExpenseManager.sol";
import "./mocks/MockUSDC.sol";

contract ExpenseManagerTest is Test {
    ExpenseManager manager;
    MockUSDC usdc;

    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address carol = address(0xCA401);

    function setUp() public {
        usdc = new MockUSDC();
        manager = new ExpenseManager(address(usdc));

        usdc.mint(alice, 1_000e6);
        usdc.mint(bob, 1_000e6);
        usdc.mint(carol, 1_000e6);
    }

    function _createRoomWithThree() internal returns (uint256 roomId) {
        vm.prank(alice);
        roomId = manager.createRoom("Apartment 4B");
        vm.prank(bob);
        manager.joinRoom(roomId);
        vm.prank(alice);
        manager.inviteMember(roomId, carol);
    }

    function testCreateRoomAddsCreatorAsMember() public {
        vm.prank(alice);
        uint256 roomId = manager.createRoom("Solo room");
        assertTrue(manager.isMember(roomId, alice));
        address[] memory members = manager.getRoomMembers(roomId);
        assertEq(members.length, 1);
        assertEq(members[0], alice);
    }

    function testJoinRoomAddsMember() public {
        vm.prank(alice);
        uint256 roomId = manager.createRoom("Room");
        vm.prank(bob);
        manager.joinRoom(roomId);
        assertTrue(manager.isMember(roomId, bob));
    }

    function testOnlyMembersCanInvite() public {
        vm.prank(alice);
        uint256 roomId = manager.createRoom("Room");
        vm.prank(carol);
        vm.expectRevert("not a room member");
        manager.inviteMember(roomId, bob);
    }

    function testSetDisplayNameIsWriteOnce() public {
        vm.prank(alice);
        manager.setDisplayName("Alice");
        assertEq(manager.displayNames(alice), "Alice");

        vm.prank(alice);
        vm.expectRevert("name already claimed");
        manager.setDisplayName("Alice2");
    }

    function testAddExpenseRevertsIfSharesDontSumToTotal() public {
        uint256 roomId = _createRoomWithThree();
        address[] memory participants = new address[](2);
        participants[0] = alice;
        participants[1] = bob;
        uint256[] memory shares = new uint256[](2);
        shares[0] = 40e6;
        shares[1] = 40e6;

        vm.prank(alice);
        vm.expectRevert("shares must equal total");
        manager.addExpense(roomId, participants, shares, "Rent", "September rent", 100e6);
    }

    function testAddExpensePayerIsAutoSettled() public {
        uint256 roomId = _createRoomWithThree();
        address[] memory participants = new address[](2);
        participants[0] = alice;
        participants[1] = bob;
        uint256[] memory shares = new uint256[](2);
        shares[0] = 50e6;
        shares[1] = 50e6;

        vm.prank(alice);
        uint256 expenseId = manager.addExpense(roomId, participants, shares, "Rent", "Rent", 100e6);

        assertEq(manager.openShare(expenseId, alice), 0);
        assertEq(manager.openShare(expenseId, bob), 50e6);
    }

    function testSettleSplitTransfersUSDCAndMarksSettled() public {
        uint256 roomId = _createRoomWithThree();
        address[] memory participants = new address[](2);
        participants[0] = alice;
        participants[1] = bob;
        uint256[] memory shares = new uint256[](2);
        shares[0] = 50e6;
        shares[1] = 50e6;

        vm.prank(alice);
        uint256 expenseId = manager.addExpense(roomId, participants, shares, "Rent", "Rent", 100e6);

        vm.prank(bob);
        usdc.approve(address(manager), 50e6);

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(bob);
        manager.settleSplit(expenseId);

        assertEq(usdc.balanceOf(alice), aliceBefore + 50e6);
        assertEq(manager.openShare(expenseId, bob), 0);
    }

    function testSettleSplitRevertsWithNoAllowance() public {
        uint256 roomId = _createRoomWithThree();
        address[] memory participants = new address[](2);
        participants[0] = alice;
        participants[1] = bob;
        uint256[] memory shares = new uint256[](2);
        shares[0] = 50e6;
        shares[1] = 50e6;

        vm.prank(alice);
        uint256 expenseId = manager.addExpense(roomId, participants, shares, "Rent", "Rent", 100e6);

        // MockUSDC reverts inside transferFrom before ExpenseManager's own
        // "USDC transfer failed" require is ever reached, so the revert
        // bubbling up here is the mock's, not the manager's.
        vm.prank(bob);
        vm.expectRevert("insufficient allowance");
        manager.settleSplit(expenseId);
    }

    function testSettleWithClearsEveryOpenShareToOnePayee() public {
        uint256 roomId = _createRoomWithThree();

        address[] memory p1 = new address[](2);
        p1[0] = alice; p1[1] = bob;
        uint256[] memory s1 = new uint256[](2);
        s1[0] = 30e6; s1[1] = 30e6;
        vm.prank(alice);
        manager.addExpense(roomId, p1, s1, "Groceries", "Groceries", 60e6);

        address[] memory p2 = new address[](2);
        p2[0] = alice; p2[1] = bob;
        uint256[] memory s2 = new uint256[](2);
        s2[0] = 20e6; s2[1] = 20e6;
        vm.prank(alice);
        manager.addExpense(roomId, p2, s2, "Utilities", "Utilities", 40e6);

        assertEq(manager.owedBetween(roomId, bob, alice), 50e6);

        vm.prank(bob);
        usdc.approve(address(manager), 50e6);
        vm.prank(bob);
        manager.settleWith(roomId, alice);

        assertEq(manager.owedBetween(roomId, bob, alice), 0);
    }

    function testSettleWithRevertsWhenNothingOwed() public {
        uint256 roomId = _createRoomWithThree();
        vm.prank(bob);
        vm.expectRevert("nothing to settle");
        manager.settleWith(roomId, alice);
    }

    function testDirectTransferMovesExactAmount() public {
        vm.prank(alice);
        uint256 roomId = manager.createRoom("Room");

        vm.prank(alice);
        usdc.approve(address(manager), 25e6);

        uint256 bobBefore = usdc.balanceOf(bob);
        vm.prank(alice);
        manager.directTransfer(roomId, bob, 25e6, "reimbursement");

        assertEq(usdc.balanceOf(bob), bobBefore + 25e6);
    }

    function testGetBalancesNetsAlwaysSumToZero() public {
        uint256 roomId = _createRoomWithThree();

        address[] memory participants = new address[](3);
        participants[0] = alice; participants[1] = bob; participants[2] = carol;
        uint256[] memory shares = new uint256[](3);
        shares[0] = 34e6; shares[1] = 33e6; shares[2] = 33e6;

        vm.prank(alice);
        manager.addExpense(roomId, participants, shares, "Rent", "Rent", 100e6);

        (, int256[] memory net) = manager.getBalances(roomId);
        int256 sum;
        for (uint256 i; i < net.length; i++) sum += net[i];
        assertEq(sum, 0);
    }
}
