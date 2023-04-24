require("dotenv").config();
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helpers
const toWei = (amt) => ethers.utils.parseEther(amt.toString());
const fromWei = (amt) => ethers.utils.formatEther(amt);

// PancakeSwap Router
const abi = require("../abi/abi");

describe("FRED", function () {
  let fttContract,
    vestingContract,
    provider,
    deployer,
    account1,
    account2,
    account3,
    account4,
    account5,
    account6,
    account7,
    account8,
    account9,
    account10,
    account11,
    treasuryWallet,
    WETH;

  before("deploy", async function () {
    // Get Signers
    [
      deployer,
      account1,
      account2,
      account3,
      account4,
      account5,
      account6,
      account7,
      account8,
      account9,
      account10,
      account11,
      treasuryWallet,
    ] = await hre.ethers.getSigners();
    provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");
    const wallet = new ethers.Wallet(process.env.PK, provider);

    // Deploy
    const FTT = await hre.ethers.getContractFactory("FredTheTurtle");
    fttContract = await FTT.deploy();
    await fttContract.deployed();
    await fttContract.setTreasuryWallet(treasuryWallet.address);

    const Presale = await hre.ethers.getContractFactory("VestingContract");
    vestingContract = await Presale.deploy(fttContract.address);
    await vestingContract.deployed();
  });

  describe("Tax enabled token", () => {
    // Check owners Address
    it("Deployed with correct Owner", async function () {
      console.log(`FTT Contract deployed to ${fttContract.address}`);
      expect(await fttContract.owner()).to.equal(deployer.address);
      // console.log(`Vesting Contract deployed to ${vestingContract.address}`);
      //expect(await vestingContract.owner()).to.equal(deployer.address);
    });

    // Check that tokens got minted properly
    it("Mints 4B tokens to contract/owner", async function () {
      console.log("--Token Contract--");
      expect(await fttContract.balanceOf(deployer.address)).to.equal(
        toWei(4000000000)
      );
    });
    it("Adds Liquidity on PancakeSwap, avoids tax", async function () {
      let router = new ethers.Contract(
        abi.routerAddress,
        abi.routerAbi,
        deployer
      );

      //Approves
      await fttContract
        .connect(deployer)
        .approve(abi.routerAddress, toWei(1000000000));
      // Supply liq
      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;

      await router.addLiquidityETH(
        fttContract.address,
        toWei(1000000000),
        0,
        toWei(100),
        deployer.address,
        ethers.BigNumber.from(deadline.toString()),
        {
          value: toWei(100),
          gasLimit: 900000,
          gasPrice: ethers.utils.parseUnits("100", "gwei"),
        }
      );

      expect(await fttContract.balanceOf(deployer.address)).to.equal(
        toWei(3000000000)
      );
      expect(await fttContract.balanceOf(treasuryWallet.address)).to.equal(0);
    });

    it("Enable Trading", async function () {
      expect(await fttContract.tradingEnabled()).to.be.false;
      await fttContract.enableTrading(0);
      expect(await fttContract.tradingEnabled()).to.be.true;
    });

    it("User cannot buy more than max limit ", async function () {
      router = new ethers.Contract(abi.routerAddress, abi.routerAbi, account3);

      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;
      await expect(
        router
          .connect(account3)
          .swapETHForExactTokens(
            toWei(20000000),
            [router.WETH(), fttContract.address],
            account3.address,
            ethers.BigNumber.from(deadline.toString()),
            {
              value: toWei(6),
              gasLimit: 900000,
              gasPrice: ethers.utils.parseUnits("100", "gwei"),
            }
          )
      ).to.be.reverted;
    });
    it("Max Buy removed, user can buy 20M+", async function () {
      await fttContract.connect(deployer).removeMaxBuy();
      router = new ethers.Contract(abi.routerAddress, abi.routerAbi, account3);

      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;
      await router
        .connect(account3)
        .swapETHForExactTokens(
          toWei(20000000),
          [router.WETH(), fttContract.address],
          account3.address,
          ethers.BigNumber.from(deadline.toString()),
          {
            value: toWei(6),
            gasLimit: 900000,
            gasPrice: ethers.utils.parseUnits("100", "gwei"),
          }
        );
      expect(await fttContract.balanceOf(account3.address)).to.equal(
        toWei(20000000 * 0.97)
      );
    });

    it("User is now able to buy", async function () {
      router = new ethers.Contract(abi.routerAddress, abi.routerAbi, account1);

      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;
      await router
        .connect(account1)
        .swapETHForExactTokens(
          toWei(5000001),
          [router.WETH(), fttContract.address],
          account1.address,
          ethers.BigNumber.from(deadline.toString()),
          {
            value: toWei(1),
            gasLimit: 900000,
            gasPrice: ethers.utils.parseUnits("100", "gwei"),
          }
        );
    });

    it("Creates a shell for buyer, considers tax", async function () {
      expect(await fttContract.totalShells(account1.address)).to.equal(1);
      const shell = await fttContract.userShells(account1.address, 0);
      expect(shell.amountBought).to.closeTo(toWei(5000000 * 0.97), toWei(1));
      expect(shell.shellBalance).to.closeTo(toWei(5000000 * 0.97), toWei(1));
      expect(shell.initialAvailable).to.closeTo(
        toWei(2500000 * 0.97),
        toWei(1)
      );
      expect(shell.initialVested).to.closeTo(toWei(2500000 * 0.97), toWei(1));
      expect(shell.isActive).to.be.true;
    });

    it("Should revert if user sells more than available", async function () {
      const router = new ethers.Contract(
        abi.routerAddress,
        abi.routerAbi,
        account1
      );
      await fttContract
        .connect(account1)
        .approve(router.address, toWei(5000000));

      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;
      await expect(
        router
          .connect(account1)
          .swapExactTokensForETHSupportingFeeOnTransferTokens(
            toWei(5000000),
            0,
            [fttContract.address, router.WETH()],
            account1.address,
            ethers.BigNumber.from(deadline.toString()),
            {
              gasLimit: 900000,
              gasPrice: ethers.utils.parseUnits("100", "gwei"),
            }
          )
      ).to.be.reverted;
    });

    it("Should be able to sell whats available", async function () {
      const currentTime = await time.latest();
      await time.increaseTo(currentTime + 86400);
      let available = await fttContract.checkAll(account1.address);

      const router = new ethers.Contract(
        abi.routerAddress,
        abi.routerAbi,
        account1
      );
      await fttContract
        .connect(account1)
        .approve(router.address, toWei(5000000));

      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;
      await router
        .connect(account1)
        .swapExactTokensForETHSupportingFeeOnTransferTokens(
          available,
          0,
          [fttContract.address, router.WETH()],
          account1.address,
          ethers.BigNumber.from(deadline.toString()),
          {
            gasLimit: 900000,
            gasPrice: ethers.utils.parseUnits("100", "gwei"),
          }
        );
      expect(await fttContract.checkAll(account1.address)).to.equal(toWei(0));
    });
    it("Can buy multiple Shells", async function () {
      router = new ethers.Contract(abi.routerAddress, abi.routerAbi, account2);

      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;
      await router
        .connect(account2)
        .swapETHForExactTokens(
          toWei(500001),
          [router.WETH(), fttContract.address],
          account2.address,
          ethers.BigNumber.from(deadline.toString()),
          {
            value: toWei(1),
            gasLimit: 900000,
            gasPrice: ethers.utils.parseUnits("100", "gwei"),
          }
        );
      await router
        .connect(account2)
        .swapETHForExactTokens(
          toWei(500001),
          [router.WETH(), fttContract.address],
          account2.address,
          ethers.BigNumber.from(deadline.toString()),
          {
            value: toWei(1),
            gasLimit: 900000,
            gasPrice: ethers.utils.parseUnits("100", "gwei"),
          }
        );
      expect(await fttContract.totalShells(account2.address)).to.equal(2);
    });
    it("Transfers tokens to treasury on every transfer", async function () {
      // Balance before

      const startingBalance = await fttContract.balanceOf(
        treasuryWallet.address
      );

      // Purchase is made that triggers transfer
      router = new ethers.Contract(abi.routerAddress, abi.routerAbi, account2);

      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;
      await router
        .connect(account2)
        .swapETHForExactTokens(
          toWei(300000),
          [router.WETH(), fttContract.address],
          account2.address,
          ethers.BigNumber.from(deadline.toString()),
          {
            value: toWei(1),
            gasLimit: 900000,
            gasPrice: ethers.utils.parseUnits("100", "gwei"),
          }
        );
      await router
        .connect(account2)
        .swapETHForExactTokens(
          toWei(5000001),
          [router.WETH(), fttContract.address],
          account2.address,
          ethers.BigNumber.from(deadline.toString()),
          {
            value: toWei(1),
            gasLimit: 900000,
            gasPrice: ethers.utils.parseUnits("100", "gwei"),
          }
        );

      // Balance After
      const endingBalance = await fttContract.balanceOf(treasuryWallet.address);
      expect(endingBalance).to.be.greaterThan(startingBalance);
      // console.log(await fttContract.getAllShells(account2.address));
    });
    it("Returns available balance", async function () {
      expect(
        await fttContract.checkStatus(account2.address, 0)
      ).to.be.greaterThan(0);
    });
    it("No tax on wallet-wallet transfers", async function () {
      // Account2 sends Account4 some tokens with no tax
      expect(await fttContract.balanceOf(account4.address)).to.equal(0);
      await fttContract
        .connect(account2)
        .transfer(account4.address, toWei(50000));
      expect(await fttContract.balanceOf(account4.address)).to.equal(
        toWei(50000)
      );
      console.log;
    });
    it("Getter Functions", async function () {
      const shells = await fttContract.getAllShells(account2.address);
      expect(shells).to.be.an("array");
      // console.log(await fttContract.getAllShells(account2.address));
      expect(
        await fttContract.amountPerDay(account2.address)
      ).to.be.greaterThan(0);
      expect(
        await fttContract.checkAllLocked(account2.address)
      ).to.be.greaterThan(0);
    });
    it("Setter Functions", async function () {
      await fttContract.addTaxExempt(account5.address);
      expect(await fttContract.taxExempt(account5.address)).to.be.true;

      const pair = await fttContract.uniswapV2Pair();
      await fttContract.setUniswapV2Pair(account6.address);
      await fttContract.setUniswapV2Pair(pair);
      expect(await fttContract.uniswapV2Pair()).to.equal(pair);
    });
    it("70 days later gets full shells", async function () {
      // Gets FULL shells
      const currentTime = await time.latest();
      await time.increaseTo(currentTime + 6048000);
      expect(await fttContract.getFertileShells(account2.address)).to.be.an(
        "array"
      );
    });

    it("Removes shells and trades normally", async function () {
      await fttContract.removeShells();
      // Makes Purchase
      router = new ethers.Contract(abi.routerAddress, abi.routerAbi, account8);

      const block = await ethers.provider.getBlock();
      const deadline = block.timestamp + 60 * 20;
      await router
        .connect(account8)
        .swapETHForExactTokens(
          toWei(5000001),
          [router.WETH(), fttContract.address],
          account8.address,
          ethers.BigNumber.from(deadline.toString()),
          {
            value: toWei(6),
            gasLimit: 900000,
            gasPrice: ethers.utils.parseUnits("100", "gwei"),
          }
        );
      const currentTime = await time.latest();
      // Advance 1 week
      await time.increaseTo(currentTime + 604800);

      expect(await fttContract.totalShells(account8.address)).to.equal(0);
      expect(await fttContract.balanceOf(account8.address)).to.equal(
        toWei(5000001 * 0.97)
      );
      // Can sell full amount
    });
  });
});
