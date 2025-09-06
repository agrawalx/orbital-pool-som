// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/orbital.sol";

/**
 * @title DeploymentHelper
 * @dev Helper functions for interacting with the deployed Orbital Pool
 */
contract DeploymentHelper is Script {
    uint256 private constant SQRT5_SCALED = 2236067977499790; // sqrt(5) * 1e15
    uint256 private constant PRECISION = 1e15;
    uint256 private constant TOKENS_COUNT = 5;
    
    /**
     * @dev Calculate valid k value for given token amounts
     * @param amounts Array of 5 token amounts (18 decimals)
     * @return k Valid k value that can be used with addLiquidity
     */
    function calculateValidK(uint256[5] memory amounts) public pure returns (uint256) {
        // Calculate radius
        uint256 radiusSquared = 0;
        for (uint i = 0; i < 5; i++) {
            radiusSquared += amounts[i] * amounts[i];
        }
        uint256 radius = _sqrt(radiusSquared);
        
        // Calculate valid k bounds following the contract's validation
        uint256 sqrt5MinusOne = SQRT5_SCALED - PRECISION;
        uint256 lowerBound = (sqrt5MinusOne * radius) / PRECISION;
        uint256 reserveConstraint = (radius * PRECISION) / SQRT5_SCALED;
        
        // Return the maximum of the two constraints with small buffer
        uint256 actualMinimum = lowerBound > reserveConstraint ? lowerBound : reserveConstraint;
        return actualMinimum + (radius / 100); // Add small buffer (1% of radius)
    }
    
    /**
     * @dev Check if k value is valid for given amounts
     */
    function isValidK(uint256 k, uint256[5] memory amounts) public pure returns (bool) {
        uint256 radiusSquared = 0;
        for (uint i = 0; i < 5; i++) {
            radiusSquared += amounts[i] * amounts[i];
        }
        uint256 radius = _sqrt(radiusSquared);
        
        if (radius == 0) return false;
        
        uint256 sqrt5MinusOne = SQRT5_SCALED - PRECISION;
        uint256 lowerBound = (sqrt5MinusOne * radius) / PRECISION;
        uint256 upperBound = (4 * radius * PRECISION) / SQRT5_SCALED;
        
        if (k < lowerBound || k > upperBound) return false;
        
        uint256 reserveConstraint = (radius * PRECISION) / SQRT5_SCALED;
        return k >= reserveConstraint;
    }
    
    /**
     * @dev Calculate radius for given amounts
     */
    function calculateRadius(uint256[5] memory amounts) public pure returns (uint256) {
        uint256 sum = 0;
        for (uint i = 0; i < 5; i++) {
            sum += amounts[i] * amounts[i];
        }
        return _sqrt(sum);
    }
    
    /**
     * @dev Get k bounds for given amounts
     */
    function getKBounds(uint256[5] memory amounts) public pure returns (uint256 lower, uint256 upper, uint256 reserveConstraint) {
        uint256 radius = calculateRadius(amounts);
        if (radius == 0) return (0, 0, 0);
        
        uint256 sqrt5MinusOne = SQRT5_SCALED - PRECISION;
        lower = (sqrt5MinusOne * radius) / PRECISION;
        upper = (4 * radius * PRECISION) / SQRT5_SCALED;
        reserveConstraint = (radius * PRECISION) / SQRT5_SCALED;
    }
    
    /**
     * @dev Square root function using Babylonian method
     */
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
    
    /**
     * @dev Generate example amounts for testing
     */
    function getExampleAmounts() public pure returns (uint256[5] memory amounts) {
        // Equal amounts: 1000 tokens each
        amounts[0] = 1000 * 1e18;
        amounts[1] = 1000 * 1e18;
        amounts[2] = 1000 * 1e18;
        amounts[3] = 1000 * 1e18;
        amounts[4] = 1000 * 1e18;
    }
    
    /**
     * @dev Generate varied amounts for testing
     */
    function getVariedAmounts() public pure returns (uint256[5] memory amounts) {
        // Varied amounts
        amounts[0] = 500 * 1e18;
        amounts[1] = 750 * 1e18;
        amounts[2] = 1000 * 1e18;
        amounts[3] = 1250 * 1e18;
        amounts[4] = 1500 * 1e18;
    }
    
    /**
     * @dev Generate small amounts for testing
     */
    function getSmallAmounts() public pure returns (uint256[5] memory amounts) {
        // Small amounts
        amounts[0] = 10 * 1e18;
        amounts[1] = 15 * 1e18;
        amounts[2] = 20 * 1e18;
        amounts[3] = 25 * 1e18;
        amounts[4] = 30 * 1e18;
    }
    
    /**
     * @dev Script to demonstrate usage
     */
    function run() external pure {
        console.log("=== Orbital Pool Helper Functions ===\n");
        
        // Example 1: Equal amounts
        uint256[5] memory equalAmounts = getExampleAmounts();
        uint256 k1 = calculateValidK(equalAmounts);
        console.log("Example 1 - Equal amounts (1000 each):");
        console.log("Valid k:", k1);
        console.log("Radius:", calculateRadius(equalAmounts));
        console.log("Is valid:", isValidK(k1, equalAmounts));
        
        (uint256 lower1, uint256 upper1, uint256 reserve1) = getKBounds(equalAmounts);
        console.log("K bounds - Lower:", lower1);
        console.log("K bounds - Upper:", upper1);
        console.log("Reserve constraint:", reserve1);
        
        console.log("\n");
        
        // Example 2: Varied amounts
        uint256[5] memory variedAmounts = getVariedAmounts();
        uint256 k2 = calculateValidK(variedAmounts);
        console.log("Example 2 - Varied amounts (500, 750, 1000, 1250, 1500):");
        console.log("Valid k:", k2);
        console.log("Radius:", calculateRadius(variedAmounts));
        console.log("Is valid:", isValidK(k2, variedAmounts));
        
        (uint256 lower2, uint256 upper2, uint256 reserve2) = getKBounds(variedAmounts);
        console.log("K bounds - Lower:", lower2);
        console.log("K bounds - Upper:", upper2);
        console.log("Reserve constraint:", reserve2);
        
        console.log("\n");
        
        // Example 3: Small amounts
        uint256[5] memory smallAmounts = getSmallAmounts();
        uint256 k3 = calculateValidK(smallAmounts);
        console.log("Example 3 - Small amounts (10, 15, 20, 25, 30):");
        console.log("Valid k:", k3);
        console.log("Radius:", calculateRadius(smallAmounts));
        console.log("Is valid:", isValidK(k3, smallAmounts));
        
        (uint256 lower3, uint256 upper3, uint256 reserve3) = getKBounds(smallAmounts);
        console.log("K bounds - Lower:", lower3);
        console.log("K bounds - Upper:", upper3);
        console.log("Reserve constraint:", reserve3);
    }
}
