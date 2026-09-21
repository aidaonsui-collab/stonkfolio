// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IFolioTreasury {
    function receiveFees(uint256 amount) external;
    function distribute(address token, address[] calldata holders, uint256[] calldata amounts) external;
    function usdc() external view returns (address);
}

/// @notice Opens a merkle round and pushes a stock token to $SFOLIO holders.
///         Must be FolioTreasury.keeper. The Circle agent wallet stays the buyer.
contract FolioDistributor {
    IFolioTreasury public immutable treasury;
    address public owner;
    address public agent;
    address public sfolo;
    uint256 public minBalance;

    uint256 public roundId;
    bytes32 public root;
    address public stock;
    uint256 public totalShares;
    uint256 public stockAmount;
    bool public roundOpen;
    mapping(uint256 => mapping(address => bool)) public delivered;

    event OwnerSet(address indexed owner);
    event AgentSet(address indexed agent);
    event SfoloSet(address indexed sfolo, uint256 minBalance);
    event FeesDeposited(address indexed from, uint256 amount);
    event RoundOpened(uint256 indexed roundId, bytes32 root, address indexed stock, uint256 totalShares, uint256 stockAmount);
    event Delivered(uint256 indexed roundId, address indexed holder, uint256 shares, uint256 amount);

    error NotOwner();
    error NotAgent();
    error ZeroAddress();
    error RoundClosed();
    error BadProof();
    error AlreadyDelivered();
    error NotHolder();
    error ZeroShares();
    error LengthMismatch();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAgent() {
        if (msg.sender != agent && msg.sender != owner) revert NotAgent();
        _;
    }

    constructor(address treasury_, address owner_, address agent_) {
        if (treasury_ == address(0) || owner_ == address(0) || agent_ == address(0)) revert ZeroAddress();
        treasury = IFolioTreasury(treasury_);
        owner = owner_;
        agent = agent_;
    }

    function setOwner(address next) external onlyOwner {
        if (next == address(0)) revert ZeroAddress();
        owner = next;
        emit OwnerSet(next);
    }

    function setAgent(address next) external onlyOwner {
        if (next == address(0)) revert ZeroAddress();
        agent = next;
        emit AgentSet(next);
    }

    /// @param token $SFOLIO. Zero disables the balance check until the token exists.
    function setSfolo(address token, uint256 min) external onlyOwner {
        sfolo = token;
        minBalance = min;
        emit SfoloSet(token, min);
    }

    /// Pull fee USDC from the agent wallet into the treasury.
    function depositFees(uint256 amount) external onlyAgent {
        address usdc = treasury.usdc();
        bool ok = IERC20(usdc).transferFrom(msg.sender, address(this), amount);
        if (!ok) revert NotHolder();
        IERC20(usdc).approve(address(treasury), amount);
        treasury.receiveFees(amount);
        emit FeesDeposited(msg.sender, amount);
    }

    function openRound(bytes32 nextRoot, address nextStock, uint256 shares, uint256 amount) external onlyAgent {
        if (nextRoot == bytes32(0) || nextStock == address(0) || shares == 0 || amount == 0) revert ZeroShares();
        roundId += 1;
        root = nextRoot;
        stock = nextStock;
        totalShares = shares;
        stockAmount = amount;
        roundOpen = true;
        emit RoundOpened(roundId, nextRoot, nextStock, shares, amount);
    }

    function closeRound() external onlyAgent {
        roundOpen = false;
    }

    /// Push this round's stock to holders. `proofs[i]` proves leaf(holder, shares).
    function deliver(address[] calldata holders, uint256[] calldata shares, bytes32[][] calldata proofs) external onlyAgent {
        if (!roundOpen) revert RoundClosed();
        uint256 n = holders.length;
        if (n != shares.length || n != proofs.length) revert LengthMismatch();
        address[] memory batch = new address[](n);
        uint256[] memory amounts = new uint256[](n);
        uint256 id = roundId;
        for (uint256 i; i < n; ++i) {
            address holder = holders[i];
            uint256 share = shares[i];
            if (holder == address(0) || share == 0) revert ZeroShares();
            if (delivered[id][holder]) revert AlreadyDelivered();
            if (!_verify(_leaf(holder, share), proofs[i])) revert BadProof();
            if (sfolo != address(0) && IERC20(sfolo).balanceOf(holder) < minBalance) revert NotHolder();
            uint256 out = (stockAmount * share) / totalShares;
            if (out == 0) revert ZeroShares();
            delivered[id][holder] = true;
            batch[i] = holder;
            amounts[i] = out;
            emit Delivered(id, holder, share, out);
        }
        treasury.distribute(stock, batch, amounts);
    }

    function _leaf(address holder, uint256 share) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(holder, share))));
    }

    function _verify(bytes32 leaf, bytes32[] calldata proof) internal view returns (bool) {
        bytes32 h = leaf;
        for (uint256 i; i < proof.length; ++i) {
            bytes32 p = proof[i];
            h = h < p ? keccak256(abi.encodePacked(h, p)) : keccak256(abi.encodePacked(p, h));
        }
        return h == root;
    }
}
