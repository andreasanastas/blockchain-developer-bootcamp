const { fireEvent } = require('@testing-library/react');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Token', ()=> {
    let token, accounts, deployer, receiver

    describe('Success', () =>{
        beforeEach( async () =>{
            //fetch Token
            const Token = await ethers.getContractFactory('Token')
            token = await Token.deploy('Dapp University', 'DAPP', '1000000')
    
            accounts = await ethers.getSigners()
            deployer = accounts[0]
            receiver = accounts[1]
    
        })
    
        describe('Deployment', () => {
            const name = 'Dapp University'
            const symbol = 'DAPP'
            const decimals = '18'
            const totalSupply = tokens(1000000)
    
            it('has the correct name', async () => {
                //Check that name is correct
                expect(await token.name()).to.equal(name)  
            })
        
            it('has the correct symbol', async () => {
                //Check that name is correct
                expect(await token.symbol()).to.equal(symbol)  
            })
        
            it('has correct decimals', async () => {
                //Check that decimals is correct
                expect(await token.decimals()).to.equal(decimals)  
            })
        
            it('has correct total supply', async () => {
                //Check that total supply is correct
                expect(await token.totalSupply()).to.equal(totalSupply)  
            })
    
            it('assigns total supply to deployer', async () => {
                //Check that total supply is correct
                expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)  
            })
    
        })
    
        describe('Sending tokens', () => {
            let amount, transaction, result
    
            beforeEach(async () => {
                //Transfer tokens
                amount = tokens(100)
                transaction = await token.connect(deployer).transfer(receiver.address, amount)
                result = await transaction.wait()
            })
    
            it('transfers token balances', async () => {
                
                expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
                expect(await token.balanceOf(receiver.address)).to.equal(amount)
    
            })
    
            it('emits a transfer event', async () => {
            const event = result.events[0]
            expect(event.event).to.equal('Transfer')  
    
            const args = event.args 
            expect(args.from).to.equal(deployer.address)  
            expect(args.to).to.equal(receiver.address)  
            expect(args.value).to.equal(amount)  
            })
    
        })
    })

    describe('Failure', () =>{
        it('rejects insufficient balances', async () =>{
            //transfers more than user has
            const invalidAmount = tokens(1000000000000)
            await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted
        })

        it('rejects invalid recipient', async () =>{
            //transfers more than user has
            const amount = tokens(100)
            await expect(token.connect(deployer).transfer('0x0000000000000000000000000000000000000000', 
                amount)).to.be.reverted
        })

    })

})
