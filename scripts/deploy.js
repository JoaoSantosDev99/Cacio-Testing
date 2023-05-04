const hre = require("hardhat");

async function main() {
  const cacio = await ethers.getContractFactory("TEST");
  const Cacio = await cacio.deploy();

  await Cacio.deployed();
  console.log("Cacio deployed at: ", Cacio.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
