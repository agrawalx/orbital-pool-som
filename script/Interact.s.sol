// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/orbital.sol";
import "../script/DeploymentHelper.s.sol";

contract InteractScript is Script {
    // You'll need to update these addresses after deployment
    address constant POOL_ADDRESS = address(0); // Update with deployed pool address
    address[5] public TOKEN_ADDRESSES = [
        address(0), // USDC
        address(0), // USDT  
        address(0), // DAI
        address(0), // TUSD
        address(0)  // FRAX
    ];
    
    DeploymentHelper helper;
    
    function setUp() public {
        helper = new DeploymentHelper();
    }
    
    function run() external {
        require(POOL_ADDRESS != address(0), "Update POOL_ADDRESS first");
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Interacting with Orbital Pool:", POOL_ADDRESS);
        console.log("Using account:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Example: Add liquidity
        addLiquidityExample();
        
        // Example: Query pool state
        queryPoolState();
        
        vm.stopBroadcast();
    }
    
    function addLiquidityExample() internal {
        orbitalPool pool = orbitalPool(POOL_ADDRESS);
        
        // Get example amounts
        uint256[5] memory amounts = helper.getExampleAmounts();
        uint256 k = helper.calculateValidK(amounts);
        
        console.log("\n=== Adding Liquidity Example ===");
        console.log("Amounts: [1000, 1000, 1000, 1000, 1000] * 1e18");
        console.log("Calculated k:", k);
        console.log("Is valid k:", helper.isValidK(k, amounts));
        
        // Approve tokens (assuming you have them)
        for (uint i = 0; i < 5; i++) {
            if (TOKEN_ADDRESSES[i] != address(0)) {
                IERC20(TOKEN_ADDRESSES[i]).approve(POOL_ADDRESS, amounts[i]);
                console.log("Approved token", i, "for amount:", amounts[i]);
            }
        }
        
        // Add liquidity
        try pool.addLiquidity(k, amounts) {
            console.log("Liquidity added successfully!");
            
            // Check LP shares
            uint256 lpShares = pool.getUserLpShares(k, msg.sender);
            console.log("LP shares received:", lpShares);
        } catch Error(string memory reason) {
            console.log("Failed to add liquidity:", reason);
        } catch {
            console.log("Failed to add liquidity: Unknown error");
        }
    }
    
    function queryPoolState() internal view {
        orbitalPool pool = orbitalPool(POOL_ADDRESS);
        
        console.log("\n=== Pool State Query ===");
        
        // Get active ticks
        uint256[] memory activeTicks = pool.getActiveTicks();
        console.log("Active ticks count:", activeTicks.length);
        
        for (uint i = 0; i < activeTicks.length && i < 5; i++) {
            uint256 k = activeTicks[i];
            console.log("\nTick k:", k);
            
            (
                uint256 r,
                uint256 liquidity,
                uint256[5] memory reserves,
                uint256 totalLpShares,
                orbitalPool.TickStatus status
            ) = pool.getTickInfo(k);
            
            console.log("  Radius:", r);
            console.log("  Liquidity:", liquidity);
            console.log("  Total LP shares:", totalLpShares);
            console.log("  Status:", uint(status) == 0 ? "Interior" : "Boundary");
            
            console.log("  Reserves:");
            for (uint j = 0; j < 5; j++) {
                console.log("    Token", j, ":", reserves[j]);
            }
        }
        
        // Get total reserves
        uint256[5] memory totalReserves = pool._getTotalReserves();
        console.log("\nTotal reserves across all ticks:");
        for (uint i = 0; i < 5; i++) {
            console.log("  Token", i, ":", totalReserves[i]);
        }
    }
    
    function swapExample() external {
        require(POOL_ADDRESS != address(0), "Update POOL_ADDRESS first");
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        orbitalPool pool = orbitalPool(POOL_ADDRESS);
        
        console.log("\n=== Swap Example ===");
        
        // Swap 100 tokens of token 0 for token 1
        uint256 amountIn = 100 * 1e18;
        uint256 minAmountOut = 90 * 1e18; // 10% slippage tolerance
        
        console.log("Swapping", amountIn, "of token 0 for token 1");
        console.log("Min amount out:", minAmountOut);
        
        // Approve token 0
        if (TOKEN_ADDRESSES[0] != address(0)) {
            IERC20(TOKEN_ADDRESSES[0]).approve(POOL_ADDRESS, amountIn);
            
            try pool.swap(0, 1, amountIn, minAmountOut) returns (uint256 amountOut) {
                console.log("Swap successful!");
                console.log("Amount out:", amountOut);
                console.log("Effective rate:", (amountOut * 10000) / amountIn, "basis points");
            } catch Error(string memory reason) {
                console.log("Swap failed:", reason);
            }
        } else {
            console.log("Token addresses not set, skipping swap");
        }
        
        vm.stopBroadcast();
    }
}
