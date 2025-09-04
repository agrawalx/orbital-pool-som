// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/orbital.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 1e18);
    }
}

contract DebugTest is Test {
    orbitalPool public pool;
    MockToken[5] public tokens;
    IERC20[5] public poolTokens;
    
    uint256 public constant PRECISION = 1e15;
    uint256 public constant SQRT5_SCALED = 2236067977499790;
    
    function setUp() public {
        for (uint i = 0; i < 5; i++) {
            tokens[i] = new MockToken(string(abi.encodePacked("Token", i)), string(abi.encodePacked("TK", i)));
            poolTokens[i] = IERC20(address(tokens[i]));
        }
        pool = new orbitalPool(poolTokens);
    }
    
    function test_CalculateValidK() public {
        uint256[5] memory amounts = [uint256(1000 * 1e18), uint256(1000 * 1e18), uint256(1000 * 1e18), uint256(1000 * 1e18), uint256(1000 * 1e18)];
        
        // Calculate radius
        uint256 radiusSquared = 0;
        for (uint i = 0; i < 5; i++) {
            radiusSquared += amounts[i] * amounts[i];
        }
        uint256 radius = _sqrt(radiusSquared);
        
        console.log("Radius:", radius);
        
        // Calculate bounds
        uint256 sqrt5MinusOne = SQRT5_SCALED - PRECISION;
        uint256 lowerBound = (sqrt5MinusOne * radius) / PRECISION;
        uint256 upperBound = (4 * radius * PRECISION) / SQRT5_SCALED;
        uint256 reserveConstraint = (radius * PRECISION) / SQRT5_SCALED;
        
        console.log("Lower bound:", lowerBound);
        console.log("Upper bound:", upperBound);
        console.log("Reserve constraint:", reserveConstraint);
        console.log("Max of lower bound and reserve constraint:", lowerBound > reserveConstraint ? lowerBound : reserveConstraint);
        
        // Test with valid k
        uint256 validK = (lowerBound > reserveConstraint ? lowerBound : reserveConstraint) + 1e18;
        console.log("Testing k:", validK);
        
        // Approve tokens
        for (uint i = 0; i < 5; i++) {
            tokens[i].approve(address(pool), amounts[i]);
        }
        
        pool.addLiquidity(validK, amounts);
        
        (uint256 r, , , , ) = pool.getTickInfo(validK);
        assertGt(r, 0);
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
}
