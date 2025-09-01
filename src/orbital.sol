
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract orbitalPool {
    uint256 public constant TOKENS_COUNT = 5; // 5 tokens pegged to USD 

    enum TickStatus {
        Interior, 
        Boundary
    }
    
    struct Tick {
        uint256 r; // radius of tick (radius squared = sum of squared reserves)
        uint256 k; // plane constant for the tick
        uint256 liquidity; // total liquidity in the tick
        uint256[TOKENS_COUNT] reserves; // reserves of each token in the tick (x vector)
        uint256 totalLpShares; // total LP shares issued for this tick
        mapping(address => uint256) lpShares; // mapping of LP address to their shares
        TickStatus status; // status of the tick (Interior or Boundary)
        uint256 accruedFees; // total fees accrued to this tick
    }

    struct ConsolidatedTickData {
        uint256[TOKENS_COUNT] totalReserves;     // Sum of reserves across consolidated ticks
        uint256[TOKENS_COUNT] sumSquaredReserves; // Sum of squared reserves
        uint256 totalLiquidity;      // Combined liquidity
        uint256 tickCount;           // Number of ticks in this consolidation
    }

    // Fee configuration
    uint256 public swapFee = 3000; // 0.3% in basis points
    uint256 public constant FEE_DENOMINATOR = 1000000;
    
    function addLiquidity(uint256 k , uint256[TOKENS_COUNT] memory amounts) external {
        // Step 1: Check if tick exists, if not create it. check if there exists a tick with same k
        // step 2: calculate the radius using sum of square of reserves
        // step 3: if tick does not exist. check if k is valid and between minimal and maximal bounds. then check if amounts are greater than minimum required and x.v <= K 
        //         if tick exists, add liquidity to existing tick, check k is bounded by new R constraints. check the plane constraint and then update radius 
        // step 4: transfer tokens from liquidity provider
        // step 5: calculate how many lp shares to mint
        // step 6: mint lp shares to liquidity provider
        // step 7: update tick data and pool data
    }

    // implement remove liquidity
    // implement swap function
    // implement tick consolidation functions
    // implement the global trade invariant function
    // implement the normalization and trade segmentation functions 
}