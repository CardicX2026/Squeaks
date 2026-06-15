// ══════════════════════════════
// SUPABASE
// ══════════════════════════════
const { createClient } = supabase;
const sb = createClient(
  'https://jhyaknksgeitcxbewuft.supabase.co',
  'sb_publishable_A8qb2SHtcII7_yZ9kR3Ycw_fccJmHur'
);

// ══════════════════════════════
// THEME
// ══════════════════════════════
function initTheme() {
  const saved = localStorage.getItem('sq-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('sq-theme', next);
  updateThemeBtn(next);
}
function updateThemeBtn(theme) {
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.innerHTML = theme === 'dark'
      ? '<span class="theme-icon">☀️</span> Light'
      : '<span class="theme-icon">🌙</span> Dark';
  });
}

// ══════════════════════════════
// ROUTER
// ══════════════════════════════
function navigate(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => a.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) {
    page.classList.add('active');
    document.querySelectorAll(`[data-page="${id}"]`).forEach(a => a.classList.add('active'));
    window.scrollTo(0, 0);
  }
  closeMobileMenu();
  const fab = document.getElementById('cart-fab');
  if (fab) fab.style.display = id === 'merch' ? 'flex' : 'none';
  if (id === 'nft') setTimeout(initFloatingNFTs, 120);
  if (id === 'community') setTimeout(initCountUps, 300);
  if (id === 'cheese-hub') { if (!priceData.length) fetchPrices(); else { renderTicker(); renderMarketCards(); } }
}
document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.page); });
});
function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('open'); }
function closeMobileMenu() { document.getElementById('mobile-menu')?.classList.remove('open'); }

// ══════════════════════════════
// AUTH
// ══════════════════════════════
let currentUser = null, userProfile = null;

async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) await onLogin(session.user);
  sb.auth.onAuthStateChange(async (_e, session) => {
    if (session) await onLogin(session.user);
    else onLogout();
  });
}

async function onLogin(user) {
  currentUser = user;
  let { data } = await sb.from('profiles').select('*').eq('id', user.id).single();
  if (!data) {
    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'squeaker';
    const { data: created } = await sb.from('profiles').insert({ id: user.id, username, xp: 0, level: 1 }).select().single();
    data = created;
  }
  userProfile = data;
  renderNavUser();
  await claimDailyLogin();
  await loadDashboard();
}

function onLogout() { currentUser = null; userProfile = null; renderNavUser(); }

function renderNavUser() {
  const el = document.getElementById('nav-user-area');
  if (!el) return;
  if (currentUser) {
    const uname = userProfile?.username || currentUser.email?.split('@')[0] || '?';
    const avatarSrc = userProfile?.avatar_url;
    el.innerHTML = `
      <div class="nav-user" onclick="navigate('dashboard')">
        <div class="nav-avatar" style="background:var(--accent)">${avatarSrc ? `<img src="${avatarSrc}" alt="av"/>` : uname[0].toUpperCase()}</div>
        <span>${uname}</span>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="logOut()">Out</button>`;
  } else {
    el.innerHTML = `
      <a href="#" class="btn btn-outline btn-sm" onclick="navigate('auth');return false;">Log In</a>
      <a href="#" class="btn btn-primary btn-sm" onclick="navigate('auth');return false;">Sign Up</a>`;
  }
  const mob = document.getElementById('mob-auth-area');
  if (mob) {
    if (currentUser) {
      const uname = userProfile?.username || currentUser.email?.split('@')[0] || '?';
      mob.innerHTML = `<button class="btn btn-outline btn-sm" onclick="navigate('dashboard')">Dashboard</button><button class="btn btn-ghost btn-sm" onclick="logOut()">Log Out</button>`;
    } else {
      mob.innerHTML = `<a href="#" class="btn btn-outline btn-sm" onclick="navigate('auth');return false;">Log In</a><a href="#" class="btn btn-primary btn-sm" onclick="navigate('auth');return false;">Sign Up</a>`;
    }
  }
}

async function signUp() {
  const username = document.getElementById('su-username')?.value?.trim();
  const email = document.getElementById('su-email')?.value?.trim();
  const password = document.getElementById('su-password')?.value;
  if (!username || !email || !password) return showToast('⚠️ Fill all fields');
  const { error } = await sb.auth.signUp({ email, password, options: { data: { username } } });
  if (error) showToast('❌ ' + error.message);
  else showToast('✅ Account created! Check your email.');
}
async function logIn() {
  const email = document.getElementById('li-email')?.value?.trim();
  const password = document.getElementById('li-password')?.value;
  if (!email || !password) return showToast('⚠️ Fill all fields');
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) showToast('❌ ' + error.message);
  else { showToast('✅ Welcome back!'); navigate('dashboard'); }
}
async function logOut() { await sb.auth.signOut(); showToast('👋 Logged out'); navigate('home'); }

// ══════════════════════════════
// XP
// ══════════════════════════════
const XP_ACTIONS = { daily_login:10, join_event:150, win_game:75, play_game:15, place_order:60, vote:30, own_nft:80, refer_friend:120, complete_profile:40, submit_cx_username:25 };
const LEVELS = [
  {level:1,name:'Squeaker',min:0,max:299},{level:2,name:'Rat Pack',min:300,max:999},
  {level:3,name:'Cheese Chaser',min:1000,max:2499},{level:4,name:'Degen',min:2500,max:5999},
  {level:5,name:'Diamond Degen',min:6000,max:12999},{level:6,name:'Golden Degen',min:13000,max:27999},
  {level:7,name:'Certified Degen',min:28000,max:Infinity}
];
const LEVEL_PERKS = { 1:[],2:['5% merch discount'],3:['10% merch discount','NFT whitelist'],4:['15% merch discount','Exclusive game modes'],5:['20% merch discount','Monthly $SQKS airdrop'],6:['25% merch discount','Early access'],7:['30% merch discount','Certified Degen badge','Direct team access'] };
function getLevel(xp) { return LEVELS.slice().reverse().find(l => xp >= l.min) || LEVELS[0]; }

async function awardXP(action, metadata={}) {
  if (!currentUser) return;
  const amount = XP_ACTIONS[action]; if (!amount) return;
  try {
    await sb.from('xp_transactions').insert({ user_id:currentUser.id, action, xp_earned:amount, metadata });
    const newXP = (userProfile?.xp||0) + amount;
    const newLevel = getLevel(newXP).level;
    await sb.from('profiles').upsert({ id:currentUser.id, xp:newXP, level:newLevel }, { onConflict:'id' });
    userProfile = { ...userProfile, xp:newXP, level:newLevel };
    renderXPBar(); showToast(`+${amount} XP — ${action.replace(/_/g,' ')}`);
  } catch(e) { console.error(e); }
}

async function claimDailyLogin() {
  if (!currentUser) return;
  try {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await sb.from('daily_logins').insert({ user_id:currentUser.id, login_date:today });
    if (!error) await awardXP('daily_login');
  } catch(e) {}
}

function renderXPBar() {
  ['xp-bar-section','xp-bar-section-2'].forEach(id => {
    const el = document.getElementById(id); if (!el || !userProfile) return;
    const xp = userProfile.xp||0, lvl = getLevel(xp);
    const next = LEVELS.find(l => l.level === lvl.level+1);
    const pct = next ? Math.min(100,((xp-lvl.min)/(lvl.max-lvl.min))*100) : 100;
    const perks = LEVEL_PERKS[lvl.level]||[];
    el.innerHTML = `<div class="xp-bar-wrap">
      <div class="xp-level-row"><span class="xp-level-badge">Lv.${lvl.level} — ${lvl.name}</span><span class="xp-amount">${xp.toLocaleString()} XP</span></div>
      <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${pct}%"></div></div>
      <div class="xp-next">${next ? `${(lvl.max-xp+1).toLocaleString()} XP to ${next.name}` : '🏆 Max level!'}</div>
      ${perks.length ? `<div class="xp-perks">${perks.map(p=>`<span class="xp-perk">${p}</span>`).join('')}</div>` : ''}
    </div>`;
  });
}

// ══════════════════════════════
// CART
// ══════════════════════════════
let cart = [];
const cartTotal = () => cart.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2);
const cartCount = () => cart.reduce((s,i)=>s+i.qty,0);
function addToCart(product, variant='') {
  const key = product.id+'|'+variant, ex = cart.find(i=>i.key===key);
  if (ex) ex.qty++; else cart.push({key,id:product.id,name:product.name,price:product.price,img:product.img,variant,qty:1});
  updateCartBadge(); showToast('🛒 Added to cart!');
}
function removeFromCart(key) { cart=cart.filter(i=>i.key!==key); updateCartBadge(); renderCart(); }
function changeQty(key,d) {
  const i=cart.find(x=>x.key===key); if(!i) return;
  i.qty+=d; if(i.qty<=0) removeFromCart(key); else { updateCartBadge(); renderCart(); }
}
function updateCartBadge() { const el=document.getElementById('cart-count'); if(el) el.textContent=cartCount(); }
function renderCart() {
  const el=document.getElementById('cart-items'), tot=document.getElementById('cart-total-amt');
  if (!el) return;
  if (!cart.length) { el.innerHTML='<div class="cart-empty"><div style="font-size:2.5rem;margin-bottom:.5rem">🛒</div><p>Your cart is empty</p></div>'; if(tot) tot.textContent='$0.00'; return; }
  el.innerHTML=cart.map(i=>`<div class="cart-item">
    <img class="ci-img" src="${i.img}" alt="${i.name}"/>
    <div class="ci-info"><div class="ci-name">${i.name}</div>${i.variant?`<div class="ci-var">${i.variant}</div>`:''}
    <div class="qty-ctrl"><button class="qty-btn" onclick="changeQty('${i.key}',-1)">−</button><span class="qty-n">${i.qty}</span><button class="qty-btn" onclick="changeQty('${i.key}',1)">+</button></div></div>
    <div class="ci-price">$${(i.price*i.qty).toFixed(2)}</div><button class="ci-remove" onclick="removeFromCart('${i.key}')">✕</button>
  </div>`).join('');
  if(tot) tot.textContent='$'+cartTotal();
}
function openCart() { renderCart(); openModal('cart-modal'); }
function startCheckout() {
  if (!currentUser) { closeModal('cart-modal'); navigate('auth'); showToast('🔐 Login to checkout'); return; }
  closeModal('cart-modal'); renderShippingForm(); openModal('checkout-modal');
}
function renderShippingForm() {
  document.getElementById('checkout-body').innerHTML=`
    <div class="checkout-steps"><div class="c-step done"></div><div class="c-step active"></div><div class="c-step"></div></div>
    <h3 style="font-family:var(--font-head);font-size:1.4rem;margin-bottom:1.2rem">SHIPPING ADDRESS</h3>
    <div class="form-row-2">
      <div class="form-group"><label class="form-label">First Name</label><input class="form-input" id="sh-fname" placeholder="John"/></div>
      <div class="form-group"><label class="form-label">Last Name</label><input class="form-input" id="sh-lname" placeholder="Doe"/></div>
    </div>
    <div class="form-group"><label class="form-label">Address</label><input class="form-input" id="sh-addr" placeholder="123 Street"/></div>
    <div class="form-row-2">
      <div class="form-group"><label class="form-label">City</label><input class="form-input" id="sh-city" placeholder="City"/></div>
      <div class="form-group"><label class="form-label">Postal Code</label><input class="form-input" id="sh-zip" placeholder="0001"/></div>
    </div>
    <div class="form-group"><label class="form-label">Country</label><input class="form-input" id="sh-country" placeholder="South Africa"/></div>
    <div style="display:flex;gap:.8rem;margin-top:1rem">
      <button class="btn btn-primary btn-lg" style="flex:1" onclick="confirmOrder()">Place Order →</button>
      <button class="btn btn-ghost" onclick="closeModal('checkout-modal')">Cancel</button>
    </div>`;
}
async function confirmOrder() {
  const shipping = { name:(document.getElementById('sh-fname')?.value||'')+' '+(document.getElementById('sh-lname')?.value||''), address:document.getElementById('sh-addr')?.value||'', city:document.getElementById('sh-city')?.value||'', zip:document.getElementById('sh-zip')?.value||'', country:document.getElementById('sh-country')?.value||'' };
  try {
    const { error } = await sb.from('orders').insert({ user_id:currentUser.id, items:cart, total:parseFloat(cartTotal()), status:'pending', shipping_address:shipping });
    if (error) throw error;
    await awardXP('place_order'); cart=[]; updateCartBadge();
    document.getElementById('checkout-body').innerHTML=`<div style="text-align:center;padding:2rem 0"><div style="font-size:3.5rem;margin-bottom:1rem">🎉</div><h3 style="font-family:var(--font-head);font-size:2rem;margin-bottom:.5rem">ORDER PLACED!</h3><p style="color:var(--muted);font-size:.86rem">Your Squeaks gear is on its way.</p><button class="btn btn-primary btn-lg" style="margin-top:1.5rem" onclick="closeModal('checkout-modal');navigate('dashboard')">View Orders →</button></div>`;
    loadDashboard();
  } catch(e) { showToast('❌ '+e.message); }
}

// ══════════════════════════════
// PRODUCTS
// ══════════════════════════════
const PRODUCTS = [
  {id:1,name:'PUMP IT Oversized Hoodie',category:'Hoodies',img:'images/product-hoodie.png',price:59,desc:'Heavyweight super hoodie with embroidered PUMP IT design.',variants:{sizes:['S','M','L','XL'],colors:['Arona','Asphalt','Black','Moss Gray']},real:true},
  {id:2,name:'CDXLIV Oversized Tee',category:'T-shirts',img:'images/product-tshirt.png',price:39,desc:'All-over print oversized cotton t-shirt with bold CDXLIV graphic.',variants:{sizes:['XS','S','M','L'],colors:['White']},real:true},
  {id:3,name:'SQUEAKS Bucket Hat',category:'Accessories',img:'images/product-hat.png',price:27.49,desc:'Embroidered SQUEAKS bucket hat. Clean and bold.',variants:{sizes:['One Size'],colors:['Black','Navy','White']},real:true},
  {id:4,name:'SQUEAKS Hoodie V2',category:'Hoodies',img:'images/product-hoodie.png',price:null,desc:'New colourway dropping soon.',variants:{sizes:[],colors:[]},real:false},
  {id:5,name:'CDXLIV Long Sleeve',category:'T-shirts',img:'images/product-tshirt.png',price:null,desc:'Long sleeve edition. Coming soon.',variants:{sizes:[],colors:[]},real:false},
];
const SLIDER_PRODUCTS = [
  {img:'images/product-hoodie.png',name:'PUMP IT Hoodie',price:'$59'},
  {img:'images/product-tshirt.png',name:'CDXLIV Tee',price:'$39'},
  {img:'images/product-hat.png',name:'SQUEAKS Hat',price:'$27.49'},
  {img:'images/product-hoodie.png',name:'Hoodie V2',price:'Soon'},
  {img:'images/product-tshirt.png',name:'Long Sleeve',price:'Soon'},
];
let sliderIdx = 1, sliderTimer = null;
function initProductSlider() {
  const track = document.getElementById('slider-track'); if (!track) return;
  const all = [...SLIDER_PRODUCTS,...SLIDER_PRODUCTS,...SLIDER_PRODUCTS];
  track.innerHTML = all.map(p=>`<div class="block-slide side-slide" style="width:88px"><img src="${p.img}" alt="${p.name}" style="width:88px;height:88px"/></div>`).join('');
  sliderIdx = SLIDER_PRODUCTS.length; updateSlider(false);
  clearInterval(sliderTimer);
  sliderTimer = setInterval(() => { sliderIdx++; updateSlider(true); }, 2800);
}
function updateSlider(animate) {
  const track = document.getElementById('slider-track'); if (!track) return;
  track.querySelectorAll('.block-slide').forEach((s,i) => {
    s.classList.remove('center-slide','side-slide');
    s.classList.add(i===sliderIdx ? 'center-slide' : 'side-slide');
  });
  track.style.transition = animate ? 'transform .6s cubic-bezier(.4,0,.2,1)' : 'none';
  track.style.transform = `translateX(-${sliderIdx*94}px)`;
  if (sliderIdx >= SLIDER_PRODUCTS.length*2) setTimeout(() => { sliderIdx=SLIDER_PRODUCTS.length; updateSlider(false); }, 650);
}
let selectedVariants = {};
function renderProducts(filter='All') {
  const grid = document.getElementById('products-grid'); if (!grid) return;
  const items = filter==='All' ? PRODUCTS : PRODUCTS.filter(p=>p.category===filter);
  grid.innerHTML = items.map(p=>`
    <div class="card" style="cursor:pointer" onclick="${p.real?`openProductModal(${p.id})`:`showToast('Coming soon!')`}">
      <div class="product-img-wrap"><img src="${p.img}" alt="${p.name}"/>${!p.real?'<span class="product-badge badge-soon">Coming Soon</span>':'<span class="product-badge badge-new">New</span>'}</div>
      <div class="card-pad">
        <div class="product-cat">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div class="product-price">${p.price?'$'+p.price.toFixed(2):'Upcoming'}</div>
          ${p.real?`<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();quickAdd(${p.id})">+ Cart</button>`:''}
        </div>
      </div>
    </div>`).join('');
}
function quickAdd(id) {
  const p=PRODUCTS.find(x=>x.id===id); if(!p||!p.real) return;
  addToCart({id:p.id,name:p.name,price:p.price,img:p.img},p.variants.sizes[0]+' / '+p.variants.colors[0]);
}
function openProductModal(id) {
  const p=PRODUCTS.find(x=>x.id===id); if(!p) return;
  selectedVariants={size:p.variants.sizes[0]||'',color:p.variants.colors[0]||''};
  document.getElementById('pm-content').innerHTML=`
    <div class="pm-top"><img class="pm-img" src="${p.img}" alt="${p.name}"/>
      <div><div class="pm-cat">${p.category}</div><div class="pm-name">${p.name}</div><div class="pm-price">$${p.price?.toFixed(2)}</div></div></div>
    <p class="pm-desc">${p.desc}</p>
    ${p.variants.sizes.length?`<div class="variant-group"><div class="form-label">Size</div><div class="variant-opts">${p.variants.sizes.map((s,i)=>`<button class="var-btn${i===0?' sel':''}" onclick="selectVar('size','${s}',this)">${s}</button>`).join('')}</div></div>`:''}
    ${p.variants.colors.length>1?`<div class="variant-group"><div class="form-label">Color</div><div class="variant-opts">${p.variants.colors.map((c,i)=>`<button class="var-btn${i===0?' sel':''}" onclick="selectVar('color','${c}',this)">${c}</button>`).join('')}</div></div>`:''}
    <div style="display:flex;gap:.8rem;margin-top:1.2rem">
      <button class="btn btn-primary btn-lg" style="flex:1" onclick="addToCartFromModal(${p.id})">🛒 Add to Cart</button>
      <button class="btn btn-ghost" onclick="closeModal('pm-modal')">Close</button>
    </div>`;
  openModal('pm-modal');
}
function selectVar(type,val,btn) {
  selectedVariants[type]=val;
  btn.closest('.variant-opts').querySelectorAll('.var-btn').forEach(b=>b.classList.remove('sel'));
  btn.classList.add('sel');
}
function addToCartFromModal(id) {
  const p=PRODUCTS.find(x=>x.id===id);
  addToCart({id:p.id,name:p.name,price:p.price,img:p.img},[selectedVariants.size,selectedVariants.color].filter(Boolean).join(' / '));
  closeModal('pm-modal');
}

// ══════════════════════════════
// NFT CANVAS
// ══════════════════════════════
const NFT_DATA=[
  {img:'images/nft-01.jpg',name:'Chartreuse Photographer'},{img:'images/nft-02.jpg',name:'Chic Degen Boutique'},
  {img:'images/nft-03.jpg',name:'Cool Coffee Mouse'},{img:'images/nft-04.jpg',name:'Elegant Cafe Mouse'},
  {img:'images/nft-05.jpg',name:'Athlete CDXLIV'},{img:'images/nft-06.jpg',name:'Athletic Squeaks'},
  {img:'images/nft-07.jpg',name:'Coffee Glasses'},{img:'images/nft-08.jpg',name:'Hip Hop DJ'},
  {img:'images/nft-09.jpg',name:'Lilac Tennis'},{img:'images/nft-10.jpg',name:'Mint Polaroid'},
  {img:'images/nft-11.jpg',name:'Fedora CDXLIV'},{img:'images/nft-12.jpg',name:'Neon Boombox'},
  {img:'images/nft-13.jpg',name:'Skater Orange'},{img:'images/nft-14.jpg',name:'Market Squeaks'},
  {img:'images/nft-15.jpg',name:'Windbreaker CDXLIV'},{img:'images/nft-16.jpg',name:'Peach Tracksuit'},
  {img:'images/nft-17.jpg',name:'Red Jacket Degen'},
];
const nftVels=[];
function initFloatingNFTs() {
  const wrap=document.getElementById('nft-canvas-wrap'); if(!wrap) return;
  wrap.innerHTML=''; nftVels.length=0;
  const W=wrap.offsetWidth,H=wrap.offsetHeight||440;
  NFT_DATA.forEach((nft,i)=>{
    const el=document.createElement('div'); el.className='float-nft';
    el.innerHTML=`<img src="${nft.img}" alt="${nft.name}" draggable="false"/>`; el.title=nft.name;
    const x=20+Math.random()*(W-116),y=20+Math.random()*(H-116);
    el.style.left=x+'px'; el.style.top=y+'px'; el.dataset.x=x; el.dataset.y=y;
    const sp=.35+Math.random()*.5,ang=Math.random()*Math.PI*2;
    nftVels.push({vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,dragging:false});
    makeDraggable(el,i,wrap); el.addEventListener('click',()=>bouncNFT(el)); wrap.appendChild(el);
  });
  animNFTs(wrap);
}
function bouncNFT(el){el.classList.remove('bounce');void el.offsetWidth;el.classList.add('bounce');setTimeout(()=>el.classList.remove('bounce'),450)}
function animNFTs(wrap) {
  const W=wrap.offsetWidth,H=wrap.offsetHeight||440;
  wrap.querySelectorAll('.float-nft').forEach((el,i)=>{
    if(nftVels[i]?.dragging) return;
    let x=parseFloat(el.dataset.x),y=parseFloat(el.dataset.y);
    x+=nftVels[i].vx; y+=nftVels[i].vy;
    if(x<0||x>W-96){nftVels[i].vx*=-1;x=Math.max(0,Math.min(W-96,x))}
    if(y<0||y>H-96){nftVels[i].vy*=-1;y=Math.max(0,Math.min(H-96,y))}
    el.style.left=x+'px'; el.style.top=y+'px'; el.dataset.x=x; el.dataset.y=y;
  });
  requestAnimationFrame(()=>animNFTs(wrap));
}
function makeDraggable(el,idx,container) {
  let ox,oy,dragging=false;
  el.addEventListener('mousedown',e=>{dragging=true;nftVels[idx].dragging=true;el.classList.add('dragging');const rect=el.getBoundingClientRect();ox=e.clientX-rect.left;oy=e.clientY-rect.top;e.preventDefault()});
  document.addEventListener('mousemove',e=>{if(!dragging)return;const cr=container.getBoundingClientRect();let x=Math.max(0,Math.min(cr.width-96,e.clientX-cr.left-ox));let y=Math.max(0,Math.min(cr.height-96,e.clientY-cr.top-oy));el.style.left=x+'px';el.style.top=y+'px';el.dataset.x=x;el.dataset.y=y});
  document.addEventListener('mouseup',()=>{if(dragging){dragging=false;nftVels[idx].dragging=false;el.classList.remove('dragging')}});
}
function initNFTMarquee() {
  const el=document.getElementById('nft-marquee-inner'); if(!el) return;
  el.innerHTML=[...NFT_DATA,...NFT_DATA].map(n=>`
    <div class="nft-marquee-item">
      <img src="${n.img}" alt="${n.name}"/>
      <div><div class="nft-marquee-name">${n.name}</div><div class="nft-marquee-badge">CDXLIV • Minting Soon</div></div>
    </div>`).join('');
}

// ══════════════════════════════
// LIVE PRICES — CoinGecko
// ══════════════════════════════
let priceData = [];
const CG_KEY = 'CG-UBJbhTKLAeTNRAWMNRtNFwYF';
const CG_IDS = 'bitcoin,ethereum,solana,binancecoin,dogecoin,avalanche-2,matic-network,cardano,hyperliquid';

async function fetchPrices() {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CG_IDS}&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`,
      { headers: { 'x-cg-demo-api-key': CG_KEY, 'Accept': 'application/json' } }
    );
    if (!res.ok) throw new Error('CG error');
    const data = await res.json();
    priceData = data.map(c => ({
      sym: c.symbol.toUpperCase(),
      name: c.name,
      price: c.current_price,
      change: c.price_change_percentage_24h || 0,
      img: c.image
    }));
    renderTicker();
    renderMarketCards();
    renderBlockPrices();
  } catch(e) {
    console.warn('CoinGecko fallback', e);
    priceData = [
      {sym:'BTC',name:'Bitcoin',price:67420,change:2.4,img:null},
      {sym:'ETH',name:'Ethereum',price:3820,change:-1.2,img:null},
      {sym:'SOL',name:'Solana',price:178,change:5.6,img:null},
      {sym:'HYPE',name:'Hyperliquid',price:28.4,change:3.1,img:null},
      {sym:'BNB',name:'BNB',price:598,change:.8,img:null},
      {sym:'DOGE',name:'Dogecoin',price:.18,change:-3.1,img:null},
    ];
    renderTicker(); renderMarketCards(); renderBlockPrices();
  }
}

function fmtP(p) {
  if (!p && p !== 0) return '—';
  if (p < .01) return '$'+p.toFixed(6);
  if (p < 1) return '$'+p.toFixed(4);
  if (p < 1000) return '$'+p.toFixed(2);
  return '$'+p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
}

function renderTicker() {
  const el = document.getElementById('ticker-inner'); if (!el || !priceData.length) return;
  const html = priceData.map(t=>`<span class="ticker-item"><span class="t-sym">${t.sym}</span><span>${fmtP(t.price)}</span><span class="${t.change>=0?'t-up':'t-dn'}">${t.change>=0?'+':''}${t.change.toFixed(2)}%</span></span>`).join('');
  el.innerHTML = html+html;
}

function renderMarketCards() {
  const grid = document.getElementById('market-grid'); if (!grid || !priceData.length) return;
  grid.innerHTML = priceData.map(t=>`
    <div class="market-card">
      <div style="display:flex;align-items:center;gap:.6rem">
        ${t.img?`<img src="${t.img}" style="width:28px;height:28px;border-radius:50%" alt="${t.sym}"/>`:'<div style="width:28px;height:28px;border-radius:50%;background:var(--surface2)"></div>'}
        <div><div class="market-sym">${t.sym}</div><div class="market-name">${t.name}</div></div>
      </div>
      <svg class="sparkline" viewBox="0 0 80 30"><polyline points="${genSparkline(t.change)}" fill="none" stroke="${t.change>=0?'var(--green)':'var(--red)'}" stroke-width="1.5"/></svg>
      <div><div class="market-price">${fmtP(t.price)}</div><div class="market-chg ${t.change>=0?'t-up':'t-dn'}">${t.change>=0?'+':''}${t.change.toFixed(2)}%</div></div>
    </div>`).join('');
}

function renderBlockPrices() {
  const el = document.getElementById('cheese-block-prices'); if (!el) return;
  const coins = priceData.filter(t => ['BTC','SOL','HYPE'].includes(t.sym)).slice(0,3);
  if (!coins.length) return;
  el.innerHTML = coins.map(t=>`
    <div class="bp-row">
      <span class="bp-sym">${t.sym}</span>
      <span class="bp-price">${fmtP(t.price)}</span>
      <span class="${t.change>=0?'t-up':'t-dn'}">${t.change>=0?'+':''}${t.change.toFixed(2)}%</span>
    </div>`).join('');
}

function genSparkline(trend) {
  let pts=[],y=15;
  for(let x=0;x<=80;x+=10){y+=(Math.random()-.48+trend*.04)*5;y=Math.max(3,Math.min(27,y));pts.push(`${x},${y}`);}
  return pts.join(' ');
}

// ══════════════════════════════
// DAO
// ══════════════════════════════
const DAO_PROPOSALS=[
  {id:1,title:'CDXLIV NFT Collection Size: 444 vs 888',desc:'Community vote to decide the total supply of the CDXLIV NFT collection. 444 won.',opt_a:'444 NFTs',opt_b:'888 NFTs',votes_a:22,votes_b:10},
  {id:2,title:'XP Allocation — CX Event Participation',desc:'Approve awarding 150 XP for joining live CardicX events through the Squeaks dashboard.',opt_a:'Approve 150 XP',opt_b:'Reduce to 75 XP',votes_a:22,votes_b:10},
  {id:3,title:'XP Allocation — Daily Login Rewards',desc:'Approve 10 XP daily login reward to incentivize consistent platform engagement.',opt_a:'Approve 10 XP/day',opt_b:'No daily reward',votes_a:22,votes_b:10},
];
function renderProposals() {
  const el=document.getElementById('proposals-list'); if(!el) return;
  el.innerHTML=DAO_PROPOSALS.map(p=>{
    const total=p.votes_a+p.votes_b,pct=((p.votes_a/total)*100).toFixed(0);
    return `<div class="proposal-card"><span class="p-status p-passed">✅ Passed</span><div class="proposal-title">${p.title}</div><div class="proposal-desc">${p.desc}</div><div class="vote-bar-wrap"><div class="vote-bar-fill" style="width:${pct}%"></div></div><div class="vote-meta"><span class="vote-winner">✅ ${p.opt_a} — ${p.votes_a} votes (${pct}%)</span><span>❌ ${p.opt_b} — ${p.votes_b} votes</span></div><div style="font-size:.66rem;color:var(--muted);font-family:var(--font-mono);margin-top:.5rem">${total} total votes</div></div>`;
  }).join('');
}

// ══════════════════════════════
// DONUT (interactive)
// ══════════════════════════════
const DONUT_SEGS=[
  {pct:40,color:'var(--accent)',label:'Community & Rewards',desc:'Game rewards, staking, airdrops'},
  {pct:25,color:'var(--blue)',label:'Liquidity & Listings',desc:'DEX/CEX liquidity pools'},
  {pct:15,color:'var(--green)',label:'Ecosystem Dev',desc:'Games, NFTs, integrations'},
  {pct:8,color:'#b04fff',label:'Team & Advisors',desc:'Vested over 24 months'},
  {pct:12,color:'var(--red)',label:'Marketing',desc:'Influencers & partnerships'},
];
function renderDonut() {
  const wrap=document.getElementById('donut-svg-wrap'); if(!wrap) return;
  const R=90,r=58,cx=110,cy=110;
  let start=-Math.PI/2,paths='';
  DONUT_SEGS.forEach((s,idx)=>{
    const a=(s.pct/100)*2*Math.PI;
    const x1=cx+R*Math.cos(start),y1=cy+R*Math.sin(start);
    const x2=cx+R*Math.cos(start+a),y2=cy+R*Math.sin(start+a);
    const xi1=cx+r*Math.cos(start),yi1=cy+r*Math.sin(start);
    const xi2=cx+r*Math.cos(start+a),yi2=cy+r*Math.sin(start+a);
    const large=a>Math.PI?1:0;
    paths+=`<path d="M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${r},${r} 0 ${large},0 ${xi1},${yi1} Z" fill="${s.color}" opacity=".85" stroke="var(--bg)" stroke-width="2" style="cursor:pointer;transition:opacity .2s" onmouseenter="showDonutTip(event,${idx})" onmouseleave="hideDonutTip()" ontouchstart="showDonutTip(event,${idx})"/>`;
    start+=a;
  });
  wrap.innerHTML=`<div class="donut-wrap"><svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:220px">${paths}</svg><div class="donut-center"><span class="d-ticker">$SQKS</span><span class="d-label">Tokenomics</span></div></div><div class="donut-tooltip" id="donut-tip"></div>`;
}
function showDonutTip(e,idx) {
  const s=DONUT_SEGS[idx],tip=document.getElementById('donut-tip'); if(!tip) return;
  tip.innerHTML=`<div class="dt-name" style="color:${s.color}">${s.label}</div><div class="dt-pct">${s.pct}%</div><div style="font-size:.7rem;color:var(--muted);margin-top:.2rem">${s.desc}</div>`;
  tip.classList.add('show');
  const rect=e.target.closest('.donut-wrap')?.getBoundingClientRect();
  if(rect){tip.style.left=(e.clientX-rect.left+12)+'px';tip.style.top=(e.clientY-rect.top-20)+'px';}
  document.querySelectorAll('#donut-svg-wrap path').forEach((p,i)=>p.style.opacity=i===idx?'1':'.4');
}
function hideDonutTip() {
  const tip=document.getElementById('donut-tip'); if(tip) tip.classList.remove('show');
  document.querySelectorAll('#donut-svg-wrap path').forEach(p=>p.style.opacity='.85');
}

// ══════════════════════════════
// COUNT UP
// ══════════════════════════════
function countUp(el,target,duration=1800) {
  let start=0,step=target/(duration/16);
  const timer=setInterval(()=>{start+=step;if(start>=target){start=target;clearInterval(timer)}el.textContent=Math.floor(start).toLocaleString();},16);
}
function initCountUps() {
  document.querySelectorAll('[data-countup]').forEach(el=>countUp(el,parseInt(el.dataset.countup)));
}
function initHomeCountUps() {
  document.querySelectorAll('[data-countup-home]').forEach(el=>{
    let start=0;const target=parseInt(el.dataset.countupHome),step=target/60;
    const timer=setInterval(()=>{start+=step;if(start>=target){start=target;clearInterval(timer)}el.textContent=Math.floor(start);},24);
  });
}

// ══════════════════════════════
// WAITLIST
// ══════════════════════════════
async function joinWaitlist() {
  let email='';
  document.querySelectorAll('.waitlist-email-input').forEach(i=>{if(i.value.trim()) email=i.value.trim();});
  if(!email||!email.includes('@')) return showToast('⚠️ Enter a valid email');
  document.querySelectorAll('.waitlist-email-input').forEach(i=>i.value='');
  showToast('✅ You\'re on the waitlist!');
}

// ══════════════════════════════
// DASHBOARD
// ══════════════════════════════
async function loadDashboard() {
  if(!currentUser||!userProfile) return;
  const uname=userProfile.username||currentUser.email?.split('@')[0];
  const avatarEl=document.getElementById('dash-avatar-img');
  if(avatarEl){ if(userProfile.avatar_url){avatarEl.src=userProfile.avatar_url;}else{avatarEl.textContent=uname?.[0]?.toUpperCase()||'?';} }
  const unEl=document.getElementById('dash-username-display'); if(unEl) unEl.textContent=uname;
  const emEl=document.getElementById('dash-email-display'); if(emEl) emEl.textContent=currentUser.email;
  const editU=document.getElementById('edit-username'); if(editU) editU.value=uname;
  const editE=document.getElementById('edit-email'); if(editE) editE.value=currentUser.email;
  const editCX=document.getElementById('edit-cx'); if(editCX) editCX.value=userProfile.cx_username||'';
  const editZ=document.getElementById('edit-zealy'); if(editZ) editZ.value=userProfile.zealy_username||'';
  const editB=document.getElementById('edit-bio'); if(editB) editB.value=userProfile.bio||'';
  const editW=document.getElementById('edit-wallet'); if(editW) editW.value=userProfile.wallet_address||'';
  renderXPBar(); await loadOrders(); await loadXPHistory();
  async function loadDashboard() {
  if (!currentUser || !userProfile) return;
}}
async function loadOrders() {
  const el=document.getElementById('orders-list'); if(!el||!currentUser) return;
  const {data}=await sb.from('orders').select('*').order('created_at',{ascending:false});
  const orders=data||[];
  const cEl=document.getElementById('stat-orders'); const sEl=document.getElementById('stat-spend');
  if(cEl) cEl.textContent=orders.length;
  if(sEl) sEl.textContent='$'+orders.reduce((s,o)=>s+parseFloat(o.total),0).toFixed(2);
  if(!orders.length){el.innerHTML=`<div style="color:var(--muted);text-align:center;padding:2rem">No orders yet. <a href="#" onclick="navigate('merch');return false;" style="color:var(--accent)">Shop now →</a></div>`;return;}
  el.innerHTML=orders.map(o=>`<div class="order-row"><div class="order-id">#${o.id.slice(0,8).toUpperCase()}</div><div class="order-items">${Array.isArray(o.items)?o.items.map(i=>i.name).join(', '):'Order'}</div><div class="order-total">$${parseFloat(o.total).toFixed(2)}</div><div class="order-status os-${o.status}">${o.status}</div></div>`).join('');
}
async function loadXPHistory() {
  const el=document.getElementById('xp-history-list'); if(!el||!currentUser) return;
  const {data}=await sb.from('xp_transactions').select('*').order('created_at',{ascending:false}).limit(20);
  if(!data||!data.length){el.innerHTML='<div style="color:var(--muted);font-size:.78rem">No XP yet. Start exploring!</div>';return;}
  const icons={daily_login:'🌅',join_event:'🎯',play_game:'🎮',win_game:'🏆',place_order:'🛒',vote:'🗳️',own_nft:'🖼️',refer_friend:'👥',complete_profile:'✅',submit_cx_username:'🔗'};
  el.innerHTML=data.map(x=>`<div class="xp-history-item"><span class="xp-history-icon">${icons[x.action]||'⚡'}</span><span class="xp-history-action">${x.action.replace(/_/g,' ')}</span><span class="xp-history-amount">+${x.xp_earned} XP</span><span class="xp-history-date">${new Date(x.created_at).toLocaleDateString()}</span></div>`).join('');
}
async function saveProfile() {
  if(!currentUser) return showToast('🔐 Log in first');
  const username=document.getElementById('edit-username')?.value?.trim();
  const cx_username=document.getElementById('edit-cx')?.value?.trim();
  const zealy_username=document.getElementById('edit-zealy')?.value?.trim();
  const bio=document.getElementById('edit-bio')?.value?.trim();
  const wallet_address=document.getElementById('edit-wallet')?.value?.trim();
  const hasCX=cx_username&&!userProfile?.cx_username;
  const {error}=await sb.from('profiles').upsert({id:currentUser.id,username,cx_username,zealy_username,bio,wallet_address},{onConflict:'id'});
  if(error) return showToast('❌ '+error.message);
  userProfile={...userProfile,username,cx_username,zealy_username,bio,wallet_address};
  if(hasCX) await awardXP('submit_cx_username');
  showToast('✅ Profile saved!'); renderNavUser();
  const unEl=document.getElementById('dash-username-display'); if(unEl) unEl.textContent=username;
}
async function handleAvatarUpload(file) {
  if(!file||!currentUser) return;
  if(file.size>102400){const c=await compressImage(file,102400);if(!c)return showToast('❌ Image too large');file=c;}
  showToast('⏳ Uploading...');
  const {error}=await sb.storage.from('avatars').upload(`${currentUser.id}/avatar.jpg`,file,{upsert:true,contentType:'image/jpeg'});
  if(error) return showToast('❌ '+error.message);
  const {data:{publicUrl}}=sb.storage.from('avatars').getPublicUrl(`${currentUser.id}/avatar.jpg`);
  await sb.from('profiles').upsert({id:currentUser.id,avatar_url:publicUrl},{onConflict:'id'});
  userProfile={...userProfile,avatar_url:publicUrl};
  renderNavUser(); loadDashboard(); showToast('✅ Avatar updated!');
}
async function compressImage(file,maxBytes) {
  return new Promise(resolve=>{
    const img=new Image(),url=URL.createObjectURL(file);
    img.onload=()=>{
      const canvas=document.createElement('canvas'),size=300;
      canvas.width=size;canvas.height=size;
      const ctx=canvas.getContext('2d'),s=Math.min(img.width,img.height);
      ctx.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,size,size);
      let q=.9,dataUrl;
      do{dataUrl=canvas.toDataURL('image/jpeg',q);q-=.1;}while(dataUrl.length>maxBytes*1.37&&q>.1);
      if(dataUrl.length>maxBytes*1.37){resolve(null);return;}
      fetch(dataUrl).then(r=>r.blob()).then(resolve);URL.revokeObjectURL(url);
    };img.src=url;
  });
}

// ══════════════════════════════
// EVENT LISTENERS
// ══════════════════════════════
document.querySelectorAll('.dash-nav a').forEach(a=>{
  a.addEventListener('click',e=>{e.preventDefault();document.querySelectorAll('.dash-nav a').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.dash-section').forEach(s=>s.classList.remove('active'));a.classList.add('active');document.getElementById('ds-'+a.dataset.section)?.classList.add('active');});
});
document.querySelectorAll('.filter-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderProducts(btn.dataset.filter);});
});
document.querySelectorAll('.auth-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{document.querySelectorAll('.auth-tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.auth-form').forEach(f=>f.classList.remove('active'));tab.classList.add('active');document.getElementById('form-'+tab.dataset.form)?.classList.add('active');});
});

// ══════════════════════════════
// MODALS & TOAST
// ══════════════════════════════
function openModal(id){document.getElementById(id)?.classList.add('open')}
function closeModal(id){document.getElementById(id)?.classList.remove('open')}
document.querySelectorAll('.overlay').forEach(o=>{o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open')});});
function showToast(msg){document.querySelector('.toast')?.remove();const t=document.createElement('div');t.className='toast';t.innerHTML=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3200);}

// ══════════════════════════════
// INIT
// ══════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  initTheme(); initAuth();
  renderProducts(); renderProposals(); renderDonut();
  fetchPrices(); initNFTMarquee(); initProductSlider();
  setInterval(fetchPrices, 900000); // 15 minutes
  navigate('home');
  setTimeout(initHomeCountUps, 600);
  // Handle URL hash routing
function handleHashRoute() {
  const hash = window.location.hash.replace('#', '');
  if (hash) navigate(hash);
}
window.addEventListener('hashchange', handleHashRoute);
handleHashRoute();
  // ══════════════════════════════
// EVENTS SYSTEM
// ══════════════════════════════
let currentEventId = null;

async function loadEvents() {
  const el = document.getElementById('events-list');
  if (!el) return;
  const { data: events } = await sb.from('events').select('*').order('created_at', { ascending: false });
  if (!events || !events.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:.82rem;text-align:center;padding:2rem">No events yet. Check back soon.</div>';
    return;
  }
  el.innerHTML = events.map(e => `
    <div class="event-dash-card ${e.status}" onclick="openEventDetail('${e.id}')">
      <div class="edc-header">
        <div>
          <div class="edc-status ${e.status}">${e.status === 'live' ? '🔴 Live Now' : e.status === 'upcoming' ? '🟡 Upcoming' : '⚪ Ended'}</div>
          <div class="edc-title">${e.title}</div>
          <div class="edc-prize">Prize Pool: <strong>${e.prize_pool}</strong></div>
        </div>
        <button class="btn btn-primary btn-sm">View Event →</button>
      </div>
      <div class="edc-desc">${e.description}</div>
      ${e.ends_at ? `<div class="edc-ends">Ends: ${new Date(e.ends_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>` : ''}
    </div>`).join('');
}

async function openEventDetail(eventId) {
  currentEventId = eventId;
  const el = document.getElementById('event-detail-view');
  const listEl = document.getElementById('events-list-view');
  if (!el || !listEl) return;
  listEl.style.display = 'none';
  el.style.display = 'block';

  const { data: event } = await sb.from('events').select('*').eq('id', eventId).single();
  const { data: activities } = await sb.from('event_activities').select('*').eq('event_id', eventId).eq('is_active', true).order('sort_order');

  let completions = {};
  if (currentUser) {
    const { data: comp } = await sb.from('event_activity_completions').select('*').eq('user_id', currentUser.id).eq('event_id', eventId);
    (comp || []).forEach(c => completions[c.activity_id] = c);
  }

  el.innerHTML = `
    <button class="btn btn-ghost btn-sm" onclick="backToEvents()" style="margin-bottom:1.2rem">← Back to Events</button>
    <div style="margin-bottom:1.5rem">
      <div class="edc-status ${event.status}">${event.status === 'live' ? '🔴 Live Now' : event.status === 'upcoming' ? '🟡 Upcoming' : '⚪ Ended'}</div>
      <h2 style="font-family:var(--font-head);font-size:1.8rem;margin:.3rem 0">${event.title}</h2>
      <div style="color:var(--accent);font-family:var(--font-head);font-size:1.3rem">Prize Pool: ${event.prize_pool}</div>
      <p style="color:var(--muted);font-size:.84rem;margin-top:.5rem;line-height:1.65;max-width:560px">${event.prize_description}</p>
    </div>
    <h3 style="font-family:var(--font-head);font-size:1.3rem;margin-bottom:1rem">ACTIVITIES</h3>
    <div id="event-activities-list">
      ${(activities || []).map(a => {
        const comp = completions[a.id];
        const isApproved = comp && comp.status === 'approved';
        const isPending = comp && comp.status === 'pending';
        const isDone = isApproved || isPending;
        const typeIcon = a.activity_type === 'prediction' ? '🔮' : a.activity_type === 'social_engage' ? '📣' : a.activity_type === 'join' ? '🎯' : '⚡';
        return `
        <div class="activity-card ${isApproved ? 'activity-done' : isPending ? 'activity-pending' : ''}">
          <div class="activity-icon">${typeIcon}</div>
          <div class="activity-info">
            <div class="activity-title">${a.title}</div>
            <div class="activity-desc">${a.description}</div>
            ${isPending ? '<div class="activity-review-tag">⏳ Under Review</div>' : ''}
            ${isApproved ? '<div class="activity-approved-tag">✅ Approved</div>' : ''}
          </div>
          <div class="activity-xp">+${a.xp_reward} XP</div>
          <div class="activity-actions">
            ${!isDone && a.action_url ? `<a href="${a.action_url}" target="_blank" class="btn btn-outline btn-sm">Go ↗</a>` : ''}
            ${!isDone && a.requires_review
              ? `<button class="btn btn-primary btn-sm" onclick="openProofModal('${a.id}','${a.activity_type}','${a.title.replace(/'/g,"\\'")}',${a.xp_reward})">Submit</button>`
              : !isDone
              ? `<button class="btn btn-primary btn-sm" onclick="claimActivity('${a.id}','${eventId}',${a.xp_reward})">Claim XP</button>`
              : ''
            }
          </div>
        </div>`;
      }).join('')}
    </div>
    <h3 style="font-family:var(--font-head);font-size:1.3rem;margin:2rem 0 1rem">DAILY SOCIAL <em style="color:var(--accent)">ENGAGEMENT</em></h3>
    <p style="color:var(--muted);font-size:.82rem;margin-bottom:1rem">Engage with our latest posts and earn XP for each action. Resets daily.</p>
    <div id="event-social-list"><div style="color:var(--muted);font-size:.8rem">Loading posts...</div></div>

    <h3 style="font-family:var(--font-head);font-size:1.3rem;margin:2rem 0 1rem">EVENT LEADERBOARD</h3>
    <div id="event-leaderboard"></div>`;

loadEventLeaderboard(eventId);
  loadEventSocialPosts();
}

function backToEvents() {
  document.getElementById('events-list-view').style.display = 'block';
  document.getElementById('event-detail-view').style.display = 'none';
  currentEventId = null;
}

async function claimActivity(activityId, eventId, xp) {
  if (!currentUser) return showToast('🔐 Log in first');
  try {
    const { error } = await sb.from('event_activity_completions').insert({
      user_id: currentUser.id,
      event_id: eventId,
      activity_id: activityId,
      status: 'approved',
      xp_awarded: xp
    });
    if (error) { showToast('⚠️ Already claimed'); return; }
    const newXP = (userProfile?.xp || 0) + xp;
    const newLevel = getLevel(newXP).level;
    await sb.from('profiles').upsert({ id: currentUser.id, xp: newXP, level: newLevel }, { onConflict: 'id' });
    userProfile = { ...userProfile, xp: newXP, level: newLevel };
    renderXPBar();
    showToast(`+${xp} XP earned! 🎉`);
    openEventDetail(eventId);
  } catch(e) { showToast('❌ ' + e.message); }
}

function openProofModal(activityId, activityType, title, xp) {
  const isPrediction = activityType === 'prediction';
  document.getElementById('proof-modal-body').innerHTML = `
    <div class="modal-head">
      <h2>${isPrediction ? '🔮 PREDICTION' : '📣 SUBMIT PROOF'}</h2>
      <button class="modal-close" onclick="closeModal('proof-modal')">✕</button>
    </div>
    <p style="color:var(--muted);font-size:.84rem;margin-bottom:1rem">${title}</p>
    <div class="form-group">
      <label class="form-label">${isPrediction ? 'Your Prediction' : 'Proof (post link, username, or screenshot URL)'}</label>
      <input class="form-input" id="proof-input" placeholder="${isPrediction ? 'e.g. Brazil 2 - 1 France' : 'e.g. https://x.com/yourhandle/status/...'}"/>
      ${isPrediction ? '<div style="font-size:.7rem;color:var(--muted);margin-top:.3rem">Reviewed after the match. Correct predictions earn full XP.</div>' : ''}
    </div>
    <div style="display:flex;gap:.8rem;margin-top:1rem">
      <button class="btn btn-primary" style="flex:1" onclick="submitProof('${activityId}','${currentEventId}',${xp})">Submit →</button>
      <button class="btn btn-ghost" onclick="closeModal('proof-modal')">Cancel</button>
    </div>`;
  openModal('proof-modal');
}

async function submitProof(activityId, eventId, xp) {
  const proof = document.getElementById('proof-input')?.value?.trim();
  if (!proof) return showToast('⚠️ Enter your submission');
  if (!currentUser) return showToast('🔐 Log in first');
  try {
    const { error } = await sb.from('event_activity_completions').insert({
      user_id: currentUser.id,
      event_id: eventId,
      activity_id: activityId,
      status: 'pending',
      proof_text: proof,
      xp_awarded: 0
    });
    if (error) { showToast('⚠️ Already submitted'); return; }
    closeModal('proof-modal');
    showToast('✅ Submitted! Under review.');
    openEventDetail(eventId);
  } catch(e) { showToast('❌ ' + e.message); }
}

async function loadEventLeaderboard(eventId) {
  const el = document.getElementById('event-leaderboard');
  if (!el) return;
  const { data } = await sb.from('event_leaderboard').select('*').eq('event_id', eventId).order('rank').limit(20);
  if (!data || !data.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:.8rem">No activity yet. Be the first!</div>';
    return;
  }
  el.innerHTML = `
    <div class="leaderboard-header">
      <span style="width:50px">Rank</span><span style="flex:1">User</span><span style="width:80px;text-align:center">Done</span><span style="width:80px;text-align:right">XP</span>
    </div>
    ${data.map((row, i) => {
      const isMe = currentUser && row.user_id === currentUser.id;
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${row.rank}`;
      return `
      <div class="leaderboard-row ${isMe ? 'leaderboard-me' : ''}">
        <span class="lb-rank">${medal}</span>
        <span class="lb-user">${row.username || 'Anonymous'}${isMe ? ' (you)' : ''}</span>
        <span class="lb-acts">${row.completed_activities}</span>
        <span class="lb-xp">${parseInt(row.event_xp).toLocaleString()} XP</span>
      </div>`;
    }).join('')}`;
}
});


async function loadEventSocialPosts() {
  const el = document.getElementById('event-social-list');
  if (!el) return;

  const FEED_URL = 'https://rss.app/feeds/Mc0KFmfcbDRfpMAk.xml';
  const RSS2JSON_KEY = 'xtnj6ril6txyremvpkbfronyx96s8dcrbwwsusos';
  const platforms = {
    twitter: { label: 'Twitter / X', icon: '𝕏', color: '#1da1f2', feed: 'https://rss.app/feeds/0HzPY91DiF2sHx93.xml' },
    instagram: { label: 'Instagram', icon: '📷', color: '#e1306c', feed: 'https://rss.app/feeds/Mc0KFmfcbDRfpMAk.xml' },
    tiktok: { label: 'TikTok', icon: '🎵', color: '#ff0050', feed: 'https://rss.app/feeds/saxncBXL5xmGeUIj.xml' }
  };

  let html = '';

  for (const [platform, config] of Object.entries(platforms)) {
    if (config.feed.includes('YOUR_')) continue;
    let posts = [];
    try {
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(config.feed)}&api_key=${RSS2JSON_KEY}&count=5`);
      const data = await res.json();
      posts = (data.items || []).slice(0, 5);
    } catch(e) { console.warn(platform, e); }

    html += `
      <div class="social-engage-group">
        <div class="seg-platform-header" style="border-color:${config.color}">
          <span class="seg-icon">${config.icon}</span>
          <span class="seg-platform-name">${config.label}</span>
        </div>
        ${posts.length ? posts.map((p, i) => `
          <div class="seg-post-item">
            <div class="seg-post-info">
              <a href="${p.link}" target="_blank" class="seg-post-title">${(p.title||'View Post').slice(0,80)}${(p.title||'').length>80?'...':''}</a>
              <div class="seg-post-date">${new Date(p.pubDate).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
            </div>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap;flex-shrink:0">
              <button class="btn btn-outline btn-sm" onclick="window.open('${p.link}','_blank')">View ↗</button>
              <button class="btn btn-sm" style="background:var(--red-dim);color:var(--red);border:1px solid rgba(200,36,43,.2)" onclick="claimPostAction('${platform}_like_${i}',5,'❤️ Liked')">❤️ +5</button>
              <button class="btn btn-sm" style="background:var(--accent-dim);color:var(--accent);border:1px solid rgba(255,184,154,.2)" onclick="claimPostAction('${platform}_comment_${i}',5,'💬 Commented')">💬 +5</button>
              <button class="btn btn-sm" style="background:rgba(79,255,160,.08);color:var(--green);border:1px solid rgba(79,255,160,.2)" onclick="claimPostAction('${platform}_repost_${i}',5,'🔁 Reposted')">🔁 +5</button>
            </div>
          </div>`).join('') : `<div style="color:var(--muted);font-size:.78rem;padding:.6rem 0">No posts found.</div>`}
      </div>`;
  }

  el.innerHTML = html || '<div style="color:var(--muted);font-size:.8rem">No posts available.</div>';
}

async function claimPostAction(actionId, xp, label) {
  if (!currentUser) return showToast('🔐 Log in first');
  // Use today's date so actions reset daily
  const today = new Date().toISOString().split('T')[0];
  const questId = `post_${actionId}_${today}`;
  try {
    const { error } = await sb.from('quest_completions').insert({
      user_id: currentUser.id,
      quest_id: questId,
      xp_awarded: xp
    });
    if (error) { showToast(`⚠️ Already claimed today`); return; }
    const newXP = (userProfile?.xp || 0) + xp;
    const newLevel = getLevel(newXP).level;
    await sb.from('profiles').upsert({ id: currentUser.id, xp: newXP, level: newLevel }, { onConflict: 'id' });
    userProfile = { ...userProfile, xp: newXP, level: newLevel };
    renderXPBar();
    showToast(`+${xp} XP — ${label} 🎉`);
  } catch(e) { showToast('❌ ' + e.message); }
}


// ══════════════════════════════
// EVENTS SYSTEM
// ══════════════════════════════
let currentEventId = null;

async function loadEvents() {
  const el = document.getElementById('events-list');
  if (!el) return;
  const { data: events } = await sb.from('events').select('*').order('created_at', { ascending: false });
  if (!events || !events.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:.82rem;text-align:center;padding:2rem">No events yet. Check back soon.</div>';
    return;
  }
  el.innerHTML = events.map(e => `
    <div class="event-dash-card ${e.status}" onclick="openEventDetail('${e.id}')">
      <div class="edc-header">
        <div>
          <div class="edc-status ${e.status}">${e.status === 'live' ? '🔴 Live Now' : e.status === 'upcoming' ? '🟡 Upcoming' : '⚪ Ended'}</div>
          <div class="edc-title">${e.title}</div>
          <div class="edc-prize">Prize Pool: <strong>${e.prize_pool}</strong></div>
        </div>
        <button class="btn btn-primary btn-sm">View Event →</button>
      </div>
      <div class="edc-desc">${e.description}</div>
      ${e.ends_at ? `<div class="edc-ends">Ends: ${new Date(e.ends_at).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</div>` : ''}
    </div>`).join('');
}

async function openEventDetail(eventId) {
  currentEventId = eventId;
  const el = document.getElementById('event-detail-view');
  const listEl = document.getElementById('events-list-view');
  if (!el || !listEl) return;
  listEl.style.display = 'none';
  el.style.display = 'block';

  const { data: event } = await sb.from('events').select('*').eq('id', eventId).single();
  const { data: activities } = await sb.from('event_activities').select('*').eq('event_id', eventId).eq('is_active', true).order('sort_order');
  const { data: joined } = currentUser ? await sb.from('event_joins').select('id').eq('user_id', currentUser.id).eq('event_id', eventId).single() : { data: null };

  let completions = {};
  if (currentUser) {
    const { data: comp } = await sb.from('event_activity_completions').select('*').eq('user_id', currentUser.id).eq('event_id', eventId);
    (comp || []).forEach(c => completions[c.activity_id] = c);
  }

  const isJoined = !!joined;

  el.innerHTML = `
    <button class="btn btn-ghost btn-sm" onclick="backToEvents()" style="margin-bottom:1.2rem">← Back to Events</button>
    <div class="event-detail-header">
      <div>
        <div class="edc-status ${event.status}">${event.status === 'live' ? '🔴 Live Now' : event.status === 'upcoming' ? '🟡 Upcoming' : '⚪ Ended'}</div>
        <h2 style="font-family:var(--font-head);font-size:1.8rem;margin:.3rem 0">${event.title}</h2>
        <div style="color:var(--accent);font-family:var(--font-head);font-size:1.3rem">Prize Pool: ${event.prize_pool}</div>
        <p style="color:var(--muted);font-size:.84rem;margin-top:.5rem;line-height:1.65">${event.prize_description}</p>
      </div>
    </div>

    <!-- Activities -->
    <h3 style="font-family:var(--font-head);font-size:1.3rem;margin:1.5rem 0 1rem">ACTIVITIES</h3>
    <div id="event-activities-list">
      ${(activities || []).map(a => {
        const comp = completions[a.id];
        const isDone = comp && (comp.status === 'approved' || comp.status === 'pending');
        const isPending = comp && comp.status === 'pending';
        const isApproved = comp && comp.status === 'approved';
        const needsProof = a.requires_review;
        const typeIcon = a.activity_type === 'prediction' ? '🔮' : a.activity_type === 'social_engage' ? '📣' : a.activity_type === 'join' ? '🎯' : '⚡';
        return `
        <div class="activity-card ${isApproved ? 'activity-done' : isPending ? 'activity-pending' : ''}">
          <div class="activity-icon">${typeIcon}</div>
          <div class="activity-info">
            <div class="activity-title">${a.title}</div>
            <div class="activity-desc">${a.description}</div>
            ${isPending ? '<div class="activity-review-tag">⏳ Under Review</div>' : ''}
            ${isApproved ? '<div class="activity-approved-tag">✅ Approved</div>' : ''}
          </div>
          <div class="activity-xp">+${a.xp_reward} XP</div>
          <div class="activity-actions">
            ${!isDone && a.action_url ? `<a href="${a.action_url}" target="_blank" class="btn btn-outline btn-sm">Go ↗</a>` : ''}
            ${!isDone && needsProof
              ? `<button class="btn btn-primary btn-sm" onclick="openProofModal('${a.id}','${a.activity_type}','${a.title.replace(/'/g,"\\'")}',${a.xp_reward})">Submit</button>`
              : !isDone
              ? `<button class="btn btn-primary btn-sm" onclick="claimActivity('${a.id}','${eventId}',${a.xp_reward})">Claim XP</button>`
              : ''
            }
          </div>
        </div>`;
      }).join('')}
    </div>

    <!-- Leaderboard -->
    <h3 style="font-family:var(--font-head);font-size:1.3rem;margin:2rem 0 1rem">EVENT LEADERBOARD</h3>
    <div id="event-leaderboard"></div>`;

loadEventLeaderboard(eventId);
  loadEventSocialPosts();
}

function backToEvents() {
  document.getElementById('events-list-view').style.display = 'block';
  document.getElementById('event-detail-view').style.display = 'none';
  currentEventId = null;
}

async function claimActivity(activityId, eventId, xp) {
  if (!currentUser) return showToast('🔐 Log in first');
  try {
    const { error } = await sb.from('event_activity_completions').insert({
      user_id: currentUser.id,
      event_id: eventId,
      activity_id: activityId,
      status: 'approved',
      xp_awarded: xp
    });
    if (error) { showToast('⚠️ Already claimed'); return; }
    const newXP = (userProfile?.xp || 0) + xp;
    const newLevel = getLevel(newXP).level;
    await sb.from('profiles').upsert({ id: currentUser.id, xp: newXP, level: newLevel }, { onConflict: 'id' });
    userProfile = { ...userProfile, xp: newXP, level: newLevel };
    renderXPBar();
    showToast(`+${xp} XP earned! 🎉`);
    openEventDetail(eventId);
  } catch(e) { showToast('❌ ' + e.message); }
}

// Proof submission (predictions + manual verify)
function openProofModal(activityId, activityType, title, xp) {
  const isPrediction = activityType === 'prediction';
  document.getElementById('proof-modal-body').innerHTML = `
    <div class="modal-head">
      <h2>${isPrediction ? '🔮 PREDICTION' : '📣 SUBMIT PROOF'}</h2>
      <button class="modal-close" onclick="closeModal('proof-modal')">✕</button>
    </div>
    <p style="color:var(--muted);font-size:.84rem;margin-bottom:1rem">${title}</p>
    ${isPrediction ? `
      <div class="form-group">
        <label class="form-label">Your Prediction</label>
        <input class="form-input" id="proof-input" placeholder="e.g. Brazil 2 - 1 France / Brazil wins"/>
        <div style="font-size:.7rem;color:var(--muted);margin-top:.3rem">Enter your predicted scoreline or match winner. Reviewed after the match.</div>
      </div>` : `
      <div class="form-group">
        <label class="form-label">Proof (post link, username, or screenshot URL)</label>
        <input class="form-input" id="proof-input" placeholder="e.g. https://x.com/yourhandle/status/..."/>
      </div>`
    }
    <div style="display:flex;gap:.8rem;margin-top:1rem">
      <button class="btn btn-primary" style="flex:1" onclick="submitProof('${activityId}','${currentEventId}',${xp})">Submit →</button>
      <button class="btn btn-ghost" onclick="closeModal('proof-modal')">Cancel</button>
    </div>`;
  openModal('proof-modal');
}

async function submitProof(activityId, eventId, xp) {
  const proof = document.getElementById('proof-input')?.value?.trim();
  if (!proof) return showToast('⚠️ Enter your submission');
  if (!currentUser) return showToast('🔐 Log in first');
  try {
    const { error } = await sb.from('event_activity_completions').insert({
      user_id: currentUser.id,
      event_id: eventId,
      activity_id: activityId,
      status: 'pending',
      proof_text: proof,
      xp_awarded: 0
    });
    if (error) { showToast('⚠️ Already submitted'); return; }
    closeModal('proof-modal');
    showToast('✅ Submitted! Under review.');
    openEventDetail(eventId);
  } catch(e) { showToast('❌ ' + e.message); }
}

async function loadEventLeaderboard(eventId) {
  const el = document.getElementById('event-leaderboard');
  if (!el) return;
  const { data } = await sb.from('event_leaderboard').select('*').eq('event_id', eventId).order('rank').limit(20);
  if (!data || !data.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:.8rem">No activity yet. Be the first!</div>';
    return;
  }
  el.innerHTML = `
    <div class="leaderboard-header">
      <span>Rank</span><span>User</span><span>Activities</span><span>Event XP</span>
    </div>
    ${data.map((row, i) => {
      const isMe = currentUser && row.user_id === currentUser.id;
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${row.rank}`;
      return `
      <div class="leaderboard-row ${isMe ? 'leaderboard-me' : ''}">
        <span class="lb-rank">${medal}</span>
        <span class="lb-user">${row.username || 'Anonymous'}${isMe ? ' (you)' : ''}</span>
        <span class="lb-acts" style="color:var(--muted);font-size:.78rem">${row.completed_activities} done</span>
        <span class="lb-xp">${parseInt(row.event_xp).toLocaleString()} XP</span>
      </div>`;
    }).join('')}`;
}

document.querySelectorAll('.dash-nav a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.dash-nav a').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
    a.classList.add('active');
    document.getElementById('ds-' + a.dataset.section)?.classList.add('active');
    if (a.dataset.section === 'events') loadEvents();
    if (a.dataset.section === 'quests') loadQuests();
  });
});
