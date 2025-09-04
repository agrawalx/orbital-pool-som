// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../script/Deploy.s.sol";
import "../script/DeploymentHelper.s.sol";

/**
 * @title DeploymentTest
 * @dev Test the deployment script to ensure it works correctly
 */
contract DeploymentTest is Test {
    DeployScript deployScript;
    DeploymentHelper helper;
    
    function setUp() public {
        deployScript = new DeployScript();
        helper = new DeploymentHelper();
    }
    
    function test_DeploymentScript() public {
        // Deploy the contracts
        vm.deal(address(this), 10 ether); // Give test account some ETH
        
        // Mock the environment variable for testing
        vm.setEnv("PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
        
        // Run deployment
        deployScript.run();
        
        // The deployment script should complete without reverting
        // In a real test, you could verify the deployed contract addresses
        // and ensure they work correctly
    }
    
    function test_HelperFunctions() public view {
        // Test the helper functions
        uint256[5] memory amounts = helper.getExampleAmounts();
        
        // Verify amounts are correct
        for (uint i = 0; i < 5; i++) {
            assertEq(amounts[i], 1000 * 1e18);
        }
        
        // Test k calculation
        uint256 k = helper.calculateValidK(amounts);
        assertGt(k, 0);
        
        // Test k validation
        assertTrue(helper.isValidK(k, amounts));
        
        // Test radius calculation
        uint256 radius = helper.calculateRadius(amounts);
        assertGt(radius, 0);
        
        // Expected radius for equal amounts: sqrt(5 * 1000^2 * 1e36) = 1000 * sqrt(5) * 1e18
        uint256 expectedRadius = 2236067977499789696409; // sqrt(5) * 1000 * 1e18
        assertApproxEqAbs(radius, expectedRadius, 1e15); // Allow small precision error
        
        // Test bounds calculation
        (uint256 lower, uint256 upper, uint256 reserveConstraint) = helper.getKBounds(amounts);
        assertGt(lower, 0);
        assertGt(upper, lower);
        assertGt(reserveConstraint, 0);
        assertGe(k, lower);
        assertLe(k, upper);
        assertGe(k, reserveConstraint);
    }
    
    function test_VariedAmounts() public view {
        uint256[5] memory amounts = helper.getVariedAmounts();
        
        // Verify amounts are correct
        assertEq(amounts[0], 500 * 1e18);
        assertEq(amounts[1], 750 * 1e18);
        assertEq(amounts[2], 1000 * 1e18);
        assertEq(amounts[3], 1250 * 1e18);
        assertEq(amounts[4], 1500 * 1e18);
        
        uint256 k = helper.calculateValidK(amounts);
        assertTrue(helper.isValidK(k, amounts));
    }
    
    function test_SmallAmounts() public view {
        uint256[5] memory amounts = helper.getSmallAmounts();
        
        // Verify amounts are correct
        assertEq(amounts[0], 10 * 1e18);
        assertEq(amounts[1], 15 * 1e18);
        assertEq(amounts[2], 20 * 1e18);
        assertEq(amounts[3], 25 * 1e18);
        assertEq(amounts[4], 30 * 1e18);
        
        uint256 k = helper.calculateValidK(amounts);
        assertTrue(helper.isValidK(k, amounts));
    }
}
