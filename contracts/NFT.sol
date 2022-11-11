// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

contract EtherPoop is
    Initializable,
    UUPSUpgradeable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using SafeMathUpgradeable for uint16;

    struct Poop {
        bool currentlyForSale;
        uint256 price;
        uint256 timesSold;
        uint256 mintPrice;
    }
    
    mapping (uint => Poop) public poops;

    uint16 public MAX_SUPPLY;
    uint16 _maxPurchaseCount;
    uint256 _mintPrice;
    uint256 _saleStart;
    string _baseURIValue;

    /**
     * @dev Emitted when new token `tokenId` is minted to user `to` at price `price`.
     */
    event Mint(address indexed to,uint256 indexed tokenId, uint256 indexed price);

    /**
     * @dev Emitted when `to` buys token `tokenId` from `from` at the price `price`.
     */
    event Buy(address indexed from, address indexed to, uint256 indexed tokenId, uint256 price);

    /**
     * @dev Emitted when `owner` list token `tokenId` for sale at the price `price`.
     */
    event Sell(address indexed owner, uint256 indexed tokenId, uint256 indexed price);

    /**
     * @dev Emitted when `owner` removes token `tokenId` from sale.
     */
    event CancelSell(address indexed owner, uint256 indexed tokenId);

    function initialize() public initializer {
       ERC721Upgradeable.__ERC721_init("Ether Poop","ETHERPOOP");
       OwnableUpgradeable.__Ownable_init();
       ReentrancyGuardUpgradeable.__ReentrancyGuard_init();
       MAX_SUPPLY = 101;
       _maxPurchaseCount = 1;
       _mintPrice = 0.15 ether;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseURIValue;
    }

    function baseURI() external view returns (string memory) {
        return _baseURI();
    }

    function setBaseURI(string memory newBase) external onlyOwner {
        _baseURIValue = newBase;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setSaleStart(uint256 saleStart_) external onlyOwner {
        _saleStart = saleStart_;
    }

    function saleStart() external view returns (uint256) {
        return _saleStart;
    }

    function saleHasStarted() public view returns (bool) {
        return _saleStart <= block.timestamp;
    }


    function maxPurchaseCount() external view returns (uint256) {
        return _maxPurchaseCount;
    }

    function setMaxPurchaseCount(uint8 count) external onlyOwner {
        _maxPurchaseCount = count;
    }

    function baseMintPrice() external view returns (uint256) {
        return _mintPrice;
    }

    function setBaseMintPrice(uint256 price) external onlyOwner {
        _mintPrice = price;
    }

    function mintPrice(uint256 _tokenID) public view returns (uint256) {
        if(_tokenID < MAX_SUPPLY.sub(1)) {
            return _mintPrice.mul(_tokenID).add(_mintPrice);
        } else {
            return 0;
        }
    }

    modifier mintCountMeetsSupply(uint256 numberOfTokens) {
        require(
            totalSupply().add(numberOfTokens) <= MAX_SUPPLY,
            "Purchase would exceed max supply"
        );
        _;
    }

    modifier doesNotExceedMaxPurchaseCount(uint256 numberOfTokens) {
        require(
            numberOfTokens <= _maxPurchaseCount,
            "Cannot mint more than allowed tokens at a time"
        );
        _;
    }

    modifier validatePurchasePrice(uint256 numberOfTokens) {
        require(
            multipleTokenMintPrice(numberOfTokens) == msg.value,
            "Ether value sent is not correct"
        );
        _;
    }

    function multipleTokenMintPrice(uint256 numberOfTokens) public view returns(uint256){
        uint256 _tokenPrice;
        
        for (uint256 i = totalSupply(); i < numberOfTokens.add(totalSupply()); i++) {
            _tokenPrice = _tokenPrice.add(mintPrice(i));
        }
        
        return _tokenPrice;
    }

    function _mintTokens(uint256 numberOfTokens, address to) internal {
        for (uint256 i = 0; i < numberOfTokens; i++) {
            uint256 _tokenPrice = mintPrice(totalSupply());
            poops[totalSupply()].mintPrice = _tokenPrice;
            payable(owner()).transfer(_tokenPrice);
            
            if(totalSupply() == MAX_SUPPLY.sub(1)) {
                _safeMint(owner(), totalSupply());
                emit Mint(owner(), totalSupply().sub(1), _tokenPrice);
            } else {
                _safeMint(to, totalSupply());
                emit Mint(_msgSender(), totalSupply().sub(1), _tokenPrice);
            }
        }
    }

    function mintTokens(uint256 numberOfTokens)
        external
        payable
        mintCountMeetsSupply(numberOfTokens)
        whenNotPaused
        doesNotExceedMaxPurchaseCount(numberOfTokens)
        validatePurchasePrice(numberOfTokens)
        nonReentrant {
        require(saleHasStarted(), "Sale has not started yet");

        _mintTokens(numberOfTokens, msg.sender);
    }

    function buyPoop(uint poopNumber) external payable whenNotPaused nonReentrant {
        require(poops[poopNumber].currentlyForSale == true,"buyPoop: Poop not available for sale");
        require(msg.value == poops[poopNumber].price, "buyPoop: Not enough ether to buy");
        address _from = ownerOf(poopNumber);
        poops[poopNumber].currentlyForSale = false;
        payable(ownerOf(poopNumber)).transfer(poops[poopNumber].price);
        _transfer(ownerOf(poopNumber), _msgSender(), poopNumber);
        poops[poopNumber].timesSold++;
        emit Buy(_from, _msgSender(), poopNumber, poops[poopNumber].price);
    }
    
    function sellPoop(uint poopNumber, uint price) external whenNotPaused nonReentrant {
        require(msg.sender == ownerOf(poopNumber), "sellPoop: Only poop owner can sell");
        require(poops[poopNumber].currentlyForSale == false,"sellPoop: Already listed for sell");
        require(price > 0, "sellPoop: Sell price cannot be 0");
        poops[poopNumber].price = price;
        poops[poopNumber].currentlyForSale = true;
        emit Sell(ownerOf(poopNumber), poopNumber, price);
    }
    
    function dontSellPoop(uint poopNumber) external whenNotPaused nonReentrant {
        require(msg.sender == ownerOf(poopNumber), "dontSellPoop: Only poop owner can cancel sell");
        require(poops[poopNumber].currentlyForSale == true,"dontSellPoop: Not listed for sale");
        poops[poopNumber].currentlyForSale = false;
        emit CancelSell(ownerOf(poopNumber), poopNumber);
    }

    function _authorizeUpgrade(address) internal override {
        require(owner() == msg.sender,"Only owner can upgrade implementation");
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        require(poops[tokenId].currentlyForSale == false, "ERC721: Cann't transfer during sale");
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}