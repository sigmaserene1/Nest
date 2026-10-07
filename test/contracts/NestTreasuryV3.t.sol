// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../contracts/NestTreasuryV3.sol";
import "./mocks/MockUSDC.sol";

contract NestTreasuryV3Test is Test {
    NestTreasuryV3 treasury;
    MockUSDC usdc;

    address owner = address(0xA11CE);
    address alice = address(0xB0B);
    address bob = address(0xCA401);
    address vendor = address(0xD00D);

    uint256 workspaceId;

    function setUp() public {
        usdc = new MockUSDC();
        treasury = new NestTreasuryV3(address(usdc));

        usdc.mint(owner, 10_000e6);
        usdc.mint(alice, 10_000e6);
        usdc.mint(bob, 10_000e6);

        vm.prank(owner);
        workspaceId = treasury.createWorkspace("Nest Studio");

        vm.prank(owner);
        treasury.addMember(workspaceId, alice);

        vm.prank(owner);
        treasury.addMember(workspaceId, bob);

        vm.prank(owner);
        treasury.setManager(workspaceId, alice, true);

        vm.startPrank(owner);
        usdc.approve(address(treasury), type(uint256).max);
        treasury.deposit(workspaceId, 2_000e6);
        vm.stopPrank();
    }

    function testSharedTreasuryTracksAvailableBalance() public {
        NestTreasuryV3.Workspace memory w = treasury.getWorkspace(workspaceId);
        assertEq(w.availableTreasury, 2_000e6);
        assertEq(w.reservedTreasury, 0);

        vm.startPrank(alice);
        usdc.approve(address(treasury), 250e6);
        treasury.deposit(workspaceId, 250e6);
        vm.stopPrank();

        w = treasury.getWorkspace(workspaceId);
        assertEq(w.availableTreasury, 2_250e6);
    }

    function testTwoOfTwoProposalApprovalAndExecution() public {
        vm.prank(owner);
        treasury.setApprovalThreshold(workspaceId, 2);

        vm.prank(owner);
        uint256 proposalId = treasury.createPaymentProposal(
            workspaceId,
            vendor,
            300e6,
            "Design retainer",
            uint64(block.timestamp + 7 days)
        );

        vm.expectRevert("more approvals required");
        treasury.executeProposal(proposalId);

        vm.prank(alice);
        treasury.approveProposal(proposalId);

        uint256 beforeVendor = usdc.balanceOf(vendor);
        treasury.executeProposal(proposalId);
        assertEq(usdc.balanceOf(vendor) - beforeVendor, 300e6);

        NestTreasuryV3.PaymentProposal memory proposal = treasury.getProposal(proposalId);
        assertTrue(proposal.executed);

        NestTreasuryV3.Workspace memory w = treasury.getWorkspace(workspaceId);
        assertEq(w.availableTreasury, 1_700e6);
    }

    function testProposalCannotDoubleApproveOrExecuteTwice() public {
        vm.prank(owner);
        uint256 proposalId = treasury.createPaymentProposal(
            workspaceId,
            vendor,
            100e6,
            "One off",
            uint64(block.timestamp + 1 days)
        );

        vm.prank(owner);
        vm.expectRevert("already approved");
        treasury.approveProposal(proposalId);

        treasury.executeProposal(proposalId);

        vm.expectRevert("proposal inactive");
        treasury.executeProposal(proposalId);
    }

    function testRecurringPaymentExecutesOnlyWhenDue() public {
        vm.prank(owner);
        uint256 recurringId = treasury.createRecurringPayment(
            workspaceId,
            vendor,
            50e6,
            30 days,
            uint64(block.timestamp + 1 days),
            2,
            "Monthly contractor"
        );

        vm.expectRevert("not due");
        treasury.executeRecurringPayment(recurringId);

        vm.warp(block.timestamp + 1 days);
        treasury.executeRecurringPayment(recurringId);
        assertEq(usdc.balanceOf(vendor), 50e6);

        NestTreasuryV3.RecurringPayment memory schedule = treasury.getRecurringPayment(recurringId);
        assertEq(schedule.remainingExecutions, 1);
        assertTrue(schedule.active);

        vm.warp(uint256(schedule.nextExecutionAt));
        treasury.executeRecurringPayment(recurringId);
        schedule = treasury.getRecurringPayment(recurringId);
        assertEq(usdc.balanceOf(vendor), 100e6);
        assertEq(schedule.remainingExecutions, 0);
        assertFalse(schedule.active);
    }

    function testMilestoneReservesTreasuryUntilRelease() public {
        vm.prank(owner);
        treasury.setApprovalThreshold(workspaceId, 2);

        vm.prank(owner);
        uint256 milestoneId = treasury.createMilestone(
            workspaceId,
            vendor,
            400e6,
            "Ship production mobile build"
        );

        NestTreasuryV3.Workspace memory w = treasury.getWorkspace(workspaceId);
        assertEq(w.availableTreasury, 1_600e6);
        assertEq(w.reservedTreasury, 400e6);

        vm.expectRevert("more approvals required");
        treasury.releaseMilestone(milestoneId);

        vm.prank(alice);
        treasury.approveMilestone(milestoneId);

        treasury.releaseMilestone(milestoneId);
        assertEq(usdc.balanceOf(vendor), 400e6);

        w = treasury.getWorkspace(workspaceId);
        assertEq(w.availableTreasury, 1_600e6);
        assertEq(w.reservedTreasury, 0);
    }

    function testCancelledMilestoneReturnsReservedFunds() public {
        vm.prank(owner);
        uint256 milestoneId = treasury.createMilestone(
            workspaceId,
            vendor,
            250e6,
            "Cancelled deliverable"
        );

        vm.prank(owner);
        treasury.cancelMilestone(milestoneId);

        NestTreasuryV3.Workspace memory w = treasury.getWorkspace(workspaceId);
        assertEq(w.availableTreasury, 2_000e6);
        assertEq(w.reservedTreasury, 0);

        vm.expectRevert("milestone inactive");
        treasury.releaseMilestone(milestoneId);
    }

    function testDelegatedBudgetEnforcesPeriodCapAndResets() public {
        vm.prank(owner);
        treasury.setBudgetPolicy(workspaceId, bob, 200e6, 7 days);

        vm.prank(bob);
        treasury.spendFromBudget(workspaceId, vendor, 125e6, "Team software");
        assertEq(usdc.balanceOf(vendor), 125e6);

        vm.prank(bob);
        vm.expectRevert("budget exceeded");
        treasury.spendFromBudget(workspaceId, vendor, 100e6, "Would exceed cap");

        vm.warp(block.timestamp + 7 days);
        vm.prank(bob);
        treasury.spendFromBudget(workspaceId, vendor, 100e6, "New period");

        NestTreasuryV3.BudgetPolicy memory policy = treasury.getBudgetPolicy(workspaceId, bob);
        assertEq(policy.spent, 100e6);
        assertEq(usdc.balanceOf(vendor), 225e6);
    }

    function testOnlyManagerCanConfigureBudgetsAndPayments() public {
        vm.prank(bob);
        vm.expectRevert("not a manager");
        treasury.setBudgetPolicy(workspaceId, bob, 100e6, 1 days);

        vm.prank(bob);
        vm.expectRevert("not a manager");
        treasury.createPaymentProposal(
            workspaceId,
            vendor,
            100e6,
            "Unauthorized",
            uint64(block.timestamp + 1 days)
        );
    }

    function testThresholdCannotExceedManagerCount() public {
        vm.prank(owner);
        vm.expectRevert("invalid threshold");
        treasury.setApprovalThreshold(workspaceId, 3);
    }
}
