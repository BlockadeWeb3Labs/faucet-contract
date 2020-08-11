const Faucet = artifacts.require('./Faucet.sol');

// eslint-disable-next-line func-names
module.exports = async (deployer) => {
  await deployer.deploy(Faucet);
};
