const { expect } = require("chai");
const routerAbi = require("../ABIs/UniswapV2.json");
const wethAbi = require("../ABIs/WETH.json");
const pairAbi = require("../ABIs/pairAbi.json");
const { ethers } = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

const toWei = (amt) => ethers.utils.parseEther(amt.toString());
const fromWei = (amt) => ethers.utils.formatEther(amt);
const toCacio = (amt) => ethers.utils.parseUnits(amt.toString(), 9);
const fromCacio = (amt) => ethers.utils.formatUnits(amt, 9);

describe("Cacio Instance", function () {
  let Cacio;
  let deployer,
    account1,
    account2,
    account3,
    account4,
    account5,
    marketing,
    provider,
    uniswapPair;
  const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  before(async function () {
    [deployer, account1, account2, account3, account4, account5, marketing] =
      await ethers.getSigners();

    provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");

    const cacio = await ethers.getContractFactory("TEST");
    Cacio = await cacio.deploy();
  });

  describe("It deployes the contract correctly", function () {
    it("Ownership to deployer", async function () {
      expect(await Cacio.owner()).to.equal(deployer.address);
    });
    it("Excludes owner from fees", async function () {
      const owner = await Cacio.owner();
      expect(await Cacio._isExcludedFromFee(owner)).to.be.true;
    });
    it("Excludes the contract from fees", async function () {
      expect(await Cacio._isExcludedFromFee(Cacio.address)).to.be.true;
    });
    it("Updates Marketing Wallet", async function () {
      await Cacio._setMarketingWallet(marketing.address);
    });
    it("Excludes owner from max wallet", async function () {
      const owner = await Cacio.owner();
      expect(await Cacio._isExcludedFromMaxWallet(owner)).to.be.true;
    });
    it("Excludes owner from max wallet", async function () {
      uniswapPair = await Cacio.uniswapV2Pair();
      expect(await Cacio._isExcludedFromMaxWallet(uniswapPair)).to.be.true;
    });
    it("Tranfer all funds to owner", async function () {
      const owner = await Cacio.owner();
      const total = await Cacio._rTotal();
      expect(await Cacio._rOwned(owner)).to.equal(total);
    });
    it("Sets the router", async function () {
      const routerAdd = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
      expect(await Cacio.uniswapV2Router()).to.equal(routerAdd);
    });
    it("Creates the uniswap pair", async function () {
      const uniPair = await Cacio.uniswapV2Pair();
      expect(ethers.utils.isAddress(uniPair)).to.be.true;
    });
  });

  describe("Rewards mechanism", function () {
    let wallet1, wallet2, wallet3, wallet4, wallet5, WETH, pair;
    before("Creates routers", function () {
      wallet1 = new ethers.Contract(uniswapRouterAddress, routerAbi, account1);
      wallet2 = new ethers.Contract(uniswapRouterAddress, routerAbi, account2);
      wallet3 = new ethers.Contract(uniswapRouterAddress, routerAbi, account3);
      wallet4 = new ethers.Contract(uniswapRouterAddress, routerAbi, account4);
      wallet5 = new ethers.Contract(uniswapRouterAddress, routerAbi, account5);
      WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    });
    it("Everybody included by default", async function () {
      pair = new ethers.Contract(
        await Cacio.uniswapV2Pair(),
        pairAbi,
        deployer
      );
      expect(await Cacio._isExcluded(account1.address)).to.be.false;
    });
    it("Excludes a wallet from rewards", async function () {
      expect(await Cacio._isExcluded(account1.address)).to.be.false;
      await Cacio.excludeFromReward(account1.address);
      expect(await Cacio._isExcluded(account1.address)).to.be.true;
    });
    it("Adds Liq", async function () {
      let router = new ethers.Contract(
        uniswapRouterAddress,
        routerAbi,
        deployer
      );
      //Approves
      await Cacio.connect(deployer).approve(
        uniswapRouterAddress,
        ethers.utils.parseUnits("100000000000", 9)
      );

      // Supply liq
      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;

      await router.addLiquidityETH(
        Cacio.address,
        ethers.utils.parseUnits("100000000000", 9),
        0,
        0,
        deployer.address,
        ethers.BigNumber.from(deadline.toString()),
        {
          value: toWei(10),
          gasLimit: 900000,
          gasPrice: ethers.utils.parseUnits("100", "gwei"),
        }
      );
    });
    it("Checks that liquidity was added correctly", async function () {
      const pair = await Cacio.uniswapV2Pair();
      expect(await Cacio.balanceOf(pair)).to.equal(toCacio(100000000000));
      const wethContract = new ethers.Contract(WETH, wethAbi, deployer);
      expect(await wethContract.balanceOf(pair)).to.equal(toWei(10));
    });
    it("Checks maxTx ", async function () {
      // User tries to buy more than max TX and reverts
      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;
      await expect(
        wallet1.swapExactETHForTokens(
          0,
          [WETH, Cacio.address],
          account1.address,
          ethers.BigNumber.from(deadline.toString()),
          { value: toWei(0.11) }
        )
      ).to.be.reverted;
    });
    it("Activates Trading", async function () {
      const tx = await Cacio.startTrading();
      expect(await Cacio.tradingStartTime()).to.equal(tx.blockNumber);
    });
    it("Sniper bot gets caught and blacklisted", async function () {
      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;

      const tx = await wallet5.swapExactETHForTokens(
        0,
        [WETH, Cacio.address],
        account5.address,
        ethers.BigNumber.from(deadline.toString()),
        { value: toWei(0.07) }
      );
      expect(await Cacio._isBlacklisted(account5.address)).to.be.true;
      expect(await Cacio.botsCaught()).to.equal(1);

      await mine(6);
    });
    it("Checks max Wallet ", async function () {
      // User makes 3 purchases but 4th reverts due to max wallet
      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;

      //console.log(fromCacio(await Cacio.balanceOf(wallet1.address)));
      const tx = async () => {
        await wallet1.swapExactETHForTokens(
          0,
          [WETH, Cacio.address],
          account1.address,
          ethers.BigNumber.from(deadline.toString()),
          { value: toWei(0.07) }
        );
      };
      await tx();
      await tx();
      await tx();
      await expect(
        wallet1.swapExactETHForTokens(
          0,
          [WETH, Cacio.address],
          account1.address,
          ethers.BigNumber.from(deadline.toString()),
          { value: toWei(0.07) }
        )
      ).to.be.reverted;

      //console.log(fromCacio(await Cacio.balanceOf(wallet1.address)));
      //console.log(fromCacio(await Cacio._maxWalletAmount()));
    });
    it("Checks max wallet P2P", async function () {
      // User 2 buys and tries to send to 1st user but reverts due to max wallet
      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;

      //console.log(fromCacio(await Cacio.balanceOf(account2.address)));

      await wallet2.swapExactETHForTokens(
        0,
        [WETH, Cacio.address],
        account2.address,
        ethers.BigNumber.from(deadline.toString()),
        { value: toWei(0.1) }
      );
      // console.log(fromCacio(await Cacio.balanceOf(account2.address)));
      // console.log(fromCacio(await Cacio.balanceOf(account1.address)));
      // user 2 tries to send more tokens to user1 but reverts

      await expect(
        Cacio.connect(account2).transfer(account1.address, toCacio(57998222))
      ).to.be.reverted;
      // user2 successfully sends user1 tokens under max wallet
      await Cacio.connect(account2).transfer(
        account1.address,
        toCacio(31171697)
      );
    });
    it("More trading to increase tokenbalance", async function () {
      /*  console.log(
        "Balance of LP Before:",
        fromWei(await pair.balanceOf(deployer.address))
      ); */

      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;

      const tx = async (wallet, account) => {
        await wallet.swapExactETHForTokens(
          0,
          [WETH, Cacio.address],
          account.address,
          ethers.BigNumber.from(deadline.toString()),
          { value: toWei(0.1) }
        );
      };
      await tx(wallet3, account3);
      await tx(wallet4, account4);
      //await tx(wallet5, account5);
      //await tx(wallet3, account3);
      //await tx(wallet4, account4);
      //await tx(wallet5, account5);
    });
    it("Autoliquidity", async function () {
      /*  console.log(
        Number(fromCacio(await Cacio.numTokensToExchangeForMarketing())) +
          Number(fromCacio(await Cacio.numTokensToExchangeForLiquidity()))
      );
      console.log(
        "contract balance before: ",
        fromCacio(await Cacio.balanceOf(Cacio.address))
      );
      console.log(
        "Marketing Eth Before: ",
        fromWei(await provider.getBalance(marketing.address))
      ); */

      // User Sells and triggers autoliq
      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;
      //---First approves
      const balance = await Cacio.balanceOf(account2.address);
      await Cacio.connect(account2).approve(uniswapRouterAddress, balance);
      // Swaps for ETH
      await wallet2.swapExactTokensForETHSupportingFeeOnTransferTokens(
        balance,
        0,
        [Cacio.address, WETH],
        account2.address,
        deadline,
        { gasLimit: 3000000 }
      );

      /*  console.log(
        "Balance of LP After:",
        fromWei(await pair.balanceOf(deployer.address))
      );
      console.log(
        "contract balance after",
        fromCacio(await Cacio.balanceOf(Cacio.address))
      );
      console.log(
        "Marketing Eth After: ",
        fromWei(await provider.getBalance(marketing.address))
      ); */
    });
    it("Blacklisted cannot sell", async function () {
      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;
      const balance = await Cacio.balanceOf(account5.address);
      await Cacio.connect(account5).approve(uniswapRouterAddress, balance);

      await expect(
        wallet5.swapExactTokensForETHSupportingFeeOnTransferTokens(
          balance,
          0,
          [Cacio.address, WETH],
          account5.address,
          deadline,
          { gasLimit: 3000000 }
        )
      ).to.be.reverted;
    });
    /* it("Withdraw Liquidity", async function () {
      await Cacio._setMaxTxAmount(toWei(99999999999999));
      const pairAddress = await Cacio.uniswapV2Pair();
      const pair = new ethers.Contract(pairAddress, pairAbi, deployer);

      const balance = await pair.balanceOf(deployer.address);
      console.log(balance);

      await pair.approve(uniswapRouterAddress, balance);

      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;

      const router = new ethers.Contract(
        uniswapRouterAddress,
        routerAbi,
        deployer
      );
      const removeLiq =
        await router.removeLiquidityETHSupportingFeeOnTransferTokens(
          Cacio.address,
          balance,
          0,
          0,
          deployer.address,
          deadline
        );
      console.log(removeLiq);
    }); */
  });
});
