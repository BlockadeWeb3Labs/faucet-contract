/*global artifacts, assert, before, contract, it, web3*/

const expectThrow = require('./helpers/expectThrow.js');

const Faucet = artifacts.require('./Faucet.sol');

contract('Distribute funds', async (accounts) => {
  let faucet;

  const owner    = accounts[0],
        userA    = accounts[1],
        userB    = accounts[2],
        amount   = web3.utils.toBN(web3.utils.toWei("0.01", "ether"), 10),
        gasPrice = web3.utils.toBN(web3.utils.toWei("1", "gwei"), 10);

  before(async () => {
    faucet = await Faucet.deployed();
  });

  it('should not allow address to pay to not fallback payable', async () => {
    () => expectThrow(
      web3.eth.sendTransaction({from:userA, to:faucet.address, value:amount})
    );
  });

  it('should allow any address to send to any other single address', async () => {
    let initialBalance = web3.utils.toBN(await web3.eth.getBalance(userA));
    let initialReceived = web3.utils.toBN(await web3.eth.getBalance(userB));
    let send = await faucet.batchTransfer([userB], amount, {from:userA, value:amount, gasPrice:gasPrice });
    let finalBalance = web3.utils.toBN(await web3.eth.getBalance(userA));
    let finalReceived = web3.utils.toBN(await web3.eth.getBalance(userB));

    assert(finalReceived.eq(initialReceived.add(amount)));
    assert(finalBalance.eq(initialBalance.sub(amount).sub(web3.utils.toBN(send.receipt.gasUsed*gasPrice))));
  });

  it('should allow any address to send to multiple addresses', async () => {
    let initialBalance = web3.utils.toBN(await web3.eth.getBalance(userA));

    let recipients = [];
    let initialReceivedBatch = [];
    for (let idx = 2; idx < accounts.length; idx++) {
      recipients.push(accounts[idx]);
      initialReceivedBatch.push(web3.utils.toBN(await web3.eth.getBalance(accounts[idx])));
    }

    // Parameter is the amount per recipient, value is amount * number of recipients
    let totalAmount = amount.mul(web3.utils.toBN(recipients.length));
    let send = await faucet.batchTransfer(recipients, amount, {from:userA, value:totalAmount, gasPrice:gasPrice });

    for (let idx = 0; idx < recipients.length; idx++) {
      let finalReceived = web3.utils.toBN(await web3.eth.getBalance(recipients[idx]));
      assert(finalReceived.eq(initialReceivedBatch[idx].add(amount)));
    }

    let finalBalance = web3.utils.toBN(await web3.eth.getBalance(userA));
    assert(finalBalance.eq(initialBalance.sub(totalAmount).sub(web3.utils.toBN(send.receipt.gasUsed*gasPrice))));
  });

  it('should not allow address to pay incorrect value to addresses', async () => {
    let recipients = [];
    for (let idx = 2; idx < accounts.length; idx++) {
      recipients.push(accounts[idx]);
    }

    let wrongTotalAmount = amount.mul(web3.utils.toBN(recipients.length)).add(web3.utils.toBN(1));

    () => expectThrow(
      faucet.batchTransfer(recipients, amount, {from:userA, value:wrongTotalAmount, gasPrice:gasPrice })
    );
  });

});
