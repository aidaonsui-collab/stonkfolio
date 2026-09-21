// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {FolioTreasury} from "../src/FolioTreasury.sol";
import {FolioDistributor} from "../src/FolioDistributor.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract FolioDistributorTest is Test {
    FolioTreasury internal treasury;
    FolioDistributor internal dist;
    MockERC20 internal usdc;
    MockERC20 internal nvda;
    MockERC20 internal sfolo;

    address internal owner = address(this);
    address internal agent = address(0xA11CE);
    address internal alice = address(0xA11);
    address internal bob = address(0xB0B);

    function setUp() public {
        usdc = new MockERC20("USDC", "USDC", 6);
        nvda = new MockERC20("NVDA", "NVDA", 18);
        sfolo = new MockERC20("SFOLIO", "SFOLIO", 18);
        treasury = new FolioTreasury(address(usdc), owner, agent);
        dist = new FolioDistributor(address(treasury), owner, agent);
        treasury.setKeeper(address(dist));
        treasury.setStockToken(address(nvda), true, 1200);
        dist.setSfolo(address(sfolo), 1);

        usdc.mint(agent, 100e6);
        nvda.mint(address(treasury), 100 ether);
        sfolo.mint(alice, 25 ether);
        sfolo.mint(bob, 75 ether);
    }

    function _leaf(address who, uint256 share) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(who, share))));
    }

    function _root(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    function testDepositFeesAndDeliverProRata() public {
        vm.startPrank(agent);
        usdc.approve(address(dist), 70e6);
        dist.depositFees(70e6);
        vm.stopPrank();
        assertEq(usdc.balanceOf(address(treasury)), 70e6);

        bytes32 leafA = _leaf(alice, 25);
        bytes32 leafB = _leaf(bob, 75);
        bytes32 root = _root(leafA, leafB);
        vm.prank(agent);
        dist.openRound(root, address(nvda), 100, 100 ether);

        address[] memory holders = new address[](2);
        uint256[] memory shares = new uint256[](2);
        bytes32[][] memory proofs = new bytes32[][](2);
        holders[0] = alice;
        holders[1] = bob;
        shares[0] = 25;
        shares[1] = 75;
        proofs[0] = new bytes32[](1);
        proofs[1] = new bytes32[](1);
        proofs[0][0] = leafB;
        proofs[1][0] = leafA;

        vm.prank(agent);
        dist.deliver(holders, shares, proofs);
        assertEq(nvda.balanceOf(alice), 25 ether);
        assertEq(nvda.balanceOf(bob), 75 ether);
    }

    function testRejectsBadProof() public {
        bytes32 leafA = _leaf(alice, 25);
        bytes32 leafB = _leaf(bob, 75);
        vm.prank(agent);
        dist.openRound(_root(leafA, leafB), address(nvda), 100, 100 ether);

        address[] memory holders = new address[](1);
        uint256[] memory shares = new uint256[](1);
        bytes32[][] memory proofs = new bytes32[][](1);
        holders[0] = alice;
        shares[0] = 25;
        proofs[0] = new bytes32[](1);
        proofs[0][0] = bytes32(uint256(1));
        vm.prank(agent);
        vm.expectRevert(FolioDistributor.BadProof.selector);
        dist.deliver(holders, shares, proofs);
    }

    function testRejectsNonHolderWhenTokenSet() public {
        address carol = address(0xC);
        bytes32 leaf = _leaf(carol, 10);
        vm.prank(agent);
        dist.openRound(leaf, address(nvda), 10, 10 ether);
        address[] memory holders = new address[](1);
        uint256[] memory shares = new uint256[](1);
        bytes32[][] memory proofs = new bytes32[][](1);
        holders[0] = carol;
        shares[0] = 10;
        proofs[0] = new bytes32[](0);
        vm.prank(agent);
        vm.expectRevert(FolioDistributor.NotHolder.selector);
        dist.deliver(holders, shares, proofs);
    }
}
