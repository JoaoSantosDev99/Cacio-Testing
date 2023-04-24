// require("dotenv").config();
// const { time } = require("@nomicfoundation/hardhat-network-helpers");
// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// // Helpers
// const toWei = (amt) => ethers.utils.parseEther(amt.toString());
// const fromWei = (amt) => ethers.utils.formatEther(amt);

// // PancakeSwap Router
// const abi = require("../abi/abi");

// describe("Test", function () {
//   let fttContract,
//     vestingContract,
//     provider,
//     deployer,
//     account1,
//     account2,
//     account3,
//     account4,
//     account5,
//     account6,
//     account7,
//     account8,
//     account9,
//     account10,
//     account11;

//   before("deploy", async function () {
//     // Get Signers
//     [
//       deployer,
//       account1,
//       account2,
//       account3,
//       account4,
//       account5,
//       account6,
//       account7,
//       account8,
//       account9,
//       account10,
//       account11,
//     ] = await hre.ethers.getSigners();
//     provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");
//     const wallet = new ethers.Wallet(process.env.PK, provider);

//     // Deploy
//     const FTT = await hre.ethers.getContractFactory("FredTheTurtle");
//     fttContract = await FTT.deploy();
//     await fttContract.deployed();

//     const Presale = await hre.ethers.getContractFactory("VestingContract");
//     vestingContract = await Presale.deploy(fttContract.address);
//     await vestingContract.deployed();

//     // Fund contract
//     await wallet.sendTransaction({
//       to: fttContract.address,
//       value: ethers.utils.parseEther("10"),
//     });
//   });
//   // Check owners Address
//   it("Deployed with correct Owner", async function () {
//     console.log(`FTT Contract deployed to ${fttContract.address}`);
//     expect(await fttContract.owner()).to.equal(deployer.address);
//     console.log(`Vesting Contract deployed to ${vestingContract.address}`);
//     expect(await vestingContract.owner()).to.equal(deployer.address);
//   });

//   // Check that tokens got minted properly
//   it("Mints 2.2B/1.8B tokens to contract/owner", async function () {
//     console.log("--Token Contract--");
//     expect(await fttContract.balanceOf(fttContract.address)).to.equal(
//       toWei(2200000000)
//     );
//     expect(await fttContract.balanceOf(deployer.address)).to.equal(
//       toWei(1800000000)
//     );
//   });
//   it("Adds Liquidity on PancakeSwap", async function () {
//     await fttContract.addLiquidity();
//   });
//   it("Transfers Tokens to Vesting Contract", async function () {
//     await fttContract.transfer(vestingContract.address, toWei(600000000));
//     expect(await fttContract.balanceOf(vestingContract.address)).to.equal(
//       toWei(600000000)
//     );
//   });
//   // User cannot buy because there is no liquidity
//   it("User tries to buy and reverts", async function () {
//     // Create router contract object
//     const router = new ethers.Contract(abi.pancakeRouter, abi.abi, account2);
//     // Get current block to create the deadline
//     const block = await ethers.provider.getBlock();
//     const deadline = block.timestamp + 60 * 20;
//     // Send transaction
//     await expect(
//       router
//         .connect(account2)
//         .swapETHForExactTokens(
//           toWei(100000),
//           [router.WETH(), fttContract.address],
//           account2.address,
//           ethers.BigNumber.from(deadline.toString()),
//           {
//             value: toWei(0.1),
//             gasLimit: 500000,
//             gasPrice: ethers.utils.parseUnits("100", "gwei"),
//           }
//         )
//     ).to.be.reverted;
//   });
//   it("Enable Trading", async function () {
//     expect(await fttContract.tradingEnabled()).to.be.false;
//     await fttContract.enableTrading(3);
//     expect(await fttContract.tradingEnabled()).to.be.true;
//   });
//   it("Sends Snipe bots tokens to owner", async function () {
//     expect(await fttContract.balanceOf(account10.address)).to.equal(0);
//     // Make a buy with account 10
//     const router = new ethers.Contract(abi.pancakeRouter, abi.abi, account10);
//     const block = await ethers.provider.getBlock();
//     const deadline = block.timestamp + 60 * 20;
//     await router
//       .connect(account10)
//       .swapETHForExactTokens(
//         toWei(100000),
//         [router.WETH(), fttContract.address],
//         account10.address,
//         ethers.BigNumber.from(deadline.toString()),
//         {
//           value: toWei(0.1),
//           gasLimit: 900000,
//           gasPrice: ethers.utils.parseUnits("100", "gwei"),
//         }
//       );
//     expect(await fttContract.balanceOf(account10.address)).to.equal(0);
//     expect(await fttContract.balanceOf(deployer.address)).to.equal(
//       toWei(1200100000)
//     );
//   });

//   it("User is now able to buy", async function () {
//     // Fast Forward Time
//     const currentTime = await time.latest();
//     await time.increaseTo(currentTime + 200);

//     const router = new ethers.Contract(abi.pancakeRouter, abi.abi, account2);
//     const block = await ethers.provider.getBlock();
//     const deadline = block.timestamp + 60 * 20;
//     await router
//       .connect(account2)
//       .swapETHForExactTokens(
//         toWei(100000),
//         [router.WETH(), fttContract.address],
//         account2.address,
//         ethers.BigNumber.from(deadline.toString()),
//         {
//           value: toWei(0.1),
//           gasLimit: 900000,
//           gasPrice: ethers.utils.parseUnits("100", "gwei"),
//         }
//       );
//   });
//   it("Creates a shell for buyer", async function () {
//     expect(await fttContract.totalShells(account2.address)).to.equal(1);
//     const shell = await fttContract.userShells(account2.address, 0);
//     expect(shell.amountBought).to.equal(toWei(100000));
//     expect(shell.shellBalance).to.equal(toWei(100000));
//     expect(shell.initialAvailable).to.equal(toWei(30000));
//     expect(shell.initialVested).to.equal(toWei(70000));
//     expect(shell.isActive).to.be.true;
//   });
//   it("Should revert if user sells more than available", async function () {
//     const router = new ethers.Contract(abi.pancakeRouter, abi.abi, account2);
//     await fttContract.connect(account2).approve(router.address, toWei(5000000));
//     const block = await ethers.provider.getBlock();
//     const deadline = block.timestamp + 60 * 20;
//     await expect(
//       router
//         .connect(account2)
//         .swapExactTokensForETH(
//           toWei(50000),
//           0,
//           [fttContract.address, router.WETH()],
//           account2.address,
//           ethers.BigNumber.from(deadline.toString()),
//           {
//             gasLimit: 900000,
//             gasPrice: ethers.utils.parseUnits("100", "gwei"),
//           }
//         )
//     ).to.be.reverted;
//   });
//   it("Should be able to sell whats available", async function () {
//     const available = await fttContract.checkAll(account2.address);
//     const router = new ethers.Contract(abi.pancakeRouter, abi.abi, account2);
//     await fttContract.connect(account2).approve(router.address, toWei(5000000));

//     const block = await ethers.provider.getBlock();
//     const deadline = block.timestamp + 60 * 20;
//     await router
//       .connect(account2)
//       .swapExactTokensForETH(
//         available,
//         0,
//         [fttContract.address, router.WETH()],
//         account2.address,
//         ethers.BigNumber.from(deadline.toString()),
//         {
//           gasLimit: 900000,
//           gasPrice: ethers.utils.parseUnits("100", "gwei"),
//         }
//       );
//     expect(await fttContract.checkAll(account2.address)).to.equal(toWei(0));
//   });
//   it("User can buy multiple shells", async function () {
//     const router = new ethers.Contract(abi.pancakeRouter, abi.abi, account2);
//     const block = await ethers.provider.getBlock();
//     const deadline = block.timestamp + 60 * 20;
//     await router
//       .connect(account2)
//       .swapETHForExactTokens(
//         toWei(100000),
//         [router.WETH(), fttContract.address],
//         account2.address,
//         ethers.BigNumber.from(deadline.toString()),
//         {
//           value: toWei(0.1),
//           gasLimit: 900000,
//           gasPrice: ethers.utils.parseUnits("100", "gwei"),
//         }
//       );
//     await router
//       .connect(account2)
//       .swapETHForExactTokens(
//         toWei(5000000),
//         [router.WETH(), fttContract.address],
//         account2.address,
//         ethers.BigNumber.from(deadline.toString()),
//         {
//           value: toWei(0.1),
//           gasLimit: 900000,
//           gasPrice: ethers.utils.parseUnits("100", "gwei"),
//         }
//       );
//     expect(await fttContract.totalShells(account2.address)).to.equal(3);
//     expect(await fttContract.checkAll(account2.address)).to.be.greaterThan(
//       toWei(30000)
//     );
//   });
//   it("Tokens release slowly", async function () {
//     const currentBalance = await fttContract.checkAll(account2.address);
//     const currentTime = await time.latest();
//     await time.increaseTo(currentTime + 864000);
//     expect(await fttContract.checkAll(account2.address)).to.be.greaterThan(
//       currentBalance
//     );
//   });
//   it("Cannot unvest more tokens than bought", async function () {
//     const router = new ethers.Contract(abi.pancakeRouter, abi.abi, account3);
//     const block = await ethers.provider.getBlock();
//     const deadline = block.timestamp + 60 * 20;
//     const tx = await router
//       .connect(account3)
//       .swapETHForExactTokens(
//         toWei(5000000),
//         [router.WETH(), fttContract.address],
//         account3.address,
//         ethers.BigNumber.from(deadline.toString()),
//         {
//           value: toWei(0.5),
//           gasLimit: 900000,
//           gasPrice: ethers.utils.parseUnits("100", "gwei"),
//         }
//       );
//     await tx.wait();

//     const currentTime = await time.latest();

//     await time.increaseTo(currentTime + 6185000);
//     let available = await fttContract.checkAll(account3.address);
//     expect(available).to.be.lessThanOrEqual(toWei(5000000));
//   });
//   it("User sells and new balance reflects it", async function () {
//     const router = new ethers.Contract(abi.pancakeRouter, abi.abi, account4);
//     let block = await ethers.provider.getBlock();
//     let deadline = block.timestamp + 60 * 20;
//     // User Buys 5M tokens
//     await router
//       .connect(account4)
//       .swapETHForExactTokens(
//         toWei(5000000),
//         [router.WETH(), fttContract.address],
//         account4.address,
//         ethers.BigNumber.from(deadline.toString()),
//         {
//           value: toWei(0.1),
//           gasLimit: 900000,
//           gasPrice: ethers.utils.parseUnits("100", "gwei"),
//         }
//       );
//     // Users balance is now 5M tokens
//     expect(await fttContract.balanceOf(account4.address)).to.equal(
//       toWei(5000000)
//     );
//     // Available to sell 2.5M tokens
//     expect(await fttContract.checkAll(account4.address)).to.equal(
//       toWei(2500000)
//     );
//     // Fast forward half the vesting time (30 days)
//     const currentTime = await time.latest();

//     await time.increaseTo(currentTime + 2592000);
//     // Available to sell now should be 3.75M
//     expect(await fttContract.checkAll(account4.address)).to.be.closeTo(
//       toWei(3750000),
//       toWei(10)
//     );
//     // User sells whats available
//     const available = await fttContract.checkAll(account4.address);
//     await fttContract.connect(account4).approve(router.address, available);

//     block = await ethers.provider.getBlock();
//     deadline = block.timestamp + 60 * 20;
//     await router
//       .connect(account4)
//       .swapExactTokensForETH(
//         available,
//         0,
//         [fttContract.address, router.WETH()],
//         account4.address,
//         ethers.BigNumber.from(deadline.toString()),
//         {
//           gasLimit: 900000,
//           gasPrice: ethers.utils.parseUnits("100", "gwei"),
//         }
//       );
//     expect(await fttContract.checkAll(account4.address)).to.equal(0);
//     expect(await fttContract.balanceOf(account4.address)).to.be.lessThanOrEqual(
//       toWei(1250001)
//     );
//   });

//   it("Returns fertile shells", async function () {
//     const router = new ethers.Contract(abi.pancakeRouter, abi.abi, account5);
//     let block = await ethers.provider.getBlock();
//     let deadline = block.timestamp + 60 * 20;
//     // User Buys 5M tokens
//     await router
//       .connect(account5)
//       .swapETHForExactTokens(
//         toWei(5000000),
//         [router.WETH(), fttContract.address],
//         account5.address,
//         ethers.BigNumber.from(deadline.toString()),
//         {
//           value: toWei(0.1),
//           gasLimit: 900000,
//           gasPrice: ethers.utils.parseUnits("100", "gwei"),
//         }
//       );
//     // Users balance is now 5M tokens
//     expect(await fttContract.balanceOf(account5.address)).to.equal(
//       toWei(5000000)
//     );
//     // Available to sell 2.5M tokens
//     expect(await fttContract.checkAll(account5.address)).to.equal(
//       toWei(2500000)
//     );
//     // Time passes
//     const currentTime = await time.latest();
//     await time.increaseTo(currentTime + 8640000);
//     // Available to sell 5M tokens
//     expect(await fttContract.checkAll(account5.address)).to.be.closeTo(
//       toWei(5000000),
//       toWei(2)
//     );

//     const fertilShell = await fttContract.getFertileShells(account5.address);
//     expect(fertilShell[0].shellBalance).to.equal(fertilShell[0].amountBought);
//   });
//   it("Whitelists accounts", async function () {
//     expect(await fttContract.whiteListed(vestingContract.address)).to.be.false;
//     await fttContract.whiteListAccount(vestingContract.address, true);
//     expect(await fttContract.whiteListed(vestingContract.address)).to.be.true;
//   });
//   it("Allows normal trading once shells are removed", async function () {
//     expect(await fttContract.shellsRemoved()).to.be.false;
//     await fttContract.connect(deployer).removeShells();
//     expect(await fttContract.shellsRemoved()).to.be.true;
//     const router = new ethers.Contract(abi.pancakeRouter, abi.abi, account8);
//     let block = await ethers.provider.getBlock();
//     let deadline = block.timestamp + 60 * 20;
//     // User Buys 5M tokens
//     await router
//       .connect(account8)
//       .swapETHForExactTokens(
//         toWei(5000000),
//         [router.WETH(), fttContract.address],
//         account8.address,
//         ethers.BigNumber.from(deadline.toString()),
//         {
//           value: toWei(0.1),
//           gasLimit: 900000,
//           gasPrice: ethers.utils.parseUnits("100", "gwei"),
//         }
//       );
//     // Users balance is now 5M tokens
//     expect(await fttContract.balanceOf(account8.address)).to.equal(
//       toWei(5000000)
//     );
//     // Expect user to have NO shells
//     expect(await fttContract.totalShells(account8.address)).to.equal(0);
//     // Expect user to be able to sell everything
//     const available = await fttContract.balanceOf(account8.address);
//     await fttContract.connect(account8).approve(router.address, available);

//     block = await ethers.provider.getBlock();
//     deadline = block.timestamp + 60 * 20;
//     await router
//       .connect(account8)
//       .swapExactTokensForETH(
//         available,
//         0,
//         [fttContract.address, router.WETH()],
//         account8.address,
//         ethers.BigNumber.from(deadline.toString()),
//         {
//           gasLimit: 900000,
//           gasPrice: ethers.utils.parseUnits("100", "gwei"),
//         }
//       );
//     expect(await fttContract.balanceOf(account8.address)).to.equal(0);
//   });
//   it("Checks addresses of FTT and BUSD", async function () {
//     console.log("--- Vesting Contract ---");
//     expect(await vestingContract.FTT()).to.equal(fttContract.address);
//     expect(await vestingContract.BUSD()).to.equal(abi.BUSD);
//   });
//   it("Reverts if presale is not started", async function () {
//     expect(await vestingContract.presaleActive()).to.be.false;
//     let currentTime = await time.latest();
//     await vestingContract.setStartTime(currentTime);
//     // Buys BUSD with BNB
//     const router = new ethers.Contract(abi.pancakeRouter, abi.abi, account6);
//     const BUSD = new ethers.Contract(abi.BUSD, abi.BUSDABI, account6);
//     let block = await ethers.provider.getBlock();
//     let deadline = block.timestamp + 60 * 20;

//     await router
//       .connect(account6)
//       .swapETHForExactTokens(
//         toWei(400),
//         [router.WETH(), abi.BUSD],
//         account6.address,
//         ethers.BigNumber.from(deadline.toString()),
//         {
//           value: toWei(2),
//           gasLimit: 900000,
//           gasPrice: ethers.utils.parseUnits("100", "gwei"),
//         }
//       );

//     BUSD.approve(vestingContract.address, toWei(200));

//     // Buys presale spot
//     await expect(
//       vestingContract.connect(account6).buyPresaleSlot()
//     ).to.be.revertedWith("Presale is not active yet");
//   });
//   it("Reverts if not enough BUSD is sent", async function () {
//     await expect(vestingContract.connect(account6).buyPresaleSlot()).to.be
//       .reverted;
//   });

//   it("Buys presale slot with enough BUSD", async function () {
//     await vestingContract.startPresale();
//     let currentTime = await time.latest();
//     await vestingContract.setStartTime(currentTime);
//     // Buys BUSD with BNB
//     const router = new ethers.Contract(abi.pancakeRouter, abi.abi, account6);
//     const BUSD = new ethers.Contract(abi.BUSD, abi.BUSDABI, account6);
//     let block = await ethers.provider.getBlock();
//     let deadline = block.timestamp + 60 * 20;

//     await router
//       .connect(account6)
//       .swapETHForExactTokens(
//         toWei(400),
//         [router.WETH(), abi.BUSD],
//         account6.address,
//         ethers.BigNumber.from(deadline.toString()),
//         {
//           value: toWei(2),
//           gasLimit: 900000,
//           gasPrice: ethers.utils.parseUnits("100", "gwei"),
//         }
//       );
//     await BUSD.approve(vestingContract.address, toWei(200));
//     // Buys presale spot
//     await vestingContract.connect(account6).buyPresaleSlot();
//     // Contract should now have $200
//     expect(await BUSD.balanceOf(vestingContract.address)).to.equal(toWei(200));
//     // Presale spots should be decreased by 1
//     expect(await vestingContract.presaleSpots()).to.equal(139);
//   });
//   it("Doesnt allow to claim within 24hrs", async function () {
//     // 23 hours pass by
//     currentTime = await time.latest();

//     await time.increaseTo(currentTime + 82800);

//     // User tries to claim
//     await expect(
//       vestingContract.connect(account6).claimTokens()
//     ).to.be.revertedWith("Your tokens will start releasing after 24hrs");
//   });
//   it("Allows to claim after 24hrs", async function () {
//     // 25 hours pass by
//     const currentTime = await time.latest();
//     await time.increaseTo(currentTime + 7200);
//     expect(
//       await vestingContract
//         .connect(account6)
//         .checkAvailableTokens(account6.address)
//     ).to.be.greaterThan(toWei(80000));

//     await vestingContract.connect(account6).claimTokens();
//     expect(
//       await vestingContract
//         .connect(account6)
//         .checkAvailableTokens(account6.address)
//     ).to.be.lessThan(toWei(1000));
//   });
//   it("Can only buy one spot per wallet", async function () {
//     const BUSD = new ethers.Contract(abi.BUSD, abi.BUSDABI, account6);
//     await BUSD.approve(vestingContract.address, toWei(200));
//     await expect(
//       vestingContract.connect(account6).buyPresaleSlot()
//     ).to.be.revertedWith("This wallet already has purchased");
//   });
//   it("Cannot claim more than 4B tokens", async function () {
//     const router = new ethers.Contract(abi.pancakeRouter, abi.abi, account7);
//     const BUSD = new ethers.Contract(abi.BUSD, abi.BUSDABI, account7);
//     let block = await ethers.provider.getBlock();
//     let deadline = block.timestamp + 60 * 20;

//     await router
//       .connect(account7)
//       .swapETHForExactTokens(
//         toWei(200),
//         [router.WETH(), abi.BUSD],
//         account7.address,
//         ethers.BigNumber.from(deadline.toString()),
//         {
//           value: toWei(1),
//           gasLimit: 900000,
//           gasPrice: ethers.utils.parseUnits("100", "gwei"),
//         }
//       );
//     await BUSD.approve(vestingContract.address, toWei(200));
//     // Buys presale spot
//     await vestingContract.connect(account7).buyPresaleSlot();
//     // 60 days pass by

//     const currentTime = await time.latest();
//     await time.increaseTo(currentTime + 15184000);

//     expect(
//       await vestingContract
//         .connect(account7)
//         .checkAvailableTokens(account7.address)
//     ).to.be.lessThanOrEqual(toWei(4000000));
//   });

//   it("Allows owner to withdraw BUSD", async function () {
//     const BUSD = new ethers.Contract(abi.BUSD, abi.BUSDABI, deployer);
//     const startingBalanceOwner = await BUSD.balanceOf(deployer.address);

//     // Only owner can remove
//     await expect(vestingContract.connect(account1).withdrawBUSD()).to.be
//       .reverted;
//     await vestingContract.connect(deployer).withdrawBUSD();
//     expect(await BUSD.balanceOf(vestingContract.address)).to.equal(0);
//     expect(await BUSD.balanceOf(deployer.address)).to.be.greaterThan(
//       startingBalanceOwner
//     );
//   });
//   it("Allows whitelisted to buy", async function () {
//     expect(await vestingContract.whitelListSpots()).to.equal(10);
//     await vestingContract.addWhiteListed(account9.address);
//     expect(await vestingContract.whiteListed(account9.address)).to.be.true;

//     await vestingContract.connect(account9).buyPresaleSlot();
//     // Expect white list spots to reduce by 1
//     expect(await vestingContract.whitelListSpots()).to.equal(9);
//   });
// });
