// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {FolioTreasury} from "../src/FolioTreasury.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract FolioTreasuryTest is Test {
    FolioTreasury internal treasury;
    MockERC20 internal usdc;
    MockERC20 internal usyc;
    MockERC20 internal nvda;

    address internal owner = address(this);
    address internal keeper = address(0xA11CE);
    address internal stranger = address(0xB0B);
    address internal holderA = address(0x1);
    address internal holderB = address(0x2);

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", 6);
        usyc = new MockERC20("USYC", "USYC", 6);
        nvda = new MockERC20("NVDA wrap", "NVDA", 18);
        treasury = new FolioTreasury(address(usdc), owner, keeper);
        treasury.setCashToken(address(usyc), true);
        treasury.setStockToken(address(nvda), true, 1200);

        usdc.mint(keeper, 1_000e6);
        usyc.mint(keeper, 500e6);
        nvda.mint(keeper, 10 ether);
    }

    function testConstructorSetsKeeper() public view {
        assertEq(treasury.keeper(), keeper);
        assertEq(address(treasury.usdc()), address(usdc));
        assertEq(treasury.owner(), owner);
    }

    function testReceiveFeesFromKeeper() public {
        vm.startPrank(keeper);
        usdc.approve(address(treasury), 70e6);
        treasury.receiveFees(70e6);
        vm.stopPrank();
        assertEq(usdc.balanceOf(address(treasury)), 70e6);
    }

    function testStrangerCannotReceiveFees() public {
        usdc.mint(stranger, 10e6);
        vm.startPrank(stranger);
        usdc.approve(address(treasury), 10e6);
        vm.expectRevert(FolioTreasury.NotKeeper.selector);
        treasury.receiveFees(10e6);
        vm.stopPrank();
    }

    function testParkCashUsyc() public {
        vm.startPrank(keeper);
        usyc.approve(address(treasury), 40e6);
        treasury.depositCash(address(usyc), 40e6);
        vm.stopPrank();
        assertEq(usyc.balanceOf(address(treasury)), 40e6);
    }

    function testRejectUnknownCash() public {
        MockERC20 junk = new MockERC20("junk", "JNK", 6);
        junk.mint(keeper, 1e6);
        vm.startPrank(keeper);
        junk.approve(address(treasury), 1e6);
        vm.expectRevert(FolioTreasury.BadToken.selector);
        treasury.depositCash(address(junk), 1e6);
        vm.stopPrank();
    }

    function testWithdrawUsycToBuy() public {
        vm.startPrank(keeper);
        usyc.approve(address(treasury), 40e6);
        treasury.depositCash(address(usyc), 40e6);
        treasury.withdraw(address(usyc), keeper, 15e6);
        vm.stopPrank();
        assertEq(usyc.balanceOf(address(treasury)), 25e6);
        assertEq(usyc.balanceOf(keeper), 500e6 - 40e6 + 15e6);
    }

    function testDistributeStocksToHolders() public {
        vm.startPrank(keeper);
        nvda.approve(address(treasury), 1 ether);
        nvda.transfer(address(treasury), 1 ether);
        address[] memory holders = new address[](2);
        uint256[] memory amounts = new uint256[](2);
        holders[0] = holderA;
        holders[1] = holderB;
        amounts[0] = 0.4 ether;
        amounts[1] = 0.6 ether;
        treasury.distribute(address(nvda), holders, amounts);
        vm.stopPrank();
        assertEq(nvda.balanceOf(holderA), 0.4 ether);
        assertEq(nvda.balanceOf(holderB), 0.6 ether);
        assertEq(nvda.balanceOf(address(treasury)), 0);
    }

    function testDistributeLengthMismatch() public {
        vm.startPrank(keeper);
        nvda.transfer(address(treasury), 1 ether);
        address[] memory holders = new address[](1);
        uint256[] memory amounts = new uint256[](2);
        holders[0] = holderA;
        amounts[0] = 1;
        amounts[1] = 1;
        vm.expectRevert(FolioTreasury.LengthMismatch.selector);
        treasury.distribute(address(nvda), holders, amounts);
        vm.stopPrank();
    }

    function testCannotDistributeUnlisted() public {
        MockERC20 aapl = new MockERC20("AAPL", "AAPL", 18);
        aapl.mint(address(treasury), 1 ether);
        vm.prank(keeper);
        address[] memory holders = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        holders[0] = holderA;
        amounts[0] = 1 ether;
        vm.expectRevert(FolioTreasury.BadToken.selector);
        treasury.distribute(address(aapl), holders, amounts);
    }

    function testOwnerCanRetargetKeeper() public {
        treasury.setKeeper(stranger);
        assertEq(treasury.keeper(), stranger);
        vm.prank(keeper);
        vm.expectRevert(FolioTreasury.NotKeeper.selector);
        treasury.receiveFees(1);
    }
}
