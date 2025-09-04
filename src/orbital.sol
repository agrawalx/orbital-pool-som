// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract orbitalPool {
    using SafeERC20 for IERC20;
    
    uint256 public constant TOKENS_COUNT = 5; // 5 tokens pegged to USD 
    uint256 private constant SQRT5_SCALED = 2236067977499790; // sqrt(5) * 1e15 for precision  
    uint256 private constant PRECISION = 1e15;
    
    // Token addresses for the 5 USD-pegged tokens
    IERC20[TOKENS_COUNT] public tokens;

    enum TickStatus {
        Interior, 
        Boundary
    }
    
    struct Tick {
        uint256 r; // radius of tick 
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
        uint256 consolidatedRadius; // Combined radius for the consolidated tick
        uint256 totalKBound; // Sum of k values for boundary ticks
    }

    // Fee configuration
    uint256 public swapFee = 3000; // 0.3% in basis points
    uint256 public constant FEE_DENOMINATOR = 1000000;
    mapping (uint256 => Tick) public ticks; // k -> Tick
    
    // Track active ticks for iteration
    uint256[] public activeTicks;
    mapping(uint256 => bool) public isActiveTick;

    // Events
    event LiquidityAdded(address indexed provider, uint256 k, uint256[TOKENS_COUNT] amounts, uint256 lpShares);
    event Swap(address indexed trader, uint256 tokenIn, uint256 tokenOut, uint256 amountIn, uint256 amountOut, uint256 fee);
    event TickStatusChanged(uint256 k, TickStatus oldStatus, TickStatus newStatus);
    
    // Errors
    error InvalidKValue();
    error InvalidAmounts();
    error TickAlreadyExists();
    error InsufficientLiquidity();
    error InvalidTokenIndex();
    error SlippageExceeded();

    constructor(IERC20[TOKENS_COUNT] memory _tokens) {
        tokens = _tokens;
    }

    function addLiquidity(uint256 k , uint256[TOKENS_COUNT] memory amounts) external {
        // Validate inputs
        if (k == 0) revert InvalidKValue();
        if (!_validateAmounts(amounts)) revert InvalidAmounts();

        // Step 1: Check if tick exists
        bool tickExists = ticks[k].r > 0;
        
        // Store previous values for LP calculation (if tick exists)
        uint256 previousRadius = tickExists ? ticks[k].r : 0;
        uint256 previousTotalLpShares = tickExists ? ticks[k].totalLpShares : 0;
        
        // Step 2 & 3: Calculate radius and validate k bounds
        if (!tickExists) {
            uint256 radiusSquared = _calculateRadiusSquared(amounts);
            uint256 radius = _sqrt(radiusSquared);
            if (!_isValidK(k, radius)) revert InvalidKValue();
            
            // Determine tick status: boundary if reserve constraint = k, else interior
            uint256 reserveConstraint = (radius * PRECISION) / SQRT5_SCALED;
            TickStatus status = (reserveConstraint == k) ? TickStatus.Boundary : TickStatus.Interior;
            
            // Create the tick
            Tick storage newTick = ticks[k];
            newTick.r = radius;
            newTick.k = k;
            newTick.liquidity = radius;
            newTick.reserves = amounts;
            newTick.status = status;
            
            // Add to active ticks tracking
            if (!isActiveTick[k]) {
                activeTicks.push(k);
                isActiveTick[k] = true;
            }
            
        } else {
            // Add to existing tick
            uint256[TOKENS_COUNT] memory newReserves;
            for (uint256 i = 0; i < TOKENS_COUNT; i++) {
                newReserves[i] = ticks[k].reserves[i] + amounts[i];
            }
            
            uint256 newRadiusSquared = _calculateRadiusSquared(newReserves);
            uint256 newRadius = _sqrt(newRadiusSquared);
            
            if (!_isValidK(k, newRadius)) revert InvalidKValue();
            
            // Update tick status
            uint256 reserveConstraint = (newRadius * PRECISION) / SQRT5_SCALED;
            TickStatus newStatus = (reserveConstraint == k) ? TickStatus.Boundary : TickStatus.Interior;
            
            ticks[k].r = newRadius;
            ticks[k].reserves = newReserves;
            ticks[k].liquidity = newRadius;
            ticks[k].status = newStatus;
        }
        
        // Step 4: Transfer tokens
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            if (amounts[i] > 0) {
                tokens[i].safeTransferFrom(msg.sender, address(this), amounts[i]);
            }
        }
        
        // Step 5: Calculate LP shares
        uint256 lpShares;
        if (!tickExists || previousTotalLpShares == 0) {
            lpShares = ticks[k].r;
        } else {
            // Corrected formula: ((newRadius - previousRadius) * totalLPSharesBeforeDeposit) / previousRadius
            uint256 currentRadius = ticks[k].r;
            if (currentRadius > previousRadius) {
                uint256 radiusIncrease = currentRadius - previousRadius;
                lpShares = (radiusIncrease * previousTotalLpShares) / previousRadius;
            } else {
                // If radius didn't increase or decreased, give minimal shares
                lpShares = 1;
            }
        }
        
        // Step 6 & 7: Mint shares and update data
        ticks[k].lpShares[msg.sender] += lpShares;
        ticks[k].totalLpShares += lpShares;
        
        emit LiquidityAdded(msg.sender, k, amounts, lpShares);
    }

    /**
     * @dev Swap tokens using Orbital AMM with proper invariant calculation
     * Based on reference implementation but adapted to fixed array structure
     */
    function swap(
        uint256 tokenIn, 
        uint256 tokenOut, 
        uint256 amountIn, 
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        // Validate inputs
        if (tokenIn >= TOKENS_COUNT || tokenOut >= TOKENS_COUNT) revert InvalidTokenIndex();
        if (tokenIn == tokenOut) revert InvalidAmounts();
        if (amountIn == 0) revert InvalidAmounts();
        
        // Transfer input token first
        tokens[tokenIn].safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Apply fee
        uint256 amountInAfterFee = (amountIn * (FEE_DENOMINATOR - swapFee)) / FEE_DENOMINATOR;
        
        // Get current total reserves across all ticks
        uint256[TOKENS_COUNT] memory totalReserves = _getTotalReserves();
        
                // Calculate output amount using torus invariant
        amountOut = _calculateSwapOutput(
            totalReserves,
            tokenIn,
            tokenOut,
            amountInAfterFee
        );
        
        // Slippage check
        if (amountOut < minAmountOut) revert SlippageExceeded();
        
        // Update reserves and check for tick crossings
        totalReserves[tokenIn] += amountInAfterFee;
        if (totalReserves[tokenOut] >= amountOut) {
            totalReserves[tokenOut] -= amountOut;
        } else {
            // Safety: If not enough reserves, set to 0 (this shouldn't happen in normal operation)
            totalReserves[tokenOut] = 0;
        }
        _updateTickReservesWithCrossings(totalReserves);
        
        // Transfer output token
        tokens[tokenOut].safeTransfer(msg.sender, amountOut);
        
        // Distribute fees proportionally
        _distributeFees(amountIn - amountInAfterFee, tokenIn);
        
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut, amountIn - amountInAfterFee);
    }

      
    /**
     * @dev Get consolidated data for interior and boundary ticks
     * Implements tick consolidation from Section "Tick Consolidation"
     */
    function _getConsolidatedTickData() internal view returns (
        ConsolidatedTickData memory interiorData,
        ConsolidatedTickData memory boundaryData
    ) {
        // Initialize structures
        interiorData.consolidatedRadius = 0;
        boundaryData.consolidatedRadius = 0;
        boundaryData.totalKBound = 0;
        
        // Consolidate all ticks by status
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            Tick storage tick = ticks[k];
            
            if (tick.r == 0) continue;
            
            if (tick.status == TickStatus.Interior) {
                // Interior tick consolidation: r_c = r_a + r_b
                interiorData.consolidatedRadius += tick.r;
                interiorData.totalLiquidity += tick.liquidity;
                interiorData.tickCount++;
                
                for (uint256 j = 0; j < TOKENS_COUNT; j++) {
                    interiorData.totalReserves[j] += tick.reserves[j];
                    interiorData.sumSquaredReserves[j] += tick.reserves[j] * tick.reserves[j];
                }
            } else {
                // Boundary tick consolidation: s_c = s_a + s_b
                uint256 s = _calculateBoundaryTickS(tick.r, tick.k);
                boundaryData.consolidatedRadius += s;
                boundaryData.totalLiquidity += tick.liquidity;
                boundaryData.tickCount++;
                boundaryData.totalKBound += tick.k;
                
                for (uint256 j = 0; j < TOKENS_COUNT; j++) {
                    boundaryData.totalReserves[j] += tick.reserves[j];
                    boundaryData.sumSquaredReserves[j] += tick.reserves[j] * tick.reserves[j];
                }
            }
        }
    }

    /**
     * @dev Calculate s value for boundary tick: s = sqrt(r² - (k - r/√n)²)
     */
    function _calculateBoundaryTickS(uint256 r, uint256 k) internal pure returns (uint256) {
        uint256 sqrtN = _sqrt(TOKENS_COUNT * PRECISION * PRECISION);
        uint256 rOverSqrtN = (r * PRECISION) / sqrtN;
        
        uint256 diff = (k > rOverSqrtN) ? k - rOverSqrtN : rOverSqrtN - k;
        uint256 diffSquared = diff * diff;
        uint256 rSquared = r * r;
        
        if (rSquared <= diffSquared) return 0;
        return _sqrt(rSquared - diffSquared);
    }

    /**
     * @dev Calculate total reserves from consolidated data
     */
    function _calculateTotalReserves(
        ConsolidatedTickData memory interiorData,
        ConsolidatedTickData memory boundaryData
    ) internal pure returns (uint256[TOKENS_COUNT] memory totalReserves) {
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            totalReserves[i] = interiorData.totalReserves[i] + boundaryData.totalReserves[i];
        }
    }

   

    /**
     * @dev Check for tick boundary crossings using normalization
     * Implements the boundary crossing detection from Section "Crossing Ticks"
     */
    function _checkTickBoundaryCrossing(
        uint256[TOKENS_COUNT] memory currentReserves,
        uint256[TOKENS_COUNT] memory newReserves,
        ConsolidatedTickData memory interiorData,
        ConsolidatedTickData memory boundaryData,
        uint256 tradeAmountIn
    ) internal view returns (bool hasCrossing, uint256 crossingAmountIn) {
        // Calculate normalized alpha values
        uint256 currentAlpha = _calculateAlpha(currentReserves);
        uint256 newAlpha = _calculateAlpha(newReserves);
        
        // Find critical k values for crossing detection
        (uint256 kIntMin, uint256 kBoundMax) = _findCriticalKValues();
        
        // Check boundary crossing using normalized values
        if (interiorData.consolidatedRadius > 0 && (kIntMin > 0 || kBoundMax > 0)) {
            uint256 currentAlphaNorm = _getNormalizedAlpha(currentAlpha, interiorData.consolidatedRadius);
            uint256 newAlphaNorm = _getNormalizedAlpha(newAlpha, interiorData.consolidatedRadius);
            
            uint256 kIntMinNorm = kIntMin > 0 ? _getNormalizedK(kIntMin, interiorData.consolidatedRadius) : 0;
            uint256 kBoundMaxNorm = kBoundMax > 0 ? _getNormalizedK(kBoundMax, boundaryData.consolidatedRadius) : 0;
            
            // Check if we cross any boundaries
            if ((kIntMinNorm > 0 && currentAlphaNorm < kIntMinNorm && newAlphaNorm >= kIntMinNorm) ||
                (kBoundMaxNorm > 0 && currentAlphaNorm > kBoundMaxNorm && newAlphaNorm <= kBoundMaxNorm)) {
                hasCrossing = true;
                crossingAmountIn = tradeAmountIn / 2; // Simplified crossing point calculation
            }
        }
        
        if (!hasCrossing) {
            crossingAmountIn = 0;
        }
    }

    /**
     * @dev Find critical k values for boundary crossing detection
     */
    function _findCriticalKValues() internal view returns (uint256 kIntMin, uint256 kBoundMax) {
        kIntMin = type(uint256).max;
        kBoundMax = 0;
        
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            Tick storage tick = ticks[k];
            
            if (tick.r == 0) continue;
            
            if (tick.status == TickStatus.Interior && k < kIntMin) {
                kIntMin = k;
            } else if (tick.status == TickStatus.Boundary && k > kBoundMax) {
                kBoundMax = k;
            }
        }
        
        if (kIntMin == type(uint256).max) kIntMin = 0;
    }

    /**
     * @dev Update reserves in individual ticks after trade
     */
    function _updateTickReserves(
        uint256 tokenIn,
        uint256 tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) internal {
        uint256 totalLiquidity = 0;
        
        // Calculate total liquidity for proportional distribution
        for (uint256 i = 0; i < activeTicks.length; i++) {
            totalLiquidity += ticks[activeTicks[i]].liquidity;
        }
        
        if (totalLiquidity == 0) return;
        
        // Update each tick proportionally
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            Tick storage tick = ticks[k];
            
            if (tick.liquidity == 0) continue;
            
            uint256 proportion = (tick.liquidity * PRECISION) / totalLiquidity;
            uint256 tickAmountIn = (amountIn * proportion) / PRECISION;
            uint256 tickAmountOut = (amountOut * proportion) / PRECISION;
            
            tick.reserves[tokenIn] += tickAmountIn;
            if (tick.reserves[tokenOut] >= tickAmountOut) {
                tick.reserves[tokenOut] -= tickAmountOut;
            }
            
            // Recalculate radius and liquidity
            uint256 newRadiusSquared = _calculateRadiusSquared(tick.reserves);
            tick.r = _sqrt(newRadiusSquared);
            tick.liquidity = tick.r;
        }
    }

    /**
     * @dev Update tick statuses when crossing boundaries
     * Implements status updates during boundary crossings
     */
    function _updateTickStatusesAtCrossing(
        uint256 /* tokenIn */,
        uint256 /* tokenOut */,
        uint256 /* crossingAmountIn */
    ) internal {
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            Tick storage tick = ticks[k];
            
            if (tick.r == 0) continue;
            
            // Recalculate status based on current reserves
            uint256 reserveConstraint = (tick.r * PRECISION) / SQRT5_SCALED;
            TickStatus oldStatus = tick.status;
            TickStatus newStatus = (reserveConstraint == k) ? TickStatus.Boundary : TickStatus.Interior;
            
            if (oldStatus != newStatus) {
                tick.status = newStatus;
                emit TickStatusChanged(k, oldStatus, newStatus);
            }
        }
    }

    /**
     * @dev Distribute fees proportionally across active ticks
     */
    function _distributeFees(uint256 feeAmount, uint256 /* tokenIn */) internal {
        uint256 totalLiquidity = 0;
        
        for (uint256 i = 0; i < activeTicks.length; i++) {
            totalLiquidity += ticks[activeTicks[i]].liquidity;
        }
        
        if (totalLiquidity == 0) return;
        
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            Tick storage tick = ticks[k];
            
            if (tick.liquidity == 0) continue;
            
            uint256 tickFee = (feeAmount * tick.liquidity) / totalLiquidity;
            tick.accruedFees += tickFee;
        }
    }

    /**
     * @dev Calculate radius squared from amounts
     */
    function _calculateRadiusSquared(uint256[TOKENS_COUNT] memory amounts) internal pure returns (uint256) {
        uint256 sum = 0;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            sum += amounts[i] * amounts[i];
        }
        return sum;
    }

    /**
     * @dev Validate that all amounts are greater than zero
     */
    function _validateAmounts(uint256[TOKENS_COUNT] memory amounts) internal pure returns (bool) {
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            if (amounts[i] == 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * @dev Calculate square root using Babylonian method
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
     * @dev Validate k bounds: (√5-1)*r ≤ k ≤ 4*r/√5 and r/√5 ≤ k
     */
    function _isValidK(uint256 k, uint256 radius) internal pure returns (bool) {
        if (radius == 0) return false;
        
        uint256 sqrt5MinusOne = SQRT5_SCALED - PRECISION;
        uint256 lowerBound = (sqrt5MinusOne * radius) / PRECISION;
        uint256 upperBound = (4 * radius * PRECISION) / SQRT5_SCALED;
        
        if (k < lowerBound || k > upperBound) return false;
        
        uint256 reserveConstraint = (radius * PRECISION) / SQRT5_SCALED;
        return k >= reserveConstraint;
    }

    /**
     * @dev Calculate alpha: (1/n) * sum of all reserves
     */
    function _calculateAlpha(uint256[TOKENS_COUNT] memory reserves) internal pure returns (uint256) {
        uint256 sum = 0;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            sum += reserves[i];
        }
        return sum / TOKENS_COUNT;
    }

    /**
     * @dev Calculate orthogonal component magnitude ||w||
     */
    function _calculateOrthogonalMagnitude(uint256[TOKENS_COUNT] memory reserves) internal pure returns (uint256) {
        uint256 alpha = _calculateAlpha(reserves);
        uint256 sumSquares = 0;
        uint256 alphaSquaredTimesN = alpha * alpha * TOKENS_COUNT;
        
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            sumSquares += reserves[i] * reserves[i];
        }
        
        if (sumSquares <= alphaSquaredTimesN) return 0;
        return _sqrt(sumSquares - alphaSquaredTimesN);
    }

    /**
     * @dev Calculate normalized k: k/r
     */
    function _getNormalizedK(uint256 k, uint256 r) internal pure returns (uint256) {
        if (r == 0) return 0;
        return (k * PRECISION) / r;
    }

    /**
     * @dev Calculate normalized alpha: α/r
     */
    function _getNormalizedAlpha(uint256 alpha, uint256 r) internal pure returns (uint256) {
        if (r == 0) return 0;
        return (alpha * PRECISION) / r;
    }

    /**
     * @dev Check if tick should be interior: α_norm < k_norm
     */
    function _shouldBeInterior(uint256 alphaNorm, uint256 kNorm) internal pure returns (bool) {
        return alphaNorm < kNorm;
    }

    /**
     * @dev Get tick information for external queries
     */
    function getTickInfo(uint256 k) external view returns (
        uint256 r,
        uint256 liquidity,
        uint256[TOKENS_COUNT] memory reserves,
        uint256 totalLpShares,
        TickStatus status
    ) {
        Tick storage tick = ticks[k];
        return (
            tick.r,
            tick.liquidity,
            tick.reserves,
            tick.totalLpShares,
            tick.status
        );
    }

    /**
     * @dev Get user's LP share balance for a specific tick
     */
    function getUserLpShares(uint256 k, address user) external view returns (uint256) {
        return ticks[k].lpShares[user];
    }

    /**
     * @dev Get all active tick k values
     */
    function getActiveTicks() external view returns (uint256[] memory) {
        return activeTicks;
    }

    /**
     * @dev Get total reserves across all active ticks
     */
    function _getTotalReserves() public view returns (uint256[TOKENS_COUNT] memory totalReserves) {
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            Tick storage tick = ticks[k];
            if (tick.r > 0) {
                for (uint256 j = 0; j < TOKENS_COUNT; j++) {
                    totalReserves[j] += tick.reserves[j];
                }
            }
        }
    }

    /**
     * @dev Calculate swap output maintaining torus invariant using Newton's method
     * Adapted from Rust implementation for better precision and efficiency
     */
    function _calculateSwapOutput(
        uint256[TOKENS_COUNT] memory reserves,
        uint256 tokenIn,
        uint256 tokenOut,
        uint256 amountIn
    ) internal view returns (uint256) {
        // Validate inputs
        if (tokenIn >= TOKENS_COUNT || tokenOut >= TOKENS_COUNT) return 0;
        if (reserves[tokenOut] == 0 || amountIn == 0) return 0;
        
        // Get initial invariant
        uint256 initialInvariant = _computeTorusInvariant(reserves);
        if (initialInvariant == 0) return 0;
        
        // Newton's method to solve: f(y) = new_invariant(y) - initial_invariant = 0
        // where y is the amount out
        uint256 maxIterations = 30;
        uint256 tolerance = initialInvariant / 1000000; // More reasonable tolerance relative to invariant size
        
        // Start with a better initial guess - use simple constant product formula as starting point
        uint256 amountOut = (amountIn * reserves[tokenOut]) / (reserves[tokenIn] + amountIn);
        if (amountOut == 0) amountOut = amountIn / 10; // Fallback guess
        if (amountOut >= reserves[tokenOut]) amountOut = reserves[tokenOut] / 2;
        
        for (uint256 i = 0; i < maxIterations; i++) {
            // Ensure amountOut is within bounds
            if (amountOut >= reserves[tokenOut]) {
                amountOut = reserves[tokenOut] * 95 / 100; // Use 95% as max
            }
            if (amountOut == 0) amountOut = 1e15; // Minimum meaningful amount
            
            // Calculate f(y) = new_invariant(y) - initial_invariant
            uint256[TOKENS_COUNT] memory newReserves = reserves;
            newReserves[tokenIn] += amountIn;
            newReserves[tokenOut] -= amountOut;
            
            uint256 newInvariant = _computeTorusInvariant(newReserves);
            
            // f(y) = new_invariant - initial_invariant
            int256 f_y;
            if (newInvariant >= initialInvariant) {
                f_y = int256(newInvariant - initialInvariant);
            } else {
                f_y = -int256(initialInvariant - newInvariant);
            }
            
            // Check convergence
            if (_abs(f_y) <= int256(tolerance)) {
                break;
            }
            
            // Calculate numerical derivative f'(y) ≈ (f(y + ε) - f(y)) / ε
            // Use adaptive epsilon based on current amountOut
            uint256 epsilon = amountOut / 1000; // 0.1% of current amount
            if (epsilon < 1e15) epsilon = 1e15; // Minimum epsilon
            if (epsilon > amountOut / 2) epsilon = amountOut / 2; // Maximum epsilon
            
            uint256 amountOutPlusEpsilon = amountOut + epsilon;
            
            // Ensure derivative calculation is valid
            if (amountOutPlusEpsilon >= reserves[tokenOut]) {
                epsilon = (reserves[tokenOut] - amountOut) / 2;
                if (epsilon == 0) break;
                amountOutPlusEpsilon = amountOut + epsilon;
            }
            
            uint256[TOKENS_COUNT] memory reservesForDerivative = reserves;
            reservesForDerivative[tokenIn] += amountIn;
            reservesForDerivative[tokenOut] -= amountOutPlusEpsilon;
            
            uint256 newInvariantPlusEpsilon = _computeTorusInvariant(reservesForDerivative);
            
            int256 f_y_plus_epsilon;
            if (newInvariantPlusEpsilon >= initialInvariant) {
                f_y_plus_epsilon = int256(newInvariantPlusEpsilon - initialInvariant);
            } else {
                f_y_plus_epsilon = -int256(initialInvariant - newInvariantPlusEpsilon);
            }
            
            // Calculate derivative: f'(y) = (f(y + ε) - f(y)) / ε
            int256 derivative = (f_y_plus_epsilon - f_y) / int256(epsilon);
            
            // Check if derivative is meaningful
            if (_abs(derivative) < int256(tolerance / 1000)) {
                // If derivative is too small, use direction-based adjustment
                if (f_y > 0) {
                    // New invariant is too high, increase amountOut
                    amountOut = amountOut + amountOut / 10;
                } else {
                    // New invariant is too low, decrease amountOut  
                    amountOut = amountOut - amountOut / 10;
                }
                continue;
            }
            
            // Newton's method update: y_{n+1} = y_n - f(y_n) / f'(y_n)
            int256 deltaY = f_y / derivative;
            
            // Apply step size limiting to prevent overshooting
            int256 maxStep = int256(amountOut / 4); // Limit step to 25% of current value
            if (_abs(deltaY) > maxStep) {
                deltaY = deltaY > 0 ? maxStep : -maxStep;
            }
            
            if (deltaY >= 0) {
                if (amountOut >= uint256(deltaY)) {
                    amountOut -= uint256(deltaY);
                } else {
                    amountOut = amountOut / 2; // Reduce by half instead of going negative
                }
            } else {
                uint256 increase = uint256(-deltaY);
                if (amountOut + increase < reserves[tokenOut]) {
                    amountOut += increase;
                } else {
                    amountOut = (amountOut + reserves[tokenOut] * 95 / 100) / 2; // Move towards 95% of max
                }
            }
            
            // Ensure meaningful minimum
            if (amountOut < 1e15) amountOut = 1e15;
        }
        
        // Final safety checks
        if (amountOut >= reserves[tokenOut]) {
            amountOut = reserves[tokenOut] * 95 / 100;
        }
        
        // Final invariant check - if still far off, use fallback
        uint256[TOKENS_COUNT] memory finalReserves = reserves;
        finalReserves[tokenIn] += amountIn;
        if (finalReserves[tokenOut] >= amountOut) {
            finalReserves[tokenOut] -= amountOut;
            uint256 finalInvariant = _computeTorusInvariant(finalReserves);
            
            uint256 invariantDiff = finalInvariant > initialInvariant ? 
                finalInvariant - initialInvariant : initialInvariant - finalInvariant;
            
            // If invariant is still significantly different, use simple proportional fallback
            if (invariantDiff > initialInvariant / 50) { // More than 2% difference
                amountOut = (amountIn * reserves[tokenOut]) / (reserves[tokenIn] + amountIn);
                // Apply a reduction factor to account for fees and slippage
                amountOut = amountOut * 98 / 100; // 2% reduction
            }
        }
        
        return amountOut;
    }
    
    /**
     * @dev Calculate absolute value of signed integer
     */
    function _abs(int256 x) internal pure returns (int256) {
        return x >= 0 ? x : -x;
    }

    /**
     * @dev Compute the torus invariant for given reserves
     * Using the correct formula from the Orbital whitepaper
     */
    function _computeTorusInvariant(uint256[TOKENS_COUNT] memory /* reserves */) public view returns (uint256) {
        // Get consolidated tick data for interior and boundary ticks
        (ConsolidatedTickData memory interiorData, ConsolidatedTickData memory boundaryData) = _getConsolidatedTickData();
        
        // First term: (1/√n * Σ(x_int,i) - k_bound - r_int * √n)²
        uint256 sqrtN = _sqrt(TOKENS_COUNT * PRECISION * PRECISION); // √5 scaled
        
        // Sum of interior reserves only
        uint256 sumInteriorReserves = 0;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            sumInteriorReserves += interiorData.totalReserves[i];
        }
        
        // Calculate first term components
        uint256 firstComponent = (sumInteriorReserves * PRECISION) / sqrtN; // (1/√n) * Σ(x_int,i)
        uint256 secondComponent = boundaryData.totalKBound; // k_bound  
        uint256 thirdComponent = (interiorData.consolidatedRadius * sqrtN) / PRECISION; // r_int * √n
        
        // First term: ((1/√n * Σ(x_int,i)) - k_bound - r_int * √n)²
        uint256 term1Sum = firstComponent > (secondComponent + thirdComponent) ? 
            firstComponent - secondComponent - thirdComponent : secondComponent + thirdComponent - firstComponent;
        uint256 term1 = (term1Sum * term1Sum) / PRECISION;
        
        // Second term: (√(Σ(x_total,i)²) - (1/n)(Σ(x_total,i))² - r_bound²)²
        // Sum of all reserves (interior + boundary)
        uint256 sumTotalReserves = 0;
        uint256 sumTotalReservesSquared = 0;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            uint256 totalReserve = interiorData.totalReserves[i] + boundaryData.totalReserves[i];
            sumTotalReserves += totalReserve;
            sumTotalReservesSquared += (totalReserve * totalReserve) / PRECISION;
        }
        
        // Calculate (1/n)(Σ(x_total,i))²
        uint256 sumTotalReserves_sq = (sumTotalReserves * sumTotalReserves) / PRECISION;
        uint256 sum_sq_div_n = sumTotalReserves_sq / TOKENS_COUNT;

        // Second term: (√(Σ(x_total,i)² - (1/n)(Σ(x_total,i))²) - r_bound)²
        uint256 term2Component = 0;
        if (sumTotalReservesSquared > sum_sq_div_n) { // Use the corrected value here
            uint256 sqrtTerm = _sqrt((sumTotalReservesSquared - sum_sq_div_n) * PRECISION);
            term2Component = sqrtTerm > boundaryData.consolidatedRadius ? 
            sqrtTerm - boundaryData.consolidatedRadius : boundaryData.consolidatedRadius - sqrtTerm;
        }
        
        uint256 term2 = (term2Component * term2Component) / PRECISION;
        
        return term1 + term2;
    }

    /**
     * @dev Get consolidated radius data for torus invariant calculation
     */
    function _getConsolidatedRadiusData() internal view returns (
        uint256 totalInteriorRadiusSquared,
        uint256 totalBoundaryRadiusSquared, 
        uint256 totalBoundaryConstantSquared
    ) {
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            Tick storage tick = ticks[k];
            
            if (tick.r == 0) continue;
            
            uint256 radiusSquared = (tick.r * tick.r) / PRECISION;
            
            if (tick.status == TickStatus.Interior) {
                totalInteriorRadiusSquared += radiusSquared;
            } else {
                totalBoundaryRadiusSquared += radiusSquared;
                uint256 constantSquared = (tick.k * tick.k) / PRECISION;
                totalBoundaryConstantSquared += constantSquared;
            }
        }
    }

    /**
     * @dev Update tick reserves and handle boundary crossings
     * Adapted from reference implementation
     */
    function _updateTickReservesWithCrossings(uint256[TOKENS_COUNT] memory newTotalReserves) internal {
        uint256 newProjection = _calculateAlpha(newTotalReserves);
        
        // Check each tick for boundary crossing
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            Tick storage tick = ticks[k];
            
            if (tick.r == 0) continue;
            
            uint256 normalizedProjection = (newProjection * PRECISION) / tick.r;
            uint256 normalizedBoundary = (tick.k * PRECISION) / tick.r;
            
            TickStatus oldStatus = tick.status;
            TickStatus newStatus = (normalizedProjection < normalizedBoundary) ? TickStatus.Interior : TickStatus.Boundary;
            
            if (oldStatus != newStatus) {
                tick.status = newStatus;
                emit TickStatusChanged(k, oldStatus, newStatus);
            }
        }
        
        // Update reserves for all ticks proportionally
        _updateIndividualTickReserves(newTotalReserves);
    }

    /**
     * @dev Update individual tick reserves proportionally
     */
    function _updateIndividualTickReserves(uint256[TOKENS_COUNT] memory newTotalReserves) internal {
        uint256 totalInteriorRadius = 0;
        
        // Sum interior tick radii for proportional distribution
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            if (ticks[k].r > 0 && ticks[k].status == TickStatus.Interior) {
                totalInteriorRadius += ticks[k].r;
            }
        }
        
        // Update each tick's reserves
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            Tick storage tick = ticks[k];
            
            if (tick.r == 0) continue;
            
            if (tick.status == TickStatus.Interior && totalInteriorRadius > 0) {
                // Interior ticks: proportional reserves based on radius
                for (uint256 j = 0; j < TOKENS_COUNT; j++) {
                    tick.reserves[j] = (newTotalReserves[j] * tick.r) / totalInteriorRadius;
                }
            } else if (tick.status == TickStatus.Boundary) {
                // Boundary ticks: project to boundary while maintaining constraints
                _projectTickToBoundary(k, newTotalReserves);
            }
        }
    }

    /**
     * @dev Project tick reserves onto its boundary plane
     */
    function _projectTickToBoundary(uint256 k, uint256[TOKENS_COUNT] memory /* totalReserves */) internal {
        Tick storage tick = ticks[k];
        uint256 currentProjection = _calculateAlpha(tick.reserves);
        
        if (currentProjection != tick.k) {
            // Adjust reserves to satisfy plane constraint: x·v = k
            for (uint256 i = 0; i < TOKENS_COUNT; i++) {
                tick.reserves[i] = (tick.reserves[i] * tick.k) / currentProjection;
            }
        }
    }
}
