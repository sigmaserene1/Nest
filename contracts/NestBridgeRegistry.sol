// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Nest Bridge Registry
/// @notice Canonical Nest-side record of completed cross-chain USDC bridges.
/// @dev The source/destination transactions remain the execution truth on their
///      respective chains. This registry links those hashes to a Nest wallet so
///      history survives browsers and can be reconstructed without a database.
contract NestBridgeRegistry {
    struct BridgeRecord {
        uint256 id;
        address owner;
        address recipient;
        uint256 sourceChainId;
        uint256 destinationChainId;
        uint256 amount; // canonical USDC base units (6 decimals)
        bytes32 sourceTxHash;
        bytes32 destinationTxHash;
        string sourceName;
        string destinationName;
        string provider;
        uint64 createdAt;
    }

    struct BridgeInput {
        uint256 sourceChainId;
        uint256 destinationChainId;
        string sourceName;
        string destinationName;
        uint256 amount;
        address recipient;
        bytes32 sourceTxHash;
        bytes32 destinationTxHash;
        string provider;
    }

    uint256 public bridgeCount;

    mapping(uint256 => BridgeRecord) private bridges;
    mapping(address => uint256[]) private userBridgeIds;
    mapping(bytes32 => uint256) public bridgeIdBySourceKey;

    event BridgeRecorded(
        uint256 indexed bridgeId,
        address indexed owner,
        bytes32 indexed sourceTxHash,
        bytes32 destinationTxHash
    );

    function recordCompletedBridge(
        BridgeInput calldata input
    ) external returns (uint256 bridgeId) {
        require(input.sourceChainId != 0 && input.destinationChainId != 0, "chain required");
        require(input.sourceChainId != input.destinationChainId, "same chain");
        require(input.amount > 0, "amount required");
        require(input.recipient != address(0), "recipient required");
        require(input.sourceTxHash != bytes32(0), "source hash required");
        require(input.destinationTxHash != bytes32(0), "destination hash required");
        require(bytes(input.sourceName).length > 0 && bytes(input.sourceName).length <= 48, "bad source name");
        require(
            bytes(input.destinationName).length > 0 && bytes(input.destinationName).length <= 48,
            "bad destination name"
        );
        require(bytes(input.provider).length > 0 && bytes(input.provider).length <= 48, "bad provider");

        bytes32 sourceKey = keccak256(abi.encode(input.sourceChainId, input.sourceTxHash));
        require(bridgeIdBySourceKey[sourceKey] == 0, "bridge already recorded");

        bridgeId = ++bridgeCount;
        bridges[bridgeId] = BridgeRecord({
            id: bridgeId,
            owner: msg.sender,
            recipient: input.recipient,
            sourceChainId: input.sourceChainId,
            destinationChainId: input.destinationChainId,
            amount: input.amount,
            sourceTxHash: input.sourceTxHash,
            destinationTxHash: input.destinationTxHash,
            sourceName: input.sourceName,
            destinationName: input.destinationName,
            provider: input.provider,
            createdAt: uint64(block.timestamp)
        });

        userBridgeIds[msg.sender].push(bridgeId);
        bridgeIdBySourceKey[sourceKey] = bridgeId;

        emit BridgeRecorded(
            bridgeId,
            msg.sender,
            input.sourceTxHash,
            input.destinationTxHash
        );
    }

    function getBridge(uint256 bridgeId) external view returns (BridgeRecord memory) {
        return bridges[bridgeId];
    }

    /// @notice Returns newest records first. Limit is capped to keep reads bounded.
    function getUserBridges(
        address user,
        uint256 limit
    ) external view returns (BridgeRecord[] memory out) {
        require(limit <= 200, "limit too high");
        uint256[] storage ids = userBridgeIds[user];
        uint256 n = ids.length < limit ? ids.length : limit;
        out = new BridgeRecord[](n);
        for (uint256 i; i < n; i++) {
            out[i] = bridges[ids[ids.length - 1 - i]];
        }
    }

    function getUserBridgeCount(address user) external view returns (uint256) {
        return userBridgeIds[user].length;
    }
}
