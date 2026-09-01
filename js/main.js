// ============================================
// ESSBEE SYSTEM & SOLUTIONS — MAIN JS
// Includes: Navbar, Particles, Scroll Reveal,
//           Portfolio Filter/Modal, Offers CRUD,
//           Admin Panel, Testimonials, Back-to-Top
// ============================================

// ---- RENDER OFFERS (FROM BACKEND) ----
async function fetchOffers() {
  try {
    const res = await fetch('/api/offers');
    const offers = await res.json();
    renderOffers(offers);
    renderAdminOffersList(offers);
  } catch (err) {
    console.error("Failed to load offers", err);
  }
}

function renderOffers(offers) {
  const grid = document.getElementById('offersGrid');
  if (!grid) return;

  grid.innerHTML = '';

  if (offers.length === 0) {
    grid.innerHTML = `
      <div class="offers-empty">
        <div class="offers-empty-icon">📭</div>
        <p>No active offers right now. Check back soon!</p>
      </div>`;
    return;
  }

  offers.forEach(offer => {
    let pricingHTML = '';
    if (offer.single_price || offer.multi_price) {
      pricingHTML = `
      <div style="margin-bottom:12px;">
        <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Current Price</div>
        <div class="offer-pricing">`;
      if (offer.single_price) {
        pricingHTML += `
            <div class="offer-price-item">
              <div class="offer-price-label">Single-User</div>
              <div class="offer-price-value">${offer.single_price}</div>
              <div class="offer-price-gst">+18% GST</div>
            </div>`;
      }
      if (offer.multi_price) {
        pricingHTML += `
            <div class="offer-price-item">
              <div class="offer-price-label">Multi-User</div>
              <div class="offer-price-value">${offer.multi_price}</div>
              <div class="offer-price-gst">+18% GST</div>
            </div>`;
      }
      pricingHTML += `</div></div>`;
    }

    const noteHTML = offer.note ? `<div class="offer-note">${offer.note}</div>` : '';
    const validityHTML = offer.validity ? `<div class="offer-validity">📅 ${offer.validity}</div>` : '';

    const badgeClass = offer.badge_type === 'hot' ? 'offer-badge hot' : offer.badge_type === 'new' ? 'offer-badge new' : 'offer-badge';

    const card = document.createElement('div');
    card.className = 'offer-card reveal';
    card.dataset.offerId = offer.id;
    card.innerHTML = `
      <div class="offer-card-header">
        <div class="${badgeClass}">${offer.badge || '🎁 OFFER'}</div>
        <h3>${offer.title}</h3>
        <p class="offer-sub">${offer.subtitle || ''}</p>
      </div>
      <div class="offer-card-body">
        ${pricingHTML}
        ${noteHTML}
        ${validityHTML}
      </div>
      <div class="offer-card-footer">
        <button class="offer-cta offer-cta-primary" onclick="document.getElementById('contact').scrollIntoView({behavior:'smooth'})">
          ${offer.cta_text || 'Contact Us'}
        </button>
      </div>`;
    grid.appendChild(card);
  });

  // Re-observe newly added cards
  if (revealObserver) {
    grid.querySelectorAll('.reveal').forEach(el => {
      revealObserver.observe(el);
    });
  }
}

// ---- ADMIN OFFERS LIST (SECURE DASHBOARD) ----
function renderAdminOffersList(offers) {
  const list = document.getElementById('secureOffersTableBody');
  if (!list) return;
  
  list.innerHTML = '';
  if (offers.length === 0) {
    list.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:16px;">No offers found.</td></tr>';
    return;
  }
  
  offers.forEach(offer => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:16px; border-bottom:1px solid #e2e8f0; font-weight:600;">${offer.title}</td>
      <td style="padding:16px; border-bottom:1px solid #e2e8f0;">${offer.badge || '-'}</td>
      <td style="padding:16px; border-bottom:1px solid #e2e8f0;">
        ${offer.single_price ? '1U: '+offer.single_price : ''} <br>
        ${offer.multi_price ? 'MU: '+offer.multi_price : ''}
      </td>
      <td style="padding:16px; border-bottom:1px solid #e2e8f0;">${offer.validity || '-'}</td>
      <td style="padding:16px; border-bottom:1px solid #e2e8f0;">
        <button class="delete-offer-btn" data-id="${offer.id}" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:13px;">Delete</button>
      </td>
    `;
    list.appendChild(tr);
  });

  // Bind delete buttons
  document.querySelectorAll('.delete-offer-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (!confirm('Are you sure you want to delete this offer?')) return;
      const id = e.target.getAttribute('data-id');
      const token = localStorage.getItem('adminToken');
      
      try {
        const res = await fetch('/api/admin/offers/' + id, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
          fetchOffers(); // refresh UI
        } else {
          alert('Failed to delete offer');
        }
      } catch (err) {
        console.error(err);
      }
    });
  });
}

// ---- SCROLL REVEAL (global so renderOffers can use it) ----
let revealObserver;

document.addEventListener('DOMContentLoaded', () => {

  // ---- NAVBAR ----
  const navbar = document.getElementById('navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navMobile = document.querySelector('.nav-mobile');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
    updateActiveNav();
  });

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navMobile.classList.toggle('open');
  });

  navMobile.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navMobile.classList.remove('open');
    });
  });

  function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a, .nav-mobile a[href^="#"]');
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 130) current = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) link.classList.add('active');
    });
  }

  // ---- HERO PARTICLES ----
  const particleContainer = document.querySelector('.hero-particles');
  if (particleContainer) {
    const colors = ['#4A8DB5', '#7BBDD8', '#3DBEC5', '#9B8EC4', '#1C3D6B'];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 4 + 2;
      p.style.cssText = `width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random()*colors.length)]};left:${Math.random()*100}%;animation-duration:${Math.random()*15+10}s;animation-delay:${Math.random()*-20}s;`;
      particleContainer.appendChild(p);
    }
  }

  // ---- COUNTER ANIMATION ----
  function animateCounter(el) {
    const target = parseInt(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.floor(current) + suffix;
    }, 16);
  }

  // ---- SCROLL REVEAL SETUP ----
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Counter observer
  document.querySelectorAll('[data-count]').forEach(counter => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !counter.dataset.animated) {
          counter.dataset.animated = 'true';
          animateCounter(counter);
          obs.unobserve(counter);
        }
      });
    }, { threshold: 0.5 });
    obs.observe(counter);
  });

  // ---- OFFERS SECTION INIT ----
  fetchOffers();

  // ---- PORTFOLIO FILTER ----
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.portfolio-card').forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.style.display = show ? 'block' : 'none';
      });
    });
  });

  // ---- PORTFOLIO MODAL ----
  const modalOverlay = document.getElementById('portfolioModal');
  const modalClose = document.getElementById('modalClose');

  document.querySelectorAll('.portfolio-card').forEach(card => {
    card.querySelector('.portfolio-view-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('modalTitle').textContent = card.querySelector('h4').textContent;
      document.getElementById('modalDesc').textContent = card.querySelector('p').textContent;
      document.getElementById('modalCat').textContent = card.querySelector('.portfolio-cat').textContent;
      document.getElementById('modalTech').textContent = card.dataset.tech || '';
      modalOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() { modalOverlay.classList.remove('open'); document.body.style.overflow = ''; }
  modalClose?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

  // ---- CONTACT FORM ----
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.form-submit');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());
      
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        contactForm.style.display = 'none';
        formSuccess.classList.add('show');
      } else {
        alert('Failed to send message. Please try again.');
        btn.textContent = 'Send Message';
        btn.disabled = false;
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred. Please try again later.');
      btn.textContent = 'Send Message';
      btn.disabled = false;
    }
  });

  // ---- SERVICE CARD TILT ----
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.transform = `translateY(-8px) perspective(1000px) rotateX(${((y-r.height/2)/r.height)*-4}deg) rotateY(${((x-r.width/2)/r.width)*4}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  // ---- TYPED TEXT ----
  const typedEl = document.getElementById('typed-text');
  if (typedEl) {
    const words = ['Software', 'Solutions', 'Products', 'Technology'];
    let wi = 0, ci = 0, deleting = false;
    function type() {
      const w = words[wi];
      typedEl.textContent = deleting ? w.substring(0, ci - 1) : w.substring(0, ci + 1);
      deleting ? ci-- : ci++;
      let delay = deleting ? 80 : 120;
      if (!deleting && ci === w.length) { delay = 2000; deleting = true; }
      else if (deleting && ci === 0) { deleting = false; wi = (wi + 1) % words.length; delay = 400; }
      setTimeout(type, delay);
    }
    type();
  }

  // ---- BACK TO TOP ----
  const btt = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (btt) { btt.style.opacity = window.scrollY > 500 ? '1' : '0'; btt.style.pointerEvents = window.scrollY > 500 ? 'auto' : 'none'; }
  });
  btt?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ---- TESTIMONIAL INFINITE SCROLL ----
  const track = document.querySelector('.testimonial-track');
  if (track) track.innerHTML = track.innerHTML + track.innerHTML;

  // ---- LEADS ADMIN PANEL INTEGRATION ----
  const openLeadsAdminBtn = document.getElementById('openLeadsAdminBtn');
  const leadsAdminPanel = document.getElementById('leadsAdminPanel');
  const closeLeadsAdminBtn = document.getElementById('closeLeadsAdminBtn');
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const leadsTableBody = document.getElementById('leadsTableBody');

  function openLeadsAdmin() {
    leadsAdminPanel.style.display = 'block';
    document.body.style.overflow = 'hidden';
    const token = localStorage.getItem('adminToken');
    if (token) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  function closeLeadsAdmin() {
    leadsAdminPanel.style.display = 'none';
    document.body.style.overflow = '';
  }

  openLeadsAdminBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openLeadsAdmin();
  });

  closeLeadsAdminBtn?.addEventListener('click', closeLeadsAdmin);
  
  leadsAdminPanel?.addEventListener('click', (e) => {
    if (e.target === leadsAdminPanel) closeLeadsAdmin();
  });

  function showLogin() {
    loginSection.style.display = 'flex';
    dashboardSection.style.display = 'none';
  }

  function showDashboard() {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    fetchLeads();
    fetchOffers(); // Refresh offers list in dashboard too
  }

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        showDashboard();
      } else {
        loginError.textContent = data.error || 'Login failed';
        loginError.style.display = 'block';
      }
    } catch (err) {
      console.error(err);
      loginError.textContent = 'Network error';
      loginError.style.display = 'block';
    }
  });

  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    showLogin();
  });

  refreshBtn?.addEventListener('click', fetchLeads);

  // ---- SECURE OFFERS MANAGEMENT EVENTS ----
  const refreshOffersBtn = document.getElementById('refreshOffersBtn');
  refreshOffersBtn?.addEventListener('click', fetchOffers);

  const secureAddOfferForm = document.getElementById('secureAddOfferForm');
  secureAddOfferForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    if (!token) return showLogin();

    const data = {
      title: document.getElementById('sec-offer-title').value,
      subtitle: document.getElementById('sec-offer-subtitle').value,
      badge: document.getElementById('sec-offer-badge').value,
      badgeType: document.getElementById('sec-offer-badge-type').value,
      singlePrice: document.getElementById('sec-offer-single').value,
      multiPrice: document.getElementById('sec-offer-multi').value,
      note: document.getElementById('sec-offer-note').value,
      validity: document.getElementById('sec-offer-validity').value,
      ctaText: document.getElementById('sec-offer-cta').value
    };

    try {
      const res = await fetch('/api/admin/offers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        secureAddOfferForm.reset();
        fetchOffers(); // Refreshes both UI grids
        alert('Offer added successfully!');
      } else {
        alert('Failed to add offer');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding offer');
    }
  });

  async function fetchLeads() {
    const token = localStorage.getItem('adminToken');
    if (!token) return showLogin();

    try {
      const res = await fetch('/api/admin/leads', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        return showLogin();
      }

      const leads = await res.json();
      renderLeads(leads);
    } catch (err) {
      console.error(err);
      alert('Failed to load leads');
    }
  }

  function renderLeads(leads) {
    leadsTableBody.innerHTML = '';
    if (leads.length === 0) {
      leadsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:16px;">No leads found.</td></tr>';
      return;
    }

    leads.forEach(lead => {
      const tr = document.createElement('tr');
      const dateStr = lead.created_at.replace(' ', 'T') + 'Z';
      const date = new Date(dateStr).toLocaleString();
      tr.innerHTML = `
        <td style="padding:16px; border-bottom:1px solid #e2e8f0; color:#475569;">${date}</td>
        <td style="padding:16px; border-bottom:1px solid #e2e8f0; font-weight:600;">${lead.name}</td>
        <td style="padding:16px; border-bottom:1px solid #e2e8f0;"><a href="mailto:${lead.email}" style="color:#2563eb; text-decoration:none;">${lead.email}</a></td>
        <td style="padding:16px; border-bottom:1px solid #e2e8f0; color:#475569;">${lead.phone || '-'}</td>
        <td style="padding:16px; border-bottom:1px solid #e2e8f0; color:#475569;">${lead.message || '-'}</td>
        <td style="padding:16px; border-bottom:1px solid #e2e8f0;"><button class="delete-btn" data-id="${lead.id}" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:13px;">Delete</button></td>
      `;
      leadsTableBody.appendChild(tr);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (!confirm('Are you sure you want to delete this lead?')) return;
        
        const id = e.target.getAttribute('data-id');
        const token = localStorage.getItem('adminToken');
        
        try {
          const res = await fetch(`/api/admin/leads/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) fetchLeads();
          else alert('Failed to delete lead');
        } catch (err) {
          console.error(err);
        }
      });
    });
  }

});
