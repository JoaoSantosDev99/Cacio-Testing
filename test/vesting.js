/* require("dotenv").config();
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helpers
const toWei = (amt) => ethers.utils.parseEther(amt.toString());
const fromWei = (amt) => ethers.utils.formatEther(amt);

// PancakeSwap Router
const abi = require("../abi/abi");

describe("Vesting Contract", function () {
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
    marketing2,
    marketing1,
    teamWallet,
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
      marketing2,
      marketing1,
      teamWallet,
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

    await fttContract.setVestingContract(vestingContract.address);
  });

  describe("Presale Vests", () => {
    it("Sends 800M tokens to  presale contract", async function () {
      expect(await fttContract.balanceOf(vestingContract.address)).to.equal(0);
      await fttContract
        .connect(deployer)
        .transfer(vestingContract.address, toWei(800000000));
      expect(await fttContract.balanceOf(vestingContract.address)).to.equal(
        toWei(800000000)
      );
      expect(await fttContract.balanceOf(deployer.address)).to.equal(
        toWei(3200000000)
      );
    });
    it("Cannot buy when presale is inactive", async function () {
      const busd = new ethers.Contract(abi.busdAddress, abi.ERCABI, account2);
      await busd.approve(vestingContract.address, toWei(60));
      await expect(
        vestingContract.connect(account2).buyPresaleSlot()
      ).to.be.revertedWith("Presale is not active yet");
    });
    it("Activates Presale and whitelister buys", async function () {
      await vestingContract.connect(deployer).addWhiteListed(account2.address);
      await vestingContract.connect(deployer).startPresale();
      // Account 2 buys BUSD and buys a presale spot
      // Buys BUSD with BNB
      const router = new ethers.Contract(
        abi.routerAddress,
        abi.routerAbi,
        account2
      );
      const BUSD = new ethers.Contract(abi.busdAddress, abi.ERCABI, account2);
      let block = await ethers.provider.getBlock();
      let deadline = block.timestamp + 60 * 20;

      await router
        .connect(account2)
        .swapETHForExactTokens(
          toWei(60),
          [router.WETH(), abi.busdAddress],
          account2.address,
          ethers.BigNumber.from(deadline.toString()),
          {
            value: toWei(1),
            gasLimit: 900000,
            gasPrice: ethers.utils.parseUnits("100", "gwei"),
          }
        );
      const busd = new ethers.Contract(abi.busdAddress, abi.ERCABI, account2);
      await busd.approve(vestingContract.address, toWei(60));
      await vestingContract.connect(account2).buyPresaleSlot();
      expect(await fttContract.balanceOf(account2.address)).to.equal(
        toWei(1600000)
      );
    });

    it("Contract variables are updated", async function () {
      expect(await vestingContract.whiteListed(account2.address)).to.be.true;
      expect(await vestingContract.hasPurchased(account2.address)).to.be.true;
      expect(await vestingContract.presaleSpots()).to.equal(150);
      expect(await vestingContract.whitelListSpots()).to.equal(49);
      const presaleVest = await vestingContract.vestingRegistry(
        account2.address
      );

      expect(presaleVest._benificiary).to.equal(account2.address);
      expect(presaleVest._total).to.equal(toWei(2400000));
    });
    it("Presale ends, public sale starts", async function () {
      const currentTime = await time.latest();
      await time.increaseTo(currentTime + 3660);
      expect(await time.latest()).to.be.greaterThan(
        await vestingContract.publicStartTime()
      );
    });
    it("Public buys, variables are updated", async function () {
      // Account 3 buys BUSD and buys a presale spot
      // Buys BUSD with BNB
      const router = new ethers.Contract(
        abi.routerAddress,
        abi.routerAbi,
        account3
      );
      const BUSD = new ethers.Contract(abi.busdAddress, abi.ERCABI, account3);
      let block = await ethers.provider.getBlock();
      let deadline = block.timestamp + 60 * 20;

      await router
        .connect(account3)
        .swapETHForExactTokens(
          toWei(60),
          [router.WETH(), abi.busdAddress],
          account3.address,
          ethers.BigNumber.from(deadline.toString()),
          {
            value: toWei(1),
            gasLimit: 900000,
            gasPrice: ethers.utils.parseUnits("100", "gwei"),
          }
        );
      const busd = new ethers.Contract(abi.busdAddress, abi.ERCABI, account3);
      await busd.approve(vestingContract.address, toWei(60));
      // Public presale buys
      await vestingContract.connect(account3).buyPresaleSlot();
      // State variables update
      expect(await vestingContract.whiteListed(account3.address)).to.be.false;
      expect(await vestingContract.hasPurchased(account3.address)).to.be.true;
      expect(await vestingContract.presaleSpots()).to.equal(150);
      expect(await vestingContract.whitelListSpots()).to.equal(48);
      const presaleVest = await vestingContract.vestingRegistry(
        account3.address
      );

      expect(presaleVest._benificiary).to.equal(account3.address);
      expect(presaleVest._total).to.equal(toWei(2400000));
    });
    it("Once Whitelist spots are gone, take from public spots", async function () {
      await vestingContract.connect(deployer).updateWhiteListSpots(0);
      // Account 4 buys BUSD and buys a presale spot
      // Buys BUSD with BNB
      const router = new ethers.Contract(
        abi.routerAddress,
        abi.routerAbi,
        account4
      );
      const BUSD = new ethers.Contract(abi.busdAddress, abi.ERCABI, account4);
      let block = await ethers.provider.getBlock();
      let deadline = block.timestamp + 60 * 20;

      await router
        .connect(account4)
        .swapETHForExactTokens(
          toWei(60),
          [router.WETH(), abi.busdAddress],
          account4.address,
          ethers.BigNumber.from(deadline.toString()),
          {
            value: toWei(1),
            gasLimit: 900000,
            gasPrice: ethers.utils.parseUnits("100", "gwei"),
          }
        );
      const busd = new ethers.Contract(abi.busdAddress, abi.ERCABI, account4);
      await busd.approve(vestingContract.address, toWei(60));
      // Public presale buys
      await vestingContract.connect(account4).buyPresaleSlot();
      // State variables update
      expect(await vestingContract.whiteListed(account3.address)).to.be.false;
      expect(await vestingContract.hasPurchased(account3.address)).to.be.true;
      expect(await vestingContract.presaleSpots()).to.equal(149);
      expect(await vestingContract.whitelListSpots()).to.equal(0);
    });
    it("Reverts if tries to claim first 24h post launch", async function () {
      await expect(
        vestingContract.connect(account3).claimTokens()
      ).to.be.revertedWith(
        "Your tokens will start releasing after 24hrs post launch"
      );
    });
    it("Able to claim after 24 hours post launch", async function () {
      const currentTime = await time.latest();
      await time.increaseTo(currentTime + 432000);

      expect(await fttContract.balanceOf(account3.address)).to.equal(
        toWei(1600000)
      );
      await vestingContract.connect(account3).claimTokens();
      expect(await fttContract.balanceOf(account3.address)).to.be.greaterThan(
        toWei(1600000)
      );
    });
  });
  //////////////////////////////////////////////////////////////////////////////////////////////
  describe("Marketing Vests", function () {
    it("Creates a Marketing vest", async function () {
      const startingBalance = await fttContract.balanceOf(
        vestingContract.address
      );
      const marketStartingBalance = await fttContract.balanceOf(
        marketing1.address
      );
      // Deployer Approves
      await fttContract
        .connect(deployer)
        .approve(vestingContract.address, toWei(20000000));
      // Createse marketing vest for 20M tokens
      await vestingContract
        .connect(deployer)
        .createMarketingVest(marketing1.address, toWei(20000000));
      const endingBalance = await fttContract.balanceOf(
        vestingContract.address
      );
      expect(
        await fttContract.balanceOf(vestingContract.address)
      ).to.be.greaterThan(startingBalance);
      expect(await fttContract.balanceOf(marketing1.address)).to.be.greaterThan(
        marketStartingBalance
      );
      // Deployer Approves
      await fttContract
        .connect(deployer)
        .approve(vestingContract.address, toWei(20000000));
      // Createse marketing vest for 20M tokens
      await vestingContract
        .connect(deployer)
        .createMarketingVest(marketing2.address, toWei(10000000));
    });
    it("Sends payment to marketing wallets", async function () {
      const startingBalance1 = await fttContract.balanceOf(marketing1.address);
      const startingBalance2 = await fttContract.balanceOf(marketing2.address);
      await vestingContract.claimMarketingTokens();
      const endingBalance1 = await fttContract.balanceOf(marketing1.address);
      const endingBalance2 = await fttContract.balanceOf(marketing2.address);
      expect(endingBalance1).to.be.greaterThan(startingBalance1);
      expect(endingBalance2).to.be.greaterThan(startingBalance2);
    });
    it("Replaces marketing wallet with owner", async function () {
      let marketingWallets = await vestingContract.getMarketingWallets();
      expect(marketingWallets[1]).to.equal(marketing2.address);
      await vestingContract.replaceMarketingWallet(marketing2.address);
      marketingWallets = await vestingContract.getMarketingWallets();
      expect(marketingWallets[1]).to.equal(deployer.address);
    });
  });
  //////////////////////////////////////////////////////////////////////////////////////////////
  describe("Team Vest", () => {
    it("Sets team wallet", async function () {
      await vestingContract.setTeamWallet(teamWallet.address);
      expect(await vestingContract.teamWallet()).to.equal(teamWallet.address);
    });
    it("Vests Team Tokens", async function () {
      await fttContract
        .connect(deployer)
        .approve(vestingContract.address, toWei(400000000));
      await vestingContract.connect(deployer).vestTeamTokens(toWei(400000000));
      const teamVest = await vestingContract.teamVest();
      expect(teamVest._amount).to.equal(toWei(400000000));
      expect(teamVest._claimed).to.equal(toWei(0));
      expect(teamVest._vestingStartDate).to.be.closeTo(await time.latest(), 60);
      expect(teamVest._vestingEndDate).to.be.closeTo(
        (await time.latest()) + 60480000,
        60
      );
    });
    it("Slowly releases team tokens", async function () {
      const currentTime = await time.latest();
      await time.increaseTo(currentTime + 345600);
      expect(
        await vestingContract.checkTeamTokensAvailable()
      ).to.be.greaterThan(0);
    });
    it("Team Can only claim once a week, only team wallet", async function () {
      await expect(vestingContract.withdrawTeamTokens()).to.be.revertedWith(
        "Caller is not the team wallet"
      );
      await expect(
        vestingContract.connect(teamWallet).withdrawTeamTokens()
      ).to.be.revertedWith("Can only claim once a week");
      const currentTime = await time.latest();
      await time.increaseTo(currentTime + 345600);
      expect(await fttContract.balanceOf(teamWallet.address)).to.equal(0);
      await vestingContract.connect(teamWallet).withdrawTeamTokens();
      expect(await fttContract.balanceOf(teamWallet.address)).to.be.greaterThan(
        0
      );
      await expect(
        vestingContract.connect(teamWallet).withdrawTeamTokens()
      ).to.be.revertedWith("Can only claim once a week");
    });
    it("Withdraws BUSD", async function () {
      const BUSD = new ethers.Contract(abi.busdAddress, abi.ERCABI, deployer);
      const startingBalance = await BUSD.balanceOf(deployer.address);

      await vestingContract.connect(deployer).withdrawBUSD();
      const endingBalance = await BUSD.balanceOf(deployer.address);
      expect(endingBalance).to.be.greaterThan(startingBalance);
    });
  });
  describe("After 100 days", () => {
    it("Cannot withdraw more than what is vested", async function () {
      const currentTime = await time.latest();
      await time.increaseTo(currentTime + 8640000);
      const balance = await vestingContract.checkAvailableTokens(
        account2.address
      );
      expect(balance).to.be.lessThan(toWei(24000000));
    });
    it("Deployer can remove any unsold tokens", async function () {
      const startingBalance = await fttContract.balanceOf(deployer.address);
      await vestingContract.connect(deployer).getUnusedTokens();
      const endingBalance = await fttContract.balanceOf(deployer.address);
      expect(endingBalance).to.be.greaterThan(startingBalance);
    });
  });
});
 */
