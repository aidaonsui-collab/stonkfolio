// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title FolioTreasury
/// @notice Creator-fee USDC lands here from the Circle Agent Wallet (keeper).
///         Cash (USYC / BUIDL) parks while names queue. Listed stock tokens
///         get pushed to holders. No swaps on-contract — the agent wallet
///         swaps, then deposits the resulting token.
contract FolioTreasury {
    address public owner;
    address public keeper;
    IERC20 public immutable usdc;

    mapping(address => bool) public cashToken;
    mapping(address => bool) public stockToken;
    mapping(address => uint16) public weightBps;

    event OwnerSet(address indexed owner);
    event KeeperSet(address indexed keeper);
    event CashTokenSet(address indexed token, bool allowed);
    event StockTokenSet(address indexed token, bool allowed, uint16 weightBps);
    event FeesReceived(address indexed from, uint256 amount);
    event CashDeposited(address indexed token, uint256 amount);
    event Withdrawn(address indexed token, address indexed to, uint256 amount);
    event Distributed(address indexed token, uint256 holders, uint256 total);

    error NotOwner();
    error NotKeeper();
    error BadToken();
    error LengthMismatch();
    error Insufficient();
    error TransferFailed();
    error ZeroAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyKeeper() {
        if (msg.sender != keeper && msg.sender != owner) revert NotKeeper();
        _;
    }

    /// Owner and keeper are explicit args. Circle Agent Wallet deploys through
    /// a factory, so msg.sender in the constructor is not the agent.
    constructor(address usdc_, address owner_, address keeper_) {
        if (usdc_ == address(0) || owner_ == address(0) || keeper_ == address(0)) revert ZeroAddress();
        owner = owner_;
        usdc = IERC20(usdc_);
        keeper = keeper_;
        emit OwnerSet(owner_);
        emit KeeperSet(keeper_);
    }

    function setOwner(address next) external onlyOwner {
        if (next == address(0)) revert ZeroAddress();
        owner = next;
        emit OwnerSet(next);
    }

    function setKeeper(address next) external onlyOwner {
        if (next == address(0)) revert ZeroAddress();
        keeper = next;
        emit KeeperSet(next);
    }

    function setCashToken(address token, bool allowed) external onlyOwner {
        cashToken[token] = allowed;
        emit CashTokenSet(token, allowed);
    }

    function setStockToken(address token, bool allowed, uint16 bps) external onlyOwner {
        stockToken[token] = allowed;
        weightBps[token] = allowed ? bps : 0;
        emit StockTokenSet(token, allowed, allowed ? bps : 0);
    }

    /// Pull Instant creator USDC from the agent wallet into this vault.
    function receiveFees(uint256 amount) external onlyKeeper {
        if (amount == 0) revert Insufficient();
        _pull(usdc, msg.sender, amount);
        emit FeesReceived(msg.sender, amount);
    }

    /// After the agent swaps USDC → USYC (or BUIDL), deposit the cash token.
    function depositCash(address token, uint256 amount) external onlyKeeper {
        if (!cashToken[token] && token != address(usdc)) revert BadToken();
        if (amount == 0) revert Insufficient();
        _pull(IERC20(token), msg.sender, amount);
        emit CashDeposited(token, amount);
    }

    /// Send USDC or an allowlisted cash token back to the keeper to buy names.
    function withdraw(address token, address to, uint256 amount) external onlyKeeper {
        if (to == address(0)) revert ZeroAddress();
        if (token != address(usdc) && !cashToken[token]) revert BadToken();
        _push(IERC20(token), to, amount);
        emit Withdrawn(token, to, amount);
    }

    /// Push listed stock tokens the keeper already bought to holders.
    function distribute(address token, address[] calldata holders, uint256[] calldata amounts) external onlyKeeper {
        if (!stockToken[token]) revert BadToken();
        uint256 n = holders.length;
        if (n != amounts.length) revert LengthMismatch();
        IERC20 t = IERC20(token);
        uint256 total;
        for (uint256 i; i < n; ++i) {
            if (holders[i] == address(0)) revert ZeroAddress();
            _push(t, holders[i], amounts[i]);
            total += amounts[i];
        }
        emit Distributed(token, n, total);
    }

    function _pull(IERC20 t, address from, uint256 amount) internal {
        bool ok = t.transferFrom(from, address(this), amount);
        if (!ok) revert TransferFailed();
    }

    function _push(IERC20 t, address to, uint256 amount) internal {
        bool ok = t.transfer(to, amount);
        if (!ok) revert TransferFailed();
    }
}
