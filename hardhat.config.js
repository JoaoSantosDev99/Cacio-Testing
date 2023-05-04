require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    mainnet: {
      url: "https://rpc.ankr.com/eth",
      accounts: [process.env.PK],
    },
    goerli: {
      url: "https://rpc.ankr.com/eth_goerli",
      accounts: [process.env.PK],
    },
  },
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
};
