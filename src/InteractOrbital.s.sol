// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "./orbital.sol";
import "./MockUSDToken.sol";

/**
 * @title InteractOrbital
 * @dev Script for interacting with deployed Orbital pool
 */
contract InteractOrbital is Script {
    
    // Update these addresses after deployment
    address constant POOL_ADDRESS = address(0); // UPDATE AFTER DEPLOYMENT
    address[5] public TOKEN_ADDRESSES = [
        address(0), // mUSDC - UPDATE AFTER DEPLOYMENT
        address(0), // mUSDT - UPDATE AFTER DEPLOYMENT  
        address(0), // mDAI - UPDATE AFTER DEPLOYMENT
        address(0), // mFRAX - UPDATE AFTER DEPLOYMENT
        address(0)  // mTUSD - UPDATE AFTER DEPLOYMENT
    ];
    
    function addLiquidity() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        orbitalPool pool = orbitalPool(POOL_ADDRESS);
        
        // Prepare amounts for new liquidity (smaller amounts)
        uint256[5] memory amounts;
        amounts[0] = 10_000 * 1e6;  // mUSDC
        amounts[1] = 10_000 * 1e6;  // mUSDT
        amounts[2] = 10_000 * 1e18; // mDAI  
        amounts[3] = 10_000 * 1e18; // mFRAX
        amounts[4] = 10_000 * 1e18; // mTUSD
        
        // Approve tokens
        for (uint256 i = 0; i < 5; i++) {
            MockUSDToken(TOKEN_ADDRESSES[i]).approve(POOL_ADDRESS, amounts[i]);
        }
        
        // Add liquidity at k = 2e18
        uint256 k = 2e18;
        pool.addLiquidity(k, amounts);
        
        console.log("Added liquidity at k =", k);
        
        vm.stopBroadcast();
    }
    
    function testSwap() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        orbitalPool pool = orbitalPool(POOL_ADDRESS);
        
        // Swap 1000 mUSDC for mDAI
        uint256 tokenIn = 0; // mUSDC
        uint256 tokenOut = 2; // mDAI
        uint256 amountIn = 1000 * 1e6; // 1000 mUSDC
        uint256 minAmountOut = 990 * 1e18; // Expect at least 990 mDAI (1% slippage)
        
        // Approve token
        MockUSDToken(TOKEN_ADDRESSES[tokenIn]).approve(POOL_ADDRESS, amountIn);
        
        // Execute swap
        uint256 amountOut = pool.swap(tokenIn, tokenOut, amountIn, minAmountOut);
        
        console.log("Swapped mUSDC amount:", amountIn);
        console.log("Received mDAI amount:", amountOut);
        
        vm.stopBroadcast();
    }
    
    function checkTickInfo() external view {
        orbitalPool pool = orbitalPool(POOL_ADDRESS);
        uint256[] memory activeTicks = pool.getActiveTicks();
        
        console.log("Active ticks count:", activeTicks.length);
        
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            (
                uint256 r,
                uint256 liquidity,
                uint256[5] memory reserves,
                uint256 totalLpShares,
                orbitalPool.TickStatus status
            ) = pool.getTickInfo(k);
            
            console.log("Tick k:", k);
            console.log("Radius:", r);
            console.log("Liquidity:", liquidity);
            console.log("Total LP Shares:", totalLpShares);
            console.log("Status (0=Interior, 1=Boundary):", uint256(status));
            
            console.log("Reserves:");
            for (uint256 j = 0; j < 5; j++) {
                console.log("  Token", j, ":", reserves[j]);
            }
        }
    }
}
