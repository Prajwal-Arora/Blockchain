const { accounts, contract, privateKeys } = require('@openzeppelin/test-environment');
const { BN, expectRevert, time, expectEvent, constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { signTypedData } = require('eth-sig-util');

const MasterChef = contract.fromArtifact('MasterChef');
const TestERC20 = contract.fromArtifact('TESTERC20');

describe("MasterChef", function () {
    const [ ownerAddress, userAddress1, userAddress2, userAddress3 ] = accounts;
    beforeEach(async function () {
        this.cosmi = await TestERC20.new("Cosmi", "COS", {from: ownerAddress, gas: 8000000});
        this.lp = await TestERC20.new("LPToken", "LP", {from: ownerAddress, gas: 8000000});
        this.chef = await MasterChef.new(this.cosmi.address, "1000", "0", "1000", {from: ownerAddress, gas: 8000000});
    });

    describe('set/update variables', function () {
        it("should set correct state variables", async function () {
            const cos = await this.chef.cosmi();
            expect(cos).to.equal(this.cosmi.address);
        })
    });

    describe("With ERC/LP token added to the field", function () {
        beforeEach(async function () {
            await this.lp.transfer(userAddress1, "1000", { from: ownerAddress })
            await this.lp.transfer(userAddress2, "1000", { from: ownerAddress })
            await this.lp.transfer(userAddress3, "1000", { from: ownerAddress })
            this.lp2 = await TestERC20.new("LPToken2", "LP2", {from: ownerAddress, gas: 8000000})
            await this.lp2.transfer(userAddress1, "1000", { from: ownerAddress })
            await this.lp2.transfer(userAddress2, "1000", { from: ownerAddress })
            await this.lp2.transfer(userAddress3, "1000", { from: ownerAddress })
        })

        it("should give out COSMIs only after farming time", async function () {
            // 100 per block farming rate starting at block 100 with bonus until block 1000
            this.chef = await MasterChef.new(this.cosmi.address, "100", "100", "1000", {from: ownerAddress, gas: 8000000});

            await this.chef.add("100", this.lp.address, true, { from: ownerAddress })
            await this.cosmi.approve(this.chef.address, "100000000", { from: ownerAddress });
            await this.cosmi.transfer(this.chef.address, "100000000", { from: ownerAddress });

            await this.lp.approve(this.chef.address, "1000", { from: userAddress2 })
            await this.chef.deposit(0, "100", { from: userAddress2 })
            await time.advanceBlockTo("89")

            await this.chef.deposit(0, "0", { from: userAddress2 }) // block 90
            expect(await this.cosmi.balanceOf(userAddress2)).to.be.bignumber.equal(new BN(0));
            await time.advanceBlockTo("94")

            await this.chef.deposit(0, "0", { from: userAddress2 }) // block 95
            expect(await this.cosmi.balanceOf(userAddress2)).to.be.bignumber.equal(new BN(0))
            await time.advanceBlockTo("99")

            await this.chef.deposit(0, "0", { from: userAddress2 }) // block 100
            expect(await this.cosmi.balanceOf(userAddress2)).to.be.bignumber.equal(new BN(0))
            await time.advanceBlockTo("100")

            await this.chef.deposit(0, "0", { from: userAddress2 }) // block 101
            expect(await this.cosmi.balanceOf(userAddress2)).to.be.bignumber.equal(new BN(1000))

            await time.advanceBlockTo("104")
            await this.chef.deposit(0, "0", { from: userAddress2 }) // block 105

            expect(await this.cosmi.balanceOf(userAddress2)).to.be.bignumber.equal(new BN(5000))
        })

        it("should not distribute COSMIs if no one deposit", async function () {
            // 100 per block farming rate starting at block 200 with bonus until block 1000
            this.chef = await MasterChef.new(this.cosmi.address, "100", "200", "1000", {from: ownerAddress, gas: 8000000});
            await this.cosmi.approve(this.chef.address, "100000000", { from: ownerAddress });
            await this.cosmi.transfer(this.chef.address, "100000000", { from: ownerAddress });

            await this.chef.add("100", this.lp.address, true, { from: ownerAddress })

            await this.lp.approve(this.chef.address, "1000", { from: userAddress2 })
            await time.advanceBlockTo("199")
            expect(await this.cosmi.balanceOf(this.chef.address)).to.be.bignumber.equal(new BN(100000000))
            await time.advanceBlockTo("204")
            expect(await this.cosmi.balanceOf(this.chef.address)).to.be.bignumber.equal(new BN(100000000))
            await time.advanceBlockTo("209")
            await this.chef.deposit(0, "10", { from: userAddress2 }) // block 210
            expect(await this.cosmi.balanceOf(this.chef.address)).to.be.bignumber.equal(new BN(100000000))
            expect(await this.cosmi.balanceOf(userAddress2)).to.be.bignumber.equal(new BN(0))
            expect(await this.lp.balanceOf(userAddress2)).to.be.bignumber.equal(new BN(990))
            await time.advanceBlockTo("219")
            await this.chef.withdraw(0, "10", { from: userAddress2 }) // block 220
            expect(await this.cosmi.balanceOf(userAddress2)).to.be.bignumber.equal(new BN(1000))
            expect(await this.lp.balanceOf(userAddress2)).to.be.bignumber.equal(new BN(1000))
            expect(await this.cosmi.balanceOf(this.chef.address)).to.be.bignumber.equal(new BN(99999000))
        })

        it("should distribute COSMI properly for each staker", async function () {
            // 100 per block farming rate starting at block 300 with bonus until block 1000
            this.chef = await MasterChef.new(this.cosmi.address, "100", "300", "1000", {from: ownerAddress, gas: 8000000});
            await this.cosmi.approve(this.chef.address, "100000000", { from: ownerAddress });
            await this.cosmi.transfer(this.chef.address, "100000000", { from: ownerAddress });

            await this.chef.add("100", this.lp.address, true, { from: ownerAddress })

            await this.lp.approve(this.chef.address, "1000", {
                from: userAddress1,
            })
            await this.lp.approve(this.chef.address, "1000", {
                from: userAddress2,
            })
            await this.lp.approve(this.chef.address, "1000", {
                from: userAddress3,
            })
            // userAddress1 deposits 10 LPs at block 310
            await time.advanceBlockTo("309")
            await this.chef.deposit(0, "10", { from: userAddress1 })
            // userAddress2 deposits 20 LPs at block 314
            await time.advanceBlockTo("313")
            await this.chef.deposit(0, "20", { from: userAddress2 })
            // userAddress3 deposits 30 LPs at block 318
            await time.advanceBlockTo("317")
            await this.chef.deposit(0, "30", { from: userAddress3 })
            
            await time.advanceBlockTo("319")
            await this.chef.deposit(0, "10", { from: userAddress1 })
            expect(await this.cosmi.balanceOf(userAddress1)).to.be.bignumber.equal(new BN(5666))
            expect(await this.cosmi.balanceOf(userAddress2)).to.be.bignumber.equal(new BN(0))
            expect(await this.cosmi.balanceOf(userAddress3)).to.be.bignumber.equal(new BN(0))
            
            await time.advanceBlockTo("329")
            await this.chef.withdraw(0, "5", { from: userAddress2 })
            expect(await this.cosmi.balanceOf(userAddress1)).to.be.bignumber.equal(new BN(566))
            expect(await this.cosmi.balanceOf(userAddress2)).to.be.bignumber.equal(new BN(619))
            expect(await this.cosmi.balanceOf(userAddress3)).to.be.bignumber.equal(new BN(0))
            
            await time.advanceBlockTo("339")
            await this.chef.withdraw(0, "20", { from: userAddress1 })
            await time.advanceBlockTo("349")
            await this.chef.withdraw(0, "15", { from: userAddress2 })
            await time.advanceBlockTo("359")
            await this.chef.withdraw(0, "30", { from: userAddress3 })
            
            expect(await this.cosmi.balanceOf(userAddress1)).to.be.bignumber.equal(new BN(1159))
            
            expect(await this.cosmi.balanceOf(userAddress2)).to.be.bignumber.equal(new BN(1183))
            
            expect(await this.cosmi.balanceOf(userAddress3)).to.be.bignumber.equal(new BN(2657))
            
            expect(await this.lp.balanceOf(userAddress1)).to.be.bignumber.equal(new BN(1000))
            expect(await this.lp.balanceOf(userAddress2)).to.be.bignumber.equal(new BN(1000))
            expect(await this.lp.balanceOf(userAddress3)).to.be.bignumber.equal(new BN(1000))
        })

        it("should give proper COSMI allocation to each pool", async function () {
            // 100 per block farming rate starting at block 400 with bonus until block 1000
            this.chef = await MasterChef.new(this.cosmi.address, "100", "400", "1000", {from: ownerAddress, gas: 8000000});
            await this.cosmi.approve(this.chef.address, "100000000", { from: ownerAddress });
            await this.cosmi.transfer(this.chef.address, "100000000", { from: ownerAddress });

            await this.lp.approve(this.chef.address, "1000", { from: userAddress1 })
            await this.lp2.approve(this.chef.address, "1000", { from: userAddress2 })
            // Add first LP to the pool with allocation 1
            await this.chef.add("10", this.lp.address, true, { from: ownerAddress })

            // userAddress1 deposits 10 LPs at block 410
            await time.advanceBlockTo("409")
            await this.chef.deposit(0, "10", { from: userAddress1 })
            // Add LP2 to the pool with allocation 2 at block 420
            await time.advanceBlockTo("419")
            await this.chef.add("20", this.lp2.address, true, { from: ownerAddress })
            
            expect(await this.chef.pendingCosmi(0, userAddress1)).to.be.bignumber.equal(new BN(10000))
            // userAddress2 deposits 10 LP2s at block 425
            await time.advanceBlockTo("424")
            await this.chef.deposit(1, "5", { from: userAddress2 })
            
            expect(await this.chef.pendingCosmi(0, userAddress1)).to.be.bignumber.equal(new BN(11666))
            await time.advanceBlockTo("430")
            
            expect(await this.chef.pendingCosmi(0, userAddress1)).to.be.bignumber.equal(new BN(13333))
            expect(await this.chef.pendingCosmi(1, userAddress2)).to.be.bignumber.equal(new BN(3333))
        })

        it("should stop giving bonus COSMI after the bonus period ends", async function () {
            // 100 per block farming rate starting at block 500 with bonus until block 600
            this.chef = await MasterChef.new(this.cosmi.address, "100", "500", "600", {from: ownerAddress, gas: 8000000});
            await this.cosmi.approve(this.chef.address, "100000000", { from: ownerAddress });
            await this.cosmi.transfer(this.chef.address, "100000000", { from: ownerAddress });

            await this.lp.approve(this.chef.address, "1000", { from: userAddress1 })
            await this.chef.add("1", this.lp.address, true, { from: ownerAddress })


            // userAddress1 deposits 10 LPs at block 590
            await time.advanceBlockTo("589")
            await this.chef.deposit(0, "10", { from: userAddress1 })
            
            await time.advanceBlockTo("605")
            expect(await this.chef.pendingCosmi(0, userAddress1)).to.be.bignumber.equal(new BN(10500))
            
            await this.chef.deposit(0, "0", { from: userAddress1 })
            expect(await this.chef.pendingCosmi(0, userAddress1)).to.be.bignumber.equal(new BN(0))
            expect(await this.cosmi.balanceOf(userAddress1)).to.be.bignumber.equal(new BN(10600))
        })

        it("Should not add same lp token more than one time", async function () {
            this.chef = await MasterChef.new(this.cosmi.address, "100", "700", "1000", {from: ownerAddress, gas: 8000000});

            await this.chef.add("1", this.lp.address, true, { from: ownerAddress })
            await expectRevert(this.chef.add("1", this.lp.address, true, { from: ownerAddress }), "Cosmipay Token token already added");
        })
    })
})