(() => {
  const CONTRACT_ADDRESS = '0xb0e74D202d0190589D3dFBd9bE856BD4A2FB644D';
  const BASE_CHAIN_ID = 8453;
  const BASE_CHAIN_HEX = '0x2105';
  const BASE_RPC = 'https://mainnet.base.org';
  const MAX_QTY = 20;
  const DEFAULT_MINT_PRICE_ETH = 0.0085;
  const MAX_SUPPLY = 444;

  const ABI = [
    'function mint(uint256 quantity) external payable',
    'function totalSupply() external view returns (uint256)',
    'function MAX_SUPPLY() external view returns (uint256)',
    'function mintActive() external view returns (bool)',
    'function price() external view returns (uint256)',
    'function mintPrice() external view returns (uint256)',
    'function salePrice() external view returns (uint256)'
  ];

  let provider = null;
  let signer = null;
  let contract = null;
  let qty = 1;
  let mintPriceEth = DEFAULT_MINT_PRICE_ETH;

  function getElements() {
    return {
      actionBtn: document.getElementById('mint-action-btn'),
      qtyNum: document.getElementById('mint-qty'),
      totalText: document.getElementById('mint-total'),
      priceText: document.getElementById('mint-price'),
      priceUsd: document.getElementById('mint-price-usd'),
      status: document.getElementById('mint-status'),
      networkWarning: document.getElementById('network-warning'),
      mintedLabel: document.getElementById('minted-label'),
      remainingLabel: document.getElementById('remaining-label'),
      progressFill: document.getElementById('mint-progress-fill'),
      minusBtn: document.getElementById('mint-qty-minus'),
      plusBtn: document.getElementById('mint-qty-plus')
    };
  }

  // ---- Launch countdown logic (inserted) ----
  const LAUNCH_TS = Date.UTC(2026, 6, 30, 0, 0, 0); // July 30, 2026 00:00:00 UTC

  function el(id) { return document.getElementById(id); }

  function revealMintUI() {
    const cd = document.getElementById('mint-countdown');
    const mp = document.querySelector('.mint-panel');
    const els = getElements();
    if (cd) {
      cd.classList.add('hidden');
      cd.setAttribute('aria-hidden','true');
    }
    if (mp) {
      mp.classList.remove('hidden');
      mp.setAttribute('aria-hidden','false');
      mp.style.transition = 'opacity .6s, transform .6s';
      mp.style.opacity = 1;
      mp.style.transform = 'translateY(0)';
    }
    if (els.actionBtn) {
      els.actionBtn.disabled = false;
      els.actionBtn.classList.remove('mint-action-disabled');
      els.actionBtn.setAttribute('aria-hidden','false');
    }
    // Reveal footer links if present
    const footerLinks = document.getElementById('mint-footer-links');
    if (footerLinks) {
      footerLinks.classList.remove('hidden');
      footerLinks.setAttribute('aria-hidden','false');
    }
    try { refreshSupply(); } catch (e) { }
  }

  function showLaunchLiveThenReveal() {
    const cdInner = document.querySelector('#mint-countdown .lc-inner');
    if (!cdInner) { revealMintUI(); return; }
    const liveEl = document.createElement('div');
    liveEl.className = 'launch-live show';
    liveEl.textContent = '🚀 SQUEAKS GENESIS IS LIVE';
    cdInner.style.display = 'flex';
    cdInner.style.alignItems = 'center';
    cdInner.style.justifyContent = 'center';
    cdInner.innerHTML = '';
    cdInner.appendChild(liveEl);
    setTimeout(() => { revealMintUI(); }, 2000);
  }

  function initLaunchCountdown() {
    const cd = document.getElementById('mint-countdown');
    const mp = document.querySelector('.mint-panel');
    const els = getElements();
    if (!cd || !mp || !els.actionBtn) return;

    const now = Date.now();
    if (now >= LAUNCH_TS) {
      cd.classList.add('hidden'); cd.setAttribute('aria-hidden','true');
      mp.classList.remove('hidden'); mp.setAttribute('aria-hidden','false');
      els.actionBtn.disabled = false; els.actionBtn.classList.remove('mint-action-disabled');
      const footerLinks = document.getElementById('mint-footer-links'); if (footerLinks) footerLinks.classList.remove('hidden');
      return;
    }

    mp.classList.add('hidden'); mp.setAttribute('aria-hidden','true');
    cd.classList.remove('hidden'); cd.setAttribute('aria-hidden','false');
    els.actionBtn.disabled = true; els.actionBtn.classList.add('mint-action-disabled'); els.actionBtn.setAttribute('aria-hidden','true');

    // Hide the footer links until reveal
    const footerLinks = document.getElementById('mint-footer-links'); if (footerLinks) { footerLinks.classList.add('hidden'); footerLinks.setAttribute('aria-hidden','true'); }

    const daysEl = el('lc-days'); const hoursEl = el('lc-hours'); const minsEl = el('lc-minutes'); const secsEl = el('lc-seconds');
    let tickInterval = null;

    function updateTick() {
      const now = Date.now(); const diff = LAUNCH_TS - now;
      if (diff <= 0) { clearInterval(tickInterval); showLaunchLiveThenReveal(); return; }
      const totalSec = Math.floor(diff / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      if (daysEl) daysEl.textContent = String(days).padStart(2,'0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2,'0');
      if (minsEl) minsEl.textContent = String(minutes).padStart(2,'0');
      if (secsEl) secsEl.textContent = String(seconds).padStart(2,'0');
      if (totalSec <= 10) {
        cd.classList.add('final-seconds');
        if (daysEl) daysEl.parentElement.style.display = 'none';
        if (hoursEl) hoursEl.parentElement.style.display = 'none';
        if (minsEl) minsEl.parentElement.style.display = 'none';
        if (secsEl) { secsEl.parentElement.style.display = 'block'; secsEl.textContent = String(seconds); }
      }
    }

    updateTick(); tickInterval = setInterval(updateTick, 1000);
  }

  function setStatus(message, type) {
    const els = getElements();
    if (!els.status) return;
    els.status.textContent = message || '';
    els.status.className = 'mint-status' + (type ? ` ${type}` : '');
  }

  function updateQtyUI() {
    const els = getElements();
    if (!els.qtyNum || !els.totalText || !els.priceText) return;

    els.qtyNum.textContent = qty;
    els.minusBtn.disabled = qty <= 1;
    els.plusBtn.disabled = qty >= MAX_QTY;

    const total = (mintPriceEth * qty).toFixed(4);
    els.totalText.textContent = `${total} ETH`;
    els.priceText.textContent = `${mintPriceEth.toFixed(4)} ETH`;
    els.priceUsd.textContent = `(~$${(mintPriceEth * 1760).toFixed(0)})`;

    if (contract && els.actionBtn) {
      els.actionBtn.textContent = `Mint ${qty} for ${total} ETH`;
    }
  }

  function showNetworkWarning(show) {
    const els = getElements();
    if (!els.networkWarning) return;
    els.networkWarning.classList.toggle('show', show);
  }

  function updateProgress(minted, maxSupplyValue) {
    const els = getElements();
    if (!els.mintedLabel || !els.remainingLabel || !els.progressFill) return;
    const safeMax = Number(maxSupplyValue || MAX_SUPPLY);
    const safeMinted = Math.max(0, Math.min(Number(minted || 0), safeMax));
    const remaining = Math.max(0, safeMax - safeMinted);
    const pct = Math.min((safeMinted / safeMax) * 100, 100);

    els.mintedLabel.textContent = `${safeMinted.toLocaleString()} minted`;
    els.remainingLabel.textContent = `${remaining.toLocaleString()} remaining`;
    els.progressFill.style.width = `${pct}%`;
  }

  function getReadProvider() {
    if (window.ethereum) {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
    return new ethers.providers.JsonRpcProvider(BASE_RPC);
  }

  async function readContractPrice(readContract) {
    const candidates = ['price', 'mintPrice', 'salePrice'];
    for (const name of candidates) {
      try {
        const value = await readContract[name]();
        if (value) {
          const formatted = Number(ethers.utils.formatEther(value));
          if (!Number.isNaN(formatted) && formatted > 0) return formatted;
        }
      } catch (error) {
        // Keep trying the next candidate.
      }
    }
    return DEFAULT_MINT_PRICE_ETH;
  }

  async function refreshSupply() {
    try {
      const readProvider = getReadProvider();
      const readContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, readProvider);
      const [supply, max, mintActive] = await Promise.all([
        readContract.totalSupply().catch(() => 0),
        readContract.MAX_SUPPLY().catch(() => MAX_SUPPLY),
        readContract.mintActive().catch(() => true)
      ]);

      const supplyNumber = Number(supply?.toString?.() || supply || 0);
      const maxNumber = Number(max?.toString?.() || max || MAX_SUPPLY);
      const priceValue = await readContractPrice(readContract);
      mintPriceEth = priceValue || DEFAULT_MINT_PRICE_ETH;
      updateQtyUI();
      updateProgress(supplyNumber, maxNumber);
      if (!mintActive) {
        setStatus('Minting is currently inactive.', 'error');
      }
    } catch (error) {
      mintPriceEth = DEFAULT_MINT_PRICE_ETH;
      updateQtyUI();
      updateProgress(0, MAX_SUPPLY);
    }
  }

  async function checkNetwork() {
    if (!window.ethereum) return false;
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainIdHex, 16);
    const isBase = chainId === BASE_CHAIN_ID;
    showNetworkWarning(!isBase);
    return isBase;
  }

  async function switchToBase() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_CHAIN_HEX }]
      });
    } catch (error) {
      if (error?.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: BASE_CHAIN_HEX,
            chainName: 'Base',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: [BASE_RPC],
            blockExplorerUrls: ['https://basescan.org']
          }]
        });
      } else {
        throw error;
      }
    }
  }

  async function connectWallet() {
    const els = getElements();
    if (!window.ethereum) {
      setStatus('No wallet detected. Install MetaMask or a browser wallet.', 'error');
      return;
    }

    try {
      setStatus('Connecting wallet...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts?.[0];
      if (!address) throw new Error('No account selected.');

      let onBase = await checkNetwork();
      if (!onBase) {
        setStatus('Switching to Base...');
        await switchToBase();
        onBase = await checkNetwork();
      }

      if (!onBase) {
        setStatus('Please switch your wallet to Base Mainnet.', 'error');
        return;
      }

      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
      if (els.actionBtn) {
        els.actionBtn.textContent = `Mint ${qty} for ${(mintPriceEth * qty).toFixed(4)} ETH`;
      }
      setStatus(`Connected: ${shortAddress}`, 'success');
      await refreshSupply();
    } catch (error) {
      setStatus(error?.message || 'Connection failed.', 'error');
    }
  }

  async function doMint() {
    if (!contract) {
      await connectWallet();
      return;
    }

    try {
      const onBase = await checkNetwork();
      if (!onBase) {
        setStatus('Please switch to Base network first.', 'error');
        return;
      }

      const value = ethers.utils.parseEther((mintPriceEth * qty).toFixed(6));
      const els = getElements();
      if (els.actionBtn) {
        els.actionBtn.disabled = true;
      }
      setStatus(`Confirming ${qty} mint${qty > 1 ? 's' : ''} in your wallet...`);

      const tx = await contract.mint(qty, { value });
      setStatus('Minting… waiting for confirmation.');
      await tx.wait();
      setStatus('Minted successfully! Check your wallet and explorer.', 'success');
      await refreshSupply();
    } catch (error) {
      setStatus(error?.reason || error?.message || 'Mint failed.', 'error');
    } finally {
      const els = getElements();
      if (els.actionBtn) {
        els.actionBtn.disabled = false;
      }
      updateQtyUI();
    }
  }

  function bindEvents() {
    const els = getElements();
    if (!els.actionBtn) return;

    els.minusBtn?.addEventListener('click', () => {
      if (qty > 1) {
        qty -= 1;
        updateQtyUI();
      }
    });

    els.plusBtn?.addEventListener('click', () => {
      if (qty < MAX_QTY) {
        qty += 1;
        updateQtyUI();
      }
    });

    els.actionBtn.addEventListener('click', async () => {
      if (!contract) {
        await connectWallet();
      } else {
        await doMint();
      }
    });
  }

  function initialize() {
    const els = getElements();
    if (!els.actionBtn) return;

    bindEvents();
    updateQtyUI();
    refreshSupply();

    try { initLaunchCountdown(); } catch (e) { /* ignore if countdown not present */ }

    if (window.ethereum?.on) {
      window.ethereum.on('chainChanged', () => {
        checkNetwork();
        refreshSupply();
      });
      window.ethereum.on('accountsChanged', () => {
        provider = null;
        signer = null;
        contract = null;
        setStatus('Wallet disconnected. Connect again to mint.', 'error');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  window.SqueaksMint = {
    connectWallet,
    doMint,
    refreshSupply,
    initialize
  };
})();
