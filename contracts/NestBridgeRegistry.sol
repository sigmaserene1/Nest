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

    uint256 public bridgeCount;

    mapping(uint256 => BridgeRecord) private bridges;
    mapping(address => uint256[]) private userBridgeIds;
    mapping(bytes32 => uint256) public bridgeIdBySourceKey;

    event BridgeRecorded(
        uint256 indexed bridgeId,
        address indexed owner,
        address indexed recipient,
        uint256 sourceChainId,
        uint256 destinationChainId,
        uint256 amount,
        bytes32 sourceTxHash,
        bytes32 destinationTxHash,
        string provider
    );

    function recordCompletedBridge(
        uint256 sourceChainId,
        uint256 destinationChainId,
        string calldata sourceName,
        string calldata destinationName,
        uint256 amount,
        address recipient,
        bytes32 sourceTxHash,
        bytes32 destinationTxHash,
        string calldata provider
    ) external returns (uint256 bridgeId) {
        require(sourceChainId != 0 && destinationChainId != 0, "chain required");
        require(sourceChainId != destinationChainId, "same chain");
        require(amount > 0, "amount required");
        require(recipient != address(0), "recipient required");
        require(sourceTxHash != bytes32(0), "source hash required");
        require(destinationTxHash != bytes32(0), "destination hash required");
        require(bytes(sourceName).length > 0 && bytes(sourceName).length <= 48, "bad source name");
        require(
            bytes(destinationName).length > 0 && bytes(destinationName).length <= 48,
            "bad destination name"
        );
        require(bytes(provider).length > 0 && bytes(provider).length <= 48, "bad provider");

        bytes32 sourceKey = keccak256(abi.encode(sourceChainId, sourceTxHash));
        require(bridgeIdBySourceKey[sourceKey] == 0, "bridge already recorded");

        bridgeId = ++bridgeCount;
        bridges[bridgeId] = BridgeRecord({
            id: bridgeId,
            owner: msg.sender,
            recipient: recipient,
            sourceChainId: sourceChainId,
            destinationChainId: destinationChainId,
            amount: amount,
            sourceTxHash: sourceTxHash,
            destinationTxHash: destinationTxHash,
            sourceName: sourceName,
            destinationName: destinationName,
            provider: provider,
            createdAt: uint64(block.timestamp)
        });

        userBridgeIds[msg.sender].push(bridgeId);
        bridgeIdBySourceKey[sourceKey] = bridgeId;

        emit BridgeRecorded(
            bridgeId,
            msg.sender,
            recipient,
            sourceChainId,
            destinationChainId,
            amount,
            sourceTxHash,
            destinationTxHash,
            provider
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
