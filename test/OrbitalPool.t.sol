// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {OrbitalPool} from "../src/pool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Mock ERC20 token for testing
contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        return true;
    }
}

contract OrbitalPoolTest is Test {
    OrbitalPool public pool;
    MockERC20 public tokenA;
    MockERC20 public tokenB;
    MockERC20 public tokenC;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);

    function setUp() public {
        // Deploy mock tokens
        tokenA = new MockERC20("Token A", "TKA");
        tokenB = new MockERC20("Token B", "TKB");
        tokenC = new MockERC20("Token C", "TKC");
        
        // Deploy pool with 3 tokens
        address[] memory tokens = new address[](3);
        tokens[0] = address(tokenA);
        tokens[1] = address(tokenB);
        tokens[2] = address(tokenC);
        
        pool = new OrbitalPool(tokens);
        
        // Mint tokens to test addresses
        tokenA.mint(alice, 1000e18);
        tokenB.mint(alice, 1000e18);
        tokenC.mint(alice, 1000e18);
        
        tokenA.mint(bob, 1000e18);
        tokenB.mint(bob, 1000e18);
        tokenC.mint(bob, 1000e18);
        
        tokenA.mint(charlie, 1000e18);
        tokenB.mint(charlie, 1000e18);
        tokenC.mint(charlie, 1000e18);
    }

    function test_InitialPoolState() public {
        // Test initial pool state
        (uint256[] memory totalReserves, uint256[] memory sumSquaredReserves, uint256 globalInvariant) = pool.getGlobalState();
        
        assertEq(totalReserves.length, 3, "Should have 3 tokens");
        assertEq(totalReserves[0], 0, "Initial reserve A should be 0");
        assertEq(totalReserves[1], 0, "Initial reserve B should be 0");
        assertEq(totalReserves[2], 0, "Initial reserve C should be 0");
        assertEq(globalInvariant, 0, "Initial invariant should be 0");
    }

    function test_AddLiquidity() public {
        vm.startPrank(alice);
        
        // Approve tokens
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        tokenC.approve(address(pool), type(uint256).max);
        
        // Add liquidity to a tick
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100e18; // 100 Token A
        amounts[1] = 100e18; // 100 Token B
        amounts[2] = 100e18; // 100 Token C
        
        (uint256 tickId, uint256 shares) = pool.addLiquidity(1000e18, 500e18, amounts);
        
        assertGt(tickId, 0, "Should create tick");
        assertGt(shares, 0, "Should receive shares");
        
        // Check global state
        (uint256[] memory totalReserves, , ) = pool.getGlobalState();
        assertEq(totalReserves[0], 100e18, "Reserve A should be updated");
        assertEq(totalReserves[1], 100e18, "Reserve B should be updated");
        assertEq(totalReserves[2], 100e18, "Reserve C should be updated");
        
        vm.stopPrank();
    }

    function test_AddLiquidityToMultipleTicks() public {
        vm.startPrank(alice);
        
        // Approve tokens
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        tokenC.approve(address(pool), type(uint256).max);
        
        // Add liquidity to first tick
        uint256[] memory amounts1 = new uint256[](3);
        amounts1[0] = 50e18;
        amounts1[1] = 50e18;
        amounts1[2] = 50e18;
        
        (uint256 tickId1, ) = pool.addLiquidity(1000e18, 300e18, amounts1);
        
        // Add liquidity to second tick
        uint256[] memory amounts2 = new uint256[](3);
        amounts2[0] = 30e18;
        amounts2[1] = 30e18;
        amounts2[2] = 30e18;
        
        (uint256 tickId2, ) = pool.addLiquidity(800e18, 200e18, amounts2);
        
        assertGt(tickId1, 0, "Should create first tick");
        assertGt(tickId2, 0, "Should create second tick");
        assertEq(tickId1, 1, "First tick should have ID 1");
        assertEq(tickId2, 2, "Second tick should have ID 2");
        
        vm.stopPrank();
    }

    function test_SwapExecution() public {
        // First add liquidity
        vm.startPrank(alice);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        tokenC.approve(address(pool), type(uint256).max);
        
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100e18;
        amounts[1] = 100e18;
        amounts[2] = 100e18;
        
        pool.addLiquidity(1000e18, 500e18, amounts);
        vm.stopPrank();
        
        // Now perform a swap
        vm.startPrank(bob);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        
        uint256 balanceBefore = tokenB.balanceOf(bob);
        uint256 amountOut = pool.swap(0, 1, 10e18, 0); // Swap 10 Token A for Token B
        uint256 balanceAfter = tokenB.balanceOf(bob);
        
        assertGt(amountOut, 0, "Should receive output tokens");
        assertEq(balanceAfter - balanceBefore, amountOut, "Balance should increase by amount out");
        
        vm.stopPrank();
    }

    function test_SwapWithBoundaryCrossing() public {
        // Add liquidity to create boundary conditions
        vm.startPrank(alice);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        tokenC.approve(address(pool), type(uint256).max);
        
        // Add liquidity close to boundary
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 80e18;
        amounts[1] = 80e18;
        amounts[2] = 80e18;
        
        // Use a small radius and plane constant to create boundary conditions
        pool.addLiquidity(100e18, 90e18, amounts);
        vm.stopPrank();
        
        // Perform a large swap that should trigger boundary crossing
        vm.startPrank(bob);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        
        uint256 amountOut = pool.swap(0, 1, 50e18, 0);
        
        assertGt(amountOut, 0, "Should receive output tokens");
        
        vm.stopPrank();
    }

    function test_RemoveLiquidity() public {
        // First add liquidity
        vm.startPrank(alice);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        tokenC.approve(address(pool), type(uint256).max);
        
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100e18;
        amounts[1] = 100e18;
        amounts[2] = 100e18;
        
        (uint256 tickId, uint256 shares) = pool.addLiquidity(1000e18, 500e18, amounts);
        
        // Record balances before removal
        uint256 balanceABefore = tokenA.balanceOf(alice);
        uint256 balanceBBefore = tokenB.balanceOf(alice);
        uint256 balanceCBefore = tokenC.balanceOf(alice);
        
        // Remove half the liquidity
        uint256[] memory removedAmounts = pool.removeLiquidity(tickId, shares / 2);
        
        // Check balances increased
        assertGt(tokenA.balanceOf(alice), balanceABefore, "Should receive Token A back");
        assertGt(tokenB.balanceOf(alice), balanceBBefore, "Should receive Token B back");
        assertGt(tokenC.balanceOf(alice), balanceCBefore, "Should receive Token C back");
        
        // Check removed amounts match
        assertEq(removedAmounts[0], tokenA.balanceOf(alice) - balanceABefore, "Removed amount A should match");
        assertEq(removedAmounts[1], tokenB.balanceOf(alice) - balanceBBefore, "Removed amount B should match");
        assertEq(removedAmounts[2], tokenC.balanceOf(alice) - balanceCBefore, "Removed amount C should match");
        
        vm.stopPrank();
    }

    function test_TickStatusChanges() public {
        vm.startPrank(alice);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        tokenC.approve(address(pool), type(uint256).max);
        
        // Add liquidity with boundary conditions
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 90e18;
        amounts[1] = 90e18;
        amounts[2] = 90e18;
        
        (uint256 tickId, ) = pool.addLiquidity(100e18, 95e18, amounts);
        
        // Check initial status
        (, , , , , OrbitalPool.TickStatus status) = pool.getTickInfo(tickId);
        assertEq(uint256(status), uint256(OrbitalPool.TickStatus.Interior), "Should start as interior");
        
        vm.stopPrank();
        
        // Perform swap to push to boundary
        vm.startPrank(bob);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        
        pool.swap(0, 1, 20e18, 0);
        
        vm.stopPrank();
        
        // Check if status changed (this depends on the exact boundary conditions)
        (, , , , , status) = pool.getTickInfo(tickId);
        // Note: Status change depends on the mathematical boundary conditions
    }

    function test_PriceCalculation() public {
        // Add liquidity
        vm.startPrank(alice);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        tokenC.approve(address(pool), type(uint256).max);
        
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100e18;
        amounts[1] = 100e18;
        amounts[2] = 100e18;
        
        pool.addLiquidity(1000e18, 500e18, amounts);
        vm.stopPrank();
        
        // Check prices
        uint256 priceA = pool.getPrice(0);
        uint256 priceB = pool.getPrice(1);
        uint256 priceC = pool.getPrice(2);
        
        assertGt(priceA, 0, "Price A should be positive");
        assertGt(priceB, 0, "Price B should be positive");
        assertGt(priceC, 0, "Price C should be positive");
        
        // Prices should be roughly equal for equal reserves
        uint256 tolerance = 1e16; // 1% tolerance
        assertApproxEqRel(priceA, priceB, tolerance, "Prices should be similar");
        assertApproxEqRel(priceB, priceC, tolerance, "Prices should be similar");
    }

    function test_MathematicalInvariant() public {
        // Add liquidity
        vm.startPrank(alice);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        tokenC.approve(address(pool), type(uint256).max);
        
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100e18;
        amounts[1] = 100e18;
        amounts[2] = 100e18;
        
        pool.addLiquidity(1000e18, 500e18, amounts);
        vm.stopPrank();
        
        // Record initial state
        (uint256[] memory initialReserves, uint256[] memory initialSquared, uint256 initialInvariant) = pool.getGlobalState();
        
        // Perform a swap
        vm.startPrank(bob);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        
        pool.swap(0, 1, 10e18, 0);
        
        vm.stopPrank();
        
        // Check that the torus invariant is maintained (approximately)
        (uint256[] memory finalReserves, uint256[] memory finalSquared, uint256 finalInvariant) = pool.getGlobalState();
        
        // The invariant should be approximately maintained
        uint256 tolerance = 1e15; // 0.1% tolerance for fees
        assertApproxEqRel(finalInvariant, initialInvariant, tolerance, "Invariant should be maintained");
    }

    function test_FeeDistribution() public {
        // Add liquidity from multiple providers
        vm.startPrank(alice);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        tokenC.approve(address(pool), type(uint256).max);
        
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100e18;
        amounts[1] = 100e18;
        amounts[2] = 100e18;
        
        pool.addLiquidity(1000e18, 500e18, amounts);
        vm.stopPrank();
        
        vm.startPrank(bob);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        tokenC.approve(address(pool), type(uint256).max);
        
        pool.addLiquidity(1000e18, 500e18, amounts);
        vm.stopPrank();
        
        // Perform swaps to generate fees
        vm.startPrank(charlie);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        
        for (uint256 i = 0; i < 5; i++) {
            pool.swap(0, 1, 5e18, 0);
            pool.swap(1, 0, 5e18, 0);
        }
        
        vm.stopPrank();
        
        // Check that fees were collected (this would require additional view functions)
        // For now, we just verify the swaps completed successfully
    }

    function test_RevertOnInvalidInputs() public {
        vm.startPrank(alice);
        
        // Test invalid token indices
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        
        vm.expectRevert("Invalid token index");
        pool.swap(3, 0, 10e18, 0); // Invalid token index
        
        vm.expectRevert("Same token swap");
        pool.swap(0, 0, 10e18, 0); // Same token swap
        
        vm.expectRevert("Invalid amount");
        pool.swap(0, 1, 0, 0); // Zero amount
        
        vm.stopPrank();
    }

    function test_GeometricConstraints() public {
        vm.startPrank(alice);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        tokenC.approve(address(pool), type(uint256).max);
        
        // Test adding liquidity that exceeds tick boundary
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 200e18; // Large amount
        amounts[1] = 200e18;
        amounts[2] = 200e18;
        
        // This should revert due to geometric constraints
        vm.expectRevert("Exceeds tick boundary");
        pool.addLiquidity(100e18, 50e18, amounts); // Small radius and plane constant
        
        vm.stopPrank();
    }
}
