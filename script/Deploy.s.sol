// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/SimpleToken.sol";
import "../src/orbital.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy 5 SimpleToken contracts
        SimpleToken usdc = new SimpleToken("USD Coin", "USDC", 18);
        SimpleToken usdt = new SimpleToken("Tether", "USDT", 18);
        SimpleToken dai = new SimpleToken("Dai", "DAI", 18);
        SimpleToken frax = new SimpleToken("Frax", "FRAX", 18);
        SimpleToken lusdc = new SimpleToken("LayerZero USDC", "LUSDC", 18);

        // 2. Deploy orbital.sol with the token addresses
        IERC20[5] memory tokens = [
            IERC20(address(usdc)),
            IERC20(address(usdt)),
            IERC20(address(dai)),
            IERC20(address(frax)),
            IERC20(address(lusdc))
        ];

        orbitalPool orbital = new orbitalPool(tokens);

        // 3. Approve 10000 tokens of each type to the orbital contract
        uint256 approvalAmount = 10000 * 10**18; // Assuming 18 decimals

        usdc.approve(address(orbital), approvalAmount);
        usdt.approve(address(orbital), approvalAmount);
        dai.approve(address(orbital), approvalAmount);
        frax.approve(address(orbital), approvalAmount);
        lusdc.approve(address(orbital), approvalAmount);

        vm.stopBroadcast();
    }
}
