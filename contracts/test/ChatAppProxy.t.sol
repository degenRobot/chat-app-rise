// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/ChatApp.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract ChatAppProxyTest is Test {
    ChatApp public implementation;
    ERC1967Proxy public proxy;
    ChatApp public chatApp;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    
    function setUp() public {
        // Deploy implementation
        implementation = new ChatApp();
        
        // Deploy proxy with initialization
        bytes memory initData = abi.encodeWithSelector(
            ChatApp.initialize.selector,
            owner
        );
        proxy = new ERC1967Proxy(address(implementation), initData);
        
        // Cast proxy to ChatApp interface
        chatApp = ChatApp(address(proxy));
    }
    
    function testInitialization() public view {
        assertEq(chatApp.owner(), owner);
        assertEq(chatApp.msgId(), 0);
        assertEq(chatApp.topicId(), 0); // Proxy doesn't execute constructor logic
    }
    
    function testUserRegistration() public {
        vm.prank(user1);
        chatApp.registerUser("Alice");
        
        assertEq(chatApp.userId(user1), "Alice");
        assertTrue(chatApp.isUserRegistered(user1));
    }
    
    function testCannotRegisterTwice() public {
        vm.prank(user1);
        chatApp.registerUser("Alice");
        
        vm.prank(user1);
        vm.expectRevert("User already registered");
        chatApp.registerUser("Alice2");
    }
    
    function testUpdateUserId() public {
        vm.prank(user1);
        chatApp.registerUser("Alice");
        
        vm.prank(user1);
        chatApp.updateUserId("AliceUpdated");
        
        assertEq(chatApp.userId(user1), "AliceUpdated");
    }
    
    function testSendMessage() public {
        vm.prank(user1);
        chatApp.registerUser("Alice");
        
        // sendMessage now emits MessageSentToTopic with empty topic
        vm.expectEmit(true, true, false, true);
        emit ChatApp.MessageSentToTopic(user1, "Alice", "Hello World", 0, "");
        
        vm.prank(user1);
        chatApp.sendMessage("Hello World");
        
        assertEq(chatApp.msgId(), 1);
        assertEq(chatApp.msgIdToUser(0), user1);
    }
    
    function testCreateAndSendMessageToTopic() public {
        vm.prank(user1);
        chatApp.registerUser("Alice");
        
        // Create topic
        vm.expectEmit(true, false, false, true);
        emit ChatApp.TopicCreated(0, "General");
        
        vm.prank(user1);
        chatApp.createTopic("General");
        
        assertEq(chatApp.topics(0), "General");
        assertEq(chatApp.topicId(), 1);
        
        // Send message to topic
        vm.expectEmit(true, true, false, true);
        emit ChatApp.MessageSentToTopic(user1, "Alice", "Hello Topic", 0, "General");
        
        vm.prank(user1);
        chatApp.sendMessageToTopic("Hello Topic", 0); // Use topic ID 0 for "General"
        
        assertEq(chatApp.msgId(), 1);
    }
    
    function testKarmaSystem() public {
        // Register users
        vm.prank(user1);
        chatApp.registerUser("Alice");
        
        vm.prank(user2);
        chatApp.registerUser("Bob");
        
        // User1 sends a message
        vm.prank(user1);
        chatApp.sendMessage("Great post!");
        
        // User2 likes the message
        vm.expectEmit(true, true, false, true);
        emit ChatApp.MessageLiked(user2, "Bob", 0);
        vm.expectEmit(true, true, false, true);
        emit ChatApp.KarmaChanged(user1, "Alice", 1);
        
        vm.prank(user2);
        chatApp.likeMessage(0);
        
        assertEq(chatApp.karma(user1), 1);
        
        // User2 dislikes the message
        vm.expectEmit(true, true, false, true);
        emit ChatApp.MessageDisliked(user2, "Bob", 0);
        vm.expectEmit(true, true, false, true);
        emit ChatApp.KarmaChanged(user1, "Alice", 0);
        
        vm.prank(user2);
        chatApp.dislikeMessage(0);
        
        assertEq(chatApp.karma(user1), 0);
    }
    
    function testCannotKarmaOwnMessage() public {
        vm.prank(user1);
        chatApp.registerUser("Alice");
        
        vm.prank(user1);
        chatApp.sendMessage("My message");
        
        vm.prank(user1);
        vm.expectRevert("Cannot karma your own message");
        chatApp.likeMessage(0);
        
        vm.prank(user1);
        vm.expectRevert("Cannot karma your own message");
        chatApp.dislikeMessage(0);
    }
    
    function testProxyUpgrade() public view {
        // Test version
        assertEq(chatApp.version(), "2.0.0");
        
        // Test proxiableUUID
        assertEq(
            chatApp.proxiableUUID(),
            0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
        );
    }
    
    function testProxyPointsToImplementation() public view {
        // Get implementation address from proxy storage
        bytes32 implSlot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        bytes32 storedImpl = vm.load(address(proxy), implSlot);
        address actualImpl = address(uint160(uint256(storedImpl)));
        
        assertEq(actualImpl, address(implementation));
    }
}