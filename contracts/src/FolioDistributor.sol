// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IFolioTreasury {
    function receiveFees(uint256 amount) external;
    function depositCash(address token, uint256 amount) external;
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

    /// Other apps pay this cut. Their holders receive the rest as stocks.
    uint16 public constant SERVICE_FEE_BPS = 500;
    uint16 internal constant BPS = 10_000;

    struct Client {
        address holderToken;
        uint256 minBalance;
        uint256 usdc;
        bool exists;
    }

    uint256 public roundId;
    bytes32 public root;
    address public stock;
    uint256 public totalShares;
    uint256 public stockAmount;
    bool public roundOpen;
    bytes32 public roundClient;
    mapping(uint256 => mapping(address => bool)) public delivered;
    mapping(bytes32 => Client) public clients;

    event OwnerSet(address indexed owner);
    event AgentSet(address indexed agent);
    event SfoloSet(address indexed sfolo, uint256 minBalance);
    event FeesDeposited(address indexed from, uint256 amount);
    event ClientSet(bytes32 indexed clientId, address holderToken, uint256 minBalance);
    event ServiceDeposit(bytes32 indexed clientId, address indexed from, uint256 gross, uint256 cut, uint256 net);
    event ReleasedForBuy(bytes32 indexed clientId, address indexed to, uint256 amount);
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
    error UnknownClient();
    error OverCredit();

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

    /// Pull fee USDC from the agent wallet into the treasury. This is the $SFOLIO path. No cut.
    function depositFees(uint256 amount) external onlyAgent {
        address usdc = treasury.usdc();
        bool ok = IERC20(usdc).transferFrom(msg.sender, address(this), amount);
        if (!ok) revert NotHolder();
        IERC20(usdc).approve(address(treasury), amount);
        treasury.receiveFees(amount);
        emit FeesDeposited(msg.sender, amount);
    }

    /// Pull a cash token the agent already bought and park it. This contract is the treasury keeper.
    function depositCash(address token, uint256 amount) external onlyAgent {
        if (token == address(0) || amount == 0) revert ZeroShares();
        bool ok = IERC20(token).transferFrom(msg.sender, address(this), amount);
        if (!ok) revert NotHolder();
        IERC20(token).approve(address(treasury), amount);
        treasury.depositCash(token, amount);
    }

    /// Register an app. `holderToken` is the token whose holders receive the stocks.
    function setClient(bytes32 clientId, address holderToken, uint256 min) external onlyOwner {
        if (clientId == bytes32(0)) revert ZeroShares();
        Client storage c = clients[clientId];
        c.holderToken = holderToken;
        c.minBalance = min;
        c.exists = true;
        emit ClientSet(clientId, holderToken, min);
    }

    /// Another app funds the book. 5% stays in the treasury. The rest is reserved for that app's holders.
    function depositFor(bytes32 clientId, uint256 amount) external {
        Client storage c = clients[clientId];
        if (!c.exists || amount == 0) revert UnknownClient();
        uint256 cut = (amount * SERVICE_FEE_BPS) / BPS;
        uint256 net = amount - cut;
        address usdcAddr = treasury.usdc();
        bool ok = IERC20(usdcAddr).transferFrom(msg.sender, address(this), amount);
        if (!ok) revert NotHolder();
        if (cut > 0) {
            IERC20(usdcAddr).approve(address(treasury), cut);
            treasury.receiveFees(cut);
        }
        c.usdc += net;
        emit ServiceDeposit(clientId, msg.sender, amount, cut, net);
    }

    /// Send a client's reserved USDC to the agent so it can buy the book.
    function releaseForBuy(bytes32 clientId, address to, uint256 amount) external onlyAgent {
        Client storage c = clients[clientId];
        if (!c.exists) revert UnknownClient();
        if (to == address(0) || amount == 0 || amount > c.usdc) revert OverCredit();
        c.usdc -= amount;
        bool ok = IERC20(treasury.usdc()).transfer(to, amount);
        if (!ok) revert NotHolder();
        emit ReleasedForBuy(clientId, to, amount);
    }

    function openRound(bytes32 nextRoot, address nextStock, uint256 shares, uint256 amount) public onlyAgent {
        if (nextRoot == bytes32(0) || nextStock == address(0) || shares == 0 || amount == 0) revert ZeroShares();
        roundId += 1;
        root = nextRoot;
        stock = nextStock;
        totalShares = shares;
        stockAmount = amount;
        roundOpen = true;
        roundClient = bytes32(0);
        emit RoundOpened(roundId, nextRoot, nextStock, shares, amount);
    }

    /// Same round, but payouts are checked against this client's holder token.
    function openRoundFor(bytes32 clientId, bytes32 nextRoot, address nextStock, uint256 shares, uint256 amount) external onlyAgent {
        if (!clients[clientId].exists) revert UnknownClient();
        openRound(nextRoot, nextStock, shares, amount);
        roundClient = clientId;
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
            (address gate, uint256 min) = _holderGate();
            if (gate != address(0) && IERC20(gate).balanceOf(holder) < min) revert NotHolder();
            uint256 out = (stockAmount * share) / totalShares;
            if (out == 0) revert ZeroShares();
            delivered[id][holder] = true;
            batch[i] = holder;
            amounts[i] = out;
            emit Delivered(id, holder, share, out);
        }
        treasury.distribute(stock, batch, amounts);
    }

    function _holderGate() internal view returns (address token, uint256 min) {
        if (roundClient != bytes32(0)) {
            Client storage c = clients[roundClient];
            return (c.holderToken, c.minBalance);
        }
        return (sfolo, minBalance);
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
