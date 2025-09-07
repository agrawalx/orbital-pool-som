// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title SimpleToken
 * @dev A simple ERC20 token that mints 10,000 tokens to the deployer
 * @notice Deploy with different name/symbol parameters to create different tokens
 */
contract SimpleToken is ERC20 {
    uint8 private _decimals;
    address public owner;
    uint256 public constant INITIAL_MINT = 10000 * 1e18; // 10,000 tokens
    
    /**
     * @dev Constructor that creates the token and mints initial supply to deployer.
     * @param name The name of the token (e.g., "USD Coin")
     * @param symbol The symbol of the token (e.g., "USDC")
     * @param decimals_ The number of decimals (usually 18)
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        owner = msg.sender;
        
        // Mint 10,000 tokens to the deployer
        _mint(msg.sender, INITIAL_MINT);
    }
    
    /**
     * @dev Returns the number of decimals used to get its user representation
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Mint additional tokens (only owner)
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == owner, "Only owner can mint");
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens (only owner)
     * @param from The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burn(address from, uint256 amount) external {
        require(msg.sender == owner, "Only owner can burn");
        _burn(from, amount);
    }
    
    /**
     * @dev Transfer ownership to a new address
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Only owner can transfer ownership");
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}