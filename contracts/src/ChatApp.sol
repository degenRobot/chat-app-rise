// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title ChatApp
 * @notice Upgradeable ChatApp contract using UUPS proxy pattern
 */
contract ChatApp is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // --- Storage layout must match the original contract --- //
    
    mapping (address => string) public userId;
    mapping (address => bool) public isUserRegistered;
    mapping (address => int256) public karma;
    mapping (uint256 => address) public msgIdToUser;
    mapping (uint256 => string) public topics;

    mapping(uint256 => uint256) public msgToTopic;
    mapping(uint256 => int256) msgNetLikes;
    mapping(uint256 => int256) topNeticLikes;

    // Topic rating storage
    mapping(address => mapping(uint256 => uint8)) public userTopicRatings;
    mapping(uint256 => uint256) public topicTotalRatings;
    mapping(uint256 => uint256) public topicRatingSum;

    uint256 public msgId;
    uint256 public topicId;

    // --- Events --- //
    event UserRegistered(address indexed user, string userId);
    event UserUpdated(address indexed user, string userId);
    event MessageSent(address indexed user, string userId, string message, uint256 msgId);
    event MessageSentToTopic(address indexed user, string userId, string message, uint256 msgId, string topic);
    event MessageLiked(address indexed user, string userId, uint256 msgId);
    event MessageDisliked(address indexed user, string userId, uint256 msgId);
    event KarmaChanged(address indexed user, string userId, int256 karma);
    event TopicCreated(uint256 indexed topicId, string topic);
    event TopicRated(address indexed user, uint256 indexed topicId, uint8 rating);

    // --- Initializer --- //
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
        // Set the first topic to an empty string
        topics[0] = "";
        topicId += 1;
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        
        // Set up the initial empty topic (General)
        topics[0] = "";
        topicId = 1;
    }

    // --- Functions --- //
    function registerUser(string memory _userId) public {
        require(!isUserRegistered[msg.sender], "User already registered");
        userId[msg.sender] = _userId;
        isUserRegistered[msg.sender] = true;
        emit UserRegistered(msg.sender, _userId);
    }

    function updateUserId(string memory _userId) public {
        require(isUserRegistered[msg.sender], "User not registered");
        userId[msg.sender] = _userId;
        emit UserUpdated(msg.sender, _userId);
    }

    function sendMessage(string memory _message ) public {
        require(isUserRegistered[msg.sender], "User not registered");
        msgIdToUser[msgId] = msg.sender;
        string memory topic = topics[0];
        msgToTopic[msgId] = 0;
        emit MessageSentToTopic(msg.sender, userId[msg.sender], _message, msgId, topic);

        msgId++;
    }

    function sendMessageToTopic(string memory _message, uint256 _topicId) public {
        require(isUserRegistered[msg.sender], "User not registered");
        require(_topicId <= topicId, "Invalid topicId");
        msgIdToUser[msgId] = msg.sender;
        string memory topic = topics[_topicId];
        msgToTopic[msgId] = _topicId;
        emit MessageSentToTopic(msg.sender, userId[msg.sender], _message, msgId, topic);
        msgId++;
    }

    function likeMessage(uint256 _msgId) public {
        require(isUserRegistered[msg.sender], "User not registered");
        require(_msgId < msgId, "Invalid msgId");

        address user = msgIdToUser[_msgId];
        
        require(user != address(0), "Message not found");
        require(user != msg.sender, "Cannot karma your own message");

        uint256 _topicId = msgToTopic[_msgId];

        msgNetLikes[_msgId] += 1;
        topNeticLikes[_topicId] += 1;
        karma[user] += 1;

        emit MessageLiked(msg.sender, userId[msg.sender], _msgId);        
        emit KarmaChanged(user, userId[user], karma[user]);
    }

    function dislikeMessage(uint256 _msgId) public {
        require(isUserRegistered[msg.sender], "User not registered");
        require(_msgId < msgId, "Invalid msgId");

        address user = msgIdToUser[_msgId];
        
        require(user != address(0), "Message not found");
        require(user != msg.sender, "Cannot karma your own message");

        uint256 _topicId = msgToTopic[_msgId];


        msgNetLikes[_msgId] -= 1;
        topNeticLikes[_topicId] -= 1;
        karma[user] -= 1;

        emit MessageDisliked(msg.sender, userId[msg.sender], _msgId);        
        emit KarmaChanged(user, userId[user], karma[user]);
    }



    function createTopic(string memory _topic) public {
        require(isUserRegistered[msg.sender], "User not registered");
        topics[topicId] = _topic;
        emit TopicCreated(topicId, _topic);
        topicId++;
    }

    function rateTopic(uint256 _topicId, uint8 _rating) public {
        require(isUserRegistered[msg.sender], "User not registered");
        require(_topicId < topicId, "Invalid topicId");
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");

        uint8 previousRating = userTopicRatings[msg.sender][_topicId];
        
        if (previousRating == 0) {
            // First time rating
            topicTotalRatings[_topicId]++;
            topicRatingSum[_topicId] += _rating;
        } else {
            // Update existing rating
            topicRatingSum[_topicId] = topicRatingSum[_topicId] - previousRating + _rating;
        }
        
        userTopicRatings[msg.sender][_topicId] = _rating;
        emit TopicRated(msg.sender, _topicId, _rating);
    }

    function getTopicRating(uint256 _topicId) public view returns (uint256 averageRating, uint256 totalRatings) {
        require(_topicId < topicId, "Invalid topicId");
        
        totalRatings = topicTotalRatings[_topicId];
        if (totalRatings == 0) {
            return (0, 0);
        }
        
        averageRating = (topicRatingSum[_topicId] * 100) / totalRatings;
        return (averageRating, totalRatings);
    }

    /**
     * @notice Get the current version of the contract
     * @return Version string
     */
    function version() external pure returns (string memory) {
        return "2.0.0";
    }

    /**
     * @notice Returns information about the proxiable UUID
     * @dev Necessary for UUPS compatibility
     */
    function proxiableUUID() external pure override returns (bytes32) {
        // Standard EIP-1822 proxiable UUID
        // bytes32(uint256(keccak256('eip1967.proxy.uuid')) - 1)
        return 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    }

    // --- UUPS Upgrade Function --- //
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}