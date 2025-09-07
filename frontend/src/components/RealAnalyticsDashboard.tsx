/**
 * Orbital AMM - Real Analytics Dashboard
 * 
 * Real-time analytics querying actual contract data.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Activity, 
  Droplets, 
  Zap, 
  Users, 
  Target, 
  BarChart3, 
  PieChart,
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TOKENS } from '@/lib/constants';
import { useOrbitalAMMEthers, formatTokenAmount } from '@/hooks/useOrbitalAMMEthers';
import { useWallet } from '@/hooks/useWallet';

interface TickData {
  k: bigint;
  r: bigint;
  liquidity: bigint;
  reserves: readonly [bigint, bigint, bigint, bigint, bigint];
  totalLpShares: bigint;
  status: number; // 0 = Interior, 1 = Boundary
}

interface TokenReserves {
  symbol: string;
  address: string;
  reserves: bigint;
  percentage: number;
  usdValue: number; // Assuming 1:1 USD peg for stablecoins
}

export function RealAnalyticsDashboard() {
  const { isConnected, address } = useWallet();
  const {
    activeTicks,
    getTickInfo,
    getUserLpShares,
    totalReserves,
    swapFee,
    isLoading,
    error
  } = useOrbitalAMMEthers();

  // State for analytics data
  const [ticksData, setTicksData] = useState<TickData[]>([]);
  const [userPositions, setUserPositions] = useState<{ k: bigint; shares: bigint }[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load real analytics data
  const loadAnalyticsData = async () => {
    if (!activeTicks || activeTicks.length === 0) return;

    try {
      setIsLoadingAnalytics(true);

      // Load tick data for all active ticks
      const tickDataPromises = activeTicks.map(async (k) => {
        const tickInfo = await getTickInfo(k);
        if (!tickInfo) return null;
        
        return {
          k,
          r: tickInfo.r,
          liquidity: tickInfo.liquidity,
          reserves: tickInfo.reserves,
          totalLpShares: tickInfo.totalLpShares,
          status: tickInfo.status
        };
      });

      const tickData = (await Promise.all(tickDataPromises)).filter(Boolean) as TickData[];
      setTicksData(tickData);

      // Load user positions if connected
      if (isConnected && address) {
        const userPositionPromises = activeTicks.map(async (k) => {
          const shares = await getUserLpShares(k, address);
          return { k, shares: shares || BigInt(0) };
        });

        const positions = await Promise.all(userPositionPromises);
        setUserPositions(positions.filter(p => p.shares > 0));
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadAnalyticsData();
  }, [activeTicks, isConnected, address]);

  // Calculate total value locked
  const totalValueLocked = useMemo(() => {
    if (!totalReserves) return 0;
    
    // Sum all reserves (assuming 1:1 USD peg for stablecoins)
    let total = 0;
    totalReserves.forEach((reserve, index) => {
      const tokenAmount = parseFloat(formatTokenAmount(reserve, TOKENS[index].decimals));
      total += tokenAmount; // 1:1 USD assumption
    });
    
    return total;
  }, [totalReserves]);

  // Calculate token distribution
  const tokenDistribution: TokenReserves[] = useMemo(() => {
    if (!totalReserves) return [];

    const totalUSD = totalValueLocked;
    
    return TOKENS.map((token, index) => {
      const reserves = totalReserves[index];
      const tokenAmount = parseFloat(formatTokenAmount(reserves, token.decimals));
      const usdValue = tokenAmount; // 1:1 USD assumption
      const percentage = totalUSD > 0 ? (usdValue / totalUSD) * 100 : 0;

      return {
        symbol: token.symbol,
        address: token.address,
        reserves,
        percentage,
        usdValue
      };
    });
  }, [totalReserves, totalValueLocked]);

  // Calculate analytics metrics
  const analytics = useMemo(() => {
    const activeTickCount = ticksData.length;
    const interiorTicks = ticksData.filter(t => t.status === 0).length; // Interior = 0
    const boundaryTicks = ticksData.filter(t => t.status === 1).length; // Boundary = 1
    
    const totalLiquidity = ticksData.reduce((sum, tick) => {
      return sum + parseFloat(formatTokenAmount(tick.liquidity, 18));
    }, 0);

    const avgLiquidityPerTick = activeTickCount > 0 ? totalLiquidity / activeTickCount : 0;
    
    const userLPPositions = userPositions.length;
    const userTotalShares = userPositions.reduce((sum, pos) => sum + pos.shares, BigInt(0));

    return {
      totalValueLocked,
      activeTicks: activeTickCount,
      interiorTicks,
      boundaryTicks,
      totalLiquidity,
      avgLiquidityPerTick,
      userLPPositions,
      userTotalShares,
      swapFeeRate: swapFee ? Number(swapFee) / 10000 : 0.3 // Convert basis points to percentage
    };
  }, [ticksData, userPositions, totalValueLocked, swapFee]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Pool Analytics</h1>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={loadAnalyticsData}
            disabled={isLoadingAnalytics}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">Error loading analytics: {error}</span>
        </motion.div>
      )}

      {/* Key Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {/* Total Value Locked */}
        <Card className="glass-morphism-dark border border-orange-500/20 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-orange-500/20 border border-orange-500/30">
              <Droplets className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300">Total Value Locked</h3>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(analytics.totalValueLocked)}
              </div>
            </div>
          </div>
        </Card>

        {/* Active Ticks */}
        <Card className="glass-morphism-dark border border-orange-500/20 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-blue-500/20 border border-blue-500/30">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300">Active Ticks</h3>
              <div className="text-2xl font-bold text-white">{analytics.activeTicks}</div>
              <div className="text-xs text-gray-400">
                {analytics.interiorTicks} Interior, {analytics.boundaryTicks} Boundary
              </div>
            </div>
          </div>
        </Card>

        {/* Total Liquidity */}
        <Card className="glass-morphism-dark border border-orange-500/20 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-green-500/20 border border-green-500/30">
              <Activity className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300">Total Liquidity</h3>
              <div className="text-2xl font-bold text-white">
                {formatNumber(analytics.totalLiquidity)}
              </div>
              <div className="text-xs text-gray-400">
                Avg: {formatNumber(analytics.avgLiquidityPerTick)} per tick
              </div>
            </div>
          </div>
        </Card>

        {/* Swap Fee Rate */}
        <Card className="glass-morphism-dark border border-orange-500/20 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-purple-500/20 border border-purple-500/30">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300">Swap Fee</h3>
              <div className="text-2xl font-bold text-white">
                {analytics.swapFeeRate}%
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Token Distribution */}
      <Card className="glass-morphism-dark border border-orange-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-orange-400" />
          Token Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {tokenDistribution.map((token, index) => (
            <div key={token.symbol} className="space-y-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: TOKENS[index].color }}
                />
                <span className="text-white font-medium">{token.symbol}</span>
              </div>
              <div className="text-sm text-gray-300">
                <div>{formatCurrency(token.usdValue)}</div>
                <div className="text-xs text-gray-400">{token.percentage.toFixed(1)}%</div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${token.percentage}%`,
                    backgroundColor: TOKENS[index].color 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* User Positions (if connected) */}
      {isConnected && (
        <Card className="glass-morphism-dark border border-orange-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Your Positions
          </h3>
          {userPositions.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-300 mb-4">
                Total Positions: {analytics.userLPPositions} | 
                Total LP Shares: {analytics.userTotalShares.toString()}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userPositions.map((position) => {
                  const tickData = ticksData.find(t => t.k === position.k);
                  return (
                    <div key={position.k.toString()} className="p-4 rounded-lg bg-black/20 border border-gray-700">
                      <div className="text-sm font-medium text-white">
                        Tick K: {position.k.toString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        LP Shares: {position.shares.toString()}
                      </div>
                      {tickData && (
                        <div className="text-xs text-gray-400 mt-1">
                          Status: {tickData.status === 0 ? 'Interior' : 'Boundary'} | 
                          Liquidity: {formatTokenAmount(tickData.liquidity, 18)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-center py-8">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No liquidity positions found</p>
              <p className="text-sm">Add liquidity to see your positions here</p>
            </div>
          )}
        </Card>
      )}

      {/* Detailed Tick Information */}
      <Card className="glass-morphism-dark border border-orange-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-400" />
          Active Ticks Details
        </h3>
        {ticksData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-300 py-2">K Value</th>
                  <th className="text-left text-gray-300 py-2">Status</th>
                  <th className="text-left text-gray-300 py-2">Radius</th>
                  <th className="text-left text-gray-300 py-2">Liquidity</th>
                  <th className="text-left text-gray-300 py-2">LP Shares</th>
                </tr>
              </thead>
              <tbody>
                {ticksData.map((tick) => (
                  <tr key={tick.k.toString()} className="border-b border-gray-800">
                    <td className="py-3 text-white font-mono">{tick.k.toString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        tick.status === 0 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {tick.status === 0 ? 'Interior' : 'Boundary'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-300">{formatTokenAmount(tick.r, 18)}</td>
                    <td className="py-3 text-gray-300">{formatTokenAmount(tick.liquidity, 18)}</td>
                    <td className="py-3 text-gray-300">{tick.totalLpShares.toString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No active ticks found</p>
            <p className="text-sm">Add liquidity to create the first tick</p>
          </div>
        )}
      </Card>
    </div>
  );
}
