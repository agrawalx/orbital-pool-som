// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/orbital.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// Mock ERC20 token with 18 decimals
contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 1e18); // 1M tokens
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract OrbitalPoolTestSuite is Test {
    orbitalPool public pool;
    MockToken[5] public tokens;
    IERC20[5] public poolTokens;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    
    // Test constants
    uint256 public constant PRECISION = 1e15;
    uint256 public constant SQRT5_SCALED = 2236067977499790; // sqrt(5) * 1e15
    uint256 public constant TOKENS_COUNT = 5;
    
    // Test amounts (all 18 decimals)
    uint256[5] private testAmounts = [
        1000 * 1e18,  // Token0: 1000
        1000 * 1e18,  // Token1: 1000
        1000 * 1e18,  // Token2: 1000
        1000 * 1e18,  // Token3: 1000
        1000 * 1e18   // Token4: 1000
    ];

    function setUp() public {
        // Deploy mock tokens (all 18 decimals)
        for (uint i = 0; i < 5; i++) {
            tokens[i] = new MockToken(
                string(abi.encodePacked("Token", Strings.toString(i))),
                string(abi.encodePacked("TK", Strings.toString(i)))
            );
            poolTokens[i] = IERC20(address(tokens[i]));
        }
        
        // Deploy orbital pool
        pool = new orbitalPool(poolTokens);
        
        // Setup test accounts with tokens
        _setupTestAccounts();
    }
    
    function _setupTestAccounts() internal {
        address[3] memory accounts = [alice, bob, charlie];
        
        for (uint i = 0; i < accounts.length; i++) {
            for (uint j = 0; j < 5; j++) {
                tokens[j].mint(accounts[i], 100000 * 1e18);
            }
        }
    }
    
    function _approveTokens(address user, uint256[5] memory amounts) internal {
        vm.startPrank(user);
        for (uint i = 0; i < 5; i++) {
            tokens[i].approve(address(pool), amounts[i]);
        }
        vm.stopPrank();
    }
    
    function _calculateRadius(uint256[5] memory amounts) internal pure returns (uint256) {
        uint256 sum = 0;
        for (uint i = 0; i < 5; i++) {
            sum += amounts[i] * amounts[i];
        }
        return _sqrt(sum);
    }
    
    function _calculateValidK(uint256[5] memory amounts) internal pure returns (uint256) {
        // Calculate radius
        uint256 radiusSquared = 0;
        for (uint i = 0; i < 5; i++) {
            radiusSquared += amounts[i] * amounts[i];
        }
        uint256 radius = _sqrt(radiusSquared);
        
        // Calculate valid k bounds
        uint256 sqrt5MinusOne = SQRT5_SCALED - PRECISION;
        uint256 lowerBound = (sqrt5MinusOne * radius) / PRECISION;
        uint256 reserveConstraint = (radius * PRECISION) / SQRT5_SCALED;
        
        // Return the minimum valid k (with small buffer)
        return (lowerBound > reserveConstraint ? lowerBound : reserveConstraint) + 1e18;
    }
    
    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    // ========== CORE FUNCTIONALITY TESTS ==========

    function test_Constructor() public view {
        // Verify tokens are set correctly
        for (uint i = 0; i < 5; i++) {
            assertEq(address(pool.tokens(i)), address(tokens[i]));
        }
        
        // Verify constants
        assertEq(pool.TOKENS_COUNT(), 5);
        assertEq(pool.swapFee(), 3000); // 0.3%
        assertEq(pool.FEE_DENOMINATOR(), 1000000);
    }

    function test_AddLiquidity_BasicFunctionality() public {
        uint256 k = _calculateValidK(testAmounts);
        _approveTokens(alice, testAmounts);
        
        // Calculate expected values
        uint256 expectedRadius = _calculateRadius(testAmounts);
        uint256 expectedLpShares = expectedRadius; // For new tick
        
        // Add liquidity
        vm.prank(alice);
        pool.addLiquidity(k, testAmounts);
        
        // Verify tick was created correctly
        (uint256 r, uint256 liquidity, uint256[5] memory reserves, uint256 totalLpShares, orbitalPool.TickStatus status) = 
            pool.getTickInfo(k);
            
        assertEq(r, expectedRadius);
        assertEq(liquidity, expectedRadius);
        assertEq(totalLpShares, expectedLpShares);
        
        // Verify reserves
        for (uint i = 0; i < 5; i++) {
            assertEq(reserves[i], testAmounts[i]);
        }
        
        // Verify user LP shares
        assertEq(pool.getUserLpShares(k, alice), expectedLpShares);
        
        // Verify active ticks
        uint256[] memory activeTicks = pool.getActiveTicks();
        assertEq(activeTicks.length, 1);
        assertEq(activeTicks[0], k);
    }
    
    function test_AddLiquidity_MultipleProviders() public {
        // Alice adds liquidity to first tick
        uint256 k1 = _calculateValidK(testAmounts);
        _approveTokens(alice, testAmounts);
        vm.prank(alice);
        pool.addLiquidity(k1, testAmounts);
        
        // Bob adds liquidity to a different tick with different amounts
        uint256[5] memory bobAmounts = [
            uint256(500 * 1e18), uint256(500 * 1e18), uint256(500 * 1e18), 
            uint256(500 * 1e18), uint256(500 * 1e18)
        ];
        uint256 k2 = _calculateValidK(bobAmounts);
        _approveTokens(bob, bobAmounts);
        vm.prank(bob);
        pool.addLiquidity(k2, bobAmounts);
        
        // Verify both users have LP shares in their respective ticks
        assertGt(pool.getUserLpShares(k1, alice), 0);
        assertGt(pool.getUserLpShares(k2, bob), 0);
        
        // Verify we have two active ticks now
        uint256[] memory activeTicks = pool.getActiveTicks();
        assertEq(activeTicks.length, 2);
    }

    function test_AddLiquidity_InvalidK() public {
        _approveTokens(alice, testAmounts);
        
        vm.startPrank(alice);
        
        // Test k = 0
        vm.expectRevert(orbitalPool.InvalidKValue.selector);
        pool.addLiquidity(0, testAmounts);
        
        // Test k too large for radius
        uint256 radius = _calculateRadius(testAmounts);
        uint256 invalidK = (4 * radius * PRECISION) / SQRT5_SCALED + 1e18; // Above upper bound
        
        vm.expectRevert(orbitalPool.InvalidKValue.selector);
        pool.addLiquidity(invalidK, testAmounts);
        
        vm.stopPrank();
    }
    
    function test_AddLiquidity_InvalidAmounts() public {
        uint256[5] memory zeroAmounts = [uint256(0), 0, 0, 0, 0];
        _approveTokens(alice, zeroAmounts);
        
        vm.prank(alice);
        vm.expectRevert(orbitalPool.InvalidAmounts.selector);
        pool.addLiquidity(_calculateValidK(testAmounts), zeroAmounts);
    }

    function test_Getters() public {
        uint256 k = _calculateValidK(testAmounts);
        _approveTokens(alice, testAmounts);
        vm.prank(alice);
        pool.addLiquidity(k, testAmounts);
        
        // Test getTickInfo
        (uint256 r, uint256 liquidity, uint256[5] memory reserves, uint256 totalLpShares, orbitalPool.TickStatus status) = 
            pool.getTickInfo(k);
        
        uint256 expectedRadius = _calculateRadius(testAmounts);
        assertEq(r, expectedRadius);
        assertEq(liquidity, expectedRadius);
        assertEq(totalLpShares, expectedRadius);
        
        // Test getUserLpShares
        assertEq(pool.getUserLpShares(k, alice), expectedRadius);
        assertEq(pool.getUserLpShares(k, bob), 0); // Bob didn't provide liquidity
        
        // Test getActiveTicks
        uint256[] memory activeTicks = pool.getActiveTicks();
        assertEq(activeTicks.length, 1);
        assertEq(activeTicks[0], k);
    }

    function test_Swap_InvalidInputs() public {
        vm.startPrank(alice);
        
        // Same token
        vm.expectRevert(orbitalPool.InvalidAmounts.selector);
        pool.swap(0, 0, 100 * 1e18, 90 * 1e18);
        
        // Invalid token index
        vm.expectRevert(orbitalPool.InvalidTokenIndex.selector);
        pool.swap(5, 1, 100 * 1e18, 90 * 1e18);
        
        vm.expectRevert(orbitalPool.InvalidTokenIndex.selector);
        pool.swap(0, 5, 100 * 1e18, 90 * 1e18);
        
        // Zero amount
        vm.expectRevert(orbitalPool.InvalidAmounts.selector);
        pool.swap(0, 1, 0, 90 * 1e18);
        
        vm.stopPrank();
    }

    function test_Events() public {
        uint256 k = _calculateValidK(testAmounts);
        _approveTokens(alice, testAmounts);
        
        // Test LiquidityAdded event
        uint256 expectedLpShares = _calculateRadius(testAmounts);
        
        vm.expectEmit(true, true, false, true);
        emit orbitalPool.LiquidityAdded(alice, k, testAmounts, expectedLpShares);
        
        vm.prank(alice);
        pool.addLiquidity(k, testAmounts);
    }

    function test_MathematicalProperties() public {
        // Test with known Pythagorean triple: 3-4-5-0-0 should give radius close to sqrt(50)
        uint256[5] memory knownAmounts = [
            uint256(3 * 1e18), uint256(4 * 1e18), uint256(5 * 1e18), uint256(1 * 1e18), uint256(1 * 1e18)
        ];
        // Expected radius² = 3² + 4² + 5² + 1² + 1² = 9 + 16 + 25 + 1 + 1 = 52
        // So radius = sqrt(52) ≈ 7.21
        
        uint256 k = _calculateValidK(knownAmounts);
        _approveTokens(alice, knownAmounts);
        vm.prank(alice);
        pool.addLiquidity(k, knownAmounts);
        
        (uint256 r, , , , ) = pool.getTickInfo(k);
        assertGt(r, 7 * 1e18); // Should be greater than 7
        assertLt(r, 8 * 1e18); // Should be less than 8
    }

    function test_GasUsage() public {
        uint256 k = _calculateValidK(testAmounts);
        _approveTokens(alice, testAmounts);
        
        vm.prank(alice);
        uint256 gasBefore = gasleft();
        pool.addLiquidity(k, testAmounts);
        uint256 gasUsed = gasBefore - gasleft();
        
        // Ensure gas usage is reasonable
        assertLt(gasUsed, 1000000); // Less than 1M gas
        console.log("Gas used for addLiquidity:", gasUsed);
    }

    function test_MultipleTicks() public {
        // Create multiple ticks with different k values
        uint256 k1 = _calculateValidK(testAmounts);
        _approveTokens(alice, testAmounts);
        vm.prank(alice);
        pool.addLiquidity(k1, testAmounts);
        
        // Second tick with different amounts
        uint256[5] memory amounts2 = [
            uint256(500 * 1e18), uint256(600 * 1e18), uint256(700 * 1e18),
            uint256(800 * 1e18), uint256(900 * 1e18)
        ];
        uint256 k2 = _calculateValidK(amounts2);
        _approveTokens(bob, amounts2);
        vm.prank(bob);
        pool.addLiquidity(k2, amounts2);
        
        // Verify both ticks are active
        uint256[] memory activeTicks = pool.getActiveTicks();
        assertEq(activeTicks.length, 2);
        
        // Verify each tick exists
        (uint256 r1, , , , ) = pool.getTickInfo(k1);
        (uint256 r2, , , , ) = pool.getTickInfo(k2);
        assertGt(r1, 0);
        assertGt(r2, 0);
    }

    function test_EdgeCase_VerySmallAmounts() public {
        uint256[5] memory smallAmounts = [
            uint256(1e18), uint256(1e18), uint256(1e18), uint256(1e18), uint256(1e18) // 1 token each (not too small)
        ];
        
        uint256 k = _calculateValidK(smallAmounts);
        _approveTokens(alice, smallAmounts);
        vm.prank(alice);
        pool.addLiquidity(k, smallAmounts);
        
        (uint256 r, , , , ) = pool.getTickInfo(k);
        assertGt(r, 0);
    }

    function test_EdgeCase_VeryLargeAmounts() public {
        uint256[5] memory largeAmounts = [
            uint256(1e24), uint256(1e24), uint256(1e24), uint256(1e24), uint256(1e24) // 1M tokens each
        ];
        
        // Mint extra tokens for this test
        for (uint i = 0; i < 5; i++) {
            tokens[i].mint(alice, 10e24);
        }
        
        uint256 k = _calculateValidK(largeAmounts);
        _approveTokens(alice, largeAmounts);
        vm.prank(alice);
        pool.addLiquidity(k, largeAmounts);
        
        (uint256 r, , , , ) = pool.getTickInfo(k);
        assertGt(r, 0);
    }
}
