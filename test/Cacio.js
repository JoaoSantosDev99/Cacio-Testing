const { expect } = require("chai");

describe("Cacio Instance", function () {
  let Cacio;
  let deployer, account1, account2, account3, account4, account5;

  beforeEach(async function () {
    [deployer, account1, account2, account3, account4, account5] =
      await ethers.getSigners();

    const cacio = await ethers.getContractFactory("Cacio");
    Cacio = await cacio.deploy();
  });

  describe("It deployes the contract correctly", function () {
    // it("Ownership to deployer", async function () {
    //   expect(await Cacio.owner()).to.equal(deployer.address);
    // });
    // it("Excludes owner from fees", async function () {
    //   const owner = await Cacio.owner();
    //   expect(await Cacio._isExcludedFromFee(owner)).to.be.true;
    // });
    // it("Excludes the contract from fees", async function () {
    //   expect(await Cacio._isExcludedFromFee(Cacio.address)).to.be.true;
    // });
    // it("Excludes owner from max wallet", async function () {
    //   const owner = await Cacio.owner();
    //   expect(await Cacio._isExcludedFromMaxWallet(owner)).to.be.true;
    // });
    // it("Excludes owner from max wallet", async function () {
    //   const uniPar = await Cacio.uniswapV2Pair();
    //   expect(await Cacio._isExcludedFromMaxWallet(uniPar)).to.be.true;
    // });
    // it("Tranfer all funds to owner", async function () {
    //   const owner = await Cacio.owner();
    //   const total = await Cacio._rTotal();
    //   expect(await Cacio._rOwned(owner)).to.equal(total);
    // });
    // it("Sets the router", async function () {
    //   const routerAdd = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    //   expect(await Cacio.uniswapV2Router()).to.equal(routerAdd);
    // });
    // it("Creates the uniswap pair", async function () {
    //   const uniPair = await Cacio.uniswapV2Pair();
    //   expect(ethers.utils.isAddress(uniPair)).to.be.true;
    // });
  });

  describe("Rewards mechanism", function () {
    // it("Everybody included by default", async function () {
    //   expect(await Cacio._isExcluded(account1.address)).to.be.false;
    // });
    // it("Excludes a wallet from rewards", async function () {
    //   expect(await Cacio._isExcluded(account1.address)).to.be.false;
    //   await Cacio.excludeFromReward(account1.address);
    //   expect(await Cacio._isExcluded(account1.address)).to.be.true;
    // });
    // it("Cant exclude twice", async function () {
    //   expect(await Cacio._isExcluded(account1.address)).to.be.false;
    //   await Cacio.excludeFromReward(account1.address);
    //   expect(await Cacio._isExcluded(account1.address)).to.be.true;
    //   await expect(
    //     Cacio.excludeFromReward(account1.address)
    //   ).to.be.revertedWith("Account is already excluded");
    // });
  });

  describe("Adds liquidity", function () {
    beforeEach(async function () {
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
        Cacio.address,
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

      expect(await Cacio.balanceOf(deployer.address)).to.equal(
        toWei(3000000000)
      );
    });
  });

  // describe("Sets owner data", function () {
  //   const description = "descriptions text";
  //   const website = "vercel.com";
  //   const email = "vitalik@eth.com";
  //   const avatar = "Green Gobblin";
  //   let ownerData;

  //   beforeEach(async function () {
  //     await Registrar.setOwnerData(description, website, email, avatar);
  //     ownerData = await Registrar.ownerInfo();
  //   });

  //   it("Reverts if the caller is not the owner", async function () {
  //     await expect(
  //       Registrar.connect(account1).setOwnerData(
  //         description,
  //         website,
  //         email,
  //         avatar
  //       )
  //     ).to.be.revertedWith("Ownable: caller is not the owner");
  //   });

  //   it("Sets description", async function () {
  //     expect(ownerData.description).to.equal(description);
  //   });
  //   it("Sets website", async function () {
  //     expect(ownerData.website).to.equal(website);
  //   });
  //   it("Sets email", async function () {
  //     expect(ownerData.email).to.equal(email);
  //   });
  //   it("Sets avatar", async function () {
  //     expect(ownerData.avatar).to.equal(avatar);
  //   });
  // });

  // describe("Change Subdomain Data", function () {
  //   const ownerSubDomain = "ownersDomain";
  //   const userSubDomain = "userDomain";

  //   const subdomain = {
  //     description: "descriptions text",
  //     website: "vercel.com",
  //     email: "vitalik@eth.com",
  //     avatar: "Green Gobblin",
  //   };

  //   const control = {
  //     description: "Eths Backbone",
  //     website: "youtube.com",
  //     email: "gavinwood@eth.com",
  //     avatar: "Bright Cat",
  //   };

  //   beforeEach(async function () {
  //     await Registrar.setNewSubdomain();
  //   });
  // });

  // describe("Transfering a subdomain", function () {
  //   const subDomainA = "subdomain-a";
  //   const subDomainB = "subdomain-b";
  //   const subDomainC = "subdomain-c";

  //   beforeEach(async function () {
  //     await Registrar.setNewSubdomain(subDomainA);
  //     await Registrar.setNewSubdomain(subDomainB);
  //   });

  //   it("Reverts if domain doesn't exist", async function () {
  //     const target = account3.address;
  //     await expect(
  //       Registrar.transferSubDomain(subDomainC, target)
  //     ).to.be.revertedWith("You are not the owner of this sub-domain");
  //   });

  //   it("Transfers the domain to another account", async function () {
  //     const target = account1.address;
  //     await Registrar.transferSubDomain(subDomainA, target);
  //     const transferedSubdomain = await Registrar.subDomainData(subDomainA);

  //     expect(transferedSubdomain.owner).to.equal(target);
  //   });

  //   it("Not trasnfered domains stay with the owner", async function () {
  //     const notTransferedSubdomain = await Registrar.subDomainData(subDomainB);
  //     expect(notTransferedSubdomain.owner).to.equal(deployer.address);
  //   });

  //   it("Owner cannot transfer a subdomain that is no longer his", async function () {
  //     const target = account2.address;
  //     await Registrar.transferSubDomain(subDomainA, target);

  //     await expect(
  //       Registrar.transferSubDomain(subDomainA, target)
  //     ).to.be.revertedWith("You are not the owner of this sub-domain");
  //   });

  //   it("Reverts if new owner already has a subdomain", async function () {
  //     const target = account1.address;
  //     await Registrar.transferSubDomain(subDomainA, target);

  //     await expect(
  //       Registrar.transferSubDomain(subDomainB, target)
  //     ).to.be.revertedWith("This address already have a subdomain!");
  //   });

  //   it("New owner have a domain", async function () {
  //     const target = account1.address;
  //     await Registrar.transferSubDomain(subDomainA, target);
  //     const transferedSubdomain = await Registrar.subDomainData(subDomainA);
  //     expect(transferedSubdomain.owner).to.be.equal(target);
  //   });

  //   it("New owner can transfer", async function () {
  //     const targetSigner = account1;
  //     const targetAddress = account1.address;
  //     const secondOwner = account2.address;

  //     await Registrar.transferSubDomain(subDomainA, targetAddress);

  //     const unTransferedSubdomain = await Registrar.subDomainData(subDomainA);
  //     expect(unTransferedSubdomain.owner).to.be.equal(targetAddress);

  //     await Registrar.connect(targetSigner).transferSubDomain(
  //       subDomainA,
  //       secondOwner
  //     );
  //     const transferedSubdomain = await Registrar.subDomainData(subDomainA);
  //     expect(transferedSubdomain.owner).to.be.equal(secondOwner);
  //   });

  //   it("Transfer resets data", async function () {
  //     const subdomain = {
  //       description: "descriptions text",
  //       website: "vercel.com",
  //       email: "vitalik@eth.com",
  //       avatar: "Green Gobblin",
  //     };

  //     const targetSigner = account1;
  //     const targetAddress = account1.address;
  //     const secondOwner = account2.address;

  //     await Registrar.transferSubDomain(subDomainA, targetAddress);

  //     await Registrar.connect(targetSigner).changeSubDomainData(
  //       subDomainA,
  //       subdomain.description,
  //       subdomain.website,
  //       subdomain.email,
  //       subdomain.avatar
  //     );

  //     const unTransfSubdom = await Registrar.subDomainData(subDomainA);

  //     expect(unTransfSubdom.owner).to.be.equal(targetAddress);
  //     expect(unTransfSubdom.description).to.be.equal(subdomain.description);
  //     expect(unTransfSubdom.website).to.be.equal(subdomain.website);
  //     expect(unTransfSubdom.email).to.be.equal(subdomain.email);
  //     expect(unTransfSubdom.avatar).to.be.equal(subdomain.avatar);

  //     expect(await Registrar.hasSubDomain(targetAddress)).to.be.true;
  //     expect(await Registrar.hasSubDomain(secondOwner)).to.be.false;

  //     await Registrar.connect(targetSigner).transferSubDomain(
  //       subDomainA,
  //       secondOwner
  //     );

  //     const transferedSubdomain = await Registrar.subDomainData(subDomainA);

  //     expect(transferedSubdomain.owner).to.be.equal(secondOwner);
  //     expect(transferedSubdomain.description).to.be.equal("");
  //     expect(transferedSubdomain.website).to.be.equal("");
  //     expect(transferedSubdomain.email).to.be.equal("");
  //     expect(transferedSubdomain.avatar).to.be.equal("");

  //     expect(await Registrar.hasSubDomain(targetAddress)).to.be.false;
  //     expect(await Registrar.hasSubDomain(secondOwner)).to.be.true;
  //   });

  //   it("Transfer back to owner deactivates", async function () {
  //     const subdomain = {
  //       description: "descriptions text",
  //       website: "vercel.com",
  //       email: "vitalik@eth.com",
  //       avatar: "Green Gobblin",
  //     };

  //     const targetSigner = account1;
  //     const targetAddress = account1.address;
  //     const owner = deployer.address;

  //     await Registrar.transferSubDomain(subDomainA, targetAddress);

  //     await Registrar.connect(targetSigner).changeSubDomainData(
  //       subDomainA,
  //       subdomain.description,
  //       subdomain.website,
  //       subdomain.email,
  //       subdomain.avatar
  //     );

  //     const unTransfSubdom = await Registrar.subDomainData(subDomainA);

  //     expect(unTransfSubdom.owner).to.be.equal(targetAddress);
  //     expect(unTransfSubdom.description).to.be.equal(subdomain.description);
  //     expect(unTransfSubdom.website).to.be.equal(subdomain.website);
  //     expect(unTransfSubdom.email).to.be.equal(subdomain.email);
  //     expect(unTransfSubdom.avatar).to.be.equal(subdomain.avatar);

  //     expect(await Registrar.hasSubDomain(targetAddress)).to.be.true;
  //     expect(await Registrar.isDomainActive(subDomainA)).to.be.true;

  //     await Registrar.connect(targetSigner).transferSubDomain(
  //       subDomainA,
  //       owner
  //     );

  //     const transferedSubdomain = await Registrar.subDomainData(subDomainA);

  //     expect(transferedSubdomain.owner).to.be.equal(owner);
  //     expect(transferedSubdomain.description).to.be.equal("");
  //     expect(transferedSubdomain.website).to.be.equal("");
  //     expect(transferedSubdomain.email).to.be.equal("");
  //     expect(transferedSubdomain.avatar).to.be.equal("");

  //     expect(await Registrar.hasSubDomain(targetAddress)).to.be.false;
  //     expect(await Registrar.isDomainActive(subDomainA)).to.be.false;
  //   });

  //   it("Reactivates a subdomain when the owner sends again", async function () {
  //     const subdomain = {};

  //     const targetSigner = account1;
  //     const targetAddress = account1.address;
  //     const owner = deployer.address;

  //     await Registrar.transferSubDomain(subDomainA, targetAddress);

  //     expect(await Registrar.hasSubDomain(targetAddress)).to.be.true;
  //     expect(await Registrar.isDomainActive(subDomainA)).to.be.true;

  //     await Registrar.connect(targetSigner).transferSubDomain(
  //       subDomainA,
  //       owner
  //     );

  //     expect(await Registrar.hasSubDomain(targetAddress)).to.be.false;
  //     expect(await Registrar.isDomainActive(subDomainA)).to.be.false;

  //     await Registrar.transferSubDomain(subDomainA, account2.address);

  //     expect(await Registrar.hasSubDomain(account2.address)).to.be.true;
  //     expect(await Registrar.isDomainActive(subDomainA)).to.be.true;
  //   });
  // });

  // describe("Subdomain Deletion", function () {
  //   const subDomainA = "subdomain-a";
  //   const subDomainB = "subdomain-b";
  //   const subDomainC = "subdomain-c";

  //   beforeEach(async function () {
  //     await Registrar.setNewSubdomain(subDomainA);
  //     await Registrar.setNewSubdomain(subDomainB);
  //   });

  //   it("New owner can delete", async function () {
  //     const targetSigner = account1;
  //     const targetAddress = account1.address;

  //     expect(await Registrar.hasSubDomain(targetAddress)).to.be.false;

  //     await Registrar.transferSubDomain(subDomainA, targetAddress);

  //     expect(await Registrar.hasSubDomain(targetAddress)).to.be.true;

  //     await Registrar.connect(targetSigner).deleteSubDomain(subDomainA);

  //     expect(await Registrar.hasSubDomain(targetAddress)).to.be.false;
  //     expect(await Registrar.isDomainActive(subDomainA)).to.be.false;
  //   });

  //   it("Parent domain owner can't delete once transfered", async function () {
  //     const targetSigner = account1;
  //     const targetAddress = account1.address;

  //     expect(await Registrar.hasSubDomain(targetAddress)).to.be.false;

  //     await Registrar.transferSubDomain(subDomainA, targetAddress);

  //     expect(await Registrar.hasSubDomain(targetAddress)).to.be.true;

  //     await expect(Registrar.deleteSubDomain(subDomainA)).to.be.revertedWith(
  //       "You are not the owner of this sub-domain"
  //     );

  //     expect(await Registrar.hasSubDomain(targetAddress)).to.be.true;
  //     expect(await Registrar.isDomainActive(subDomainA)).to.be.true;
  //   });
  // });
});
