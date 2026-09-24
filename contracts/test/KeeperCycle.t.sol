// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {FolioTreasury} from "../src/FolioTreasury.sol";
import {FolioDistributor} from "../src/FolioDistributor.sol";
import {MockERC20} from "../src/MockERC20.sol";

/// @dev Pulls USDC and mints the output token. `rate` is output wei per 1e6 USDC.
contract MockPool {
    MockERC20 public immutable usdc;

    constructor(MockERC20 usdc_) {
        usdc = usdc_;
    }

    function swapExactIn(address tokenOut, uint256 amountIn, uint256 rate) external returns (uint256 out) {
        out = (amountIn * rate) / 1e6;
        require(usdc.transferFrom(msg.sender, address(this), amountIn), "usdc");
        MockERC20(tokenOut).mint(msg.sender, out);
    }
}

/// @notice The off-chain plan, run against the live call sequence.
contract KeeperCycleTest is Test {
    FolioTreasury internal treasury;
    FolioDistributor internal dist;
    MockPool internal pool;
    MockERC20 internal usdc;
    MockERC20 internal usyc;
    MockERC20 internal nvda;
    MockERC20 internal aapl;
    MockERC20 internal sfolo;

    address internal owner = address(this);
    address internal agent = address(0xA11CE);
    address internal alice = address(0xA11);
    address internal bob = address(0xB0B);

    function setUp() public {
        usdc = new MockERC20("USDC", "USDC", 6);
        usyc = new MockERC20("USYC", "USYC", 6);
        nvda = new MockERC20("NVDA", "NVDA", 18);
        aapl = new MockERC20("AAPL", "AAPL", 18);
        sfolo = new MockERC20("SFOLIO", "SFOLIO", 18);
        treasury = new FolioTreasury(address(usdc), owner, agent);
        dist = new FolioDistributor(address(treasury), owner, agent);
        pool = new MockPool(usdc);
        treasury.setKeeper(address(dist));
        treasury.setCashToken(address(usyc), true);
        treasury.setStockToken(address(nvda), true, 1200);
        treasury.setStockToken(address(aapl), true, 1000);
        dist.setSfolo(address(sfolo), 1);

        usdc.mint(agent, 200e6);
        sfolo.mint(alice, 25 ether);
        sfolo.mint(bob, 75 ether);
    }

    function _leaf(address who, uint256 share) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(who, share))));
    }

    function _root(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    function _deliver(MockERC20 token, uint256 amount) internal {
        bytes32 leafA = _leaf(alice, 25 ether);
        bytes32 leafB = _leaf(bob, 75 ether);
        dist.openRound(_root(leafA, leafB), address(token), 100 ether, amount);

        address[] memory holders = new address[](2);
        uint256[] memory shares = new uint256[](2);
        bytes32[][] memory proofs = new bytes32[][](2);
        holders[0] = alice;
        holders[1] = bob;
        shares[0] = 25 ether;
        shares[1] = 75 ether;
        proofs[0] = new bytes32[](1);
        proofs[1] = new bytes32[](1);
        proofs[0][0] = leafB;
        proofs[1][0] = leafA;
        dist.deliver(holders, shares, proofs);
    }

    function testBuyConfiguredWeightsThenPayHolders() public {
        uint256 nvdaIn = (200e6 * 12) / 100;
        uint256 aaplIn = (200e6 * 10) / 100;
        uint256 usycIn = (200e6 * 2) / 100;
        assertEq(nvdaIn, 24e6);
        assertEq(aaplIn, 20e6);
        assertEq(usycIn, 4e6);
        assertEq(200e6 - nvdaIn - aaplIn - usycIn, 152e6);

        vm.startPrank(agent);
        usdc.approve(address(pool), nvdaIn + aaplIn + usycIn);
        uint256 nvdaOut = pool.swapExactIn(address(nvda), nvdaIn, 1e18);
        uint256 aaplOut = pool.swapExactIn(address(aapl), aaplIn, 1e18);
        uint256 usycOut = pool.swapExactIn(address(usyc), usycIn, 1e6);
        nvda.transfer(address(treasury), nvdaOut);
        aapl.transfer(address(treasury), aaplOut);
        usyc.approve(address(dist), usycOut);
        dist.depositCash(address(usyc), usycOut);
        _deliver(nvda, nvdaOut);
        _deliver(aapl, aaplOut);
        vm.stopPrank();

        assertEq(usdc.balanceOf(agent), 152e6);
        assertEq(usyc.balanceOf(address(treasury)), 4e6);
        assertEq(nvda.balanceOf(alice), 6 ether);
        assertEq(nvda.balanceOf(bob), 18 ether);
        assertEq(aapl.balanceOf(alice), 5 ether);
        assertEq(aapl.balanceOf(bob), 15 ether);
        assertEq(nvda.balanceOf(address(treasury)), 0);
        assertEq(aapl.balanceOf(address(treasury)), 0);
    }

    /// Shares 25 and 75, not 25 ether. Locked to scripts/keeper/cycle.mjs.
    function testMerkleMatchesKeeperScript() public pure {
        address alice_ = address(0xA11);
        address bob_ = address(0xB0B);
        bytes32 leafA = keccak256(bytes.concat(keccak256(abi.encode(alice_, uint256(25)))));
        bytes32 leafB = keccak256(bytes.concat(keccak256(abi.encode(bob_, uint256(75)))));
        bytes32 root = leafA < leafB ? keccak256(abi.encodePacked(leafA, leafB)) : keccak256(abi.encodePacked(leafB, leafA));
        assertEq(leafA, 0xda18d2d56c3d505514e1c3375a3f2eeb9b04e2784e1f877af1a2b3673176d5d5);
        assertEq(leafB, 0x08a0edee92679a5c12b98d6c6b119589a3e8ede2bb20e77fe185f99a6ceb97bd);
        assertEq(root, 0x1b29bcea11972db5d33d4a1b874d46e9c587bd1fd6bc83d614f5071d08beade2);
    }

    function testAgentCannotParkCashDirectly() public {
        usyc.mint(agent, 1e6);
        vm.startPrank(agent);
        usyc.approve(address(treasury), 1e6);
        vm.expectRevert(FolioTreasury.NotKeeper.selector);
        treasury.depositCash(address(usyc), 1e6);
        vm.stopPrank();
    }
}
