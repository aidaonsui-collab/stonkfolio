// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {FolioTreasury} from "../src/FolioTreasury.sol";

contract DeployFolioTreasury is Script {
    address constant ARC_USDC = 0x3600000000000000000000000000000000000000;
    address constant ARC_USYC = 0x8a5D989Bbb96929F689B0200f435f53dA42bF490;
    /// Eve Circle Agent Wallet (same SCA as EVE_PAYTO). Already on Arc.
    address constant EVE_AGENT = 0x80aa1fA83F7B771BF2AB815DA9bA1236b1B91E3F;

    function run() external {
        address keeper = vm.envOr("KEEPER_AGENT_WALLET", EVE_AGENT);
        // Owner is the broadcasting EOA so this script can allowlist USYC.
        // Keeper stays Eve's Circle agent wallet.
        vm.startBroadcast();
        FolioTreasury t = new FolioTreasury(ARC_USDC, msg.sender, keeper);
        t.setCashToken(ARC_USYC, true);
        vm.stopBroadcast();
    }
}
