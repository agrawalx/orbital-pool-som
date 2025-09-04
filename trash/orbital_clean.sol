// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.30;
// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// contract orbitalPool {
//     using SafeERC20 for IERC20;
    
//     uint256 public constant TOKENS_COUNT = 5; // 5 tokens pegged to USD 
//     uint256 private constant SQRT5_SCALED = 2236067977499790; // sqrt(5) * 1e15 for precision  
//     uint256 private constant PRECISION = 1e15;
    
//     // Token addresses for the 5 USD-pegged tokens
//     IERC20[TOKENS_COUNT] public tokens;

//     enum TickStatus {
//         Interior, 
//         Boundary
//     }
    
//     struct Tick {
//         uint256 r; // radius of tick (radius squared = sum of squared reserves)
//         uint256 k; // plane constant for the tick
//         uint256 liquidity; // total liquidity in the tick
//         uint256[TOKENS_COUNT] reserves; // reserves of each token in the tick (x vector)
//         uint256 totalLpShares; // total LP shares issued for this tick
//         mapping(address => uint256) lpShares; // mapping of LP address to their shares
//         TickStatus status; // status of the tick (Interior or Boundary)
//         uint256 accruedFees; // total fees accrued to this tick
//     }

//     struct ConsolidatedTickData {
//         uint256[TOKENS_COUNT] totalReserves;     // Sum of reserves across consolidated ticks
//         uint256[TOKENS_COUNT] sumSquaredReserves; // Sum of squared reserves
//         uint256 totalLiquidity;      // Combined liquidity
//         uint256 tickCount;           // Number of ticks in this consolidation
//         uint256 consolidatedRadius; // Combined radius for the consolidated tick
//         uint256 totalKBound; // Sum of k values for boundary ticks
//     }

//     // Fee configuration
//     uint256 public swapFee = 3000; // 0.3% in basis points
//     uint256 public constant FEE_DENOMINATOR = 1000000;
//     mapping (uint256 => Tick) public ticks; // k -> Tick
    
//     // Track active ticks for iteration
//     uint256[] public activeTicks;
//     mapping(uint256 => bool) public isActiveTick;

//     // Events
//     event LiquidityAdded(address indexed provider, uint256 k, uint256[TOKENS_COUNT] amounts, uint256 lpShares);
//     event Swap(address indexed trader, uint256 tokenIn, uint256 tokenOut, uint256 amountIn, uint256 amountOut, uint256 fee);
//     event TickStatusChanged(uint256 k, TickStatus oldStatus, TickStatus newStatus);
    
//     // Errors
//     error InvalidKValue();
//     error InvalidAmounts();
//     error TickAlreadyExists();
//     error InsufficientLiquidity();
//     error InvalidTokenIndex();
//     error SlippageExceeded();
//     error InsufficientOutputAmount();

//     constructor(IERC20[TOKENS_COUNT] memory _tokens) {
//         tokens = _tokens;
//     }

//     function addLiquidity(uint256 k , uint256[TOKENS_COUNT] memory amounts) external {
//         // Validate inputs
//         if (k == 0) revert InvalidKValue();
//         if (!_validateAmounts(amounts)) revert InvalidAmounts();

//         // Step 1: Check if tick exists
//         bool tickExists = ticks[k].r > 0;
        
//         // Store previous values for LP calculation (if tick exists)
//         uint256 previousRadius = tickExists ? ticks[k].r : 0;
//         uint256 previousTotalLpShares = tickExists ? ticks[k].totalLpShares : 0;
        
//         // Step 2: Calculate the radius using sum of square of reserves
        
        
//         // Step 3: Validate k bounds and create/update tick
//         if (!tickExists) {
//             uint256 radiusSquared = _calculateRadiusSquared(amounts);
//             uint256 radius = _sqrt(radiusSquared);
//             // Create new tick - validate k bounds
//             if (!_isValidK(k, radius)) revert InvalidKValue();
            
//             // Determine tick status based on reserve constraint
//             uint256 reserveConstraint = (radius * PRECISION) / SQRT5_SCALED;
//             TickStatus status = (reserveConstraint == k) ? TickStatus.Boundary : TickStatus.Interior;
            
//             // Create the tick
//             Tick storage newTick = ticks[k];
//             newTick.r = radius;
//             newTick.k = k;
//             newTick.liquidity = radius; // Initial liquidity equals radius
//             newTick.reserves = amounts;
//             newTick.status = status;
            
//             // Add to active ticks tracking
//             if (!isActiveTick[k]) {
//                 activeTicks.push(k);
//                 isActiveTick[k] = true;
//             }
            
//         } else {
//             // Add to existing tick - calculate new combined reserves
//             uint256[TOKENS_COUNT] memory newReserves;
//             for (uint256 i = 0; i < TOKENS_COUNT; i++) {
//                 newReserves[i] = ticks[k].reserves[i] + amounts[i];
//             }
            
//             // Calculate new radius with combined reserves
//             uint256 newRadiusSquared = _calculateRadiusSquared(newReserves);
//             uint256 newRadius = _sqrt(newRadiusSquared);
            
//             // Validate k bounds with new radius
//             if (!_isValidK(k, newRadius)) revert InvalidKValue();
            
//             // Update tick status based on new reserve constraint
//             uint256 reserveConstraint = (newRadius * PRECISION) / SQRT5_SCALED;
//             TickStatus newStatus = (reserveConstraint == k) ? TickStatus.Boundary : TickStatus.Interior;
            
//             // Update tick with new values
//             ticks[k].r = newRadius;
//             ticks[k].reserves = newReserves;
//             ticks[k].liquidity = newRadius;
//             ticks[k].status = newStatus;
//         }
        
//         // Step 4: Transfer tokens from liquidity provider
//         for (uint256 i = 0; i < TOKENS_COUNT; i++) {
//             if (amounts[i] > 0) {
//                 tokens[i].safeTransferFrom(msg.sender, address(this), amounts[i]);
//             }
//         }
        
//         // Step 5: Calculate how many LP shares to mint
//         uint256 lpShares;
//         if (!tickExists || previousTotalLpShares == 0) {
//             // First liquidity provider gets shares equal to radius
//             lpShares = ticks[k].r;
//         } else {
//             // Use corrected formula: ((newRadius - previousRadius) * totalLPSharesBeforeDeposit) / previousRadius
//             uint256 currentRadius = ticks[k].r;
//             uint256 radiusIncrease = currentRadius - previousRadius;
//             lpShares = (radiusIncrease * previousTotalLpShares) / previousRadius;
//         }
        
//         // Step 6: Mint LP shares to liquidity provider
//         ticks[k].lpShares[msg.sender] += lpShares;
        
//         // Step 7: Update tick data and pool data
//         ticks[k].totalLpShares += lpShares;
        
//         emit LiquidityAdded(msg.sender, k, amounts, lpShares);
//     }

//     /**
//      * @dev Swap tokens using the Orbital AMM with tick consolidation and boundary crossing
//      * @param tokenIn Index of input token (0-4)
//      * @param tokenOut Index of output token (0-4)
//      * @param amountIn Amount of input token
//      * @param minAmountOut Minimum amount of output token (slippage protection)
//      */
//     function swap(
//         uint256 tokenIn, 
//         uint256 tokenOut, 
//         uint256 amountIn, 
//         uint256 minAmountOut
//     ) external returns (uint256 amountOut) {
//         // Validate inputs
//         if (tokenIn >= TOKENS_COUNT || tokenOut >= TOKENS_COUNT) revert InvalidTokenIndex();
//         if (tokenIn == tokenOut) revert InvalidAmounts();
//         if (amountIn == 0) revert InvalidAmounts();
        
//         // Calculate fee
//         uint256 feeAmount = (amountIn * swapFee) / FEE_DENOMINATOR;
//         uint256 amountInAfterFee = amountIn - feeAmount;
        
//         // Transfer input token
//         tokens[tokenIn].safeTransferFrom(msg.sender, address(this), amountIn);
        
//         // Execute trade with segmentation and tick boundary crossing
//         amountOut = _executeTradeWithSegmentation(tokenIn, tokenOut, amountInAfterFee);
        
//         // Slippage check
//         if (amountOut < minAmountOut) revert SlippageExceeded();
        
//         // Transfer output token
//         tokens[tokenOut].safeTransfer(msg.sender, amountOut);
        
//         // Distribute fees proportionally across all ticks
//         _distributeFees(feeAmount, tokenIn);
        
//         emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut, feeAmount);
//     }

//     //////////////////////////////////
//     /////// Internal Functions ///////
//     //////////////////////////////////

//     /**
//      * @dev Execute trade with tick boundary crossing detection and segmentation
//      * Implements the trade segmentation process from the Orbital whitepaper
//      */
//     function _executeTradeWithSegmentation(
//         uint256 tokenIn, 
//         uint256 tokenOut, 
//         uint256 amountIn
//     ) internal returns (uint256 totalAmountOut) {
//         uint256 remainingAmountIn = amountIn;
//         totalAmountOut = 0;
        
//         while (remainingAmountIn > 0) {
//             // Step 1: Calculate consolidated tick data (interior and boundary)
//             (ConsolidatedTickData memory interiorData, ConsolidatedTickData memory boundaryData) = _getConsolidatedTickData();
            
//             // Step 2: Calculate current total reserves
//             uint256[TOKENS_COUNT] memory totalReserves = _calculateTotalReserves(interiorData, boundaryData);
            
//             // Step 3: Calculate trade assuming no boundary crossing using global torus invariant
//             (uint256 potentialAmountOut, uint256[TOKENS_COUNT] memory newTotalReserves) = 
//                 _calculateTradeWithGlobalInvariant(tokenIn, tokenOut, remainingAmountIn, totalReserves, interiorData, boundaryData);
            
//             // Step 4: Check for tick boundary crossings using normalization
//             (bool hasCrossing, uint256 crossingAmountIn) = _checkTickBoundaryCrossing(
//                 totalReserves, newTotalReserves, interiorData, boundaryData
//             );
            
//             if (!hasCrossing) {
//                 // No crossing - execute full remaining trade
//                 _updateTickReserves(tokenIn, tokenOut, remainingAmountIn, potentialAmountOut);
//                 totalAmountOut += potentialAmountOut;
//                 break;
//             } else {
//                 // Execute trade up to crossing point
//                 uint256 partialAmountOut = (potentialAmountOut * crossingAmountIn) / remainingAmountIn;
//                 _updateTickReserves(tokenIn, tokenOut, crossingAmountIn, partialAmountOut);
                
//                 // Update tick statuses at crossing point
//                 _updateTickStatusesAtCrossing(totalReserves, crossingAmountIn, tokenIn, tokenOut);
                
//                 totalAmountOut += partialAmountOut;
//                 remainingAmountIn -= crossingAmountIn;
//             }
//         }
//     }

//     /**
//      * @dev Get consolidated data for all interior and boundary ticks
//      * Implements tick consolidation as described in the whitepaper
//      */
//     function _getConsolidatedTickData() internal view returns (
//         ConsolidatedTickData memory interiorData,
//         ConsolidatedTickData memory boundaryData
//     ) {
//         // Initialize consolidated data structures
//         interiorData.totalLiquidity = 0;
//         interiorData.tickCount = 0;
//         interiorData.consolidatedRadius = 0;
//         boundaryData.totalLiquidity = 0;
//         boundaryData.tickCount = 0;
//         boundaryData.consolidatedRadius = 0;
//         boundaryData.totalKBound = 0;
        
//         // Iterate through all active ticks and consolidate by status
//         for (uint256 i = 0; i < activeTicks.length; i++) {
//             uint256 k = activeTicks[i];
//             Tick storage tick = ticks[k];
            
//             if (tick.r == 0) continue; // Skip empty ticks
            
//             if (tick.status == TickStatus.Interior) {
//                 // Consolidate interior ticks (Case 1 from whitepaper)
//                 interiorData.consolidatedRadius += tick.r;
//                 interiorData.totalLiquidity += tick.liquidity;
//                 interiorData.tickCount++;
                
//                 for (uint256 j = 0; j < TOKENS_COUNT; j++) {
//                     interiorData.totalReserves[j] += tick.reserves[j];
//                     interiorData.sumSquaredReserves[j] += tick.reserves[j] * tick.reserves[j];
//                 }
//             } else {
//                 // Consolidate boundary ticks (Case 2 from whitepaper)
//                 // For boundary ticks: s_c = s_a + s_b where s = sqrt(r² - (k - r/√n)²)
//                 uint256 s = _calculateBoundaryTickS(tick.r, tick.k);
//                 boundaryData.consolidatedRadius += s;
//                 boundaryData.totalLiquidity += tick.liquidity;
//                 boundaryData.tickCount++;
//                 boundaryData.totalKBound += tick.k;
                
//                 for (uint256 j = 0; j < TOKENS_COUNT; j++) {
//                     boundaryData.totalReserves[j] += tick.reserves[j];
//                     boundaryData.sumSquaredReserves[j] += tick.reserves[j] * tick.reserves[j];
//                 }
//             }
//         }
//     }

//     /**
//      * @dev Calculate s value for boundary tick: s = sqrt(r² - (k - r/√n)²)
//      */
//     function _calculateBoundaryTickS(uint256 r, uint256 k) internal pure returns (uint256) {
//         uint256 rOverSqrtN = (r * PRECISION) / _sqrt(TOKENS_COUNT * PRECISION * PRECISION);
//         uint256 term = (k > rOverSqrtN) ? k - rOverSqrtN : rOverSqrtN - k;
//         uint256 termSquared = term * term;
//         uint256 rSquared = r * r;
        
//         if (rSquared <= termSquared) return 0;
//         return _sqrt(rSquared - termSquared);
//     }

//     /**
//      * @dev Calculate total reserves from consolidated tick data
//      */
//     function _calculateTotalReserves(
//         ConsolidatedTickData memory interiorData,
//         ConsolidatedTickData memory boundaryData
//     ) internal pure returns (uint256[TOKENS_COUNT] memory totalReserves) {
//         for (uint256 i = 0; i < TOKENS_COUNT; i++) {
//             totalReserves[i] = interiorData.totalReserves[i] + boundaryData.totalReserves[i];
//         }
//     }

//     /**
//      * @dev Calculate trade using global torus invariant
//      * Implements the equation from the whitepaper:
//      * r_int² = ((x_total·v - k_bound) - r_int/√n)² + (||x_total - (x_total·v)v|| - s_bound)²
//      */
//     function _calculateTradeWithGlobalInvariant(
//         uint256 tokenIn,
//         uint256 tokenOut,
//         uint256 amountIn,
//         uint256[TOKENS_COUNT] memory currentReserves,
//         ConsolidatedTickData memory interiorData,
//         ConsolidatedTickData memory boundaryData
//     ) internal pure returns (uint256 amountOut, uint256[TOKENS_COUNT] memory newReserves) {
//         newReserves = currentReserves;
//         newReserves[tokenIn] += amountIn;
        
//         // Calculate alpha_total (projection onto v vector)
//         uint256 alphaTotal = _calculateAlpha(newReserves);
        
//         // Calculate orthogonal component magnitude
//         uint256 wTotalMagnitude = _calculateOrthogonalMagnitude(newReserves);
        
//         // Solve for output amount using the global torus invariant
//         // This is a simplified version - full implementation would use Newton's method
//         amountOut = _solveTorusInvariant(tokenIn, tokenOut, amountIn, currentReserves, interiorData, boundaryData);
        
//         if (amountOut > currentReserves[tokenOut]) {
//             amountOut = currentReserves[tokenOut];
//         }
//         newReserves[tokenOut] -= amountOut;
//     }

//     /**
//      * @dev Solve torus invariant equation - simplified version
//      * Full implementation would use Newton's method for the quartic equation
//      */
//     function _solveTorusInvariant(
//         uint256 tokenIn,
//         uint256 tokenOut,
//         uint256 amountIn,
//         uint256[TOKENS_COUNT] memory currentReserves,
//         ConsolidatedTickData memory interiorData,
//         ConsolidatedTickData memory boundaryData
//     ) internal pure returns (uint256 amountOut) {
//         // Simplified pricing using consolidated liquidity as approximation
//         uint256 totalLiquidity = interiorData.consolidatedRadius + boundaryData.consolidatedRadius;
//         if (totalLiquidity == 0) return 0;
        
//         // Use sphere AMM pricing formula as approximation: (r - x_j) / (r - x_i)
//         uint256 numerator = (totalLiquidity > currentReserves[tokenOut]) ? 
//             totalLiquidity - currentReserves[tokenOut] : 1;
//         uint256 denominator = (totalLiquidity > currentReserves[tokenIn]) ? 
//             totalLiquidity - currentReserves[tokenIn] + amountIn : 1;
            
//         amountOut = (amountIn * numerator) / denominator;
//     }

//     /**
//      * @dev Check for tick boundary crossings using normalization
//      */
//     function _checkTickBoundaryCrossing(
//         uint256[TOKENS_COUNT] memory currentReserves,
//         uint256[TOKENS_COUNT] memory newReserves,
//         ConsolidatedTickData memory interiorData,
//         ConsolidatedTickData memory boundaryData
//     ) internal view returns (bool hasCrossing, uint256 crossingAmountIn) {
//         // Calculate normalized alpha values
//         uint256 currentAlpha = _calculateAlpha(currentReserves);
//         uint256 newAlpha = _calculateAlpha(newReserves);
        
//         // Find k_int_min (minimum k of interior ticks) and k_bound_max (maximum k of boundary ticks)
//         (uint256 kIntMin, uint256 kBoundMax) = _findCriticalKValues();
        
//         // Check if normalized alpha crosses any boundaries
//         if (interiorData.consolidatedRadius > 0) {
//             uint256 currentAlphaNorm = _getNormalizedAlpha(currentAlpha, interiorData.consolidatedRadius);
//             uint256 newAlphaNorm = _getNormalizedAlpha(newAlpha, interiorData.consolidatedRadius);
            
//             // Check if we cross k_int_min or k_bound_max
//             uint256 kIntMinNorm = _getNormalizedK(kIntMin, interiorData.consolidatedRadius);
//             uint256 kBoundMaxNorm = _getNormalizedK(kBoundMax, boundaryData.consolidatedRadius);
            
//             if ((currentAlphaNorm < kIntMinNorm && newAlphaNorm >= kIntMinNorm) ||
//                 (currentAlphaNorm > kBoundMaxNorm && newAlphaNorm <= kBoundMaxNorm)) {
//                 hasCrossing = true;
//                 // Calculate crossing point (simplified)
//                 crossingAmountIn = amountIn / 2; // Simplified - should calculate exact crossing point
//             }
//         }
        
//         if (!hasCrossing) {
//             crossingAmountIn = 0;
//         }
//     }

//     /**
//      * @dev Find critical k values for boundary crossing detection
//      */
//     function _findCriticalKValues() internal view returns (uint256 kIntMin, uint256 kBoundMax) {
//         kIntMin = type(uint256).max;
//         kBoundMax = 0;
        
//         for (uint256 i = 0; i < activeTicks.length; i++) {
//             uint256 k = activeTicks[i];
//             Tick storage tick = ticks[k];
            
//             if (tick.r == 0) continue;
            
//             if (tick.status == TickStatus.Interior && k < kIntMin) {
//                 kIntMin = k;
//             } else if (tick.status == TickStatus.Boundary && k > kBoundMax) {
//                 kBoundMax = k;
//             }
//         }
        
//         if (kIntMin == type(uint256).max) kIntMin = 0;
//     }

//     /**
//      * @dev Update reserves in individual ticks after trade
//      */
//     function _updateTickReserves(
//         uint256 tokenIn,
//         uint256 tokenOut,
//         uint256 amountIn,
//         uint256 amountOut
//     ) internal {
//         // Update reserves proportionally across all active ticks
//         for (uint256 i = 0; i < activeTicks.length; i++) {
//             uint256 k = activeTicks[i];
//             Tick storage tick = ticks[k];
            
//             if (tick.r == 0) continue;
            
//             // Calculate this tick's proportion of total liquidity
//             uint256 totalLiquidity = 0;
//             for (uint256 j = 0; j < activeTicks.length; j++) {
//                 totalLiquidity += ticks[activeTicks[j]].liquidity;
//             }
            
//             if (totalLiquidity == 0) continue;
            
//             uint256 proportion = (tick.liquidity * PRECISION) / totalLiquidity;
            
//             // Update this tick's reserves proportionally
//             uint256 tickAmountIn = (amountIn * proportion) / PRECISION;
//             uint256 tickAmountOut = (amountOut * proportion) / PRECISION;
            
//             tick.reserves[tokenIn] += tickAmountIn;
//             if (tick.reserves[tokenOut] >= tickAmountOut) {
//                 tick.reserves[tokenOut] -= tickAmountOut;
//             }
            
//             // Recalculate radius for this tick
//             uint256 newRadiusSquared = _calculateRadiusSquared(tick.reserves);
//             tick.r = _sqrt(newRadiusSquared);
//             tick.liquidity = tick.r;
//         }
//     }

//     /**
//      * @dev Update tick statuses when crossing boundaries
//      */
//     function _updateTickStatusesAtCrossing(
//         uint256[TOKENS_COUNT] memory reserves,
//         uint256 crossingAmountIn,
//         uint256 tokenIn,
//         uint256 tokenOut
//     ) internal {
//         // Calculate new alpha after crossing
//         uint256 newAlpha = _calculateAlpha(reserves);
        
//         // Check each tick and update status if needed
//         for (uint256 i = 0; i < activeTicks.length; i++) {
//             uint256 k = activeTicks[i];
//             Tick storage tick = ticks[k];
            
//             if (tick.r == 0) continue;
            
//             // Calculate normalized values
//             uint256 alphaNorm = _getNormalizedAlpha(newAlpha, tick.r);
//             uint256 kNorm = _getNormalizedK(k, tick.r);
            
//             TickStatus oldStatus = tick.status;
//             TickStatus newStatus = _shouldBeInterior(alphaNorm, kNorm) ? TickStatus.Interior : TickStatus.Boundary;
            
//             if (oldStatus != newStatus) {
//                 tick.status = newStatus;
//                 emit TickStatusChanged(k, oldStatus, newStatus);
//             }
//         }
//     }

//     /**
//      * @dev Distribute fees proportionally across active ticks
//      */
//     function _distributeFees(uint256 feeAmount, uint256 tokenIn) internal {
//         uint256 totalLiquidity = 0;
        
//         // Calculate total liquidity across all ticks
//         for (uint256 i = 0; i < activeTicks.length; i++) {
//             totalLiquidity += ticks[activeTicks[i]].liquidity;
//         }
        
//         if (totalLiquidity == 0) return;
        
//         // Distribute fees proportionally
//         for (uint256 i = 0; i < activeTicks.length; i++) {
//             uint256 k = activeTicks[i];
//             Tick storage tick = ticks[k];
            
//             if (tick.liquidity == 0) continue;
            
//             uint256 tickFee = (feeAmount * tick.liquidity) / totalLiquidity;
//             tick.accruedFees += tickFee;
//         }
//     }

//     /**
//      * @dev Calculate radius squared from amounts (sum of squared reserves)
//      */
//     function _calculateRadiusSquared(uint256[TOKENS_COUNT] memory amounts) internal pure returns (uint256) {
//         uint256 sum = 0;
//         for (uint256 i = 0; i < TOKENS_COUNT; i++) {
//             sum += amounts[i] * amounts[i];
//         }
//         return sum;
//     }

//     /**
//      * @dev Validate that all amounts are greater than zero
//      */
//     function _validateAmounts(uint256[TOKENS_COUNT] memory amounts) internal pure returns (bool) {
//         for (uint256 i = 0; i < TOKENS_COUNT; i++) {
//             if (amounts[i] == 0) {
//                 return false;
//             }
//         }
//         return true;
//     }

//     /**
//      * @dev Calculate square root using Babylonian method
//      */
//     function _sqrt(uint256 x) internal pure returns (uint256) {
//         if (x == 0) return 0;
        
//         uint256 z = (x + 1) / 2;
//         uint256 y = x;
//         while (z < y) {
//             y = z;
//             z = (x / z + z) / 2;
//         }
//         return y;
//     }

//     /**
//      * @dev Validate if k is within valid bounds for given radius
//      * k should be between (sqrt(5) - 1) * r and 4 * r / sqrt(5)
//      */
//     function _isValidK(uint256 k, uint256 radius) internal pure returns (bool) {
//         if (radius == 0) return false;
        
//         // Calculate bounds: (sqrt(5) - 1) * r and 4 * r / sqrt(5)
//         uint256 sqrt5MinusOne = SQRT5_SCALED - PRECISION;
//         uint256 lowerBound = (sqrt5MinusOne * radius) / PRECISION;
//         uint256 upperBound = (4 * radius * PRECISION) / SQRT5_SCALED;
        
//         // Check if k is within bounds
//         if (k < lowerBound || k > upperBound) return false;
        
//         // Additional check: (Total Reserve) / sqrt(5) <= K
//         uint256 reserveConstraint = (radius * PRECISION) / SQRT5_SCALED;
//         return k >= reserveConstraint;
//     }

//     /**
//      * @dev Calculate alpha (projection onto v vector): (1/n) * sum of all reserves
//      */
//     function _calculateAlpha(uint256[TOKENS_COUNT] memory reserves) internal pure returns (uint256) {
//         uint256 sum = 0;
//         for (uint256 i = 0; i < TOKENS_COUNT; i++) {
//             sum += reserves[i];
//         }
//         return sum / TOKENS_COUNT;
//     }

//     /**
//      * @dev Calculate the orthogonal component magnitude ||w|| for polar decomposition
//      * ||w||² = ||x||² - ||α·v||² = sum(x_i²) - (1/n) * (sum(x_i))²
//      */
//     function _calculateOrthogonalMagnitude(uint256[TOKENS_COUNT] memory reserves) internal pure returns (uint256) {
//         uint256 alpha = _calculateAlpha(reserves);
//         uint256 sumSquares = 0;
//         uint256 alphaSquaredTimesN = alpha * alpha * TOKENS_COUNT;
        
//         for (uint256 i = 0; i < TOKENS_COUNT; i++) {
//             sumSquares += reserves[i] * reserves[i];
//         }
        
//         // ||w||² = sum(x_i²) - (1/n) * (sum(x_i))²
//         if (sumSquares <= alphaSquaredTimesN) return 0;
//         uint256 wSquared = sumSquares - alphaSquaredTimesN;
//         return _sqrt(wSquared);
//     }

//     /**
//      * @dev Calculate normalized k value for a tick: k/r
//      */
//     function _getNormalizedK(uint256 k, uint256 r) internal pure returns (uint256) {
//         if (r == 0) return 0;
//         return (k * PRECISION) / r;
//     }

//     /**
//      * @dev Calculate normalized alpha: α/r  
//      */
//     function _getNormalizedAlpha(uint256 alpha, uint256 r) internal pure returns (uint256) {
//         if (r == 0) return 0;
//         return (alpha * PRECISION) / r;
//     }

//     /**
//      * @dev Check if tick should be interior or boundary based on normalized values
//      * Tick is interior if α_norm < k_norm
//      */
//     function _shouldBeInterior(uint256 alphaNorm, uint256 kNorm) internal pure returns (bool) {
//         return alphaNorm < kNorm;
//     }

//     /**
//      * @dev Get total reserves across all tokens for utility
//      */
//     function _getTotalReserve(uint256[TOKENS_COUNT] memory amounts) internal pure returns (uint256) {
//         uint256 total = 0;
//         for (uint256 i = 0; i < TOKENS_COUNT; i++) {
//             total += amounts[i];
//         }
//         return total;
//     }

//     /**
//      * @dev Get tick information for external queries
//      */
//     function getTickInfo(uint256 k) external view returns (
//         uint256 r,
//         uint256 liquidity,
//         uint256[TOKENS_COUNT] memory reserves,
//         uint256 totalLpShares,
//         TickStatus status
//     ) {
//         Tick storage tick = ticks[k];
//         return (
//             tick.r,
//             tick.liquidity,
//             tick.reserves,
//             tick.totalLpShares,
//             tick.status
//         );
//     }

//     /**
//      * @dev Get user's LP share balance for a specific tick
//      */
//     function getUserLpShares(uint256 k, address user) external view returns (uint256) {
//         return ticks[k].lpShares[user];
//     }

//     /**
//      * @dev Get all active tick k values
//      */
//     function getActiveTicks() external view returns (uint256[] memory) {
//         return activeTicks;
//     }
// }
