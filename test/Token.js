const { fireEvent } = require('@testing-library/react');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Token', ()=> {
    let token, accounts, deployer, receiver, exchange

        beforeEach( async () =>{
            //fetch Token
            const Token = await ethers.getContractFactory('Token')
            token = await Token.deploy('Dapp University', 'DAPP', '1000000')
    
            accounts = await ethers.getSigners()
            deployer = accounts[0]
            receiver = accounts[1]
            exchange = accounts[2]
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
            describe('Success', () =>{

            it('transfers token balances', async () => {
                
                expect(await token.balanceOf(deployer.address)).to.be.equal(tokens(999900))
                expect(await token.balanceOf(receiver.address)).to.be.equal(amount)
    
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

    describe('Token Approvals', () =>{   
        let amount, transaction, result
        beforeEach(async () => {
            amount = tokens(100)
            transaction = await token.connect(deployer).approve(exchange.address, amount)
            result = await transaction.wait()
        })
        describe('Success', () =>{   
            it('allows an allowance for delegated token supply spending', async ()=>{
                expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount)
            })

            it('emits an approval event', async () => {
                const event = result.events[0]
                expect(event.event).to.equal('Approval')  
        
                const args = event.args 
                expect(args.owner).to.equal(deployer.address)  
                expect(args.spender).to.equal(exchange.address)  
                expect(args.value).to.equal(amount)  
                })
        })
        describe('Failure', () =>{  
                it('rejects invalid spenders', async() => {
                    await expect(token.connect(deployer).approve('0x0000000000000000000000000000000000000000', 
                    amount)).to.be.reverted
                })
        })
    })

    describe('Delegated Token Transfers', () => {
        let amount, transaction, result
        beforeEach(async () => {
            amount = tokens(100)
            transaction = await token.connect(deployer).approve(exchange.address, amount)
            result = await transaction.wait()
        })
        describe('Success', () =>{
            beforeEach(async () => {
                transaction = await token.connect(exchange).transferFrom(deployer.address, receiver.address, amount)
                result = await transaction.wait()
            })
            it('transfers token balances', async() => {
                expect(await token.balanceOf(deployer.address)).to.be.equal(tokens(999900))
                expect(await token.balanceOf(receiver.address)).to.be.equal(amount)
            })
            it('resets the allowance', async() => {
                expect(await token.allowance(deployer.address, exchange.address)).to.be.equal(0)
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

        describe('Failure', () =>{
            const invalidAmount = tokens(100000000)
            it('rejects inavlid amount', async () =>{

            await expect(token.connect(exchange).transferFrom(deployer.address,receiver.address,invalidAmount)).to.be.reverted
        })
        })

    })

})
