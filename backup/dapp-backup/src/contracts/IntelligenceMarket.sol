// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IntelligenceMarket is Ownable {
    struct Asset {
        uint256 id;
        string name;
        uint256 price;
        address owner;
    }

    IERC20 public token;
    uint256 public nextAssetId;
    mapping(uint256 => Asset) public assets;

    event AssetListed(uint256 indexed id, string name, uint256 price, address indexed owner);
    event AssetPurchased(uint256 indexed id, address indexed buyer);

    constructor(address tokenAddress) {
        token = IERC20(tokenAddress);
    }

    function listAsset(string memory name, uint256 price) external {
        require(price > 0, "Price must be greater than zero");

        assets[nextAssetId] = Asset({
            id: nextAssetId,
            name: name,
            price: price,
            owner: msg.sender
        });

        emit AssetListed(nextAssetId, name, price, msg.sender);
        nextAssetId++;
    }

    function purchaseAsset(uint256 assetId) external {
        Asset storage asset = assets[assetId];
        require(asset.owner != address(0), "Asset does not exist");
        require(asset.owner != msg.sender, "Cannot purchase your own asset");
        require(token.transferFrom(msg.sender, asset.owner, asset.price), "Payment failed");

        asset.owner = msg.sender;
        emit AssetPurchased(assetId, msg.sender);
    }
}