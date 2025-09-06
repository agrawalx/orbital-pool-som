/**
 * Orbital AMM - Contract ABI
 * 
 * Application Binary Interface for the Orbital Pool contract.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */

export const ORBITAL_POOL_ABI = [
    // Constructor
    {
        type: 'constructor',
        inputs: [
            {
                name: '_tokens',
                type: 'address[5]',
                internalType: 'contract IERC20[5]'
            }
        ],
        stateMutability: 'nonpayable'
    },

    // Constants and state variables
    {
        name: 'TOKENS_COUNT',
        type: 'function',
        inputs: [],
        outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'view'
    },
    {
        name: 'FEE_DENOMINATOR',
        type: 'function',
        inputs: [],
        outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'view'
    },
    {
        name: 'swapFee',
        type: 'function',
        inputs: [],
        outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'view'
    },
    {
        name: 'tokens',
        type: 'function',
        inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
        outputs: [{ name: '', type: 'address', internalType: 'contract IERC20' }],
        stateMutability: 'view'
    },

    // Main functions
    {
        name: 'addLiquidity',
        type: 'function',
        inputs: [
            { name: 'k', type: 'uint256', internalType: 'uint256' },
            { name: 'amounts', type: 'uint256[5]', internalType: 'uint256[5]' }
        ],
        outputs: [],
        stateMutability: 'nonpayable'
    },
    {
        name: 'removeLiquidity',
        type: 'function',
        inputs: [
            { name: 'k', type: 'uint256', internalType: 'uint256' },
            { name: 'lpSharesToRemove', type: 'uint256', internalType: 'uint256' },
            { name: 'minAmountsOut', type: 'uint256[5]', internalType: 'uint256[5]' }
        ],
        outputs: [
            { name: 'amounts', type: 'uint256[5]', internalType: 'uint256[5]' }
        ],
        stateMutability: 'nonpayable'
    },
    {
        name: 'swap',
        type: 'function',
        inputs: [
            { name: 'tokenIn', type: 'uint256', internalType: 'uint256' },
            { name: 'tokenOut', type: 'uint256', internalType: 'uint256' },
            { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
            { name: 'minAmountOut', type: 'uint256', internalType: 'uint256' }
        ],
        outputs: [
            { name: 'amountOut', type: 'uint256', internalType: 'uint256' }
        ],
        stateMutability: 'nonpayable'
    },

    // View functions
    {
        name: 'getTickInfo',
        type: 'function',
        inputs: [{ name: 'k', type: 'uint256', internalType: 'uint256' }],
        outputs: [
            { name: 'r', type: 'uint256', internalType: 'uint256' },
            { name: 'liquidity', type: 'uint256', internalType: 'uint256' },
            { name: 'reserves', type: 'uint256[5]', internalType: 'uint256[5]' },
            { name: 'totalLpShares', type: 'uint256', internalType: 'uint256' },
            { name: 'status', type: 'uint8', internalType: 'enum orbitalPool.TickStatus' },
            { name: 'accruedFees', type: 'uint256', internalType: 'uint256' }
        ],
        stateMutability: 'view'
    },
    {
        name: 'getUserLpShares',
        type: 'function',
        inputs: [
            { name: 'k', type: 'uint256', internalType: 'uint256' },
            { name: 'user', type: 'address', internalType: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'view'
    },
    {
        name: 'getActiveTicks',
        type: 'function',
        inputs: [],
        outputs: [{ name: '', type: 'uint256[]', internalType: 'uint256[]' }],
        stateMutability: 'view'
    },
    {
        name: '_getTotalReserves',
        type: 'function',
        inputs: [],
        outputs: [
            { name: 'totalReserves', type: 'uint256[5]', internalType: 'uint256[5]' }
        ],
        stateMutability: 'view'
    },
    {
        name: '_calculateSwapOutput',
        type: 'function',
        inputs: [
            { name: 'tokenIn', type: 'uint256', internalType: 'uint256' },
            { name: 'tokenOut', type: 'uint256', internalType: 'uint256' },
            { name: 'amountIn', type: 'uint256', internalType: 'uint256' }
        ],
        outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'view'
    },

    // Events
    {
        name: 'LiquidityAdded',
        type: 'event',
        anonymous: false,
        inputs: [
            { name: 'provider', type: 'address', indexed: true, internalType: 'address' },
            { name: 'k', type: 'uint256', indexed: false, internalType: 'uint256' },
            { name: 'amounts', type: 'uint256[5]', indexed: false, internalType: 'uint256[5]' },
            { name: 'lpShares', type: 'uint256', indexed: false, internalType: 'uint256' }
        ]
    },
    {
        name: 'LiquidityRemoved',
        type: 'event',
        anonymous: false,
        inputs: [
            { name: 'provider', type: 'address', indexed: true, internalType: 'address' },
            { name: 'k', type: 'uint256', indexed: false, internalType: 'uint256' },
            { name: 'amounts', type: 'uint256[5]', indexed: false, internalType: 'uint256[5]' },
            { name: 'lpShares', type: 'uint256', indexed: false, internalType: 'uint256' }
        ]
    },
    {
        name: 'Swap',
        type: 'event',
        anonymous: false,
        inputs: [
            { name: 'trader', type: 'address', indexed: true, internalType: 'address' },
            { name: 'tokenIn', type: 'uint256', indexed: false, internalType: 'uint256' },
            { name: 'tokenOut', type: 'uint256', indexed: false, internalType: 'uint256' },
            { name: 'amountIn', type: 'uint256', indexed: false, internalType: 'uint256' },
            { name: 'amountOut', type: 'uint256', indexed: false, internalType: 'uint256' },
            { name: 'fee', type: 'uint256', indexed: false, internalType: 'uint256' }
        ]
    },
    {
        name: 'TickStatusChanged',
        type: 'event',
        anonymous: false,
        inputs: [
            { name: 'k', type: 'uint256', indexed: false, internalType: 'uint256' },
            { name: 'oldStatus', type: 'uint8', indexed: false, internalType: 'enum orbitalPool.TickStatus' },
            { name: 'newStatus', type: 'uint8', indexed: false, internalType: 'enum orbitalPool.TickStatus' }
        ]
    },

    // Errors
    {
        name: 'InvalidKValue',
        type: 'error',
        inputs: []
    },
    {
        name: 'InvalidAmounts',
        type: 'error',
        inputs: []
    },
    {
        name: 'TickAlreadyExists',
        type: 'error',
        inputs: []
    },
    {
        name: 'InsufficientLiquidity',
        type: 'error',
        inputs: []
    },
    {
        name: 'InvalidTokenIndex',
        type: 'error',
        inputs: []
    },
    {
        name: 'SlippageExceeded',
        type: 'error',
        inputs: []
    },
    {
        name: 'InsufficientLpShares',
        type: 'error',
        inputs: []
    }
] as const;

// ERC20 ABI for token approvals and transfers
export const ERC20_ABI = [
    {
        name: 'approve',
        type: 'function',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable'
    },
    {
        name: 'allowance',
        type: 'function',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view'
    },
    {
        name: 'balanceOf',
        type: 'function',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view'
    },
    {
        name: 'decimals',
        type: 'function',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
        stateMutability: 'view'
    },
    {
        name: 'symbol',
        type: 'function',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view'
    },
    {
        name: 'name',
        type: 'function',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view'
    }
] as const;
