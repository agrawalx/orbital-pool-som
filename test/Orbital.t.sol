// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/orbital.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 token with 18 decimals
contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 1e18); // 1M tokens
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract OrbitalPoolTest is Test {
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
    uint256[5] public testAmounts1 = [
        1000 * 1e18,  // Token0: 1000
        1000 * 1e18,  // Token1: 1000
        1000 * 1e18,  // Token2: 1000
        1000 * 1e18,  // Token3: 1000
        1000 * 1e18   // Token4: 1000
    ];
    
    uint256[5] public testAmounts2 = [
        500 * 1e18,   // Token0: 500
        600 * 1e18,   // Token1: 600
        700 * 1e18,   // Token2: 700
        800 * 1e18,   // Token3: 800
        900 * 1e18    // Token4: 900
    ];
    
    uint256[5] public smallAmounts = [
        10 * 1e18,    // Token0: 10
        20 * 1e18,    // Token1: 20
        30 * 1e18,    // Token2: 30
        40 * 1e18,    // Token3: 40
        50 * 1e18     // Token4: 50
    ];

    function setUp() public {
        // Deploy mock tokens (all 18 decimals)
        tokens[0] = new MockToken("Token0", "TK0");
        tokens[1] = new MockToken("Token1", "TK1");
        tokens[2] = new MockToken("Token2", "TK2");
        tokens[3] = new MockToken("Token3", "TK3");
        tokens[4] = new MockToken("Token4", "TK4");
        
        // Convert to IERC20 array
        for (uint i = 0; i < 5; i++) {
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

    // ========== CONSTRUCTOR TESTS ==========
    
    function test_Constructor() public {
        // Verify tokens are set correctly
        for (uint i = 0; i < 5; i++) {
            assertEq(address(pool.tokens(i)), address(tokens[i]));
        }
        
        // Verify constants
        assertEq(pool.TOKENS_COUNT(), 5);
        assertEq(pool.swapFee(), 3000); // 0.3%
        assertEq(pool.FEE_DENOMINATOR(), 1000000);
    }

    // ========== ADD LIQUIDITY TESTS ==========
    
    function test_AddLiquidity_NewTick() public {
        uint256 k = _calculateValidK(testAmounts1);
        _approveTokens(alice, testAmounts1);
        
        vm.startPrank(alice);
        
        // Calculate expected radius and LP shares (for new tick, lpShares = radius)
        uint256 expectedRadius = _calculateRadius(testAmounts1);
        uint256 expectedLpShares = expectedRadius; // For new tick
        
        vm.expectEmit(true, true, false, true);
        emit orbitalPool.LiquidityAdded(alice, k, testAmounts1, expectedLpShares);
        
        pool.addLiquidity(k, testAmounts1);
        
        // Verify tick was created
        (uint256 r, uint256 liquidity, uint256[5] memory reserves, uint256 totalLpShares, orbitalPool.TickStatus status) = 
            pool.getTickInfo(k);
            
        assertEq(r, expectedRadius);
        assertEq(liquidity, expectedRadius);
        assertEq(totalLpShares, expectedLpShares);
        
        for (uint i = 0; i < 5; i++) {
            assertEq(reserves[i], testAmounts1[i]);
        }
        
        // Verify user LP shares
        assertEq(pool.getUserLpShares(k, alice), expectedLpShares);
        
        // Verify active ticks
        uint256[] memory activeTicks = pool.getActiveTicks();
        assertEq(activeTicks.length, 1);
        assertEq(activeTicks[0], k);
        
        vm.stopPrank();
    }
    
    function test_AddLiquidity_ExistingTick() public {
        uint256 k = 1e18;
        
        // Alice adds initial liquidity
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        pool.addLiquidity(k, testAmounts1);
        
        uint256 initialRadius = _calculateRadius(testAmounts1);
        
        // Bob adds to existing tick
        _approveTokens(bob, testAmounts2);
        vm.prank(bob);
        pool.addLiquidity(k, testAmounts2);
        
        // Calculate expected new radius
        uint256[5] memory combinedAmounts;
        for (uint i = 0; i < 5; i++) {
            combinedAmounts[i] = testAmounts1[i] + testAmounts2[i];
        }
        uint256 newRadius = _calculateRadius(combinedAmounts);
        
        // Verify updated tick
        (uint256 r, , , uint256 totalLpShares, ) = pool.getTickInfo(k);
        assertEq(r, newRadius);
        
        // Verify LP shares calculation
        uint256 radiusIncrease = newRadius - initialRadius;
        uint256 expectedBobShares = (radiusIncrease * initialRadius) / initialRadius;
        assertEq(pool.getUserLpShares(k, bob), expectedBobShares);
    }
    
    function test_AddLiquidity_RevertInvalidK() public {
        _approveTokens(alice, testAmounts1);
        
        vm.startPrank(alice);
        
        // Test k = 0
        vm.expectRevert(orbitalPool.InvalidKValue.selector);
        pool.addLiquidity(0, testAmounts1);
        
        // Test k too large for radius
        uint256 radius = _calculateRadius(testAmounts1);
        uint256 invalidK = (4 * radius * PRECISION) / SQRT5_SCALED + 1; // Above upper bound
        
        vm.expectRevert(orbitalPool.InvalidKValue.selector);
        pool.addLiquidity(invalidK, testAmounts1);
        
        vm.stopPrank();
    }
    
    function test_AddLiquidity_RevertInvalidAmounts() public {
        uint256[5] memory zeroAmounts = [uint256(0), 0, 0, 0, 0];
        _approveTokens(alice, zeroAmounts);
        
        vm.prank(alice);
        vm.expectRevert(orbitalPool.InvalidAmounts.selector);
        pool.addLiquidity(1e18, zeroAmounts);
    }
    
    function test_AddLiquidity_TickStatus() public {
        // Test boundary tick (reserve constraint = k)
        uint256 radius = _calculateRadius(testAmounts1);
        uint256 boundaryK = (radius * PRECISION) / SQRT5_SCALED;
        
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        pool.addLiquidity(boundaryK, testAmounts1);
        
        (, , , , orbitalPool.TickStatus status) = pool.getTickInfo(boundaryK);
        assertEq(uint256(status), 1); // Boundary = 1
        
        // Test interior tick (reserve constraint != k)
        uint256 interiorK = boundaryK / 2;
        _approveTokens(bob, testAmounts2);
        vm.prank(bob);
        pool.addLiquidity(interiorK, testAmounts2);
        
        (, , , , status) = pool.getTickInfo(interiorK);
        assertEq(uint256(status), 0); // Interior = 0
    }

    // ========== SWAP TESTS ==========
    
    function test_Swap_Basic() public {
        // Setup liquidity
        uint256 k = 1e18;
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        pool.addLiquidity(k, testAmounts1);
        
        // Bob swaps token 0 for token 1
        uint256 swapAmount = 100 * 1e18;
        uint256 minAmountOut = 90 * 1e18; // 10% slippage tolerance
        
        uint256 bobBalanceBefore0 = tokens[0].balanceOf(bob);
        uint256 bobBalanceBefore1 = tokens[1].balanceOf(bob);
        
        vm.startPrank(bob);
        tokens[0].approve(address(pool), swapAmount);
        
        vm.expectEmit(true, false, false, false);
        emit orbitalPool.Swap(bob, 0, 1, swapAmount, 0, 0); // amountOut and fee will be calculated
        
        uint256 amountOut = pool.swap(0, 1, swapAmount, minAmountOut);
        vm.stopPrank();
        
        // Verify balances changed
        assertEq(tokens[0].balanceOf(bob), bobBalanceBefore0 - swapAmount);
        assertEq(tokens[1].balanceOf(bob), bobBalanceBefore1 + amountOut);
        console.log(tokens[1].balanceOf(bob));
        // Verify output amount is reasonable
        assertGt(amountOut, minAmountOut);
        assertLt(amountOut, swapAmount); // Should be less due to fees and slippage
    }
    
    function test_Swap_RevertInvalidTokens() public {
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
    
    function test_Swap_RevertSlippage() public {
        // Setup liquidity
        uint256 k = 1e18;
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        pool.addLiquidity(k, testAmounts1);
        
        // Bob tries swap with unrealistic slippage tolerance
        uint256 swapAmount = 100 * 1e18;
        uint256 unrealisticMinOut = 150 * 1e18; // Expecting more out than in
        
        vm.startPrank(bob);
        tokens[0].approve(address(pool), swapAmount);
        
        vm.expectRevert(orbitalPool.SlippageExceeded.selector);
        pool.swap(0, 1, swapAmount, unrealisticMinOut);
        
        vm.stopPrank();
    }
    
    function test_Swap_FeeDistribution() public {
        // Setup liquidity from two providers
        uint256 k = 1e18;
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        pool.addLiquidity(k, testAmounts1);
        
        _approveTokens(bob, testAmounts2);
        vm.prank(bob);
        pool.addLiquidity(k, testAmounts2);
        
        // Execute swap
        uint256 swapAmount = 1000 * 1e18;
        vm.startPrank(charlie);
        tokens[0].approve(address(pool), swapAmount);
        pool.swap(0, 1, swapAmount, 0);
        vm.stopPrank();
        
        // Check that fees were distributed (accrued fees should be > 0)
        (uint256 r, uint256 liquidity, uint256[5] memory reserves, uint256 totalLpShares, orbitalPool.TickStatus status) = pool.getTickInfo(k);
        // Note: We can't directly check accruedFees as it's not exposed in getTickInfo
        // In a more complete test, we'd add a getter for fees
        assertGt(r, 0); // Ensure tick still exists
    }

    // ========== HELPER FUNCTION TESTS ==========
    
    function test_GetTickInfo() public {
        uint256 k = 1e18;
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        pool.addLiquidity(k, testAmounts1);
        
        (uint256 r, uint256 liquidity, uint256[5] memory reserves, uint256 totalLpShares, orbitalPool.TickStatus status) = 
            pool.getTickInfo(k);
        
        uint256 expectedRadius = _calculateRadius(testAmounts1);
        assertEq(r, expectedRadius);
        assertEq(liquidity, expectedRadius);
        assertEq(totalLpShares, expectedRadius);
        
        for (uint i = 0; i < 5; i++) {
            assertEq(reserves[i], testAmounts1[i]);
        }
    }
    
    function test_GetUserLpShares() public {
        uint256 k = 1e18;
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        pool.addLiquidity(k, testAmounts1);
        
        uint256 expectedShares = _calculateRadius(testAmounts1);
        assertEq(pool.getUserLpShares(k, alice), expectedShares);
        assertEq(pool.getUserLpShares(k, bob), 0); // Bob didn't provide liquidity
    }
    
    function test_GetActiveTicks() public {
        // Initially no active ticks
        uint256[] memory activeTicks = pool.getActiveTicks();
        assertEq(activeTicks.length, 0);
        
        // Add first tick
        uint256 k1 = 1e18;
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        pool.addLiquidity(k1, testAmounts1);
        
        activeTicks = pool.getActiveTicks();
        assertEq(activeTicks.length, 1);
        assertEq(activeTicks[0], k1);
        
        // Add second tick
        uint256 k2 = 2e18;
        _approveTokens(bob, testAmounts2);
        vm.prank(bob);
        pool.addLiquidity(k2, testAmounts2);
        
        activeTicks = pool.getActiveTicks();
        assertEq(activeTicks.length, 2);
        // Note: Order might vary, so check both ticks are present
        bool hasK1 = false;
        bool hasK2 = false;
        for (uint i = 0; i < activeTicks.length; i++) {
            if (activeTicks[i] == k1) hasK1 = true;
            if (activeTicks[i] == k2) hasK2 = true;
        }
        assertTrue(hasK1 && hasK2);
    }

    // ========== MATHEMATICAL FUNCTION TESTS ==========
    
    function test_CalculateRadiusSquared() public {
        // This tests the internal _calculateRadiusSquared function indirectly
        // by checking the radius calculation in addLiquidity
        uint256[5] memory knownAmounts = [uint256(3 * 1e18), uint256(4 * 1e18), uint256(0), uint256(0), uint256(0)];
        // Expected radius² = 3² + 4² = 9 + 16 = 25, so radius = 5
        uint256 expectedRadius = 5 * 1e18;
        
        uint256 k = 1e18;
        _approveTokens(alice, knownAmounts);
        vm.prank(alice);
        pool.addLiquidity(k, knownAmounts);
        
        (uint256 r, , , , ) = pool.getTickInfo(k);
        assertApproxEqAbs(r, expectedRadius, 1e15); // Allow small precision error
    }
    
    function test_ValidateAmounts() public {
        // Test with valid amounts (all positive)
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        pool.addLiquidity(1e18, testAmounts1);
        // Should not revert
        
        // Test with invalid amounts (contains zero) - tested in test_AddLiquidity_RevertInvalidAmounts
    }
    
    function test_IsValidK_Bounds() public {
        uint256 radius = _calculateRadius(testAmounts1);
        
        // Test valid k values
        uint256 minValidK = (radius * PRECISION) / SQRT5_SCALED; // r/√5
        uint256 maxValidK = (4 * radius * PRECISION) / SQRT5_SCALED; // 4r/√5
        
        _approveTokens(alice, testAmounts1);
        _approveTokens(bob, testAmounts1);
        
        vm.prank(alice);
        pool.addLiquidity(minValidK, testAmounts1); // Should work
        
        vm.prank(bob);
        pool.addLiquidity(maxValidK, testAmounts1); // Should work
    }

    // ========== EDGE CASE TESTS ==========
    
    function test_MultipleSwapsInSequence() public {
        // Setup liquidity
        uint256 k = 2e18; // Higher k for more stability
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        pool.addLiquidity(k, testAmounts1);
        
        uint256 swapAmount = 50 * 1e18;
        
        // Execute multiple swaps
        vm.startPrank(bob);
        for (uint i = 0; i < 3; i++) {
            tokens[0].approve(address(pool), swapAmount);
            pool.swap(0, 1, swapAmount, 0);
        }
        vm.stopPrank();
        
        // Pool should still be functional
        uint256[] memory activeTicks = pool.getActiveTicks();
        assertEq(activeTicks.length, 1);
    }
    
    function test_LargeAmountSwap() public {
        // Setup large liquidity
        uint256[5] memory largeAmounts;
        for (uint i = 0; i < 5; i++) {
            largeAmounts[i] = 10000 * 1e18;
        }
        
        uint256 k = 3e18;
        _approveTokens(alice, largeAmounts);
        vm.prank(alice);
        pool.addLiquidity(k, largeAmounts);
        
        // Large swap
        uint256 largeSwapAmount = 1000 * 1e18;
        vm.startPrank(bob);
        tokens[0].approve(address(pool), largeSwapAmount);
        uint256 amountOut = pool.swap(0, 1, largeSwapAmount, 0);
        vm.stopPrank();
        
        assertGt(amountOut, 0);
    }
    
    function test_SmallAmountSwap() public {
        // Setup liquidity
        uint256 k = 1e18;
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        pool.addLiquidity(k, testAmounts1);
        
        // Very small swap
        uint256 smallSwapAmount = 1e15; // 0.001 tokens
        vm.startPrank(bob);
        tokens[0].approve(address(pool), smallSwapAmount);
        uint256 amountOut = pool.swap(0, 1, smallSwapAmount, 0);
        vm.stopPrank();
        
        assertGt(amountOut, 0);
    }

    // ========== STRESS TESTS ==========
    
    function test_MultipleLiquidityProviders() public {
        uint256 k = 1e18;
        address[3] memory providers = [alice, bob, charlie];
        uint256[5][3] memory amounts = [testAmounts1, testAmounts2, smallAmounts];
        
        // Multiple providers add liquidity to same tick
        for (uint i = 0; i < providers.length; i++) {
            _approveTokens(providers[i], amounts[i]);
            vm.prank(providers[i]);
            pool.addLiquidity(k, amounts[i]);
        }
        
        // Verify all have LP shares
        for (uint i = 0; i < providers.length; i++) {
            assertGt(pool.getUserLpShares(k, providers[i]), 0);
        }
        
        // Verify only one active tick
        uint256[] memory activeTicks = pool.getActiveTicks();
        assertEq(activeTicks.length, 1);
    }
    
    function test_MultipleTicks() public {
        uint256[3] memory kValues = [uint256(1e18), uint256(2e18), uint256(3e18)];
        uint256[5][3] memory amounts = [testAmounts1, testAmounts2, smallAmounts];
        address[3] memory providers = [alice, bob, charlie];
        
        // Create multiple ticks
        for (uint i = 0; i < 3; i++) {
            _approveTokens(providers[i], amounts[i]);
            vm.prank(providers[i]);
            pool.addLiquidity(kValues[i], amounts[i]);
        }
        
        // Verify all ticks are active
        uint256[] memory activeTicks = pool.getActiveTicks();
        assertEq(activeTicks.length, 3);
        
        // Verify each tick exists
        for (uint i = 0; i < 3; i++) {
            (uint256 r, , , , ) = pool.getTickInfo(kValues[i]);
            assertGt(r, 0);
        }
    }

    // ========== INVARIANT TESTS ==========
    
    function test_SwapPreservesInvariant() public {
        // Setup liquidity
        uint256 k = 1e18;
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        pool.addLiquidity(k, testAmounts1);
        
        // Get initial state
        (uint256 initialR, , uint256[5] memory initialReserves, , ) = pool.getTickInfo(k);
        
        // Perform swap
        uint256 swapAmount = 100 * 1e18;
        vm.startPrank(bob);
        tokens[0].approve(address(pool), swapAmount);
        pool.swap(0, 1, swapAmount, 0);
        vm.stopPrank();
        
        // Get final state
        (uint256 finalR, , uint256[5] memory finalReserves, , ) = pool.getTickInfo(k);
        
        // The mathematical invariant should be preserved (approximately)
        // This is a simplified check - the actual invariant is more complex
        assertGt(finalR, 0);
        
        // Reserves should have changed appropriately
        assertGt(finalReserves[0], initialReserves[0]); // Input token increased
        assertLt(finalReserves[1], initialReserves[1]); // Output token decreased
    }
    
    // ========== GAS OPTIMIZATION TESTS ==========
    
    function test_GasUsage_AddLiquidity() public {
        uint256 k = 1e18;
        _approveTokens(alice, testAmounts1);
        
        vm.prank(alice);
        uint256 gasBefore = gasleft();
        pool.addLiquidity(k, testAmounts1);
        uint256 gasUsed = gasBefore - gasleft();
        
        // Ensure gas usage is reasonable (adjust threshold as needed)
        assertLt(gasUsed, 500000); // Less than 500k gas
    }
    
    function test_GasUsage_Swap() public {
        // Setup liquidity
        uint256 k = 1e18;
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        pool.addLiquidity(k, testAmounts1);
        
        // Measure swap gas usage
        uint256 swapAmount = 100 * 1e18;
        vm.startPrank(bob);
        tokens[0].approve(address(pool), swapAmount);
        
        uint256 gasBefore = gasleft();
        pool.swap(0, 1, swapAmount, 0);
        uint256 gasUsed = gasBefore - gasleft();
        
        vm.stopPrank();
        
        // Ensure gas usage is reasonable
        assertLt(gasUsed, 1000000); // Less than 1M gas
    }

    // ========== EVENTS TESTS ==========
    
    function test_Events_LiquidityAdded() public {
        uint256 k = 1e18;
        _approveTokens(alice, testAmounts1);
        
        vm.startPrank(alice);
        
        vm.expectEmit(true, true, false, true);
        emit orbitalPool.LiquidityAdded(alice, k, testAmounts1, _calculateRadius(testAmounts1));
        
        pool.addLiquidity(k, testAmounts1);
        
        vm.stopPrank();
    }
    
    function test_Events_Swap() public {
        // Setup liquidity
        uint256 k = 1e18;
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        pool.addLiquidity(k, testAmounts1);
        
        // Test swap event
        uint256 swapAmount = 100 * 1e18;
        vm.startPrank(bob);
        tokens[0].approve(address(pool), swapAmount);
        
        // We can't predict exact amountOut and fee, so just check event is emitted
        vm.expectEmit(true, false, false, false);
        emit orbitalPool.Swap(bob, 0, 1, swapAmount, 0, 0);
        
        pool.swap(0, 1, swapAmount, 0);
        
        vm.stopPrank();
    }

    // ========== FUZZ TESTS ==========
    
    function testFuzz_AddLiquidity_ValidK(uint256 k) public {
        // Bound k to reasonable range
        k = bound(k, 1e15, 10e18);
        
        // Calculate if k would be valid for testAmounts1
        uint256 radius = _calculateRadius(testAmounts1);
        uint256 minValidK = (radius * PRECISION) / SQRT5_SCALED;
        uint256 maxValidK = (4 * radius * PRECISION) / SQRT5_SCALED;
        
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        
        if (k >= minValidK && k <= maxValidK) {
            pool.addLiquidity(k, testAmounts1);
            // Should succeed
            (uint256 r, , , , ) = pool.getTickInfo(k);
            assertEq(r, radius);
        } else {
            vm.expectRevert(orbitalPool.InvalidKValue.selector);
            pool.addLiquidity(k, testAmounts1);
        }
    }
    
    function testFuzz_Swap_Amount(uint256 swapAmount) public {
        // Setup liquidity
        uint256 k = 1e18;
        _approveTokens(alice, testAmounts1);
        vm.prank(alice);
        pool.addLiquidity(k, testAmounts1);
        
        // Bound swap amount to reasonable range
        swapAmount = bound(swapAmount, 1e15, 500 * 1e18); // 0.001 to 500 tokens
        
        vm.startPrank(bob);
        tokens[0].approve(address(pool), swapAmount);
        
        if (swapAmount > 0) {
            uint256 amountOut = pool.swap(0, 1, swapAmount, 0);
            assertGt(amountOut, 0);
        } else {
            vm.expectRevert(orbitalPool.InvalidAmounts.selector);
            pool.swap(0, 1, swapAmount, 0);
        }
        
        vm.stopPrank();
    }
}