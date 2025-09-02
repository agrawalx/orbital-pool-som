// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console2} from "forge-std/Test.sol";
import "../src/orbital.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 token for testing
contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**18); // Mint 1M tokens
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract OrbitalTest is Test {
    orbitalPool public pool;
    MockToken[5] public tokens;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    
    function setUp() public {
        // Deploy mock tokens
        tokens[0] = new MockToken("USD Coin", "USDC");
        tokens[1] = new MockToken("Tether USD", "USDT");
        tokens[2] = new MockToken("DAI", "DAI");
        tokens[3] = new MockToken("Frax", "FRAX");
        tokens[4] = new MockToken("True USD", "TUSD");
        
        // Convert to IERC20 array for the pool constructor
        IERC20[5] memory ierc20Tokens;
        for (uint256 i = 0; i < 5; i++) {
            ierc20Tokens[i] = IERC20(address(tokens[i]));
        }
        
        // Deploy orbital pool
        pool = new orbitalPool(ierc20Tokens);
        
        // Setup test accounts with tokens
        for (uint256 i = 0; i < 5; i++) {
            tokens[i].mint(alice, 100000 * 10**18);
            tokens[i].mint(bob, 100000 * 10**18);
        }
        
        // Approve pool to spend tokens
        vm.startPrank(alice);
        for (uint256 i = 0; i < 5; i++) {
            tokens[i].approve(address(pool), type(uint256).max);
        }
        vm.stopPrank();
        
        vm.startPrank(bob);
        for (uint256 i = 0; i < 5; i++) {
            tokens[i].approve(address(pool), type(uint256).max);
        }
        vm.stopPrank();
    }
    
    function testAddLiquidity() public {
        vm.startPrank(alice);
        
        // Test liquidity addition
        uint256[5] memory amounts = [
            uint256(1000 * 10**18),  // 1000 USDC
            uint256(1000 * 10**18),  // 1000 USDT
            uint256(1000 * 10**18),  // 1000 DAI
            uint256(1000 * 10**18),  // 1000 FRAX
            uint256(1000 * 10**18)   // 1000 TUSD
        ];
        
        uint256 k = 2236067977499790; // sqrt(5) * 1e15
        
        pool.addLiquidity(k, amounts);
        
        // Verify tick was created
        (uint256 r, uint256 liquidity, , uint256 totalLpShares, orbitalPool.TickStatus status) = pool.getTickInfo(k);
        
        assertTrue(r > 0, "Radius should be greater than 0");
        assertTrue(liquidity > 0, "Liquidity should be greater than 0");
        assertTrue(totalLpShares > 0, "LP shares should be greater than 0");
        
        vm.stopPrank();
    }
    
    function testSwapFunction() public {
        // First add liquidity
        vm.startPrank(alice);
        
        uint256[5] memory amounts = [
            uint256(10000 * 10**18),  // 10k USDC
            uint256(10000 * 10**18),  // 10k USDT
            uint256(10000 * 10**18),  // 10k DAI
            uint256(10000 * 10**18),  // 10k FRAX
            uint256(10000 * 10**18)   // 10k TUSD
        ];
        
        // Add liquidity to multiple ticks
        uint256 k1 = 2000 * 10**15; // First tick
        uint256 k2 = 2500 * 10**15; // Second tick
        
        pool.addLiquidity(k1, amounts);
        pool.addLiquidity(k2, amounts);
        
        vm.stopPrank();
        
        // Now test swap as Bob
        vm.startPrank(bob);
        
        uint256 swapAmount = 100 * 10**18; // 100 USDC
        uint256 balanceBefore = tokens[1].balanceOf(bob); // USDT balance before
        
        // Execute swap: USDC -> USDT
        uint256 amountOut = pool.swap(0, 1, swapAmount, 0); // tokenIn=0 (USDC), tokenOut=1 (USDT)
        
        uint256 balanceAfter = tokens[1].balanceOf(bob);
        uint256 actualReceived = balanceAfter - balanceBefore;
        
        assertEq(actualReceived, amountOut, "Amount received should match swap output");
        assertTrue(amountOut > 0, "Should receive some tokens from swap");
        
        console2.log("Swap input:", swapAmount);
        console2.log("Swap output:", amountOut);
        console2.log("Exchange rate:", (amountOut * 10**18) / swapAmount);
        
        vm.stopPrank();
    }
    
    function testMultipleSwaps() public {
        // Add liquidity first
        vm.startPrank(alice);
        
        uint256[5] memory amounts = [
            uint256(50000 * 10**18),  // 50k each token
            uint256(50000 * 10**18),
            uint256(50000 * 10**18),
            uint256(50000 * 10**18),
            uint256(50000 * 10**18)
        ];
        
        pool.addLiquidity(2236067977499790, amounts); // sqrt(5) * 1e15
        vm.stopPrank();
        
        // Test multiple swaps
        vm.startPrank(bob);
        
        uint256 swapAmount = 1000 * 10**18;
        
        // Swap USDC -> USDT
        uint256 out1 = pool.swap(0, 1, swapAmount, 0);
        console2.log("USDC -> USDT:", out1);
        
        // Swap USDT -> DAI
        uint256 out2 = pool.swap(1, 2, out1, 0);
        console2.log("USDT -> DAI:", out2);
        
        // Swap DAI -> FRAX
        uint256 out3 = pool.swap(2, 3, out2, 0);
        console2.log("DAI -> FRAX:", out3);
        
        assertTrue(out1 > 0 && out2 > 0 && out3 > 0, "All swaps should succeed");
        
        vm.stopPrank();
    }
    
    function testTickConsolidation() public {
        vm.startPrank(alice);
        
        // Add liquidity to create interior and boundary ticks
        uint256[5] memory amounts = [
            uint256(5000 * 10**18),
            uint256(5000 * 10**18),
            uint256(5000 * 10**18),
            uint256(5000 * 10**18),
            uint256(5000 * 10**18)
        ];
        
        // Add multiple ticks with different k values
        pool.addLiquidity(2000 * 10**15, amounts); // Interior tick
        pool.addLiquidity(2236067977499790, amounts); // Boundary tick (sqrt(5) * 1e15)
        pool.addLiquidity(2500 * 10**15, amounts); // Another tick
        
        vm.stopPrank();
        
        // Check that active ticks are tracked
        uint256[] memory activeTicks = pool.getActiveTicks();
        assertEq(activeTicks.length, 3, "Should have 3 active ticks");
        
        // Test swap with tick consolidation
        vm.startPrank(bob);
        uint256 amountOut = pool.swap(0, 1, 500 * 10**18, 0);
        assertTrue(amountOut > 0, "Swap should work with multiple ticks");
        vm.stopPrank();
    }
}
