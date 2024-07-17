const { expect } = require("chai");
const { ethers } = require("hardhat");

let NFTMARKET, owner, addr1, addr2;

beforeEach(async function() {
    NFTMARKET = await ethers.deployContract("NFTMARKET");
    [owner, addr1, addr2, _] = await ethers.getSigners();
});

describe("Deployment", function() {
    it("Should set the right owner", async() => {
        const marketplaceOwner = await NFTMARKET.marketplaceOwner();
        expect(marketplaceOwner).to.equal(owner);
    });

    it("Should set the listing fee percentage", async function() {
        const listingFeePercentage = await NFTMARKET.getListingFeePercent();
        expect(listingFeePercentage).to.equal(10);
    });
});

describe("Creating NFTs", function() {
    it("Should create a new token and listing", async function() {
        const tokenURI = "https://example.com/nft";
        const price = ethers.parseEther("1");

        await NFTMARKET.createToken(tokenURI, price);

        const listing = await NFTMARKET.getNFTListing(1);
        expect(listing.tokenId).to.equal(1);
        expect(listing.owner).to.equal(owner);
        expect(listing.price).to.equal(price);
    });
});

describe("Updating Listing Fee", function() {
    it("Should update the listing fee percentage", async function() {
        await NFTMARKET.updateListingFeePercent(10);
        expect(await NFTMARKET.getListingFeePercent()).to.equal(10);
    });

    it("Should only allow owner to update the listing fee percentage", async function() {
        await expect(
            NFTMARKET.connect(addr1).updateListingFeePercent(10)
        ).to.be.revertedWith("Only owner can call this function");
    });
});

describe("Executing Sales", function() {
    beforeEach(async function() {
        const tokenURI = "https://example.com/nft";
        const price = ethers.parseEther("1");
        await NFTMARKET.createToken(tokenURI, price);
    });

    it("Should execute a sale", async function() {
        const price = ethers.parseEther("1");
        await NFTMARKET.connect(addr1).executeSale(1, { value: price });

        const listing = await NFTMARKET.getNFTListing(1);
        expect(listing.seller).to.equal(addr1);
        expect(listing.owner).to.equal(owner);
    });

    it("Should revert if the payment is incorrect", async function() {
        const incorrectPrice = ethers.parseEther("0.5");
        await expect(
            NFTMARKET.connect(addr1).executeSale(1, { value: incorrectPrice })
        ).to.be.revertedWith(
            "Please submit the asking price to complete the purchase"
        );
    });
});

describe("Retrieving NFTs", function() {
    beforeEach(async function() {
        const tokenURI1 = "https://nftstore.com/nft1";
        const tokenURI2 = "https://nftstore.com/nft2";
        const price = ethers.parseEther("1");

        await NFTMARKET.createToken(tokenURI1, price);
        await NFTMARKET.createToken(tokenURI2, price);
    });

    it("Should retrieve all listed NFTs", async function() {
        const allNFTs = await NFTMARKET.getAllListedNFTs();
        expect(allNFTs.length).to.equal(2);
    });

    it("Should retrieve my NFTs", async function() {
        const myNFTs = await NFTMARKET.getMyNFTs();
        expect(myNFTs.length).to.equal(2);
    });
});