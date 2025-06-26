 // app.js  –  front-end logika za NFTNAFAKA

/* 1)  Preuzimamo vrijednosti koje smo već stavili u globalni scope */
const contractAddress = window.NFT_ADDRESS;   // = "0x27A0689189670477E7A8164692B7C2682351CaCE"
const contractABI     = window.NFT_ABI;

/* 2)  Pomoćne konstante */
const BSC_MAINNET_ID  = "0x070Fa3c5fd21bBA4dD1e5a34Eeba7aBa0944836C";              // Chain ID 56 u heksadecimalnom formatu
const FIXED_PRICE_BNB = "0.05";              // fallback ako iz ugovora ne pročitamo cijenu

let web3;
let nftContract;

/* 3)  Provjera da je MetaMask na BSC-u */
async function switchToBSC() {
  const current = await window.ethereum.request({ method: "eth_chainId" });
  if (current !== BSC_MAINNET_ID) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BSC_MAINNET_ID }]
      });
    } catch (switchErr) {
      alert("Prebaci MetaMask na BNB Smart Chain (Mainnet) pa pokušaj opet.");
      throw switchErr;
    }
  }
}

/* 4)  Povezivanje walleta */
async function connectWallet() {
  if (!window.ethereum) {
    alert("⚠️  Trebaš instalirati MetaMask!");
    return;
  }

  await switchToBSC();                       // osiguramo mrežu

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    document.getElementById("wallet-address").innerText = "Novčanik: " + accounts[0];
    web3        = new Web3(window.ethereum);
    nftContract = new web3.eth.Contract(contractABI, contractAddress);
  } catch (err) {
    console.error(err);
    alert("Greška pri povezivanju walleta.");
  }
}

/* 5)  Mintanje NFT-a */
async function mintNFT() {
  if (!nftContract) {
    alert("Prvo spoji MetaMask! 🔗");
    return;
  }

  const amount    = parseInt(document.getElementById("mint-amount").value || "0");
  if (amount <= 0) {
    alert("Unesi valjan broj NFT-ova za mintanje.");
    return;
  }

  /* --- dohvat cijene iz ugovora (ako je dostupna) --- */
  let unitPriceWei;
  try {
    const price = await nftContract.methods.MINT_PRICE_BNB().call();
    unitPriceWei = price.toString();
  } catch (_) {
    // fallback na fiksnih 0.05 BNB
    unitPriceWei = web3.utils.toWei(FIXED_PRICE_BNB, "ether");
  }

  /* --- ukupni trošak --- */
  const totalCostWei = web3.utils.toBN(unitPriceWei).mul(web3.utils.toBN(amount));

  try {
    const accounts = await web3.eth.getAccounts();
    await nftContract.methods.mint(amount).send({
      from:  accounts[0],
      value: totalCostWei
    });
    alert("✅ Mintanje uspješno!");
  } catch (err) {
    console.error(err);
    alert("❌ Mintanje nije uspjelo. Pogledaj konzolu za detalje.");
  }
}

/* 6)  Dodjela event-handlera kad se stranica učita */
window.addEventListener("load", () => {
  document.getElementById("connect-button").onclick = connectWallet;
  document.getElementById("mint-button").onclick    = mintNFT;
});
