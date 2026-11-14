document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', e => setLanguage(e.target.value));
  }

  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === savedTheme);
    btn.addEventListener('click', () => {
      const t = btn.dataset.theme;
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('theme', t);
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const diffSelect = document.getElementById('diffSelect');
  if (diffSelect) {
    diffSelect.addEventListener('change', e => {
      if (game) game.setDifficulty(e.target.value);
    });
  }

  const hamburger = document.getElementById('hamburger');
  const sideMenu = document.getElementById('sideMenu');
  const overlay = document.getElementById('overlay');
  const closeMenu = document.getElementById('closeMenu');

  function openMenu() {
    sideMenu.classList.add('open');
    overlay.classList.add('show');
    hamburger.classList.add('active');
  }
  function closeMenuFn() {
    sideMenu.classList.remove('open');
    overlay.classList.remove('show');
    hamburger.classList.remove('active');
  }

  hamburger.addEventListener('click', () => {
    sideMenu.classList.contains('open') ? closeMenuFn() : openMenu();
  });
  closeMenu.addEventListener('click', closeMenuFn);
  overlay.addEventListener('click', closeMenuFn);

  document.querySelectorAll('.menu-list li').forEach(li => {
    li.addEventListener('click', () => {
      const page = li.dataset.page;
      document.querySelectorAll('.menu-list li').forEach(l => l.classList.remove('active'));
      li.classList.add('active');
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById(`page-${page}`).classList.add('active');
      closeMenuFn();
      if (page !== 'game' && game) game.stop();
    });
  });

  checkAuth();
  if (window.location.search.includes('logged_in=1')) {
    setTimeout(checkAuth, 600);
    window.history.replaceState({}, '', window.location.pathname);
  }

  initGame();
  const btnPlay = document.getElementById('btnPlay');
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  const btnRestart = document.getElementById('btnRestart');

  btnPlay.addEventListener('click', () => {
    if (game) {
      if (!game.running) game.start();
      else game.stop();
      btnPlay.textContent = game.running ? '⏸' : '▶';
    }
  });
  btnLeft.addEventListener('click', () => game?.turnLeft());
  btnRight.addEventListener('click', () => game?.turnRight());
  btnRestart.addEventListener('click', () => {
    game?.start();
    btnPlay.textContent = '⏸';
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') game?.turnLeft();
    if (e.key === 'ArrowRight' || e.key === 'd') game?.turnRight();
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      btnPlay.click();
    }
  });

  let leftInterval, rightInterval;
  btnLeft.addEventListener('touchstart', e => {
    e.preventDefault();
    game?.turnLeft();
    leftInterval = setInterval(() => game?.turnLeft(), 100);
  });
  btnLeft.addEventListener('touchend', () => clearInterval(leftInterval));
  btnRight.addEventListener('touchstart', e => {
    e.preventDefault();
    game?.turnRight();
    rightInterval = setInterval(() => game?.turnRight(), 100);
  });
  btnRight.addEventListener('touchend', () => clearInterval(rightInterval));

  document.getElementById('btnTiktok').addEventListener('click', async () => {
    const url = document.getElementById('tiktokUrl').value.trim();
    if (!url) return alert('URL daxil edin');
    const loading = document.getElementById('tiktokLoading');
    const result = document.getElementById('tiktokResult');
    loading.hidden = false;
    result.hidden = true;

    try {
      const res = await fetch('/api/tiktok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      loading.hidden = true;
      if (!data.success) {
        result.innerHTML = `<p style="color:var(--danger)">${data.error || 'Xəta'}</p>`;
        result.hidden = false;
        return;
      }
      result.innerHTML = `
        \( {data.cover ? `<img src=" \){data.cover}" style="width:100%;border-radius:10px;margin-bottom:12px" />` : ''}
        <p style="margin-bottom:8px;font-weight:600">${data.title || 'Video'}</p>
        <video src="${data.videoUrl}" controls playsinline style="width:100%;border-radius:10px"></video>
        <a href="${data.videoUrl}" target="_blank" download class="btn-primary" style="display:inline-block;margin-top:12px;text-decoration:none">📥 Yüklə</a>
      `;
      result.hidden = false;
    } catch (err) {
      loading.hidden = true;
      result.innerHTML = `<p style="color:var(--danger)">Server xətası</p>`;
      result.hidden = false;
    }
  });

  document.getElementById('btnQr').addEventListener('click', async () => {
    const text = document.getElementById('qrText').value.trim();
    if (!text) return alert('Mətn daxil edin');
    const size = document.getElementById('qrSize').value;
    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, size: parseInt(size) })
      });
      const data = await res.json();
      if (!data.success) return alert(data.error);
      document.getElementById('qrImage').src = data.dataUrl;
      document.getElementById('qrDownload').href = data.dataUrl;
      document.getElementById('qrResult').hidden = false;
    } catch (e) {
      alert('QR xətası');
    }
  });
});

async function checkAuth() {
  try {
    const res = await fetch('/api/user', { credentials: 'include' });
    const data = await res.json();
    const area = document.getElementById('userArea');
    if (data.loggedIn) {
      area.innerHTML = `
        \( {data.avatar ? `<img src=" \){data.avatar}" class="user-avatar" alt="avatar" />` : ''}
        <span class="user-name">${data.username}</span>
        <button class="btn-secondary" onclick="location.href='/auth/logout'" style="padding:6px 12px;font-size:0.8rem">Çıxış</button>
      `;
    } else {
      area.innerHTML = `<button class="btn-login" id="btnLogin">Discord ilə giriş</button>`;
      document.getElementById('btnLogin')?.addEventListener('click', () => {
        window.location.href = '/auth/discord';
      });
    }
  } catch (e) {
    console.log('Auth check failed');
  }
      }
