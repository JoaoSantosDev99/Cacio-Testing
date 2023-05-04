const { ethers } = require("ethers");
const tokenAddress = "0x8442E252B46bcB3773bCD4f170b345e24b6335EA";
const routerAbi = require("./ABIs/UniswapV2.json");
const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const pk = "cee1a9f58712e7e535ab8adc7b18bf7c64b0f6bb3c77c10a02a573cd9d873e36";
const provider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/eth_goerli"
);

const wallet = new ethers.Wallet(pk, provider);
const router = new ethers.Contract(routerAddress, routerAbi, wallet);

const main = async () => {
  const removeLiq =
    await router.removeLiquidityETHSupportingFeeOnTransferTokens(
      tokenAddress,
      ethers.utils.parseEther("1.581358062330568543"),
      0,
      0,
      wallet.address,
      1682558396 + 600,
      { gasLimit: 3000000 }
    );
  console.log(removeLiq);
};
main();
