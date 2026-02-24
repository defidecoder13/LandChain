// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LandRegistry
 * @dev A production-ready contract for National Blockchain Property Registry
 */
contract LandRegistry {
    enum PropertyState { Pending, Active, UnderDispute, Frozen }

    struct Property {
        string propertyId;
        address owner;
        string documentHash;
        PropertyState state;
        uint256 timestamp;
    }

    address public authority;
    mapping(string => Property) private properties;
    string[] private propertyIds;

    event PropertyRegistered(string indexed propertyId, address indexed owner, string documentHash);
    event OwnershipTransferred(string indexed propertyId, address indexed from, address indexed to, string blockchainTxHash);
    event DisputeRaised(string indexed propertyId, address indexed raisedBy, string reason);
    event DisputeResolved(string indexed propertyId, address indexed resolvedBy, string resolutionNote);
    event PropertyFrozen(string indexed propertyId, address indexed authority);

    modifier onlyAuthority() {
        require(msg.sender == authority, "Only authority can perform this action");
        _;
    }

    modifier onlyOwner(string memory _propertyId) {
        require(properties[_propertyId].owner == msg.sender, "Only property owner can perform this action");
        _;
    }

    modifier propertyExists(string memory _propertyId) {
        require(properties[_propertyId].owner != address(0), "Property does not exist");
        _;
    }

    constructor() {
        authority = msg.sender;
    }

    /**
     * @dev Register a new property. Only authority can approve initial registration.
     */
    function registerProperty(
        string memory _propertyId,
        address _owner,
        string memory _documentHash
    ) external onlyAuthority {
        require(properties[_propertyId].owner == address(0), "Property already registered");
        
        properties[_propertyId] = Property({
            propertyId: _propertyId,
            owner: _owner,
            documentHash: _documentHash,
            state: PropertyState.Active,
            timestamp: block.timestamp
        });
        
        propertyIds.push(_propertyId);
        emit PropertyRegistered(_propertyId, _owner, _documentHash);
    }

    /**
     * @dev Transfer ownership of a property. Initiated by owner, approved by authority.
     */
    function transferOwnership(
        string memory _propertyId,
        address _to,
        string memory _blockchainTxHash
    ) external onlyOwner(_propertyId) propertyExists(_propertyId) {
        require(_to != address(0), "Invalid recipient address");
        require(properties[_propertyId].state == PropertyState.Active, "Property must be Active to transfer");

        address previousOwner = properties[_propertyId].owner;
        properties[_propertyId].owner = _to;
        properties[_propertyId].timestamp = block.timestamp;

        emit OwnershipTransferred(_propertyId, previousOwner, _to, _blockchainTxHash);
    }

    /**
     * @dev Raise a dispute on a property.
     */
    function raiseDispute(
        string memory _propertyId,
        string memory _reason
    ) external propertyExists(_propertyId) {
        require(properties[_propertyId].state == PropertyState.Active, "Property cannot be disputed in current state");
        
        properties[_propertyId].state = PropertyState.UnderDispute;
        emit DisputeRaised(_propertyId, msg.sender, _reason);
    }

    /**
     * @dev Resolve a dispute and return it to active state.
     */
    function resolveDispute(
        string memory _propertyId,
        string memory _resolutionNote
    ) external onlyAuthority propertyExists(_propertyId) {
        require(properties[_propertyId].state == PropertyState.UnderDispute, "No active dispute found");
        
        properties[_propertyId].state = PropertyState.Active;
        emit DisputeResolved(_propertyId, msg.sender, _resolutionNote);
    }

    /**
     * @dev Freeze a property due to legal issues.
     */
    function freezeProperty(
        string memory _propertyId
    ) external onlyAuthority propertyExists(_propertyId) {
        properties[_propertyId].state = PropertyState.Frozen;
        emit PropertyFrozen(_propertyId, msg.sender);
    }

    /**
     * @dev Get property details.
     */
    function getProperty(string memory _propertyId) external view propertyExists(_propertyId) returns (Property memory) {
        return properties[_propertyId];
    }
}
