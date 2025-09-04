/**
 * Orbital AMM - Mathematical Core
 * 
 * Implements spherical geometry-based automated market maker mathematics.
 * Uses K = ||r||² invariant where reserves form vectors in n-dimensional space.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */

export class OrbitalMath {
  static readonly PRECISION = BigInt('1000000000000000000') // 10^18

  /**
   * Calculate the radius (magnitude) of a reserve vector
   * @param reserves Array of token reserves
   * @returns Radius as sqrt(x₁² + x₂² + ... + xₙ²)
   */
  static calculateRadius(reserves: bigint[]): bigint {
    let sumOfSquares = BigInt(0);
    
    for (const reserve of reserves) {
      sumOfSquares += reserve * reserve;
    }
    
    return this.integerSqrt(sumOfSquares);
  }

  /**
   * Calculate the K constant (sum of squared reserves)
   * @param reserves Array of token reserves
   * @returns K = ||r||² = x₁² + x₂² + ... + xₙ²
   */
  static calculateKConstant(reserves: bigint[]): bigint {
    let k = BigInt(0);
    
    for (const reserve of reserves) {
      k += reserve * reserve;
    }
    
    return k;
  }

  /**
   * Calculate trade output using spherical invariant preservation
   * @param reserves Current token reserves
   * @param tokenIn Index of input token
   * @param tokenOut Index of output token  
   * @param amountIn Amount of input tokens
   * @returns Amount of output tokens
   * @throws Error if trade is invalid or insufficient liquidity
   */
  static calculateTradeOutput(
    reserves: bigint[],
    tokenIn: number,
    tokenOut: number,
    amountIn: bigint
  ): bigint {
    if (tokenIn === tokenOut) {
      throw new Error('Cannot trade same token');
    }
    
    if (tokenIn >= reserves.length || tokenOut >= reserves.length) {
      throw new Error('Invalid token index');
    }

    const kConstant = this.calculateKConstant(reserves);
    const rIn = reserves[tokenIn];
    const rOut = reserves[tokenOut];

    const newRIn = rIn + amountIn;
    const newRInSquared = newRIn * newRIn;

    let otherSquaresSum = BigInt(0);
    for (let i = 0; i < reserves.length; i++) {
      if (i !== tokenIn && i !== tokenOut) {
        otherSquaresSum += reserves[i] * reserves[i];
      }
    }

    const remainingForROutSquared = kConstant - newRInSquared - otherSquaresSum;
    
    if (remainingForROutSquared <= BigInt(0)) {
      throw new Error('Insufficient liquidity');
    }

    const newROut = this.integerSqrt(remainingForROutSquared);
    
    if (newROut > rOut) {
      throw new Error('Invalid trade calculation');
    }

    return rOut - newROut;
  }

  /**
   * Calculate price impact for a trade
   */
  static calculatePriceImpact(
    reserves: bigint[],
    tokenIn: number,
    tokenOut: number,
    amountIn: bigint,
    amountOut: bigint
  ): number {
    const rIn = reserves[tokenIn]
    const rOut = reserves[tokenOut]

    // Old price: r_out / r_in
    const oldPrice = Number(rOut * this.PRECISION / rIn) / Number(this.PRECISION)
    
    // Trade price: amount_out / amount_in
    const tradePrice = Number(amountOut * this.PRECISION / amountIn) / Number(this.PRECISION)
    
    // Price impact as percentage
    return Math.abs((tradePrice - oldPrice) / oldPrice) * 100
  }

  /**
   * Classify tick as Interior or Boundary
   */
  static classifyTick(
    reserves: bigint[],
    radius: bigint,
    planeConstant: bigint
  ): 'Interior' | 'Boundary' {
    const currentRadius = this.calculateRadius(reserves)
    const normalizedPosition = (currentRadius * this.PRECISION) / radius
    const normalizedBoundary = (planeConstant * this.PRECISION) / radius

    return normalizedPosition >= normalizedBoundary ? 'Boundary' : 'Interior'
  }

  /**
   * Calculate capital efficiency for concentrated liquidity
   */
  static calculateEfficiency(
    concentratedReserves: bigint[],
    uniformReserves: bigint[]
  ): number {
    const concentratedK = this.calculateKConstant(concentratedReserves)
    const uniformK = this.calculateKConstant(uniformReserves)

    if (concentratedK === BigInt(0)) return 1000 // Max efficiency

    const efficiency = Number(uniformK * this.PRECISION / concentratedK) / Number(this.PRECISION)
    return Math.min(efficiency, 1000) // Cap at 1000x
  }

  /**
   * Integer square root using Newton's method
   */
  static integerSqrt(n: bigint): bigint {
    if (n === BigInt(0)) return BigInt(0)
    if (n === BigInt(1)) return BigInt(1)

    let x = n
    let y = (x + BigInt(1)) / BigInt(2)

    let iterations = 0
    const maxIterations = 100

    while (y < x && iterations < maxIterations) {
      x = y
      y = (x + n / x) / BigInt(2)
      iterations++
    }

    return x
  }

  /**
   * Normalize reserves to unit vector
   */
  static normalizeReserves(reserves: bigint[]): bigint[] {
    const radius = this.calculateRadius(reserves)
    
    return reserves.map(reserve => 
      (reserve * this.PRECISION) / radius
    )
  }

  /**
   * Calculate liquidity for a position
   */
  static calculateLiquidity(reserves: bigint[]): bigint {
    return this.calculateRadius(reserves)
  }

  /**
   * Estimate gas cost for operations
   */
  static estimateGasCost(
    operation: 'swap' | 'addLiquidity' | 'removeLiquidity',
    complexity: number = 1
  ): number {
    const baseCosts = {
      swap: 80000,
      addLiquidity: 120000,
      removeLiquidity: 100000
    }

    return baseCosts[operation] + (complexity * 15000)
  }
}

// Helper functions for frontend calculations
export function parseTokenAmount(amount: string, decimals: number): bigint {
  if (!amount || amount === '') return BigInt(0)
  
  const [whole, fraction = ''] = amount.split('.')
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals)
  
  return BigInt(whole + paddedFraction)
}

export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10) ** BigInt(decimals)
  const whole = amount / divisor
  const fraction = amount % divisor
  
  if (fraction === BigInt(0)) {
    return whole.toString()
  }
  
  const fractionStr = fraction.toString().padStart(decimals, '0')
  const trimmedFraction = fractionStr.replace(/0+$/, '')
  
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole.toString()
}