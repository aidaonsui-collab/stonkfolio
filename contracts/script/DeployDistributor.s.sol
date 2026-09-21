// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {FolioTreasury} from "../src/FolioTreasury.sol";
import {FolioDistributor} from "../src/FolioDistributor.sol";

contract DeployDistributor is Script {
    address constant TREASURY = 0xd47B04A41b3734EAb2687ef01d07881D05F9215e;
    address constant AGENT = 0x80aa1fA83F7B771BF2AB815DA9bA1236b1B91E3F;

    function run() external {
        address treasuryAddr = vm.envOr("FOLIO_TREASURY", TREASURY);
        address agent = vm.envOr("KEEPER_AGENT_WALLET", AGENT);
        vm.startBroadcast();
        FolioDistributor dist = new FolioDistributor(treasuryAddr, msg.sender, agent);
        FolioTreasury(treasuryAddr).setKeeper(address(dist));
        vm.stopBroadcast();
    }
}
