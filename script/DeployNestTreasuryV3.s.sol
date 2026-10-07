// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/NestTreasuryV3.sol";

contract DeployNestTreasuryV3 is Script {
    // Arc uses the same USDC ERC-20 interface address on testnet/mainnet.
    address internal constant ARC_USDC = 0x3600000000000000000000000000000000000000;

    function run() external returns (NestTreasuryV3 treasury) {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address usdc = vm.envOr("NEST_TREASURY_USDC", ARC_USDC);

        vm.startBroadcast(privateKey);
        treasury = new NestTreasuryV3(usdc);
        vm.stopBroadcast();

        console2.log("NestTreasuryV3:", address(treasury));
        console2.log("USDC:", usdc);
    }
}
