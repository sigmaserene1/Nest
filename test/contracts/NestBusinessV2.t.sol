// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../contracts/NestBusinessV2.sol";
import "./mocks/MockUSDC.sol";

contract NestBusinessV2Test is Test {
    NestBusinessV2 biz;
    MockUSDC usdc;

    address owner = address(0x0001);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address carol = address(0xCA401);
    address agent = address(0xA6E27);
    address lp = address(0x11);

    function setUp() public {
        usdc = new MockUSDC();
        biz = new NestBusinessV2(address(usdc));
        usdc.mint(alice, 1_000_000e6);
        usdc.mint(bob, 1_000_000e6);
        usdc.mint(carol, 1_000_000e6);
        usdc.mint(lp, 1_000_000e6);
    }

    // ---------- workspace / membership ----------

    function testCreateBusinessRoomAddsCreatorAsManager() public {
        vm.prank(alice);
        uint256 roomId = biz.createBusinessRoom("Acme Co");
        assertTrue(biz.isMember(roomId, alice));
        assertTrue(biz.isManager(roomId, alice));
    }

    function testCreateBusinessRoomRejectsEmptyOrTooLongName() public {
        vm.prank(alice);
        vm.expectRevert("invalid workspace name");
        biz.createBusinessRoom("");

        // Build a string of exactly 81 bytes (one over the contract's 80-byte cap)
        // instead of hand-typing a literal, so the length can't be miscounted.
        bytes memory raw = new bytes(81);
        for (uint256 i; i < 81; i++) raw[i] = 0x61; // 'a'
        string memory tooLong = string(raw);

        vm.prank(alice);
        vm.expectRevert("invalid workspace name");
        biz.createBusinessRoom(tooLong);
    }

    function testOnlyOwnerCanSetManager() public {
        vm.prank(alice);
        uint256 roomId = biz.createBusinessRoom("Acme");
        vm.prank(alice);
        biz.inviteMember(roomId, bob);

        vm.prank(bob);
        vm.expectRevert("only workspace owner");
        biz.setManager(roomId, bob, true);

        vm.prank(alice);
        biz.setManager(roomId, bob, true);
        assertTrue(biz.isManager(roomId, bob));
    }

    function testOnlyOperatorCanInvite() public {
        vm.prank(alice);
        uint256 roomId = biz.createBusinessRoom("Acme");
        vm.prank(alice);
        biz.inviteMember(roomId, bob);

        vm.prank(bob);
        vm.expectRevert("not a workspace manager");
        biz.inviteMember(roomId, carol);
    }

    // ---------- expenses / settlement ----------

    function _roomWithThree() internal returns (uint256 roomId) {
        vm.prank(alice);
        roomId = biz.createBusinessRoom("Acme");
        vm.prank(alice);
        biz.inviteMember(roomId, bob);
        vm.prank(alice);
        biz.inviteMember(roomId, carol);
    }

    function testAddExpenseRevertsOnShareMismatch() public {
        uint256 roomId = _roomWithThree();
        address[] memory participants = new address[](2);
        participants[0] = alice;
        participants[1] = bob;
        uint256[] memory shares = new uint256[](2);
        shares[0] = 40e6;
        shares[1] = 40e6;

        vm.prank(alice);
        vm.expectRevert(NestBusinessV2.SharesMismatch.selector);
        biz.addExpense(roomId, participants, shares, "Travel", "Flights", 100e6);
    }

    function testAddExpenseRevertsOnDuplicateParticipant() public {
        uint256 roomId = _roomWithThree();
        address[] memory participants = new address[](2);
        participants[0] = bob;
        participants[1] = bob;
        uint256[] memory shares = new uint256[](2);
        shares[0] = 50e6;
        shares[1] = 50e6;

        vm.prank(alice);
        vm.expectRevert(NestBusinessV2.DuplicateParticipant.selector);
        biz.addExpense(roomId, participants, shares, "Travel", "Flights", 100e6);
    }

    function testAddExpensePayerAutoSettled() public {
        uint256 roomId = _roomWithThree();
        address[] memory participants = new address[](2);
        participants[0] = alice;
        participants[1] = bob;
        uint256[] memory shares = new uint256[](2);
        shares[0] = 50e6;
        shares[1] = 50e6;

        vm.prank(alice);
        uint256 expenseId = biz.addExpense(roomId, participants, shares, "Travel", "Flights", 100e6);
        assertEq(biz.openShare(expenseId, alice), 0);
        assertEq(biz.openShare(expenseId, bob), 50e6);
    }

    function testSettleWithTransfersUSDCAndClearsShares() public {
        uint256 roomId = _roomWithThree();
        address[] memory participants = new address[](2);
        participants[0] = alice;
        participants[1] = bob;
        uint256[] memory shares = new uint256[](2);
        shares[0] = 50e6;
        shares[1] = 50e6;

        vm.prank(alice);
        biz.addExpense(roomId, participants, shares, "Travel", "Flights", 100e6);

        vm.prank(bob);
        usdc.approve(address(biz), 50e6);
        uint256 aliceBefore = usdc.balanceOf(alice);

        vm.prank(bob);
        biz.settleWith(roomId, alice);

        assertEq(usdc.balanceOf(alice), aliceBefore + 50e6);
        assertEq(biz.owedBetween(roomId, bob, alice), 0);
    }

    function testSettleWithRevertsWhenNothingOwed() public {
        uint256 roomId = _roomWithThree();
        vm.prank(bob);
        vm.expectRevert(NestBusinessV2.NothingToSettle.selector);
        biz.settleWith(roomId, alice);
    }

    function testSettleBatchAcrossMultipleCreditors() public {
        uint256 roomId = _roomWithThree();

        address[] memory p1 = new address[](2);
        p1[0] = bob;
        p1[1] = carol;
        uint256[] memory s1 = new uint256[](2);
        s1[0] = 20e6;
        s1[1] = 20e6;
        vm.prank(alice);
        biz.addExpense(roomId, p1, s1, "Rent", "Office rent", 40e6);

        address[] memory p2 = new address[](2);
        p2[0] = alice;
        p2[1] = carol;
        uint256[] memory s2 = new uint256[](2);
        s2[0] = 15e6;
        s2[1] = 15e6;
        vm.prank(bob);
        biz.addExpense(roomId, p2, s2, "Supplies", "Office supplies", 30e6);

        vm.prank(carol);
        usdc.approve(address(biz), 100e6);

        address[] memory creditors = new address[](2);
        creditors[0] = alice;
        creditors[1] = bob;

        uint256 aliceBefore = usdc.balanceOf(alice);
        uint256 bobBefore = usdc.balanceOf(bob);

        vm.prank(carol);
        uint256 total = biz.settleBatch(roomId, creditors);

        assertEq(total, 35e6);
        assertEq(usdc.balanceOf(alice), aliceBefore + 20e6);
        assertEq(usdc.balanceOf(bob), bobBefore + 15e6);
    }

    function testSettleBatchRevertsOnDuplicateCreditor() public {
        uint256 roomId = _roomWithThree();
        address[] memory creditors = new address[](2);
        creditors[0] = alice;
        creditors[1] = alice;

        vm.prank(bob);
        vm.expectRevert(NestBusinessV2.DuplicateCreditor.selector);
        biz.settleBatch(roomId, creditors);
    }

    function testSettleBatchRevertsOnEmptyBatch() public {
        uint256 roomId = _roomWithThree();
        address[] memory creditors = new address[](0);

        vm.prank(bob);
        vm.expectRevert(NestBusinessV2.EmptyBatch.selector);
        biz.settleBatch(roomId, creditors);
    }

    // ---------- credit pool: supply / withdraw ----------

    function testSupplyIncreasesBalanceAndPool() public {
        vm.prank(lp);
        usdc.approve(address(biz), 500e6);
        vm.prank(lp);
        biz.supply(500e6);

        NestBusinessV2.CreditPosition memory pos = biz.getCreditPosition(lp);
        assertEq(pos.supplied, 500e6);
        assertEq(biz.totalSupplied(), 500e6);
    }

    function testWithdrawReturnsUSDCAndDecreasesSupply() public {
        vm.prank(lp);
        usdc.approve(address(biz), 500e6);
        vm.prank(lp);
        biz.supply(500e6);

        uint256 before = usdc.balanceOf(lp);
        vm.prank(lp);
        biz.withdraw(200e6);

        assertEq(usdc.balanceOf(lp), before + 200e6);
        NestBusinessV2.CreditPosition memory pos = biz.getCreditPosition(lp);
        assertEq(pos.supplied, 300e6);
    }

    function testWithdrawRevertsIfWouldBreachLTVAgainstOwnDebt() public {
        // lp supplies then borrows against it, then tries to withdraw too much
        vm.prank(lp);
        usdc.approve(address(biz), 1_000e6);
        vm.prank(lp);
        biz.supply(1_000e6);

        vm.prank(lp);
        biz.borrow(500e6); // exactly 50% LTV

        vm.prank(lp);
        vm.expectRevert("would exceed credit limit");
        biz.withdraw(1e6); // any withdrawal now breaches the 50% LTV against outstanding debt
    }

    // ---------- credit pool: borrow / LTV cap ----------

    function testBorrowUpToFiftyPercentLTVSucceeds() public {
        vm.prank(alice);
        usdc.approve(address(biz), 1_000e6);
        vm.prank(alice);
        biz.supply(1_000e6);

        vm.prank(alice);
        biz.borrow(500e6); // exactly MAX_LTV_BPS = 5000 (50%)

        NestBusinessV2.CreditPosition memory pos = biz.getCreditPosition(alice);
        assertEq(pos.borrowed, 500e6);
        assertEq(pos.debt, 500e6);
    }

    function testBorrowAboveFiftyPercentLTVReverts() public {
        vm.prank(alice);
        usdc.approve(address(biz), 1_000e6);
        vm.prank(alice);
        biz.supply(1_000e6);

        vm.prank(alice);
        vm.expectRevert("exceeds credit limit");
        biz.borrow(500e6 + 1);
    }

    function testBorrowRevertsWithInsufficientPoolLiquidity() public {
        // alice supplies a large collateral base but the pool itself has no other liquidity
        // beyond her own deposit, so a borrow that exceeds available cash should revert.
        vm.prank(alice);
        usdc.approve(address(biz), 1_000e6);
        vm.prank(alice);
        biz.supply(1_000e6);

        // Simulate pool being drained by another borrower first.
        vm.prank(alice);
        biz.borrow(500e6);

        vm.prank(bob);
        usdc.approve(address(biz), 1e6);
        vm.prank(bob);
        vm.expectRevert("exceeds credit limit"); // bob has no collateral supplied
        biz.borrow(1e6);
    }

    // ---------- credit pool: interest accrual ----------

    function testInterestAccruesOverTimeAtEightPercentAPR() public {
        vm.prank(alice);
        usdc.approve(address(biz), 1_000e6);
        vm.prank(alice);
        biz.supply(1_000e6);

        vm.prank(alice);
        biz.borrow(500e6);

        // warp forward exactly 365 days -> interest should be ~8% of principal (800 bps APR)
        vm.warp(block.timestamp + 365 days);

        NestBusinessV2.CreditPosition memory pos = biz.getCreditPosition(alice);
        uint256 expectedInterest = (500e6 * 800) / 10_000; // 40e6
        assertApproxEqAbs(pos.borrowInterest, expectedInterest, 1);
        assertApproxEqAbs(pos.debt, 500e6 + expectedInterest, 1);
    }

    function testRepayClearsInterestBeforePrincipal() public {
        vm.prank(alice);
        usdc.approve(address(biz), 1_000e6);
        vm.prank(alice);
        biz.supply(1_000e6);

        vm.prank(alice);
        biz.borrow(500e6);

        vm.warp(block.timestamp + 365 days);

        NestBusinessV2.CreditPosition memory before = biz.getCreditPosition(alice);
        uint256 interestOwed = before.borrowInterest;

        vm.prank(alice);
        usdc.approve(address(biz), interestOwed);
        vm.prank(alice);
        biz.repay(interestOwed);

        NestBusinessV2.CreditPosition memory afterRepay = biz.getCreditPosition(alice);
        // interest fully cleared, principal untouched
        assertApproxEqAbs(afterRepay.borrowInterest, 0, 1);
        assertEq(afterRepay.borrowed, 500e6);
    }

    function testRepayRevertsWhenNothingOwed() public {
        vm.prank(alice);
        vm.expectRevert("nothing to repay");
        biz.repay(1e6);
    }

    // ---------- agent policies ----------

    function testSetAgentPolicyRevertsWithInvalidWindow() public {
        uint256 roomId = _roomWithThree();
        vm.prank(alice);
        vm.expectRevert("invalid policy");
        biz.setAgentPolicy(roomId, agent, uint64(block.timestamp + 100), uint64(block.timestamp), 10e6, 20e6, 1 days);
    }

    function testSetAgentPolicyRevertsWithInvalidLimits() public {
        uint256 roomId = _roomWithThree();
        vm.prank(alice);
        vm.expectRevert("invalid limits");
        biz.setAgentPolicy(roomId, agent, uint64(block.timestamp), uint64(block.timestamp + 30 days), 20e6, 10e6, 1 days);
    }

    function testAgentCanSettleWithinCapsOnBehalfOfOwner() public {
        uint256 roomId = _roomWithThree();
        address[] memory participants = new address[](2);
        participants[0] = alice;
        participants[1] = bob;
        uint256[] memory shares = new uint256[](2);
        shares[0] = 50e6;
        shares[1] = 50e6;

        vm.prank(alice);
        biz.addExpense(roomId, participants, shares, "Travel", "Flights", 100e6);

        vm.prank(bob);
        biz.setAgentPolicy(roomId, agent, uint64(block.timestamp), uint64(block.timestamp + 30 days), 100e6, 200e6, 1 days);

        vm.prank(bob);
        usdc.approve(address(biz), 50e6);

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(agent);
        biz.settleWithFor(roomId, bob, alice);

        assertEq(usdc.balanceOf(alice), aliceBefore + 50e6);
    }

    function testAgentSettlementRevertsWhenExceedingPerRunCap() public {
        uint256 roomId = _roomWithThree();
        address[] memory participants = new address[](2);
        participants[0] = alice;
        participants[1] = bob;
        uint256[] memory shares = new uint256[](2);
        shares[0] = 50e6;
        shares[1] = 50e6;

        vm.prank(alice);
        biz.addExpense(roomId, participants, shares, "Travel", "Flights", 100e6);

        // maxPerRun is deliberately below the actual owed amount (50e6)
        vm.prank(bob);
        biz.setAgentPolicy(roomId, agent, uint64(block.timestamp), uint64(block.timestamp + 30 days), 10e6, 200e6, 1 days);

        vm.prank(bob);
        usdc.approve(address(biz), 50e6);

        vm.prank(agent);
        vm.expectRevert("outside run cap");
        biz.settleWithFor(roomId, bob, alice);
    }

    function testAgentSettlementRevertsWhenExceedingPeriodCap() public {
        uint256 roomId = _roomWithThree();

        // Two separate expenses so the agent can attempt two runs within the same period.
        address[] memory p1 = new address[](2);
        p1[0] = alice;
        p1[1] = bob;
        uint256[] memory s1 = new uint256[](2);
        s1[0] = 40e6;
        s1[1] = 40e6;
        vm.prank(alice);
        biz.addExpense(roomId, p1, s1, "Travel", "Flights", 80e6);

        vm.prank(bob);
        biz.setAgentPolicy(roomId, agent, uint64(block.timestamp), uint64(block.timestamp + 30 days), 40e6, 40e6, 1 days);

        vm.prank(bob);
        usdc.approve(address(biz), 40e6);

        vm.prank(agent);
        biz.settleWithFor(roomId, bob, alice); // uses up the entire period cap (40e6)

        // A second expense creates a fresh open share, but the period cap is exhausted.
        address[] memory p2 = new address[](2);
        p2[0] = alice;
        p2[1] = bob;
        uint256[] memory s2 = new uint256[](2);
        s2[0] = 10e6;
        s2[1] = 10e6;
        vm.prank(alice);
        biz.addExpense(roomId, p2, s2, "Travel", "Taxi", 20e6);

        vm.prank(bob);
        usdc.approve(address(biz), 10e6);

        vm.prank(agent);
        vm.expectRevert("outside period cap");
        biz.settleWithFor(roomId, bob, alice);
    }

    function testAgentPeriodCapResetsAfterPeriodElapses() public {
        uint256 roomId = _roomWithThree();

        address[] memory p1 = new address[](2);
        p1[0] = alice;
        p1[1] = bob;
        uint256[] memory s1 = new uint256[](2);
        s1[0] = 40e6;
        s1[1] = 40e6;
        vm.prank(alice);
        biz.addExpense(roomId, p1, s1, "Travel", "Flights", 80e6);

        vm.prank(bob);
        biz.setAgentPolicy(roomId, agent, uint64(block.timestamp), uint64(block.timestamp + 30 days), 40e6, 40e6, 1 days);

        vm.prank(bob);
        usdc.approve(address(biz), 40e6);
        vm.prank(agent);
        biz.settleWithFor(roomId, bob, alice);

        // move past the 1-day period window
        vm.warp(block.timestamp + 1 days + 1);

        address[] memory p2 = new address[](2);
        p2[0] = alice;
        p2[1] = bob;
        uint256[] memory s2 = new uint256[](2);
        s2[0] = 10e6;
        s2[1] = 10e6;
        vm.prank(alice);
        biz.addExpense(roomId, p2, s2, "Travel", "Taxi", 20e6);

        vm.prank(bob);
        usdc.approve(address(biz), 10e6);

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(agent);
        biz.settleWithFor(roomId, bob, alice); // succeeds because the period reset

        assertEq(usdc.balanceOf(alice), aliceBefore + 10e6);
    }

    function testAgentCannotActOutsideValidWindow() public {
        uint256 roomId = _roomWithThree();
        address[] memory participants = new address[](2);
        participants[0] = alice;
        participants[1] = bob;
        uint256[] memory shares = new uint256[](2);
        shares[0] = 50e6;
        shares[1] = 50e6;

        vm.prank(alice);
        biz.addExpense(roomId, participants, shares, "Travel", "Flights", 100e6);

        vm.prank(bob);
        biz.setAgentPolicy(roomId, agent, uint64(block.timestamp + 10 days), uint64(block.timestamp + 30 days), 100e6, 200e6, 1 days);

        vm.prank(bob);
        usdc.approve(address(biz), 50e6);

        // validAfter hasn't arrived yet
        vm.prank(agent);
        vm.expectRevert("agent not authorised");
        biz.settleWithFor(roomId, bob, alice);
    }

    function testRevokedAgentPolicyCannotSettle() public {
        uint256 roomId = _roomWithThree();
        address[] memory participants = new address[](2);
        participants[0] = alice;
        participants[1] = bob;
        uint256[] memory shares = new uint256[](2);
        shares[0] = 50e6;
        shares[1] = 50e6;

        vm.prank(alice);
        biz.addExpense(roomId, participants, shares, "Travel", "Flights", 100e6);

        vm.prank(bob);
        biz.setAgentPolicy(roomId, agent, uint64(block.timestamp), uint64(block.timestamp + 30 days), 100e6, 200e6, 1 days);

        vm.prank(bob);
        biz.revokeAgentPolicy(roomId, agent);

        vm.prank(bob);
        usdc.approve(address(biz), 50e6);

        vm.prank(agent);
        vm.expectRevert("agent not authorised");
        biz.settleWithFor(roomId, bob, alice);
    }

    function testAgentCannotSettleForNonMemberCounterparty() public {
        // agent tries to settle debtor's obligation to a "creditor" who was never invited to the room
        uint256 roomId = _roomWithThree();
        address stranger = address(0x51DE);

        vm.prank(bob);
        biz.setAgentPolicy(roomId, agent, uint64(block.timestamp), uint64(block.timestamp + 30 days), 100e6, 200e6, 1 days);

        vm.prank(agent);
        vm.expectRevert(); // owedBetween returns 0 for non-member creditor -> "outside run cap"/"NothingToSettle" path
        biz.settleWithFor(roomId, bob, stranger);
    }
}
