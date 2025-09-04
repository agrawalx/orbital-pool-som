// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/orbital.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock stable coin contract for deployment
contract StableCoin is ERC20 {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract DeployScript is Script {
    // Deployment configuration
    uint256 public constant INITIAL_SUPPLY = 1000000 * 1e18; // 1M tokens each
    
    // Token names and symbols
    string[5] public tokenNames = ["USD Coin", "Tether USD", "Dai Stablecoin", "TrueUSD", "Frax"];
    string[5] public tokenSymbols = ["USDC", "USDT", "DAI", "TUSD", "FRAX"];
    
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy 5 stable coins
        StableCoin[5] memory stableCoins;
        IERC20[5] memory poolTokens;
        
        console.log("\n=== Deploying Stable Coins ===");
        for (uint256 i = 0; i < 5; i++) {
            stableCoins[i] = new StableCoin(
                tokenNames[i],
                tokenSymbols[i],
                18, // All tokens use 18 decimals
                INITIAL_SUPPLY
            );
            
            poolTokens[i] = IERC20(address(stableCoins[i]));
            
            console.log(
                string.concat(
                    "Deployed ",
                    tokenSymbols[i],
                    " at:"
                ),
                address(stableCoins[i])
            );
            console.log(
                string.concat(
                    "Initial supply: ",
                    vm.toString(stableCoins[i].totalSupply() / 1e18),
                    " tokens"
                )
            );
        }
        
        // Deploy Orbital Pool
        console.log("\n=== Deploying Orbital Pool ===");
        orbitalPool pool = new orbitalPool(poolTokens);
        
        console.log("Orbital Pool deployed at:", address(pool));
        console.log("Pool configured with tokens:");
        for (uint256 i = 0; i < 5; i++) {
            console.log(
                string.concat(
                    "  Token ",
                    vm.toString(i),
                    " (",
                    tokenSymbols[i],
                    "):"
                ),
                address(pool.tokens(i))
            );
        }
        
        // Verify pool configuration
        console.log("\n=== Pool Configuration ===");
        console.log("Tokens count:", pool.TOKENS_COUNT());
        console.log("Swap fee (basis points):", pool.swapFee());
        console.log("Fee denominator:", pool.FEE_DENOMINATOR());
        console.log("Active ticks count:", pool.getActiveTicks().length);
        
        vm.stopBroadcast();
        
        // Output deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("Deployer:", deployer);
        console.log("Orbital Pool:", address(pool));
        console.log("\nStable Coins:");
        for (uint256 i = 0; i < 5; i++) {
            console.log(
                string.concat(
                    tokenSymbols[i],
                    ":"
                ),
                address(stableCoins[i])
            );
        }
        
        console.log("\n=== Next Steps ===");
        console.log("1. The Orbital Pool has been deployed with 5 stable coins");
        console.log("2. All tokens have 18 decimals and 1M initial supply");
        console.log("3. You can now manually call addLiquidity() to add liquidity to ticks");
        console.log("4. Remember to approve tokens before calling addLiquidity()");
        console.log("5. Use the helper functions to calculate valid k values for your desired reserves");
        
        // Save deployment addresses to file for easy access
        _saveDeploymentAddresses(address(pool), stableCoins);
    }
    
    function _saveDeploymentAddresses(address poolAddress, StableCoin[5] memory tokens) internal {
        string memory deployment = string.concat(
            "# Orbital Pool Deployment\n\n",
            "## Orbital Pool\n",
            "Address: ", vm.toString(poolAddress), "\n\n",
            "## Stable Coins\n"
        );
        
        for (uint256 i = 0; i < 5; i++) {
            deployment = string.concat(
                deployment,
                "- ", tokenSymbols[i], ": ", vm.toString(address(tokens[i])), "\n"
            );
        }
        
        deployment = string.concat(
            deployment,
            "\n## Usage Examples\n\n",
            "### Adding Liquidity\n",
            "```solidity\n",
            "// 1. Calculate valid k value for your reserves\n",
            "uint256[5] memory amounts = [1000e18, 1000e18, 1000e18, 1000e18, 1000e18];\n",
            "uint256 k = calculateValidK(amounts); // Implement this helper\n\n",
            "// 2. Approve tokens\n",
            "for (uint i = 0; i < 5; i++) {\n",
            "    IERC20(tokenAddress[i]).approve(poolAddress, amounts[i]);\n",
            "}\n\n",
            "// 3. Add liquidity\n",
            "orbitalPool(poolAddress).addLiquidity(k, amounts);\n",
            "```\n\n",
            "### Swapping\n",
            "```solidity\n",
            "// Swap 100 USDC for DAI\n",
            "uint256 amountIn = 100e18;\n",
            "uint256 minAmountOut = 95e18; // 5% slippage tolerance\n",
            "IERC20(usdcAddress).approve(poolAddress, amountIn);\n",
            "orbitalPool(poolAddress).swap(0, 2, amountIn, minAmountOut);\n",
            "```\n"
        );
        
        vm.writeFile("deployment.md", deployment);
        console.log("\nDeployment details saved to deployment.md");
    }
}
