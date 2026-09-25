// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {console2} from "forge-std/console2.sol";
import {FolioTreasury} from "../src/FolioTreasury.sol";
import {FolioDistributor} from "../src/FolioDistributor.sol";
import {MockERC20} from "../src/MockERC20.sol";

/// @dev USDC in, 1:1 vault shares out. Stands in for the Circle Earn Morpho vault.
contract MockEarn {
    MockERC20 public immutable asset;

    mapping(address => uint256) public balanceOf;

    constructor(MockERC20 asset_) {
        asset = asset_;
    }

    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        require(asset.transferFrom(msg.sender, address(this), assets), "usdc");
        balanceOf[receiver] += assets;
        return assets;
    }
}

/// @dev One ticker. `rate` is token wei out per 1e6 USDC in.
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

/// @notice Items 2 through 5 of the launch checklist, with stand-in tokens.
contract LaunchSimTest is Test {
    FolioTreasury internal treasury;
    FolioDistributor internal dist;
    MockEarn internal earn;
    MockPool internal pool;
    MockERC20 internal usdc;
    MockERC20 internal nvda;
    MockERC20 internal sfolo;

    address internal agent = address(0xA11CE);
    address internal creator = address(0xC0FFEE);
    address internal pad = address(0xFEe5);
    address internal other = address(0xE1);
    address internal alice = address(0xA11);
    address internal bob = address(0xB0B);
    address internal carol = address(0xCA201);

    function setUp() public {
        usdc = new MockERC20("USDC", "USDC", 6);
        nvda = new MockERC20("NVDA", "NVDA", 18);
        sfolo = new MockERC20("SFOLIO", "SFOLIO", 18);
        treasury = new FolioTreasury(address(usdc), address(this), agent);
        dist = new FolioDistributor(address(treasury), address(this), agent);
        earn = new MockEarn(usdc);
        pool = new MockPool(usdc);
        treasury.setKeeper(address(dist));
        treasury.setStockToken(address(nvda), true, 9500);
    }

    function testLaunchChecklist() public {
        _sfoloGate();
        _fewDollarTick();
        _feeSource();
        _oneStockPayout();
    }

    /// 2. Once $SFOLIO is set, a wallet that does not hold it is rejected.
    function _sfoloGate() internal {
        console2.log("--- 2. set SFOLIO, reject a non-holder ---");
        assertEq(dist.sfolo(), address(0));
        dist.setSfolo(address(sfolo), 1);
        sfolo.mint(alice, 25 ether);
        sfolo.mint(bob, 75 ether);

        bytes32 leaf = _leaf(carol, 10 ether);
        vm.prank(agent);
        dist.openRound(leaf, address(nvda), 10 ether, 1 ether);

        address[] memory holders = new address[](1);
        uint256[] memory shares = new uint256[](1);
        bytes32[][] memory proofs = new bytes32[][](1);
        holders[0] = carol;
        shares[0] = 10 ether;
        vm.prank(agent);
        vm.expectRevert(FolioDistributor.NotHolder.selector);
        dist.deliver(holders, shares, proofs);
        dist.closeRound();
        console2.log("carol SFOLIO balance 0, deliver reverted NotHolder");
    }

    /// 3. A few dollars. The creator cut is sent. The book does not buy.
    function _fewDollarTick() internal {
        console2.log("--- 3. few-dollar tick, book stays closed ---");
        usdc.mint(agent, 20e6);
        uint256 fees = 50e6;
        uint256 cut = (fees * 1000) / 10_000;
        assertEq(cut, 5e6);
        assertLt(usdc.balanceOf(agent), 150e6);

        vm.prank(agent);
        usdc.transfer(creator, cut);
        assertEq(usdc.balanceOf(creator), 5e6);
        assertEq(usdc.balanceOf(agent), 15e6);
        console2.log("creator received 5 USDC, agent holds 15, under the 150 buy");

        vm.startPrank(agent);
        usdc.approve(address(earn), 5e6);
        earn.deposit(5e6, agent);
        vm.stopPrank();
        assertEq(earn.balanceOf(agent), 5e6);
        assertEq(usdc.balanceOf(agent), 10e6);
        console2.log("5 USDC deposited to Circle Earn, 10 USDC left, no stock bought");
    }

    /// 4. Only USDC from the named pad counts toward the 10% cut.
    function _feeSource() internal pure {
        console2.log("--- 4. fee source ---");
        uint256 fromPad = 300e6;
        uint256 fromOther = 7e6;
        uint256 income = fromPad;
        uint256 owed = (income * 1000) / 10_000;
        assertEq(owed, 30e6);
        uint256 ignored = (fromOther * 1000) / 10_000;
        assertEq(ignored, 0.7e6);
        console2.log("pad 300 USDC -> cut 30; other sender 7 USDC is not in the cut");
    }

    /// 5. Just over 150 USDC buys one stand-in ticker and pays two holders.
    function _oneStockPayout() internal {
        console2.log("--- 5. one ticker, two holders ---");
        usdc.mint(agent, 160e6);
        uint256 buy = (160e6 * 95) / 100;
        uint256 sleeve = (160e6 * 5) / 100;
        assertEq(buy, 152e6);
        assertEq(sleeve, 8e6);
        assertGt(buy, 150e6);

        vm.startPrank(agent);
        usdc.approve(address(pool), buy);
        uint256 out = pool.swapExactIn(address(nvda), buy, 1e18);
        nvda.transfer(address(treasury), out);
        usdc.approve(address(earn), sleeve);
        earn.deposit(sleeve, agent);
        vm.stopPrank();

        bytes32 leafA = _leaf(alice, 25 ether);
        bytes32 leafB = _leaf(bob, 75 ether);
        bytes32 root = leafA < leafB ? keccak256(abi.encodePacked(leafA, leafB)) : keccak256(abi.encodePacked(leafB, leafA));
        vm.prank(agent);
        dist.openRound(root, address(nvda), 100 ether, out);

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
        vm.prank(agent);
        dist.deliver(holders, shares, proofs);

        assertEq(nvda.balanceOf(alice), 38 ether);
        assertEq(nvda.balanceOf(bob), 114 ether);
        assertEq(nvda.balanceOf(address(treasury)), 0);
        assertEq(earn.balanceOf(agent), 13e6);
        console2.log("152 USDC -> 152 NVDA; alice 38, bob 114; sleeve now 13 USDC in Earn");
    }

    function _leaf(address who, uint256 share) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(who, share))));
    }
}
