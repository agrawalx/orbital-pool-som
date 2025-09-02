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
            uint256 radiusIncrease = currentRadius - previousRadius;
            lpShares = (radiusIncrease * previousTotalLpShares) / previousRadius;
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
        totalReserves[tokenOut] -= amountOut;
        _updateTickReservesWithCrossings(totalReserves);
        
        // Transfer output token
        tokens[tokenOut].safeTransfer(msg.sender, amountOut);
        
        // Distribute fees proportionally
        _distributeFees(amountIn - amountInAfterFee, tokenIn);
        
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut, amountIn - amountInAfterFee);
    }

        /**
     * @dev Get total reserves across all ticks

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
    function _getTotalReserves() internal view returns (uint256[TOKENS_COUNT] memory totalReserves) {
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
     * @dev Calculate swap output maintaining torus invariant
     * Adapted from reference implementation for fixed array structure
     */
    function _calculateSwapOutput(
        uint256[TOKENS_COUNT] memory reserves,
        uint256 tokenIn,
        uint256 tokenOut,
        uint256 amountIn
    ) internal view returns (uint256) {
        // Get current invariant
        uint256 currentInvariant = _computeTorusInvariant(reserves);
        
        // Binary search for output amount that maintains invariant
        uint256 low = 0;
        uint256 high = reserves[tokenOut];
        uint256 mid;
        
        // Use binary search for better accuracy
        for (uint256 i = 0; i < 128; i++) {
            mid = (low + high) / 2;
            
            uint256[TOKENS_COUNT] memory newReserves = reserves;
            newReserves[tokenIn] += amountIn;
            newReserves[tokenOut] -= mid;
            
            uint256 newInvariant = _computeTorusInvariant(newReserves);
            
            if (newInvariant > currentInvariant) {
                high = mid;
            } else {
                low = mid;
            }
            
            if (high - low <= 1) break;
        }
        
        return low;
    }

    /**
     * @dev Compute the torus invariant for given reserves
     * Adapted from reference implementation
     */
    function _computeTorusInvariant(uint256[TOKENS_COUNT] memory reserves) internal view returns (uint256) {
        uint256 sumSquares = 0;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            sumSquares += reserves[i] * reserves[i];
        }
        
        // Calculate projection onto equal price vector
        uint256 projection = _calculateAlpha(reserves);
        uint256 projectionSquared = projection * projection;
        
        // Get consolidated radius data
        (uint256 totalInteriorRadiusSquared, uint256 totalBoundaryRadiusSquared, uint256 totalBoundaryConstantSquared) = _getConsolidatedRadiusData();
        
        uint256 radiusSum = totalInteriorRadiusSquared + totalBoundaryRadiusSquared;
        
        // Torus invariant: (sum(x_i^2) - (R_int^2 + R_bnd^2))^2 + 4*R_bnd^2*(<x,v>^2 - C_bnd^2)
        uint256 term1 = sumSquares > radiusSum ? sumSquares - radiusSum : 0;
        uint256 term1Squared = (term1 * term1) / PRECISION;
        
        uint256 term2 = 4 * totalBoundaryRadiusSquared * 
                       (projectionSquared > totalBoundaryConstantSquared ? 
                        projectionSquared - totalBoundaryConstantSquared : 0) / 
                       PRECISION;
        
        return term1Squared + term2;
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
