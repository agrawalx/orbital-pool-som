// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "./orbital.sol";
import "./MockUSDToken.sol";

/**
 * @title DeployOrbital
 * @dev Deployment script for Orbital pool on Somnia testnet
 */
contract DeployOrbital is Script {
    // Deployment configuration
    uint256 constant INITIAL_SUPPLY = 1_000_000 * 1e18; // 1M tokens each
    
    // Stablecoin configurations
    string[5] public tokenNames = [
        "Mock USD Coin",
        "Mock Tether USD", 
        "Mock DAI Stablecoin",
        "Mock FRAX",
        "Mock TrueUSD"
    ];
    
    string[5] public tokenSymbols = [
        "mUSDC",
        "mUSDT",
        "mDAI", 
        "mFRAX",
        "mTUSD"
    ];
    
    uint8[5] public tokenDecimals = [6, 6, 18, 18, 18];
    
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying from address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy 5 mock stablecoins
        MockUSDToken[5] memory stablecoins;
        IERC20[5] memory tokens;
        
        console.log("\n=== Deploying Mock Stablecoins ===");
        
        for (uint256 i = 0; i < 5; i++) {
            stablecoins[i] = new MockUSDToken(
                tokenNames[i],
                tokenSymbols[i], 
                tokenDecimals[i],
                INITIAL_SUPPLY * (10 ** tokenDecimals[i]) / 1e18, // Adjust for decimals
                deployer
            );
            
            tokens[i] = IERC20(address(stablecoins[i]));
            
            console.log(
                string.concat(tokenSymbols[i], " deployed at:"), 
                address(stablecoins[i])
            );
        }
        
        // Deploy Orbital pool
        console.log("\n=== Deploying Orbital Pool ===");
        
        orbitalPool pool = new orbitalPool(tokens);
        
        console.log("Orbital Pool deployed at:", address(pool));
        
        // Optional: Add initial liquidity to demonstrate functionality
        console.log("\n=== Setting up initial liquidity ===");
        
        // Approve tokens for pool
        uint256[5] memory initialAmounts;
        initialAmounts[0] = 100_000 * 1e18;  // mUSDC (6 decimals)
        initialAmounts[1] = 100_000 * 1e18;  // mUSDT (6 decimals) 
        initialAmounts[2] = 100_000 * 1e18; // mDAI (18 decimals)
        initialAmounts[3] = 100_000 * 1e18; // mFRAX (18 decimals)
        initialAmounts[4] = 100_000 * 1e18; // mTUSD (18 decimals)
        
        for (uint256 i = 0; i < 5; i++) {
            stablecoins[i].approve(address(pool), initialAmounts[i]);
        }
        
        // Add liquidity at k = 1e18 (a reasonable starting point)
        uint256 k = 1e18;
        pool.addLiquidity(k, initialAmounts);
        
        console.log("Initial liquidity added at k =", k);
        
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Somnia Testnet");
        console.log("Deployer:", deployer);
        console.log("Orbital Pool:", address(pool));
        
        for (uint256 i = 0; i < 5; i++) {
            console.log(
                string.concat(tokenSymbols[i], ":"),
                address(stablecoins[i])
            );
        }
        
        console.log("\n=== NEXT STEPS ===");
        console.log("1. Verify contracts on block explorer");
        console.log("2. Fund additional accounts with test tokens");
        console.log("3. Test swapping functionality");
        console.log("4. Monitor tick boundary behavior");
    }
    
    /**
     * @dev Helper function to fund test accounts with tokens
     * Call this after deployment to distribute tokens for testing
     */
    function fundTestAccounts(address[] memory accounts, address[] memory tokenAddresses) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        uint256 testAmount = 10_000; // 10k tokens per account
        
        for (uint256 i = 0; i < accounts.length; i++) {
            for (uint256 j = 0; j < tokenAddresses.length; j++) {
                MockUSDToken token = MockUSDToken(tokenAddresses[j]);
                uint256 amount = testAmount * (10 ** token.decimals());
                token.mint(accounts[i], amount);
            }
        }
        
        vm.stopBroadcast();
        
        console.log("Test accounts funded with tokens");
    }
}