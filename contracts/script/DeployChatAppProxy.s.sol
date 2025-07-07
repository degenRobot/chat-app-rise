// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/ChatApp.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "forge-std/console.sol";

contract DeployChatAppProxy is Script {
    function run() external returns (address proxyAddress, address implAddress) {
        // Get the deployer's private key for broadcasting the transaction
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        require(deployerPrivateKey != 0, "PRIVATE_KEY must be set in .env");

        vm.startBroadcast(deployerPrivateKey);

        // Get the deployer's address from the private key
        address initialOwner = vm.addr(deployerPrivateKey);
        console.log("Initial Owner Address (deployer):", initialOwner);

        // Deploy the implementation contract
        ChatApp implementation = new ChatApp();
        implAddress = address(implementation);
        console.log("ChatApp implementation deployed at:", implAddress);

        // Prepare the initialization call data
        bytes memory initData = abi.encodeWithSelector(
            ChatApp.initialize.selector,
            initialOwner
        );

        // Deploy the ERC1967Proxy
        ERC1967Proxy proxy = new ERC1967Proxy(implAddress, initData);
        proxyAddress = address(proxy);
        console.log("ERC1967Proxy for ChatApp deployed at:", proxyAddress);

        vm.stopBroadcast();

        // Log the deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("ChatApp Proxy Address:", proxyAddress);
        console.log("ChatApp Implementation Address:", implAddress);
        console.log("Owner:", initialOwner);
    }
}