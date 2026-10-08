// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../contracts/NestBridgeRegistry.sol";

contract NestBridgeRegistryTest is Test {
    NestBridgeRegistry registry;

    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        registry = new NestBridgeRegistry();
    }

    function _input(
        uint256 sourceChainId,
        uint256 destinationChainId,
        string memory sourceName,
        string memory destinationName,
        uint256 amount,
        address recipient,
        bytes32 sourceHash,
        bytes32 destinationHash,
        string memory provider
    ) internal pure returns (NestBridgeRegistry.BridgeInput memory) {
        return NestBridgeRegistry.BridgeInput({
            sourceChainId: sourceChainId,
            destinationChainId: destinationChainId,
            sourceName: sourceName,
            destinationName: destinationName,
            amount: amount,
            recipient: recipient,
            sourceTxHash: sourceHash,
            destinationTxHash: destinationHash,
            provider: provider
        });
    }

    function testRecordsCompletedBridgeForCaller() public {
        bytes32 sourceHash = keccak256("source");
        bytes32 destinationHash = keccak256("destination");

        vm.prank(alice);
        uint256 id = registry.recordCompletedBridge(
            _input(
                8453,
                5042,
                "Base",
                "Arc",
                125e6,
                bob,
                sourceHash,
                destinationHash,
                "Circle CCTP"
            )
        );

        NestBridgeRegistry.BridgeRecord memory record = registry.getBridge(id);
        assertEq(record.owner, alice);
        assertEq(record.recipient, bob);
        assertEq(record.sourceChainId, 8453);
        assertEq(record.destinationChainId, 5042);
        assertEq(record.amount, 125e6);
        assertEq(record.sourceTxHash, sourceHash);
        assertEq(record.destinationTxHash, destinationHash);
        assertEq(record.sourceName, "Base");
        assertEq(record.destinationName, "Arc");
        assertEq(record.provider, "Circle CCTP");

        NestBridgeRegistry.BridgeRecord[] memory records = registry.getUserBridges(alice, 100);
        assertEq(records.length, 1);
        assertEq(records[0].id, id);
    }

    function testRejectsDuplicateSourceTransaction() public {
        bytes32 sourceHash = keccak256("same-source");

        vm.prank(alice);
        registry.recordCompletedBridge(
            _input(
                8453,
                5042,
                "Base",
                "Arc",
                10e6,
                alice,
                sourceHash,
                keccak256("destination-one"),
                "LI.FI"
            )
        );

        vm.prank(alice);
        vm.expectRevert("bridge already recorded");
        registry.recordCompletedBridge(
            _input(
                8453,
                5042,
                "Base",
                "Arc",
                10e6,
                alice,
                sourceHash,
                keccak256("destination-two"),
                "LI.FI"
            )
        );
    }

    function testHistoryIsNewestFirstAndScopedPerWallet() public {
        vm.startPrank(alice);
        registry.recordCompletedBridge(
            _input(1, 5042, "Ethereum", "Arc", 10e6, alice, keccak256("a1"), keccak256("a2"), "Circle CCTP")
        );
        registry.recordCompletedBridge(
            _input(8453, 5042, "Base", "Arc", 20e6, alice, keccak256("b1"), keccak256("b2"), "LI.FI")
        );
        vm.stopPrank();

        vm.prank(bob);
        registry.recordCompletedBridge(
            _input(42161, 5042, "Arbitrum", "Arc", 30e6, bob, keccak256("c1"), keccak256("c2"), "LI.FI")
        );

        NestBridgeRegistry.BridgeRecord[] memory aliceRecords =
            registry.getUserBridges(alice, 100);
        assertEq(aliceRecords.length, 2);
        assertEq(aliceRecords[0].amount, 20e6);
        assertEq(aliceRecords[1].amount, 10e6);

        NestBridgeRegistry.BridgeRecord[] memory bobRecords =
            registry.getUserBridges(bob, 100);
        assertEq(bobRecords.length, 1);
        assertEq(bobRecords[0].amount, 30e6);
    }

    function testRejectsInvalidRecord() public {
        vm.prank(alice);
        vm.expectRevert("same chain");
        registry.recordCompletedBridge(
            _input(5042, 5042, "Arc", "Arc", 10e6, alice, keccak256("a"), keccak256("b"), "LI.FI")
        );
    }
}
