const { accounts, contract, privateKeys } = require('@openzeppelin/test-environment');

const { BN, expectRevert, time, expectEvent, constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { signTypedData } = require('eth-sig-util');

const decimal = new BN(18);
const oneether = (new BN(10)).pow(decimal);

const CosmiT = contract.fromArtifact('Cosmi');

describe('Cosmi', function () {
    const [ ownerAddress, userAddress1, userAddress2, userAddress3 ] = accounts;
    beforeEach(async function() {
        this.cosmi = await CosmiT.new({from: ownerAddress, gas: 8000000});
    })

    describe("Non owner's Minting Permission", function () {
        it("Should not mint new tokens", async function () {
            await expectRevert(this.cosmi.mint(userAddress1, 1000, {from: userAddress1}), "Ownable: caller is not the owner");
        })
    })

    describe("Transfer functionality ", function () {
        beforeEach(async function () {
            await this.cosmi.mint(ownerAddress, (new BN(100000).mul(oneether)), {from: ownerAddress});
        });

        it("Tranfer from Msg.Sender to another Account", async function () {
            await this.cosmi.transfer(userAddress3, (new BN(50000).mul(oneether)), { from: ownerAddress })
            expect(await this.cosmi.balanceOf(userAddress3)).to.be.bignumber.equal((new BN(50000).mul(oneether)));
        })
    })

    describe("Transfer from", function () {
        beforeEach(async function () {
            await this.cosmi.mint(ownerAddress, (new BN(50000).mul(oneether)), {from: ownerAddress});
        });
        it("WithOut Approve", async function () {
            await expectRevert(this.cosmi.transferFrom(ownerAddress, userAddress3,1000,{from: userAddress3}),"ERC20: transfer amount exceeds allowance");
        })
        it("Tranfer from Account 1 to Account 2", async function () {
            await this.cosmi.approve(userAddress3, (new BN(50000).mul(oneether)), { from: ownerAddress });
            await this.cosmi.transferFrom(ownerAddress, userAddress3, (new BN(50000).mul(oneether)), { from: userAddress3 })
            expect(await this.cosmi.balanceOf(userAddress3)).to.be.bignumber.equal((new BN(50000).mul(oneether)));
        })
        it("Account 1 balance should be increased", async function () {
            await this.cosmi.approve(userAddress3, (new BN(50000).mul(oneether)), { from: ownerAddress });
            await this.cosmi.transferFrom(ownerAddress, userAddress3, (new BN(50000).mul(oneether)), { from: userAddress3 })
            expect(await this.cosmi.balanceOf(userAddress3)).to.be.bignumber.equal((new BN(50000).mul(oneether)));
        })
        it("Account 1 balance should be decreased", async function () {
            await this.cosmi.approve(ownerAddress, (new BN(50000).mul(oneether)), { from: userAddress3 });
            await this.cosmi.approve(userAddress3, (new BN(50000).mul(oneether)), { from: ownerAddress });
            await this.cosmi.transferFrom(ownerAddress, userAddress3, (new BN(50000).mul(oneether)), { from: userAddress3 })
            await this.cosmi.transferFrom(userAddress3, ownerAddress, (new BN(50000).mul(oneether)), { from: ownerAddress })
            expect(await this.cosmi.balanceOf(userAddress3)).to.be.bignumber.equal(new BN(0));
        })
    })

    describe("Approve/Allowance", function () {
        beforeEach(async function () {
            await this.cosmi.mint(ownerAddress, 1000000, {from: ownerAddress});
        });
        it("Initial allowance will be 0", async function () {
            expect(await this.cosmi.allowance(ownerAddress, userAddress2)).to.be.bignumber.equal(new BN(0));
        });

        it("Allowance increase when approve", async function () {
            await this.cosmi.approve(userAddress2, 500, {from:ownerAddress});
            expect(await this.cosmi.allowance(ownerAddress, userAddress2)).to.be.bignumber.equal(new BN(500));
        });

        it("Increase Allowance", async function () {
            await this.cosmi.increaseAllowance(userAddress2, 500, {from:ownerAddress});
            expect(await this.cosmi.allowance(ownerAddress, userAddress2)).to.be.bignumber.equal(new BN(500));
        });

        it("Decrease Allowance", async function () {
            await this.cosmi.approve(userAddress2, 500, {from:ownerAddress});
            await this.cosmi.decreaseAllowance(userAddress2, 500, {from:ownerAddress});
            expect(await this.cosmi.allowance(ownerAddress, userAddress2)).to.be.bignumber.equal(new BN(0));
        });

        it("Allowance will be 0 of tx account", async function () {
            await this.cosmi.approve(userAddress2, 500, {from:ownerAddress});
            expect(await this.cosmi.allowance(userAddress2, ownerAddress)).to.be.bignumber.equal(new BN(0));
        });

        it("TranferFrom failed without allowance", async function () {
            await expectRevert(this.cosmi.transferFrom(ownerAddress, userAddress3, 500, {from:userAddress2}), "ERC20: transfer amount exceeds allowance");
        });

        it("TranferFrom with allowance", async function () {
            await this.cosmi.approve(userAddress2, 500, {from: ownerAddress});
            expect(await this.cosmi.allowance(ownerAddress, userAddress2)).to.be.bignumber.equal(new BN(500));

            await this.cosmi.transferFrom(ownerAddress, userAddress3, 500, {from:userAddress2});
            expect(await this.cosmi.allowance(ownerAddress, userAddress3)).to.be.bignumber.equal(new BN(0));

            expect(await this.cosmi.balanceOf(userAddress3)).to.be.bignumber.equal(new BN(500));
        });
    })

    describe("Burn", function () {
        beforeEach(async function () {
            await this.cosmi.mint(ownerAddress, 1000, {from: ownerAddress});
        });

        it("Burn with insufficient amount", async function () {
            await expectRevert(this.cosmi.burn((new BN(100000).mul(oneether)), {from: ownerAddress}), "ERC20: burn amount exceeds balance");
        });

        it("Burn success", async function () {    
            await this.cosmi.burn((new BN(600).mul(oneether)), {from: ownerAddress});
            expect(await this.cosmi.balanceOf(ownerAddress)).to.be.bignumber.equal(new BN(400).mul(oneether));
        });
        it("Checking Burn From", async function () {
            await this.cosmi.mint(userAddress3, 1000, {from: ownerAddress});
            await this.cosmi.approve(ownerAddress, (new BN(900).mul(oneether)), { from: userAddress3 });
            await this.cosmi.burnFrom(userAddress3, (new BN(900).mul(oneether)), {from: ownerAddress});
            expect(await this.cosmi.balanceOf(userAddress3)).to.be.bignumber.equal(new BN(100).mul(oneether));
        });
    })
})