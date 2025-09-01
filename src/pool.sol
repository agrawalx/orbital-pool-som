// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title Orbital Pool AMM
 * @notice Implementation of Paradigm's Orbital AMM for multi-dimensional stablecoin pools
 * @dev Uses spherical geometry and toroidal mathematics for concentrated liquidity
 */
contract OrbitalPool is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // ============ CONSTANTS ============
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MAX_TOKENS = 1000; // Support up to 1000 stablecoins
    uint256 public constant MIN_LIQUIDITY = 1e15; // Minimum liquidity threshold
    uint256 public constant MAX_ITERATIONS = 100; // Maximum iterations for numerical methods
    uint256 public constant CONVERGENCE_THRESHOLD = 1e12; // Convergence threshold for numerical methods
    
    // ============ ENUMS ============
    
    enum TickStatus {
        Interior,  // Reserves are interior to the tick boundary
        Boundary   // Reserves are pinned to the tick boundary
    }

    // ============ STRUCTS ============
    
    /**
     * @notice Individual tick data structure
     * @dev Each tick represents a concentrated liquidity position with specific R and P parameters
     */
    struct Tick {
        uint256 radius;              // R - The radius parameter defining tick size
        uint256 planeConstant;       // P - The plane constant defining tick boundary
        uint256 totalLiquidity;      // Total liquidity in this tick
        uint256[] reserves;          // Current token reserves for this tick
        uint256 totalLpShares;       // Total LP shares minted for this tick
        mapping(address => uint256) lpShareOwners; // LP shares per address
        TickStatus status;           // Current tick status (Interior/Boundary)
        uint256 accruedFees;         // Fees collected but not yet distributed
        uint256 normalizedPosition;  // Normalized position for tick comparison
        uint256 normalizedProjection; // Normalized projection for boundary calculations
        uint256 normalizedBoundary;  // Normalized boundary value
        uint256 invariant;           // Tick's contribution to global invariant
    }

    /**
     * @notice Consolidated tick data for efficient computation
     */
    struct ConsolidatedTickData {
        uint256[] totalReserves;     // Sum of reserves across consolidated ticks
        uint256[] sumSquaredReserves; // Sum of squared reserves
        uint256 totalLiquidity;      // Combined liquidity
        uint256 tickCount;           // Number of ticks in this consolidation
        uint256 invariant;           // Consolidated invariant
    }

    /**
     * @notice Global AMM state
     */
    struct GlobalState {
        uint256[] totalReserves;         // Total reserves across all tokens
        uint256[] sumOfSquaredReserves;  // Sum of squared reserves for torus calculation
        ConsolidatedTickData interiorTicks; // Consolidated interior ticks
        ConsolidatedTickData boundaryTicks; // Consolidated boundary ticks
        uint256 globalInvariant;         // Current global trade invariant
        uint256 lastTradeTimestamp;      // Timestamp of last trade for fee distribution
    }

    // ============ STATE VARIABLES ============
    
    IERC20[] public tokens;                    // Array of supported tokens
    uint256 public tokenCount;                 // Number of tokens in the pool
    GlobalState public globalState;            // Global AMM state
    
    // Tick management
    mapping(bytes32 => uint256) public tickRegistry; // (R,P) hash -> Tick ID
    mapping(uint256 => Tick) public ticks;           // Tick ID -> Tick data
    uint256 public nextTickId;                       // Counter for tick IDs
    
    // Fee configuration
    uint256 public swapFee = 3000; // 0.3% in basis points
    uint256 public constant FEE_DENOMINATOR = 1000000;

    // ============ EVENTS ============
    
    event LiquidityAdded(
        address indexed provider,
        uint256 indexed tickId,
        uint256[] amounts,
        uint256 sharesReceived,
        uint256 radius,
        uint256 planeConstant
    );
    
    event LiquidityRemoved(
        address indexed provider,
        uint256 indexed tickId,
        uint256[] amounts,
        uint256 sharesBurned
    );
    
    event Swap(
        address indexed user,
        uint256 indexed tokenIn,
        uint256 indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 feesPaid
    );
    
    event TickStatusChanged(
        uint256 indexed tickId,
        TickStatus oldStatus,
        TickStatus newStatus
    );

    // ============ CONSTRUCTOR ============
    
    constructor(address[] memory _tokens) {
        require(_tokens.length >= 2, "Need at least 2 tokens");
        require(_tokens.length <= MAX_TOKENS, "Too many tokens");
        
        tokenCount = _tokens.length;
        
        // Initialize token array
        for (uint256 i = 0; i < tokenCount; i++) {
            tokens.push(IERC20(_tokens[i]));
        }
        
        // Initialize global state arrays
        globalState.totalReserves = new uint256[](tokenCount);
        globalState.sumOfSquaredReserves = new uint256[](tokenCount);
        globalState.interiorTicks.totalReserves = new uint256[](tokenCount);
        globalState.interiorTicks.sumSquaredReserves = new uint256[](tokenCount);
        globalState.boundaryTicks.totalReserves = new uint256[](tokenCount);
        globalState.boundaryTicks.sumSquaredReserves = new uint256[](tokenCount);
        
        nextTickId = 1;
    }

    // ============ LIQUIDITY MANAGEMENT ============
    
    /**
     * @notice Add liquidity to a specific tick position
     * @param radius The radius parameter R defining tick size
     * @param planeConstant The plane constant P defining tick boundary
     * @param amounts Array of token amounts to deposit
     * @return tickId The ID of the tick position
     * @return sharesReceived Number of LP shares minted
     */
    function addLiquidity(
        uint256 radius,
        uint256 planeConstant,
        uint256[] memory amounts
    ) external nonReentrant returns (uint256 tickId, uint256 sharesReceived) {
        require(amounts.length == tokenCount, "Invalid amounts array length");
        require(radius > 0, "Invalid radius");
        
        // Step 1: Validate amounts are consistent with tick parameters
        _validateLiquidityAmounts(radius, planeConstant, amounts);
        
        // Step 2: Get or create tick
        tickId = _getOrCreateTick(radius, planeConstant);
        
        // Step 3: Calculate LP shares to mint
        sharesReceived = _calculateLpShares(tickId, amounts);
        
        // Step 4: Transfer tokens from user
        for (uint256 i = 0; i < tokenCount; i++) {
            if (amounts[i] > 0) {
                tokens[i].safeTransferFrom(msg.sender, address(this), amounts[i]);
            }
        }
        
        // Step 5: Update tick state
        _updateTickOnLiquidityAdd(tickId, amounts, sharesReceived);
        
        // Step 6: Update global state
        _updateGlobalStateOnLiquidityAdd(amounts);
        
        emit LiquidityAdded(msg.sender, tickId, amounts, sharesReceived, radius, planeConstant);
    }
    
    /**
     * @notice Remove liquidity from a tick position
     * @param tickId The tick ID to remove liquidity from
     * @param sharesToBurn Number of LP shares to burn
     * @return amounts Array of token amounts returned
     */
    function removeLiquidity(
        uint256 tickId,
        uint256 sharesToBurn
    ) external nonReentrant returns (uint256[] memory amounts) {
        require(tickId > 0 && tickId < nextTickId, "Invalid tick ID");
        require(sharesToBurn > 0, "Invalid shares amount");
        require(ticks[tickId].lpShareOwners[msg.sender] >= sharesToBurn, "Insufficient shares");
        
        // Step 1: Calculate token amounts to return
        amounts = _calculateTokensFromShares(tickId, sharesToBurn);
        
        // Step 2: Update tick state
        _updateTickOnLiquidityRemove(tickId, amounts, sharesToBurn);
        
        // Step 3: Update global state
        _updateGlobalStateOnLiquidityRemove(amounts);
        
        // Step 4: Transfer tokens to user
        for (uint256 i = 0; i < tokenCount; i++) {
            if (amounts[i] > 0) {
                tokens[i].safeTransfer(msg.sender, amounts[i]);
            }
        }
        
        emit LiquidityRemoved(msg.sender, tickId, amounts, sharesToBurn);
    }

    // ============ SWAP EXECUTION ============
    
    /**
     * @notice Execute a swap between two tokens
     * @param tokenInIndex Index of input token
     * @param tokenOutIndex Index of output token  
     * @param amountIn Amount of input tokens
     * @param minAmountOut Minimum output tokens expected
     * @return amountOut Actual output tokens received
     */
    function swap(
        uint256 tokenInIndex,
        uint256 tokenOutIndex,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        require(tokenInIndex != tokenOutIndex, "Same token swap");
        require(tokenInIndex < tokenCount && tokenOutIndex < tokenCount, "Invalid token index");
        require(amountIn > 0, "Invalid amount");
        
        // Step 1: Transfer input tokens
        tokens[tokenInIndex].safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Step 2: Calculate swap using global invariant
        amountOut = _executeSwapSegments(tokenInIndex, tokenOutIndex, amountIn);
        
        // Step 3: Apply fees
        uint256 feeAmount = (amountOut * swapFee) / FEE_DENOMINATOR;
        amountOut = amountOut - feeAmount;
        
        require(amountOut >= minAmountOut, "Slippage exceeded");
        
        // Step 4: Distribute fees to active ticks
        _distributeFees(tokenInIndex, tokenOutIndex, feeAmount);
        
        // Step 5: Transfer output tokens
        tokens[tokenOutIndex].safeTransfer(msg.sender, amountOut);
        
        emit Swap(msg.sender, tokenInIndex, tokenOutIndex, amountIn, amountOut, feeAmount);
    }

    // ============ INTERNAL SWAP LOGIC ============
    
    /**
     * @notice Execute swap with potential segmentation for tick boundary crossings
     */
    function _executeSwapSegments(
        uint256 tokenInIndex,
        uint256 tokenOutIndex,
        uint256 amountIn
    ) internal returns (uint256 totalAmountOut) {
        uint256 remainingAmountIn = amountIn;
        
        while (remainingAmountIn > 0) {
            // Calculate hypothetical trade outcome
            uint256 segmentAmountOut = _calculateGlobalTradeInvariant(
                tokenInIndex,
                tokenOutIndex,
                remainingAmountIn
            );
            
            // Check for boundary crossings
            uint256 boundaryTickId = _checkBoundaryCrossing(tokenInIndex, tokenOutIndex, remainingAmountIn);
            
            if (boundaryTickId == 0) {
                // No boundary crossing - execute full remaining trade
                _updateReservesForTrade(tokenInIndex, tokenOutIndex, remainingAmountIn, segmentAmountOut);
                totalAmountOut += segmentAmountOut;
                remainingAmountIn = 0;
                
                // Distribute reserve changes to individual ticks
                _distributeReserveChanges(tokenInIndex, remainingAmountIn, tokenOutIndex, segmentAmountOut);
            } else {
                // Boundary crossing detected - segment the trade
                uint256 segmentAmountIn = _calculateSegmentToBoundary(
                    boundaryTickId,
                    tokenInIndex,
                    tokenOutIndex,
                    remainingAmountIn
                );
                
                uint256 actualSegmentOut = _calculateGlobalTradeInvariant(
                    tokenInIndex,
                    tokenOutIndex,
                    segmentAmountIn
                );
                
                // Execute segment
                _updateReservesForTrade(tokenInIndex, tokenOutIndex, segmentAmountIn, actualSegmentOut);
                totalAmountOut += actualSegmentOut;
                remainingAmountIn -= segmentAmountIn;
                
                // Distribute reserve changes to individual ticks
                _distributeReserveChanges(tokenInIndex, segmentAmountIn, tokenOutIndex, actualSegmentOut);
                
                // Update tick status
                _updateTickStatus(boundaryTickId);
                
                // Recalculate global state
                _recalculateGlobalInvariant();
            }
        }
    }
    
    /**
     * @notice Calculate swap output using global torus invariant
     */
    function _calculateGlobalTradeInvariant(
        uint256 tokenInIndex,
        uint256 tokenOutIndex,
        uint256 amountIn
    ) internal view returns (uint256 amountOut) {
        // Implementation of the torus invariant formula from the whitepaper
        // This involves solving a quartic equation for the trade outcome
        
        uint256[] memory newReserves = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            newReserves[i] = globalState.totalReserves[i];
        }
        
        newReserves[tokenInIndex] += amountIn;
        
        // Solve for amountOut using the global invariant
        amountOut = _solveGlobalInvariant(newReserves, tokenInIndex, tokenOutIndex);
        
        require(amountOut <= globalState.totalReserves[tokenOutIndex], "Insufficient liquidity");
    }
    
    /**
     * @notice Solve the global torus invariant equation for trade calculation
     * @dev This implements the quartic equation from the whitepaper using Newton's method
     * The global invariant combines interior and boundary ticks into a toroidal surface
     */
    function _solveGlobalInvariant(
        uint256[] memory newReserves,
        uint256 tokenInIndex,
        uint256 tokenOutIndex
    ) internal view returns (uint256 amountOut) {
        // The global torus invariant equation from the whitepaper:
        // ||x_interior||² + ||x_boundary||² = invariant
        // where x_interior and x_boundary are the consolidated interior and boundary reserves
        
        uint256 amountIn = newReserves[tokenInIndex] - globalState.totalReserves[tokenInIndex];
        uint256 currentReserveOut = globalState.totalReserves[tokenOutIndex];
        
        // Newton's method to solve the quartic equation
        // Start with a reasonable initial guess
        uint256 x_j = currentReserveOut;
        
        for (uint256 i = 0; i < MAX_ITERATIONS; i++) {
            // Calculate f(x_j) - the global invariant equation set to zero
            uint256 fx = _calculateGlobalInvariantFunction(newReserves, tokenInIndex, tokenOutIndex, x_j);
            
            // If we're close enough to zero, we've converged
            if (fx < CONVERGENCE_THRESHOLD) {
                break;
            }
            
            // Calculate f'(x_j) - the derivative
            uint256 fPrime = _calculateGlobalInvariantDerivative(newReserves, tokenInIndex, tokenOutIndex, x_j);
            
            // Avoid division by zero
            if (fPrime == 0) {
                break;
            }
            
            // Newton's iteration: x_next = x_current - f(x_current) / f'(x_current)
            uint256 xNext;
            if (fx > fPrime) {
                // Handle potential overflow by limiting the step size
                uint256 step = fx / fPrime;
                xNext = x_j > step ? x_j - step : 0;
            } else {
                uint256 step = fx / fPrime;
                xNext = x_j > step ? x_j - step : 0;
            }
            
            // Ensure xNext doesn't go below zero
            if (xNext > x_j) {
                xNext = 0;
            }
            
            // Check for convergence
            if (x_j > xNext && x_j - xNext < CONVERGENCE_THRESHOLD) {
                break;
            }
            
            x_j = xNext;
        }
        
        // Calculate the amount out
        if (x_j < currentReserveOut) {
            amountOut = currentReserveOut - x_j;
        } else {
            amountOut = 0;
        }
        
        // Ensure we don't exceed available reserves
        if (amountOut > currentReserveOut) {
            amountOut = currentReserveOut;
        }
    }
    
    /**
     * @notice Calculate the global invariant function f(x_j) = 0
     * @dev This is the quartic equation from the whitepaper
     */
    function _calculateGlobalInvariantFunction(
        uint256[] memory newReserves,
        uint256 tokenInIndex,
        uint256 tokenOutIndex,
        uint256 x_j
    ) internal view returns (uint256) {
        // Create a copy of newReserves with the output token amount set to x_j
        uint256[] memory testReserves = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            testReserves[i] = newReserves[i];
        }
        testReserves[tokenOutIndex] = x_j;
        
        // Calculate the global invariant with these reserves
        uint256 newInvariant = _calculateGlobalInvariantFromReserves(testReserves);
        
        // Return the difference from the current invariant
        if (newInvariant > globalState.globalInvariant) {
            return newInvariant - globalState.globalInvariant;
        } else {
            return globalState.globalInvariant - newInvariant;
        }
    }
    
    /**
     * @notice Calculate the derivative of the global invariant function
     * @dev This is the derivative of the quartic equation
     */
    function _calculateGlobalInvariantDerivative(
        uint256[] memory newReserves,
        uint256 tokenInIndex,
        uint256 tokenOutIndex,
        uint256 x_j
    ) internal view returns (uint256) {
        // Use finite difference approximation for the derivative
        uint256 h = x_j / 1000; // Small step size
        if (h == 0) h = 1;
        
        // Ensure we don't go below zero
        uint256 x1 = x_j + h;
        uint256 x2 = x_j > h ? x_j - h : 0;
        
        uint256 fx1 = _calculateGlobalInvariantFunction(newReserves, tokenInIndex, tokenOutIndex, x1);
        uint256 fx2 = _calculateGlobalInvariantFunction(newReserves, tokenInIndex, tokenOutIndex, x2);
        
        uint256 denominator = 2 * h;
        if (denominator == 0) {
            return 1; // Return a small non-zero value to avoid division by zero
        }
        
        return (fx1 - fx2) / denominator;
    }
    
    /**
     * @notice Calculate the global invariant from a given reserve state
     * @dev This implements the full toroidal invariant from the whitepaper:
     * r_int² = ( (x_total ⋅ v - k_bound) - r_int√n )² + ( ||w_total|| - ||w_bound|| )²
     */
    function _calculateGlobalInvariantFromReserves(uint256[] memory reserves) internal view returns (uint256) {
        // 1. Get consolidated parameters for interior ticks
        uint256 rInt = _calculateTotalInteriorRadius();
        if (rInt == 0) return 0; // No interior liquidity

        // 2. Get consolidated parameters for boundary ticks
        uint256 kBound = _calculateTotalBoundaryPlaneConstant();
        uint256 rBound = _calculateTotalBoundaryRadius();
        uint256 wBoundNorm = _calculateBoundaryWNorm();

        // 3. Calculate terms related to the total reserve vector (the input 'reserves')
        uint256 sumX = 0;
        uint256 sumXSq = 0;
        for (uint256 i = 0; i < tokenCount; i++) {
            sumX += reserves[i];
            sumXSq += (reserves[i] * reserves[i]) / PRECISION;
        }

        uint256 nSqrt = Math.sqrt(tokenCount * PRECISION);

        // x_total ⋅ v = (1/√n) * Σxᵢ
        // Prevent overflow in division
        uint256 xTotalDotV;
        if (sumX > type(uint256).max / PRECISION) {
            xTotalDotV = (sumX / nSqrt) * PRECISION;
        } else {
            xTotalDotV = (sumX * PRECISION) / nSqrt;
        }

        // ||w_total||² = ||x_total||² - (x_total ⋅ v)²
        uint256 xTotalDotVSquared = (xTotalDotV * xTotalDotV) / PRECISION;
        uint256 wTotalNormSq;
        if (sumXSq > xTotalDotVSquared) {
            wTotalNormSq = sumXSq - xTotalDotVSquared;
        } else {
            wTotalNormSq = 0;
        }
        uint256 wTotalNorm = Math.sqrt(wTotalNormSq * PRECISION);

        // 4. Calculate the two main terms of the torus equation

        // Term 1: ( (x_total ⋅ v - k_bound) - r_int√n )²
        uint256 term1Base;
        if (xTotalDotV > kBound) {
            term1Base = xTotalDotV - kBound;
        } else {
            term1Base = kBound > xTotalDotV ? kBound - xTotalDotV : 0;
        }
        
        uint256 rIntSqrtN = (rInt * nSqrt) / PRECISION;
        if (term1Base > rIntSqrtN) {
            term1Base = term1Base - rIntSqrtN;
        } else {
            term1Base = rIntSqrtN > term1Base ? rIntSqrtN - term1Base : 0;
        }
        
        // Prevent overflow in squaring
        if (term1Base > type(uint256).max / term1Base) {
            term1Base = type(uint256).max / term1Base;
        }
        uint256 term1 = (term1Base * term1Base) / PRECISION;

        // Term 2: ( ||w_total|| - ||w_bound|| )²
        uint256 term2Base;
        if (wTotalNorm > wBoundNorm) {
            term2Base = wTotalNorm - wBoundNorm;
        } else {
            term2Base = wBoundNorm > wTotalNorm ? wBoundNorm - wTotalNorm : 0;
        }
        
        // Prevent overflow in squaring
        if (term2Base > type(uint256).max / term2Base) {
            term2Base = type(uint256).max / term2Base;
        }
        uint256 term2 = (term2Base * term2Base) / PRECISION;
        
        // The invariant is r_int², so we return the sum of the two terms
        return term1 + term2;
    }
    
    /**
     * @notice Calculate the total plane constant of all boundary ticks
     */
    function _calculateTotalBoundaryPlaneConstant() internal view returns (uint256 totalK) {
        for (uint256 tickId = 1; tickId < nextTickId; tickId++) {
            Tick storage tick = ticks[tickId];
            if (tick.status == TickStatus.Boundary) {
                totalK += tick.planeConstant;
            }
        }
        return totalK;
    }
    
    /**
     * @notice Calculate the total radius of all boundary ticks
     */
    function _calculateTotalBoundaryRadius() internal view returns (uint256 totalRadius) {
        for (uint256 tickId = 1; tickId < nextTickId; tickId++) {
            Tick storage tick = ticks[tickId];
            if (tick.status == TickStatus.Boundary) {
                totalRadius += tick.radius;
            }
        }
        return totalRadius;
    }
    
    /**
     * @notice Calculate ||w_bound|| (magnitude of boundary reserves orthogonal to v)
     */
    function _calculateBoundaryWNorm() internal view returns (uint256) {
        uint256 wBoundSquared = 0;
        
        // Calculate average boundary reserve
        uint256 totalBoundaryReserves = 0;
        for (uint256 j = 0; j < tokenCount; j++) {
            totalBoundaryReserves += globalState.boundaryTicks.totalReserves[j];
        }
        uint256 avgBoundaryReserve = totalBoundaryReserves / tokenCount;
        
        for (uint256 i = 0; i < tokenCount; i++) {
            uint256 boundaryReserve = globalState.boundaryTicks.totalReserves[i];
            
            uint256 wComponent;
            if (boundaryReserve > avgBoundaryReserve) {
                wComponent = boundaryReserve - avgBoundaryReserve;
            } else {
                wComponent = avgBoundaryReserve > boundaryReserve ? 
                    avgBoundaryReserve - boundaryReserve : 0;
            }
            
            wBoundSquared += (wComponent * wComponent) / PRECISION;
        }
        
        return Math.sqrt(wBoundSquared * PRECISION);
    }

    // ============ TICK MANAGEMENT ============
    
    /**
     * @notice Get existing tick or create new one
     */
    function _getOrCreateTick(
        uint256 radius,
        uint256 planeConstant
    ) internal returns (uint256 tickId) {
        bytes32 tickHash = keccak256(abi.encodePacked(radius, planeConstant));
        
        tickId = tickRegistry[tickHash];
        if (tickId == 0) {
            // Create new tick
            tickId = nextTickId++;
            tickRegistry[tickHash] = tickId;
            
            // Initialize tick
            ticks[tickId].radius = radius;
            ticks[tickId].planeConstant = planeConstant;
            ticks[tickId].reserves = new uint256[](tokenCount);
            ticks[tickId].status = TickStatus.Interior;
            
            // Calculate normalized values
            ticks[tickId].normalizedBoundary = planeConstant * PRECISION / radius;
        }
    }
    
    /**
     * @notice Calculate LP shares to mint based on liquidity contribution
     */
    function _calculateLpShares(
        uint256 tickId,
        uint256[] memory amounts
    ) internal view returns (uint256 shares) {
        Tick storage tick = ticks[tickId];
        
        if (tick.totalLpShares == 0) {
            // First liquidity provider - mint shares based on geometric mean
            uint256 product = PRECISION;
            for (uint256 i = 0; i < tokenCount; i++) {
                if (amounts[i] > 0) {
                    product = (product * amounts[i]) / PRECISION;
                }
            }
            shares = Math.sqrt(product);
        } else {
            // Subsequent providers - proportional to liquidity increase
            uint256 newLiquidity = _calculateTickLiquidity(amounts);
            shares = (tick.totalLpShares * newLiquidity) / tick.totalLiquidity;
        }
        
        require(shares > 0, "Insufficient liquidity");
    }
    
    /**
     * @notice Calculate tick's liquidity based on spherical geometry
     */
    function _calculateTickLiquidity(uint256[] memory reserves) internal pure returns (uint256 liquidity) {
        // Calculate ||r|| for spherical AMM
        uint256 sumSquares = 0;
        for (uint256 i = 0; i < reserves.length; i++) {
            sumSquares += (reserves[i] * reserves[i]) / PRECISION;
        }
        liquidity = Math.sqrt(sumSquares * PRECISION);
    }

    // ============ BOUNDARY DETECTION ============
    
    /**
     * @notice Check if any tick boundary will be crossed during a trade using normalized quantities
     * @dev Implements the whitepaper's approach using α_int_norm and k_norm comparisons
     */
    function _checkBoundaryCrossing(
        uint256 tokenInIndex,
        uint256 tokenOutIndex,
        uint256 amountIn
    ) internal view returns (uint256 crossedTickId) {
        // Step 1: Calculate hypothetical outcome using global invariant
        uint256[] memory hypotheticalReserves = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            hypotheticalReserves[i] = globalState.totalReserves[i];
        }
        hypotheticalReserves[tokenInIndex] += amountIn;
        
        // Calculate what the new α_int_norm would be
        uint256 newAlphaIntNorm = _calculateNormalizedInteriorProjection(hypotheticalReserves);
        
        // Step 2: Find closest boundaries
        uint256 kIntMin = _findMinimumInteriorBoundary();
        uint256 kBoundMax = _findMaximumBoundaryBoundary();
        
        // Step 3: Check for crossing
        // Trade proceeds without segmentation only if k_bound_max <= new_α_int_norm <= k_int_min
        if (newAlphaIntNorm < kBoundMax || newAlphaIntNorm > kIntMin) {
            // A boundary crossing is detected
            // Find the closest tick that would be crossed
            crossedTickId = _findClosestBoundaryTick(newAlphaIntNorm);
        }
        
        return crossedTickId;
    }
    
    /**
     * @notice Calculate the normalized projection of interior ticks (α_int_norm)
     * @dev This represents the current state of all interior liquidity
     */
    function _calculateNormalizedInteriorProjection(uint256[] memory reserves) internal view returns (uint256) {
        // Calculate the total squared reserves of interior ticks
        uint256 interiorSumSquares = 0;
        for (uint256 i = 0; i < tokenCount; i++) {
            interiorSumSquares += globalState.interiorTicks.sumSquaredReserves[i];
        }
        
        // The normalized projection is the square root of the sum of squares
        uint256 interiorNorm = Math.sqrt(interiorSumSquares * PRECISION);
        
        // Normalize by the total radius of interior ticks
        uint256 totalInteriorRadius = _calculateTotalInteriorRadius();
        
        return totalInteriorRadius > 0 ? (interiorNorm * PRECISION) / totalInteriorRadius : 0;
    }
    
    /**
     * @notice Find the minimum k_norm among all interior ticks
     */
    function _findMinimumInteriorBoundary() internal view returns (uint256 kIntMin) {
        kIntMin = type(uint256).max;
        
        for (uint256 tickId = 1; tickId < nextTickId; tickId++) {
            Tick storage tick = ticks[tickId];
            if (tick.status == TickStatus.Interior) {
                if (tick.normalizedBoundary < kIntMin) {
                    kIntMin = tick.normalizedBoundary;
                }
            }
        }
        
        return kIntMin == type(uint256).max ? 0 : kIntMin;
    }
    
    /**
     * @notice Find the maximum k_norm among all boundary ticks
     */
    function _findMaximumBoundaryBoundary() internal view returns (uint256 kBoundMax) {
        kBoundMax = 0;
        
        for (uint256 tickId = 1; tickId < nextTickId; tickId++) {
            Tick storage tick = ticks[tickId];
            if (tick.status == TickStatus.Boundary) {
                if (tick.normalizedBoundary > kBoundMax) {
                    kBoundMax = tick.normalizedBoundary;
                }
            }
        }
        
        return kBoundMax;
    }
    
    /**
     * @notice Find the closest tick that would be crossed
     */
    function _findClosestBoundaryTick(uint256 newAlphaIntNorm) internal view returns (uint256 closestTickId) {
        uint256 minDistance = type(uint256).max;
        
        for (uint256 tickId = 1; tickId < nextTickId; tickId++) {
            Tick storage tick = ticks[tickId];
            uint256 distance = newAlphaIntNorm > tick.normalizedBoundary ? 
                newAlphaIntNorm - tick.normalizedBoundary : 
                tick.normalizedBoundary - newAlphaIntNorm;
            
            if (distance < minDistance) {
                minDistance = distance;
                closestTickId = tickId;
            }
        }
        
        return closestTickId;
    }
    
    /**
     * @notice Calculate the total radius of all interior ticks
     */
    function _calculateTotalInteriorRadius() internal view returns (uint256 totalRadius) {
        for (uint256 tickId = 1; tickId < nextTickId; tickId++) {
            Tick storage tick = ticks[tickId];
            if (tick.status == TickStatus.Interior) {
                totalRadius += tick.radius;
            }
        }
        return totalRadius;
    }
    
    /**
     * @notice Update tick status when boundary is crossed
     */
    function _updateTickStatus(uint256 tickId) internal {
        Tick storage tick = ticks[tickId];
        TickStatus oldStatus = tick.status;
        
        // Determine new status based on reserves vs boundary
        bool onBoundary = _isTickOnBoundary(tickId);
        tick.status = onBoundary ? TickStatus.Boundary : TickStatus.Interior;
        
        if (oldStatus != tick.status) {
            _moveTickBetweenConsolidations(tickId, oldStatus, tick.status);
            emit TickStatusChanged(tickId, oldStatus, tick.status);
        }
    }
    
    /**
     * @notice Check if tick reserves are on the boundary
     */
    function _isTickOnBoundary(uint256 tickId) internal view returns (bool) {
        Tick storage tick = ticks[tickId];
        
        // Calculate normalized position and compare to boundary
        uint256 normalizedPos = _calculateNormalizedPosition(tickId);
        return normalizedPos >= tick.normalizedBoundary;
    }

    // ============ STATE UPDATE FUNCTIONS ============
    
    function _updateTickOnLiquidityAdd(
        uint256 tickId,
        uint256[] memory amounts,
        uint256 shares
    ) internal {
        Tick storage tick = ticks[tickId];
        
        // Update reserves
        for (uint256 i = 0; i < tokenCount; i++) {
            tick.reserves[i] += amounts[i];
        }
        
        // Update liquidity and shares
        uint256 addedLiquidity = _calculateTickLiquidity(amounts);
        tick.totalLiquidity += addedLiquidity;
        tick.totalLpShares += shares;
        tick.lpShareOwners[msg.sender] += shares;
        
        // Update normalized position and invariant
        tick.normalizedPosition = _calculateNormalizedPosition(tickId);
        tick.invariant = _calculateTickInvariant(tickId);
    }
    
    function _updateGlobalStateOnLiquidityAdd(uint256[] memory amounts) internal {
        for (uint256 i = 0; i < tokenCount; i++) {
            globalState.totalReserves[i] += amounts[i];
            globalState.sumOfSquaredReserves[i] += (amounts[i] * amounts[i]) / PRECISION;
        }
        _recalculateGlobalInvariant();
    }
    
    function _recalculateGlobalInvariant() internal {
        // Recalculate the torus invariant based on current state
        uint256 interiorSum = 0;
        uint256 boundarySum = 0;
        
        for (uint256 i = 0; i < tokenCount; i++) {
            interiorSum += globalState.interiorTicks.sumSquaredReserves[i];
            boundarySum += globalState.boundaryTicks.sumSquaredReserves[i];
        }
        
        globalState.globalInvariant = interiorSum + boundarySum;
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get current price of token relative to others
     */
    function getPrice(uint256 tokenIndex) external view returns (uint256 price) {
        require(tokenIndex < tokenCount, "Invalid token index");
        
        if (globalState.totalReserves[tokenIndex] == 0) return 0;
        
        // Price calculation based on spherical AMM geometry
        uint256 totalValue = 0;
        for (uint256 i = 0; i < tokenCount; i++) {
            totalValue += globalState.totalReserves[i];
        }
        
        price = (totalValue * PRECISION) / globalState.totalReserves[tokenIndex];
    }
    
    /**
     * @notice Get tick information
     */
    function getTickInfo(uint256 tickId) external view returns (
        uint256 radius,
        uint256 planeConstant,
        uint256 totalLiquidity,
        uint256[] memory reserves,
        uint256 totalShares,
        TickStatus status
    ) {
        require(tickId > 0 && tickId < nextTickId, "Invalid tick ID");
        
        Tick storage tick = ticks[tickId];
        radius = tick.radius;
        planeConstant = tick.planeConstant;
        totalLiquidity = tick.totalLiquidity;
        reserves = tick.reserves;
        totalShares = tick.totalLpShares;
        status = tick.status;
    }
    
    /**
     * @notice Get LP shares for an address in a specific tick
     */
    function getLpShares(uint256 tickId, address provider) external view returns (uint256 shares) {
        return ticks[tickId].lpShareOwners[provider];
    }
    
    /**
     * @notice Get global pool state
     */
    function getGlobalState() external view returns (
        uint256[] memory totalReserves,
        uint256[] memory sumSquaredReserves,
        uint256 globalInvariant
    ) {
        totalReserves = globalState.totalReserves;
        sumSquaredReserves = globalState.sumOfSquaredReserves;
        globalInvariant = globalState.globalInvariant;
    }

    // ============ HELPER FUNCTIONS ============
    
    function _validateLiquidityAmounts(
        uint256 radius,
        uint256 planeConstant,
        uint256[] memory amounts
    ) internal pure {
        // Validate that amounts are consistent with spherical constraints
        uint256 sumSquares = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            sumSquares += (amounts[i] * amounts[i]) / PRECISION;
        }
        
        require(sumSquares > 0, "Zero liquidity");
        
        // Validate that the amounts respect the tick's geometric constraints
        uint256 liquidity = Math.sqrt(sumSquares * PRECISION);
        require(liquidity >= MIN_LIQUIDITY, "Below minimum liquidity");
        
        // Additional geometric validations for tick boundaries
        if (planeConstant > 0) {
            uint256 normalizedPosition = liquidity * PRECISION / radius;
            require(normalizedPosition <= planeConstant * PRECISION / radius, "Exceeds tick boundary");
        }
    }
    
    function _calculateNormalizedPosition(uint256 tickId) internal view returns (uint256) {
        Tick storage tick = ticks[tickId];
        return _calculateNormalizedPositionFromReserves(tick.reserves, tick.radius);
    }
    
    function _calculateNormalizedPositionFromReserves(
        uint256[] memory reserves,
        uint256 radius
    ) internal pure returns (uint256) {
        // Calculate normalized position for boundary comparison
        uint256 sumSquares = 0;
        
        for (uint256 i = 0; i < reserves.length; i++) {
            sumSquares += (reserves[i] * reserves[i]) / PRECISION;
        }
        
        uint256 liquidity = Math.sqrt(sumSquares * PRECISION);
        return liquidity * PRECISION / radius;
    }
    
    function _calculateTickInvariant(uint256 tickId) internal view returns (uint256) {
        Tick storage tick = ticks[tickId];
        uint256 sumSquares = 0;
        
        for (uint256 i = 0; i < tokenCount; i++) {
            sumSquares += (tick.reserves[i] * tick.reserves[i]) / PRECISION;
        }
        
        return sumSquares;
    }
    
    function _calculateTokensFromShares(
        uint256 tickId,
        uint256 sharesToBurn
    ) internal view returns (uint256[] memory amounts) {
        Tick storage tick = ticks[tickId];
        amounts = new uint256[](tokenCount);
        
        uint256 shareRatio = (sharesToBurn * PRECISION) / tick.totalLpShares;
        
        for (uint256 i = 0; i < tokenCount; i++) {
            amounts[i] = (tick.reserves[i] * shareRatio) / PRECISION;
        }
    }
    
    function _updateTickOnLiquidityRemove(
        uint256 tickId,
        uint256[] memory amounts,
        uint256 shares
    ) internal {
        Tick storage tick = ticks[tickId];
        
        // Update reserves and shares
        for (uint256 i = 0; i < tokenCount; i++) {
            tick.reserves[i] -= amounts[i];
        }
        
        tick.totalLpShares -= shares;
        tick.lpShareOwners[msg.sender] -= shares;
        
        uint256 removedLiquidity = _calculateTickLiquidity(amounts);
        tick.totalLiquidity -= removedLiquidity;
        
        tick.normalizedPosition = _calculateNormalizedPosition(tickId);
        tick.invariant = _calculateTickInvariant(tickId);
    }
    
    function _updateGlobalStateOnLiquidityRemove(uint256[] memory amounts) internal {
        for (uint256 i = 0; i < tokenCount; i++) {
            globalState.totalReserves[i] -= amounts[i];
            globalState.sumOfSquaredReserves[i] -= (amounts[i] * amounts[i]) / PRECISION;
        }
        _recalculateGlobalInvariant();
    }
    
    function _updateReservesForTrade(
        uint256 tokenInIndex,
        uint256 tokenOutIndex,
        uint256 amountIn,
        uint256 amountOut
    ) internal {
        globalState.totalReserves[tokenInIndex] += amountIn;
        globalState.totalReserves[tokenOutIndex] -= amountOut;
        
        globalState.sumOfSquaredReserves[tokenInIndex] = 
            (globalState.totalReserves[tokenInIndex] * globalState.totalReserves[tokenInIndex]) / PRECISION;
        globalState.sumOfSquaredReserves[tokenOutIndex] = 
            (globalState.totalReserves[tokenOutIndex] * globalState.totalReserves[tokenOutIndex]) / PRECISION;
    }
    
    function _distributeFees(
        uint256 tokenInIndex,
        uint256 tokenOutIndex,
        uint256 feeAmount
    ) internal {
        // Distribute fees proportionally to active ticks
        uint256 totalActiveLiquidity = globalState.interiorTicks.totalLiquidity + globalState.boundaryTicks.totalLiquidity;
        
        if (totalActiveLiquidity > 0) {
            // Distribute to interior ticks
            if (globalState.interiorTicks.totalLiquidity > 0) {
                uint256 interiorFeeShare = (feeAmount * globalState.interiorTicks.totalLiquidity) / totalActiveLiquidity;
                _distributeFeesToTicks(interiorFeeShare, true);
            }
            
            // Distribute to boundary ticks
            if (globalState.boundaryTicks.totalLiquidity > 0) {
                uint256 boundaryFeeShare = (feeAmount * globalState.boundaryTicks.totalLiquidity) / totalActiveLiquidity;
                _distributeFeesToTicks(boundaryFeeShare, false);
            }
        }
    }
    
    function _distributeFeesToTicks(uint256 feeAmount, bool isInterior) internal {
        // This would distribute fees to individual ticks based on their liquidity contribution
        // For now, we'll accumulate fees in the consolidated data structures
        if (isInterior) {
            globalState.interiorTicks.invariant += feeAmount;
        } else {
            globalState.boundaryTicks.invariant += feeAmount;
        }
    }
    
    function _moveTickBetweenConsolidations(
        uint256 tickId,
        TickStatus oldStatus,
        TickStatus newStatus
    ) internal {
        Tick storage tick = ticks[tickId];
        
        // Remove from old consolidation
        if (oldStatus == TickStatus.Interior) {
            _removeFromInteriorConsolidation(tickId);
        } else {
            _removeFromBoundaryConsolidation(tickId);
        }
        
        // Add to new consolidation
        if (newStatus == TickStatus.Interior) {
            _addToInteriorConsolidation(tickId);
        } else {
            _addToBoundaryConsolidation(tickId);
        }
    }
    
    function _removeFromInteriorConsolidation(uint256 tickId) internal {
        Tick storage tick = ticks[tickId];
        
        for (uint256 i = 0; i < tokenCount; i++) {
            globalState.interiorTicks.totalReserves[i] -= tick.reserves[i];
            globalState.interiorTicks.sumSquaredReserves[i] -= (tick.reserves[i] * tick.reserves[i]) / PRECISION;
        }
        
        globalState.interiorTicks.totalLiquidity -= tick.totalLiquidity;
        globalState.interiorTicks.tickCount--;
    }
    
    function _addToInteriorConsolidation(uint256 tickId) internal {
        Tick storage tick = ticks[tickId];
        
        for (uint256 i = 0; i < tokenCount; i++) {
            globalState.interiorTicks.totalReserves[i] += tick.reserves[i];
            globalState.interiorTicks.sumSquaredReserves[i] += (tick.reserves[i] * tick.reserves[i]) / PRECISION;
        }
        
        globalState.interiorTicks.totalLiquidity += tick.totalLiquidity;
        globalState.interiorTicks.tickCount++;
    }
    
    function _removeFromBoundaryConsolidation(uint256 tickId) internal {
        Tick storage tick = ticks[tickId];
        
        for (uint256 i = 0; i < tokenCount; i++) {
            globalState.boundaryTicks.totalReserves[i] -= tick.reserves[i];
            globalState.boundaryTicks.sumSquaredReserves[i] -= (tick.reserves[i] * tick.reserves[i]) / PRECISION;
        }
        
        globalState.boundaryTicks.totalLiquidity -= tick.totalLiquidity;
        globalState.boundaryTicks.tickCount--;
    }
    
    function _addToBoundaryConsolidation(uint256 tickId) internal {
        Tick storage tick = ticks[tickId];
        
        for (uint256 i = 0; i < tokenCount; i++) {
            globalState.boundaryTicks.totalReserves[i] += tick.reserves[i];
            globalState.boundaryTicks.sumSquaredReserves[i] += (tick.reserves[i] * tick.reserves[i]) / PRECISION;
        }
        
        globalState.boundaryTicks.totalLiquidity += tick.totalLiquidity;
        globalState.boundaryTicks.tickCount++;
    }
    
    function _calculateSegmentToBoundary(
        uint256 boundaryTickId,
        uint256 tokenInIndex,
        uint256 tokenOutIndex,
        uint256 remainingAmountIn
    ) internal view returns (uint256 segmentAmountIn) {
        // Calculate exact trade amount to reach tick boundary using the quadratic equation
        // This implements the formula from page 23 of the whitepaper
        
        Tick storage tick = ticks[boundaryTickId];
        
        // Set up the quadratic equation: A*d_i² + B*d_i + C = 0
        // where d_i is the segment amount we're solving for
        
        // Calculate coefficients A, B, C based on the toroidal invariant
        (int256 A, int256 B, int256 C) = _calculateQuadraticCoefficients(
            boundaryTickId, tokenInIndex, tokenOutIndex
        );
        
        // Solve quadratic equation using the formula: d_i = (-B + sqrt(B² - 4AC)) / 2A
        // Handle signed arithmetic carefully
        int256 discriminant = B * B - 4 * A * C;
        
        if (discriminant > 0 && A != 0) {
            // Take the positive root for the segment amount
            // Use absolute values for sqrt calculation
            uint256 absDiscriminant = uint256(discriminant > 0 ? discriminant : -discriminant);
            uint256 sqrtDiscriminant = Math.sqrt(absDiscriminant);
            
            uint256 denominator = uint256(2 * (A > 0 ? A : -A));
            if (denominator != 0) {
                if (B < 0) {
                    segmentAmountIn = uint256(sqrtDiscriminant - uint256(-B)) / denominator;
                } else {
                    segmentAmountIn = uint256(sqrtDiscriminant + uint256(B)) / denominator;
                }
            } else {
                segmentAmountIn = remainingAmountIn;
            }
        } else {
            segmentAmountIn = remainingAmountIn;
        }
        
        // Ensure we don't exceed the remaining amount
        if (segmentAmountIn > remainingAmountIn) {
            segmentAmountIn = remainingAmountIn;
        }
        
        // Ensure the result is positive
        if (segmentAmountIn > remainingAmountIn) {
            segmentAmountIn = 0;
        }
    }
    
    /**
     * @notice Calculate the quadratic equation coefficients A, B, C for segment calculation
     * @dev This implements the mathematical derivation from page 23 of the whitepaper
     * Uses finite difference method to calculate derivatives of the toroidal invariant
     */
    function _calculateQuadraticCoefficients(
        uint256 boundaryTickId,
        uint256 tokenInIndex,
        uint256 tokenOutIndex
    ) internal view returns (int256 A, int256 B, int256 C) {
        // Use signed integers as coefficients can be negative
        uint256 h = 1e12; // Small step for finite difference calculation
        
        // Calculate C (constant term): difference between current and target invariant
        uint256 currentInvariant = _calculateGlobalInvariantFromReserves(globalState.totalReserves);
        uint256 targetInvariant = _getInvariantAtBoundary(boundaryTickId);
        C = int256(currentInvariant) - int256(targetInvariant);
        
        // Calculate reserves with +h trade
        uint256[] memory reservesPlusH = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            reservesPlusH[i] = globalState.totalReserves[i];
        }
        reservesPlusH[tokenInIndex] += h;
        
        // Calculate reserves with -h trade
        uint256[] memory reservesMinusH = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            reservesMinusH[i] = globalState.totalReserves[i];
        }
        if (globalState.totalReserves[tokenInIndex] > h) {
            reservesMinusH[tokenInIndex] -= h;
        } else {
            reservesMinusH[tokenInIndex] = 0;
        }
        
        // Calculate B (linear term): first derivative using finite difference
        // B ≈ (I(d=h) - I(d=-h)) / 2h
        int256 IPlusH = int256(_calculateGlobalInvariantFromReserves(reservesPlusH));
        int256 IMinusH = int256(_calculateGlobalInvariantFromReserves(reservesMinusH));
        int256 denominator = int256(2 * h);
        if (denominator != 0) {
            B = (IPlusH - IMinusH) / denominator;
        } else {
            B = 0;
        }
        
        // Calculate A (quadratic term): second derivative using finite difference
        // A ≈ (I(d=h) - 2*I(d=0) + I(d=-h)) / (2*h²)
        int256 IZero = int256(currentInvariant);
        int256 denominatorA = int256(2 * h * h);
        if (denominatorA != 0) {
            A = (IPlusH - 2 * IZero + IMinusH) / denominatorA;
        } else {
            A = 0;
        }
        
        return (A, B, C);
    }
    
    /**
     * @notice Get the target invariant value at a specific boundary
     * @dev Calculates what the invariant should be when reaching the boundary
     */
    function _getInvariantAtBoundary(uint256 boundaryTickId) internal view returns (uint256) {
        Tick storage tick = ticks[boundaryTickId];
        
        // The target invariant is based on the normalized boundary
        // This represents the invariant value when the tick reaches its boundary
        uint256 targetInvariant = (tick.normalizedBoundary * tick.normalizedBoundary) / PRECISION;
        
        // Add a small buffer to ensure we reach the boundary
        return targetInvariant + 1e12;
    }
    

    
    /**
     * @notice Calculate the derivative ∂α_int_norm/∂d_i
     * @dev This represents how the normalized interior projection changes with input amount
     */
    function _calculateAlphaIntNormDerivative(uint256 tokenInIndex) internal view returns (uint256) {
        // The derivative depends on how the interior reserves change with the input
        // For a small change in input, the derivative is approximately:
        // ∂α_int_norm/∂d_i ≈ (r_i / ||r_interior||) * (1 / totalInteriorRadius)
        
        uint256 totalInteriorRadius = _calculateTotalInteriorRadius();
        if (totalInteriorRadius == 0) {
            return 0;
        }
        
        uint256 interiorReserveI = globalState.interiorTicks.totalReserves[tokenInIndex];
        uint256 interiorNorm = Math.sqrt(globalState.interiorTicks.invariant * PRECISION);
        
        if (interiorNorm == 0) {
            return 0;
        }
        
        return (interiorReserveI * PRECISION) / (interiorNorm * totalInteriorRadius / PRECISION);
    }
    
    /**
     * @notice Distribute reserve changes to individual ticks proportionally to their radius
     * @dev Ensures individual tick states remain synchronized with global state
     * Based on the consolidation math from page 16: x_a = (r_a / r_b) * x_b
     */
    function _distributeReserveChanges(
        uint256 tokenInIndex,
        uint256 amountIn,
        uint256 tokenOutIndex,
        uint256 amountOut
    ) internal {
        uint256 totalInteriorRadius = _calculateTotalInteriorRadius();
        
        if (totalInteriorRadius == 0) {
            return;
        }
        
        // Distribute changes proportionally to all interior ticks based on radius
        for (uint256 tickId = 1; tickId < nextTickId; tickId++) {
            Tick storage tick = ticks[tickId];
            
            if (tick.status == TickStatus.Interior) {
                // Calculate proportional changes based on tick's share of total radius
                uint256 tickShare = (tick.radius * PRECISION) / totalInteriorRadius;
                
                uint256 tickAmountIn = (amountIn * tickShare) / PRECISION;
                uint256 tickAmountOut = (amountOut * tickShare) / PRECISION;
                
                // Update tick reserves
                tick.reserves[tokenInIndex] += tickAmountIn;
                tick.reserves[tokenOutIndex] -= tickAmountOut;
                
                // Update tick's normalized position
                tick.normalizedPosition = _calculateNormalizedPosition(tickId);
            }
        }
    }
}