import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const demoCategories = ['All dishes', 'Bowls', 'Mains', 'Small plates', 'Drinks'];
const demoMenu = [
  { id: 1, name: 'The Sunday Bowl', description: 'Crispy chickpeas, herbed labneh, garden greens, lemon oil', price: 345, categoryName: 'Bowls', isVegetarian: true, imageUrl: 'photo-1512621776951-a57141f2eefd', tag: 'HOUSE FAVORITE' },
  { id: 2, name: 'Burrata & Peaches', description: 'Stone fruit, basil, toasted sourdough, aged balsamic', price: 420, categoryName: 'Small plates', isVegetarian: true, imageUrl: 'photo-1505576399274-565b52d4ac71', tag: 'SEASONAL' },
  { id: 3, name: 'Miso Butter Noodles', description: 'Silky noodles, wild mushrooms, scallion, sesame', price: 380, categoryName: 'Mains', isVegetarian: true, imageUrl: 'photo-1473093295043-cdd812d0e601', tag: 'COMFORT FOOD' },
  { id: 4, name: 'Citrus Garden Salad', description: 'Blood orange, fennel, pistachio, little gem lettuce', price: 295, categoryName: 'Bowls', isVegetarian: true, imageUrl: 'photo-1511690743698-d9d85f2fbf38', tag: 'FRESH PICK' },
  { id: 5, name: 'Rosemary Peach Fizz', description: 'Fresh peach, rosemary, lime, a little sparkle', price: 180, categoryName: 'Drinks', isVegetarian: true, imageUrl: 'photo-1513558161293-cdaf765edfd7', tag: 'ZERO PROOF' },
  { id: 6, name: 'Charred Carrot Toast', description: 'Whipped feta, hot honey, dill, country loaf', price: 310, categoryName: 'Small plates', isVegetarian: true, imageUrl: 'photo-1525351484163-7529414344d8', tag: 'A LITTLE SPICY' }
];

const money = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
const photo = (id, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;

function App() {
  return window.location.pathname.startsWith('/admin') ? <AdminDashboard /> : <CustomerApp />;
}

function CustomerApp() {
  const [items, setItems] = useState(demoMenu);
  const [categories, setCategories] = useState(demoCategories);
  const [category, setCategory] = useState('All dishes');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({});
  const [bagOpen, setBagOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([fetch(`${API_URL}/menu/categories`), fetch(`${API_URL}/menu/items?limit=30`)])
      .then(async ([categoryResponse, itemResponse]) => {
        if (!categoryResponse.ok || !itemResponse.ok) throw new Error('Menu API unavailable');
        return Promise.all([categoryResponse.json(), itemResponse.json()]);
      })
      .then(([categoryResult, itemResult]) => {
        if (!active) return;
        if (Array.isArray(categoryResult.data) && categoryResult.data.length) setCategories(['All dishes', ...categoryResult.data.map((entry) => entry.name)]);
        if (Array.isArray(itemResult.data) && itemResult.data.length) setItems(itemResult.data);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const visibleItems = useMemo(() => items.filter((item) => {
    const inCategory = category === 'All dishes' || item.categoryName === category;
    const matches = `${item.name} ${item.description || ''}`.toLowerCase().includes(search.toLowerCase());
    return inCategory && matches;
  }), [items, category, search]);
  const cartItems = items.filter((item) => cart[item.id]).map((item) => ({ ...item, quantity: cart[item.id] }));
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const setQuantity = (id, next) => setCart((current) => {
    const updated = { ...current };
    if (next <= 0) delete updated[id]; else updated[id] = next;
    return updated;
  });

  return <div className="site-shell">
    <div className="topline"><span>GOOD FOOD, SLOW MORNINGS, BETTER EVENINGS.</span><span className="topline-right">OPEN TODAY · 11 AM — 10 PM <i>✳</i> BENGALURU, IN</span></div>
    <header className="site-header">
      <a href="#home" className="brand"><span className="brand-mark">r<span>✳</span></span><span className="brand-name">restro<span>GOOD THINGS, GROWN SLOW</span></span></a>
      <nav className="main-nav"><a href="#menu">The menu</a><a href="#story">Our little story</a><a href="#visit">Come by</a></nav>
      <div className="header-actions"><a href="/admin" className="admin-link">ADMIN <span>↗</span></a><button className="bag-trigger" onClick={() => setBagOpen(true)}>YOUR BAG <span>{cartCount.toString().padStart(2, '0')}</span></button><button className="mobile-bag" onClick={() => setBagOpen(true)} aria-label="Open your bag">Bag · {cartCount}</button></div>
    </header>

    <main>
      <section id="home" className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> A NEIGHBORHOOD KITCHEN IN BENGALURU</div><h1>Come hungry.<br/><em>Leave a little</em><br/><em>happier.</em></h1><p>Season-led plates, good pours and the kind of hospitality that makes you forget to check your phone.</p><div className="hero-actions"><a href="#menu" className="button-dark">SEE WHAT'S COOKING <span>↘</span></a><span className="hero-note">MADE FRESH, EVERY DAY <b>✳</b></span></div><div className="hero-foot"><span>12°58' N&nbsp; 77°38' E</span><span>INDEPENDENTLY GROWN · ALWAYS LOCAL WHEN WE CAN</span></div></div>
        <div className="hero-visual"><div className="hero-photo"><img src={photo('photo-1512621776951-a57141f2eefd', 1100)} alt="A vibrant seasonal salad, made fresh at Restro" fetchPriority="high"/><span className="photo-label">01 / FROM OUR SPRING TABLE</span></div><div className="hero-sticker"><span>Eat well</span><b>✳</b><span>Feel more</span></div><div className="hero-vertical">SEASONAL · THOUGHTFUL · DELICIOUS</div></div>
      </section>

      <section className="manifesto-strip"><span>GOOD FOOD IS A FEELING.</span><div className="manifesto-dots">✳ <i>✳</i> ✳</div><span>WE COOK FOR THE LONG LUNCH.</span></section>

      <section id="menu" className="menu-section">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> A FEW THINGS WE LOVE</div><h2>The good <em>stuff.</em></h2></div><p>Our menu wanders with the seasons.<br/>Here’s what’s lovely right now.</p></div>
        <div className="menu-toolbar"><div className="category-tabs">{categories.map((item) => <button className={category === item ? 'category-tab active' : 'category-tab'} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find your thing" aria-label="Search menu"/></label></div>
        <div className="menu-grid">{visibleItems.map((item, index) => <article className="dish-card" key={item.id} style={{ '--card-index': index }}><div className="dish-image"><img src={item.imageUrl?.startsWith('http') ? item.imageUrl : photo(item.imageUrl || demoMenu[index % demoMenu.length].imageUrl, 700)} alt={item.name} loading="lazy"/><span className="dish-tag">{item.tag || item.categoryName?.toUpperCase()}</span><button className="dish-add" onClick={() => setQuantity(item.id, (cart[item.id] || 0) + 1)} aria-label={`Add ${item.name} to bag`}>{cart[item.id] ? `${cart[item.id]} IN BAG  +` : 'ADD TO BAG  +'}</button></div><div className="dish-info"><div><h3>{item.name}</h3><p>{item.description}</p></div><span className="dish-price">{money(item.price)}</span></div></article>)}</div>
        {visibleItems.length === 0 && <div className="empty-menu">Nothing by that name yet. Try another search.</div>}
      </section>

      <section id="story" className="story-section"><div className="story-image"><img src={photo('photo-1547592180-85f173990554', 1100)} alt="Seasonal produce and ingredients in our kitchen" loading="lazy"/><span>GOOD THINGS GROW HERE</span></div><div className="story-copy"><div className="eyebrow"><span className="eyebrow-line"/> A TABLE WITH A POINT OF VIEW</div><h2>Not fast food.<br/><em>Not fussy food.</em><br/>Just really good<br/>food.</h2><p>We started Restro with a simple idea: the best meal is one you can feel good about. So we follow the seasons, know our growers, and make room at the table for everyone.</p><a href="#visit" className="text-link">MORE ABOUT OUR LITTLE PLACE <span>↗</span></a><div className="story-flower">✳</div></div></section>

      <section id="visit" className="visit-section"><div><div className="eyebrow"><span className="eyebrow-line"/> THERE'S A SEAT FOR YOU</div><h2>See you <em>soon?</em></h2></div><div className="visit-details"><p>12 Garden Lane, Indiranagar<br/>Bengaluru, Karnataka 560038</p><p>Every day, 11 in the morning<br/>until the last good bite.</p><a href="#menu" className="button-dark">ORDER A LITTLE JOY <span>↗</span></a></div></section>
    </main>

    <footer className="site-footer"><a href="#home" className="brand footer-brand"><span className="brand-mark">r<span>✳</span></span><span className="brand-name">restro<span>GOOD THINGS, GROWN SLOW</span></span></a><span>MADE WITH CARE, IN BENGALURU · © 2026</span><span>INSTAGRAM&nbsp; ↗</span></footer>
    {cartCount > 0 && <button className="sticky-bag" onClick={() => setBagOpen(true)}><span>{cartCount} LOVELY THING{cartCount > 1 ? 'S' : ''}</span><span>VIEW YOUR BAG&nbsp; ↗</span></button>}
    {bagOpen && <div className="bag-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setBagOpen(false); }}><aside className="bag-drawer"><div className="bag-head"><div><span className="eyebrow">THE GOOD STUFF</span><h2>Your bag<span>.</span></h2></div><button className="bag-close" onClick={() => setBagOpen(false)} aria-label="Close bag">×</button></div>{cartItems.length ? <><div className="bag-items">{cartItems.map((item) => <div className="bag-item" key={item.id}><img src={item.imageUrl?.startsWith('http') ? item.imageUrl : photo(item.imageUrl, 180)} alt=""/><div className="bag-item-info"><b>{item.name}</b><span>{money(item.price)}</span><div className="quantity-control"><button onClick={() => setQuantity(item.id, item.quantity - 1)} aria-label="Remove one">−</button><span>{item.quantity}</span><button onClick={() => setQuantity(item.id, item.quantity + 1)} aria-label="Add one">+</button></div></div></div>)}</div><div className="bag-summary"><div><span>SUBTOTAL</span><b>{money(subtotal)}</b></div><p>Delivery and taxes, if any, are added at checkout.</p><button className="button-dark checkout-button">LET'S CHECK OUT <span>↗</span></button></div></> : <div className="bag-empty"><span>✳</span><p>Your bag is taking a little breather.</p><button onClick={() => setBagOpen(false)}>FIND SOMETHING GOOD ↗</button></div>}</aside></div>}
  </div>;
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const today = new Date();
  const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(today).toUpperCase();
  const shortDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(today).toUpperCase();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const orders = [
    { id: 'RS-2048', customer: 'Mira Kapoor', items: 'Sunday Bowl × 2, Peach Fizz × 1', type: 'PICKUP', total: 870, status: 'PREPARING', color: 'amber' },
    { id: 'RS-2047', customer: 'Arjun Rao', items: 'Burrata & Peaches × 1', type: 'DINE IN · T04', total: 420, status: 'READY', color: 'green' },
    { id: 'RS-2046', customer: 'Sana Das', items: 'Butter Noodles × 1, Citrus Salad × 1', type: 'DELIVERY', total: 675, status: 'NEW ORDER', color: 'rose' },
    { id: 'RS-2045', customer: 'Dev Mehta', items: 'Carrot Toast × 2', type: 'DINE IN · T02', total: 620, status: 'SERVED', color: 'gray' }
  ];
  return <div className="admin-shell"><aside className="admin-sidebar"><a href="/" className="brand admin-brand"><span className="brand-mark">r<span>✳</span></span><span className="brand-name">restro<span>THE BACK OF HOUSE</span></span></a><div className="admin-workspace"><span className="workspace-dot"/> The Indiranagar Room <span>⌄</span></div><span className="sidebar-label">WORKSPACE</span><nav className="admin-nav">{[['◫','Overview'],['◷','Live orders'],['▦','Menu & dishes'],['⌑','Reservations'],['◌','Guests']].map(([icon, label]) => <button key={label} onClick={() => setActiveTab(label)} className={activeTab === label ? 'admin-nav-item selected' : 'admin-nav-item'}><span>{icon}</span>{label}{label === 'Live orders' && <i>3</i>}</button>)}</nav><span className="sidebar-label insights-label">INSIGHTS</span><nav className="admin-nav">{[['↗','Analytics'],['◉','Reviews'],['⚙','Settings']].map(([icon,label])=><button className={activeTab===label?'admin-nav-item selected':'admin-nav-item'} key={label} onClick={()=>setActiveTab(label)}><span>{icon}</span>{label}</button>)}</nav><div className="sidebar-bottom"><div className="admin-avatar">S</div><div><b>Sofia Bennett</b><span>Restaurant owner</span></div><button aria-label="Account options">···</button></div></aside>
    <main className="admin-main"><header className="admin-topbar"><div className="admin-breadcrumb">RESTRO <span>/</span> {activeTab.toUpperCase()}</div><div className="admin-top-actions"><span className="service-status"><i/> SERVICE IS LIVE</span><button className="notification-button" aria-label="Notifications">♧<i/></button><a className="preview-site" href="/">VIEW YOUR SITE ↗</a></div></header><div className="admin-content"><div className="admin-title-row"><div><span className="eyebrow">{longDate} <span className="title-separator">·</span> A LOVELY DAY TO BE OPEN</span><h1>{greeting}, Sofia <span>✳</span></h1><p>Here’s the little picture of how things are going today.</p></div><button className="date-button">◷ &nbsp; TODAY, {shortDate} &nbsp;⌄</button></div><section className="stats-grid">{[['TODAY’S REVENUE','₹28,450','↑ 12.8%','from last Saturday','revenue'],['ORDERS TODAY','68','↑ 8.2%','from last Saturday','orders'],['AVERAGE ORDER','₹418','↑ 3.4%','from last Saturday','average'],['TABLES TURNED','4.2×','↑ 0.6','from last Saturday','tables']].map(([label,value,growth,caption,kind])=><article className="stat-card" key={kind}><div className="stat-label">{label}<span>↗</span></div><div className="stat-value">{value}</div><div className="stat-change"><b>{growth}</b> {caption}</div><div className={`sparkline ${kind}`}><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/></div></article>)}</section><section className="admin-grid"><article className="orders-panel"><div className="panel-heading"><div><span className="eyebrow">THE KITCHEN IS HUMMING</span><h2>Live orders <span className="live-pulse"/></h2></div><button className="all-orders" onClick={()=>setActiveTab('Live orders')}>ALL ORDERS ↗</button></div><div className="orders-table"><div className="orders-table-head"><span>ORDER</span><span>WHAT THEY ORDERED</span><span>TYPE</span><span>TOTAL</span><span>STATUS</span></div>{orders.map((order)=><div className="order-row" key={order.id}><div><b>{order.id}</b><span>{order.customer}</span></div><p>{order.items}</p><span className="order-type">{order.type}</span><b>{money(order.total)}</b><span className={`order-status ${order.color}`}>{order.status}</span></div>)}</div><button className="mobile-orders-link" onClick={()=>setActiveTab('Live orders')}>SEE ALL ORDERS ↗</button></article><aside className="side-panels"><article className="covers-panel"><div className="panel-heading"><div><span className="eyebrow">TODAY, AT A GLANCE</span><h2>Coming by.</h2></div><button>↗</button></div><div className="covers-count">24 <span>covers expected</span></div><div className="cover-progress"><i/></div><div className="covers-meta"><span>9 seated</span><span>15 to come</span></div><div className="next-reservation"><span className="reservation-time">1:30 <small>PM</small></span><span><b>Table for two</b><small>Layla Chen · Patio</small></span><span className="reservation-ready">IN 12 MIN</span></div></article><article className="top-dish-panel"><div className="panel-heading"><div><span className="eyebrow">THE PEOPLE HAVE SPOKEN</span><h2>Top dish.</h2></div><button>···</button></div><div className="top-dish"><img src={photo(demoMenu[0].imageUrl,200)} alt="The Sunday Bowl"/><span><b>The Sunday Bowl</b><small>38 ordered today</small></span><strong>₹345</strong></div><div className="top-dish-note"><span>✳</span> A little ahead of last week. Keep the good stuff coming.</div></article></aside></section><footer className="admin-footer"><span>GOOD WORK TODAY, SOFIA. KEEP IT LOVELY. ✳</span><span>LAST UPDATED JUST NOW &nbsp;·&nbsp; <a href="/">BACK TO YOUR SITE ↗</a></span></footer></div></main></div>;
}

export default App;
