/* ============================================================
   PHẦN 1 — GIAO DIỆN (chạy độc lập, luôn hoạt động dù Firebase lỗi)
   ============================================================ */

/* ---------- Tên khách mời: tự động đọc từ link ----------
   Cách 1 (khuyên dùng) - mã hoá Base64 gắn sau dấu # (fragment), ví dụ: #g=QW5oIE1pbmg...
     Dùng dấu # thay vì ?  vì Messenger có thể tự động cắt bỏ toàn bộ phần "?..." (query string)
     khi xử lý link chia sẻ - còn phần sau dấu # thì không bị gửi lên server, không bị đụng tới.
   Cách 2 (dự phòng) - mã hoá Base64 gắn sau dấu ?, ví dụ: ?g=QW5oIE1pbmg... (dùng khi mở trực tiếp
     bằng trình duyệt thường, không qua app chat hay bọc link)
   Cách 3 (dự phòng, tương thích link cũ nhất) - tên trực tiếp, ví dụ: ?to=Anh Minh và gia đình
 
   Dù theo cách nào, tên đầy đủ sau khi lấy được sẽ xử lý giống nhau:
   - Ngoài phong bì: chỉ hiện phần TÊN NGẮN (trước chữ "và") -> "Anh Minh"
   - Trong phần Event: hiện NGUYÊN VĂN đầy đủ -> "Anh Minh và gia đình"
*/
function decodeGuestCode(code){
  try{
    let base64 = code.replace(/-/g, '+').replace(/_/g, '/');
    while(base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }catch(e){
    return ''; // mã lỗi/không hợp lệ -> bỏ qua, không hiện gì sai lệch
  }
}
 
(function fillGuestName(){
  const hashStr = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const hashParams = new URLSearchParams(hashStr);
  const searchParams = new URLSearchParams(window.location.search);
 
  const guestCode = (hashParams.get('g') || searchParams.get('g') || '').trim();
  let guestName = guestCode ? decodeGuestCode(guestCode) : '';
 
  if(!guestName){
    guestName = (searchParams.get('to') || searchParams.get('ten') || searchParams.get('guest') || '').trim();
  }
 
  if(!guestName) return; // không có tên trong link -> giữ nguyên chữ mặc định "Bạn"
 
  // tách phần tên ngắn gọn (trước chữ " và ") để dùng ngoài phong bì
  function extractShortName(fullName){
    const idx = fullName.indexOf(' và ');
    if(idx === -1) return fullName; // không có chữ "và" -> dùng nguyên cả chuỗi
    return fullName.slice(0, idx).trim();
  }
  const shortName = extractShortName(guestName);
 
  // textContent tự động escape, an toàn trước việc chèn mã độc qua link
  document.querySelectorAll('.guest-name-fill').forEach(el => {
    el.textContent = guestName; // tên đầy đủ - dùng trong phần Event
  });
  document.querySelectorAll('.guest-name-short-fill').forEach(el => {
    el.textContent = shortName; // chỉ tên - dùng ngoài phong bì
  });
 
  // hiện dòng "Kính mời: ..." trên phong bì (mặc định đang ẩn khi chưa có tên)
  const luxGuestRow = document.getElementById('lux-guest-row');
  if(luxGuestRow) luxGuestRow.hidden = false;
 
  // hiện tên khách dưới tiêu đề "Trân trọng kính mời" ở phần Lễ Cưới
  const eventGuestName = document.getElementById('event-guest-name');
  if(eventGuestName) eventGuestName.hidden = false;
})();

/* ---------- Mở thiệp: chạm vào dấu sáp ---------- */
const cover = document.getElementById('cover');
const envelope = document.getElementById('envelope');
const waxSeal = document.getElementById('wax-seal');
const audio = document.getElementById('bg-audio');
const musicBtn = document.getElementById('music-btn');
const openingCaption = document.getElementById('opening-caption');
let coverOpened = false;

function openInvitation(){
  if(coverOpened) return;
  coverOpened = true;

  // 1. dấu sáp vỡ ra + ruy băng tách đôi
  envelope.classList.add('open');

  if(audio && audio.getAttribute('src')){
    audio.play()
      .then(()=> musicBtn.classList.add('spin'))
      .catch(err=> console.warn('Nhạc nền không tự phát được (thường do trình duyệt chặn autoplay hoặc sai đường dẫn file):', err));
  }

  // 2. sau khi animation chạy xong, fade toàn bộ cover ra
  setTimeout(()=>{
    cover.classList.add('hide');
    setTimeout(()=> cover.style.display='none', 700);

    // 3. ngay khi cover vừa mờ đi, cho chữ "Preserve the moment" xuất hiện động
    if(openingCaption) openingCaption.classList.add('show');
  }, 750);
}

// chạm vào dấu sáp hoặc bất kỳ đâu trên thiệp đều mở được
if(waxSeal) waxSeal.addEventListener('click', openInvitation);
if(cover) cover.addEventListener('click', openInvitation);

if(musicBtn){
  musicBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    if(!audio || !audio.getAttribute('src')) return;
    if(audio.paused){
      audio.play()
        .then(()=> musicBtn.classList.add('spin'))
        .catch(err=> console.warn('Không phát được nhạc:', err));
    } else {
      audio.pause();
      musicBtn.classList.remove('spin');
    }
  });
}

/* ---------- Đếm ngược ---------- */
// Countdown — đặt đúng ngày giờ cưới tại đây
const weddingDate = new Date('2026-10-25T10:00:00+07:00').getTime();

function updateCountdown(){
  const now = Date.now();
  let diff = weddingDate - now;
  if(diff < 0) diff = 0;
  const d = Math.floor(diff / (1000*60*60*24));
  const h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
  const m = Math.floor((diff % (1000*60*60)) / (1000*60));
  const s = Math.floor((diff % (1000*60)) / 1000);
  const elD = document.getElementById('cd-days');
  const elH = document.getElementById('cd-hours');
  const elM = document.getElementById('cd-mins');
  const elS = document.getElementById('cd-secs');
  if(elD) elD.textContent = String(d).padStart(2,'0');
  if(elH) elH.textContent = String(h).padStart(2,'0');
  if(elM) elM.textContent = String(m).padStart(2,'0');
  if(elS) elS.textContent = String(s).padStart(2,'0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* ---------- Lightbox: xem ảnh toàn màn hình, vuốt trượt ngang thật (track carousel) ---------- */
const lightbox = document.getElementById('lightbox');
const lightboxViewport = document.getElementById('lightbox-viewport');
const lightboxTrack = document.getElementById('lightbox-track');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
const lightboxCounter = document.getElementById('lightbox-counter');

const galleryImages = Array.from(document.querySelectorAll('.g-item')).map(item => item.getAttribute('data-full'));
let currentImgIndex = 0;   // chỉ số ảnh THẬT (0..N-1) — dùng để hiển thị số đếm, ẩn/hiện nút, v.v.
let trackPosition = 1;     // vị trí trong dải ảnh MỞ RỘNG (có thêm 2 ảnh nhân bản ở 2 đầu để vòng lặp mượt)
const TRANSITION_MS = 320; // khớp với thời gian transition CSS của .lightbox-track (.3s) + chút dự phòng

// dựng sẵn dải ảnh một lần duy nhất khi tải trang — nhân bản thêm ảnh cuối ở đầu và ảnh đầu ở cuối
// để khi vuốt/chuyển vòng qua ranh giới, track chỉ cần trượt đúng 1 bước, không phải "bay" ngược qua
// toàn bộ N ảnh ở giữa (đó là nguyên nhân gây giật khi chuyển từ ảnh cuối về ảnh đầu).
function buildSlide(src, i){
  const slide = document.createElement('div');
  slide.className = 'lightbox-slide';
  const img = document.createElement('img');
  img.src = src;
  img.alt = 'Ảnh cưới ' + (i + 1);
  img.draggable = false;
  img.loading = 'lazy';
  slide.appendChild(img);
  return slide;
}

if(lightboxTrack && galleryImages.length > 0){
  const N = galleryImages.length;
  if(N > 1) lightboxTrack.appendChild(buildSlide(galleryImages[N - 1], N - 1)); // clone ảnh cuối, đặt ở đầu
  galleryImages.forEach((src, i)=> lightboxTrack.appendChild(buildSlide(src, i)));
  if(N > 1) lightboxTrack.appendChild(buildSlide(galleryImages[0], 0));         // clone ảnh đầu, đặt ở cuối
}

function setTrackTransform(pos, instant){
  if(instant){
    lightboxTrack.style.transition = 'none';
    lightboxTrack.style.transform = 'translateX(-' + (pos * 100) + '%)';
    // ép trình duyệt áp dụng ngay rồi mới bật lại transition cho các lần chuyển sau
    void lightboxTrack.offsetHeight;
    lightboxTrack.style.transition = '';
  } else {
    lightboxTrack.style.transform = 'translateX(-' + (pos * 100) + '%)';
  }
}

function updateLightboxUI(){
  if(lightboxCounter) lightboxCounter.textContent = (currentImgIndex + 1) + ' / ' + galleryImages.length;
  const hideNav = galleryImages.length <= 1;
  if(lightboxPrev) lightboxPrev.hidden = hideNav;
  if(lightboxNext) lightboxNext.hidden = hideNav;
}

// nhảy trực tiếp tới đúng ảnh (mở lightbox từ 1 ảnh cụ thể) — luôn tức thời, không cần hiệu ứng vòng lặp
function showLightboxImage(index, instant){
  if(galleryImages.length === 0) return;
  currentImgIndex = (index + galleryImages.length) % galleryImages.length;
  trackPosition = currentImgIndex + 1; // +1 vì slide đầu tiên trong track mở rộng là ảnh clone
  setTrackTransform(trackPosition, instant);
  updateLightboxUI();
}

// chuyển sang ảnh kế tiếp — luôn trượt đúng 1 bước về phía trước, kể cả khi đang ở ảnh cuối cùng
// (lúc đó sẽ trượt êm vào slide clone, rồi mới lặng lẽ "dịch chuyển tức thời" về đúng ảnh đầu thật,
// không có transition nên mắt không nhận ra vì 2 ảnh giống hệt nhau)
function goToNextImage(){
  if(galleryImages.length <= 1) return;
  const wasLast = currentImgIndex === galleryImages.length - 1;
  currentImgIndex = (currentImgIndex + 1) % galleryImages.length;
  trackPosition += 1;
  setTrackTransform(trackPosition, false);
  updateLightboxUI();
  if(wasLast){
    setTimeout(()=>{
      trackPosition = 1; // vị trí thật của ảnh đầu tiên trong track mở rộng
      setTrackTransform(trackPosition, true);
    }, TRANSITION_MS);
  }
}

// chuyển về ảnh trước đó — tương tự, luôn trượt đúng 1 bước về phía sau
function goToPrevImage(){
  if(galleryImages.length <= 1) return;
  const wasFirst = currentImgIndex === 0;
  currentImgIndex = (currentImgIndex - 1 + galleryImages.length) % galleryImages.length;
  trackPosition -= 1;
  setTrackTransform(trackPosition, false);
  updateLightboxUI();
  if(wasFirst){
    setTimeout(()=>{
      trackPosition = galleryImages.length; // vị trí thật của ảnh cuối cùng
      setTrackTransform(trackPosition, true);
    }, TRANSITION_MS);
  }
}

document.querySelectorAll('.g-item').forEach((item, i)=>{
  item.addEventListener('click', ()=>{
    showLightboxImage(i, true);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

function closeLightbox(){
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}
if(lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if(lightboxPrev) lightboxPrev.addEventListener('click', (e)=>{ e.stopPropagation(); goToPrevImage(); });
if(lightboxNext) lightboxNext.addEventListener('click', (e)=>{ e.stopPropagation(); goToNextImage(); });
if(lightbox){
  lightbox.addEventListener('click', (e)=>{
    if(e.target === lightbox || e.target === lightboxViewport) closeLightbox(); // chạm ra ngoài ảnh để đóng
  });
}

// vuốt trái/phải để chuyển ảnh — track trượt theo ngón tay trong lúc vuốt, không chỉ đổi ảnh đột ngột
let touchStartX = 0;
let touchStartY = 0;
let isSwiping = false;
let swipeIntentDecided = false;
let swipeIsHorizontal = false;
let pendingDragPercent = null;
let dragRafId = null;

// gộp các lần cập nhật transform vào 1 khung hình (requestAnimationFrame) để vuốt mượt, không giật
function flushDragFrame(){
  dragRafId = null;
  if(pendingDragPercent === null) return;
  lightboxTrack.style.transform = 'translateX(calc(-' + (trackPosition * 100) + '% + ' + pendingDragPercent + '%))';
  pendingDragPercent = null;
}

if(lightboxViewport){
  lightboxViewport.addEventListener('touchstart', (e)=>{
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
    isSwiping = true;
    swipeIntentDecided = false;
    swipeIsHorizontal = false;
    lightboxTrack.style.transition = 'none';
  }, { passive: true });

  lightboxViewport.addEventListener('touchmove', (e)=>{
    if(!isSwiping) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    if(!swipeIntentDecided){
      // chỉ quyết định 1 lần: vuốt ngang (đổi ảnh) hay vuốt dọc (cuộn trang)
      if(Math.abs(dx) > 8 || Math.abs(dy) > 8){
        swipeIsHorizontal = Math.abs(dx) > Math.abs(dy);
        swipeIntentDecided = true;
      }
    }

    if(swipeIsHorizontal){
      e.preventDefault(); // chặn cuộn trang khi đang vuốt ngang đổi ảnh
      const viewportWidth = lightboxViewport.clientWidth || 1;
      pendingDragPercent = (dx / viewportWidth) * 100;
      if(dragRafId === null){
        dragRafId = requestAnimationFrame(flushDragFrame);
      }
    }
  }, { passive: false });

  lightboxViewport.addEventListener('touchend', (e)=>{
    if(!isSwiping) return;
    isSwiping = false;

    if(dragRafId !== null){
      cancelAnimationFrame(dragRafId);
      dragRafId = null;
    }
    pendingDragPercent = null;
    lightboxTrack.style.transition = '';

    if(!swipeIsHorizontal){
      setTrackTransform(trackPosition, false); // không phải vuốt ngang -> giữ nguyên ảnh hiện tại
      return;
    }

    const dx = e.changedTouches[0].clientX - touchStartX;
    const viewportWidth = lightboxViewport.clientWidth || 1;
    const SWIPE_RATIO = 0.18; // vuốt qua ~18% chiều rộng khung là đủ để chuyển ảnh

    if(Math.abs(dx) / viewportWidth > SWIPE_RATIO){
      if(dx < 0) goToNextImage(); // vuốt sang trái -> ảnh sau
      else goToPrevImage();        // vuốt sang phải -> ảnh trước
    } else {
      setTrackTransform(trackPosition, false); // vuốt chưa đủ xa -> bật lại đúng ảnh hiện tại
    }
  }, { passive: true });
}

// hỗ trợ phím mũi tên trái/phải trên máy tính
document.addEventListener('keydown', (e)=>{
  if(!lightbox.classList.contains('open')) return;
  if(e.key === 'ArrowRight') goToNextImage();
  if(e.key === 'ArrowLeft') goToPrevImage();
  if(e.key === 'Escape') closeLightbox();
});

/* ---------- Hộp quà: chạm để mở, hiện QR ---------- */
const qrModal = document.getElementById('qr-modal');
const qrModalImg = document.getElementById('qr-modal-img');
const qrModalName = document.getElementById('qr-modal-name');
const qrModalBank = document.getElementById('qr-modal-bank');
const qrModalStk = document.getElementById('qr-modal-stk');
const qrModalHolder = document.getElementById('qr-modal-holder');
const qrCopyBtn = document.getElementById('qr-copy-btn');
const qrClose = document.getElementById('qr-close');
const copyToast = document.getElementById('copy-toast');
let toastTimer = null;
let currentStk = '';

function fallbackCopy(text, cb){
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try{ document.execCommand('copy'); cb(); }catch(e){}
  document.body.removeChild(ta);
}

document.querySelectorAll('.gift-box').forEach(box=>{
  box.addEventListener('click', ()=>{
    box.classList.add('opening');

    setTimeout(()=>{
      qrModalName.textContent = box.dataset.name;
      qrModalImg.src = box.dataset.qr;
      qrModalBank.textContent = box.dataset.bank;
      qrModalStk.textContent = box.dataset.stk;
      qrModalHolder.textContent = box.dataset.holder;
      currentStk = box.dataset.stk;
      qrModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }, 380);

    setTimeout(()=> box.classList.remove('opening'), 900);
  });
});

function closeQrModal(){
  qrModal.classList.remove('open');
  document.body.style.overflow = '';
}
if(qrClose) qrClose.addEventListener('click', closeQrModal);
if(qrModal){
  qrModal.addEventListener('click', (e)=>{
    if(e.target === qrModal) closeQrModal();
  });
}

if(qrCopyBtn){
  qrCopyBtn.addEventListener('click', ()=>{
    if(!currentStk) return;
    const done = ()=>{
      qrCopyBtn.textContent = 'Đã chép';
      qrCopyBtn.classList.add('copied');
      copyToast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(()=>{
        copyToast.classList.remove('show');
        qrCopyBtn.textContent = 'Sao chép';
        qrCopyBtn.classList.remove('copied');
      }, 1800);
    };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(currentStk).then(done).catch(()=>fallbackCopy(currentStk, done));
    } else {
      fallbackCopy(currentStk, done);
    }
  });
}

/* ---------- Scroll reveal: chữ xuất hiện mượt khi vuốt xuống ---------- */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

if(prefersReducedMotion){
  revealEls.forEach(el => el.classList.add('revealed'));
} else {
  document.querySelectorAll('section').forEach(section=>{
    const items = section.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    items.forEach((el, i)=>{
      el.style.transitionDelay = Math.min(i * 0.07, 0.28) + 's';
    });
  });

  // kích hoạt sớm hơn 1 chút (ngay khi phần tử vừa chạm mép dưới màn hình) để cảm giác
  // luôn "đón đầu" theo đà cuộn, không bị khựng lại rồi mới bừng sáng
  const revealObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -2% 0px' });

  revealEls.forEach(el => revealObserver.observe(el));
}


/* ============================================================
   PHẦN 2 — FIREBASE (RSVP / lời chúc / thả tim)
   Toàn bộ được bọc try/catch: nếu chưa cấu hình Firebase hoặc
   mất mạng, các phần này chỉ báo lỗi nhẹ chứ KHÔNG làm hỏng
   giao diện hay khiến thiệp không mở được.
   ============================================================ */
let db = null;

try{
  // ⚠️ THAY CÁC GIÁ TRỊ DƯỚI ĐÂY BẰNG CONFIG FIREBASE CỦA BẠN
  // (Lấy tại: Firebase Console > Project Settings > General > Your apps > SDK setup and configuration)
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
	  apiKey: "AIzaSyBnijOQ53VhUdRy0YUwrD8uiZWa7IgFlOI",
	  authDomain: "wdbinhthao.firebaseapp.com",
	  databaseURL: "https://wdbinhthao-default-rtdb.asia-southeast1.firebasedatabase.app",
	  projectId: "wdbinhthao",
	  storageBucket: "wdbinhthao.firebasestorage.app",
	  messagingSenderId: "233769001209",
	  appId: "1:233769001209:web:e72aa4c53cef5545c68228",
	  measurementId: "G-HXEKMYH4SK"
  };

  if(typeof firebase !== 'undefined'){
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
  } else {
    console.warn('Firebase SDK chưa tải được — RSVP / lời chúc / thả tim sẽ tạm không hoạt động.');
  }
}catch(err){
  console.error('Lỗi khởi tạo Firebase:', err);
}

/* ---------- RSVP ---------- */
const rsvpForm = document.getElementById('rsvp-form');
if(rsvpForm){
  rsvpForm.addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.getElementById('rsvp-name').value.trim();
    const attend = document.querySelector('input[name="attend"]:checked').value;
    const count = document.getElementById('rsvp-count').value;
    if(!name) return;

    if(!db){
      alert('Chưa kết nối được hệ thống, vui lòng thử lại sau.');
      return;
    }

    db.ref('rsvp').push({
      name, attend, count,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    }).then(()=>{
      document.getElementById('rsvp-thanks').style.display = 'block';
      rsvpForm.reset();
    }).catch(err=>{
      alert('Có lỗi khi gửi, vui lòng thử lại.');
      console.error(err);
    });
  });
}

// highlight radio selection style
document.querySelectorAll('#rsvp-attend-row label').forEach(l=>{
  l.addEventListener('click', ()=>{
    document.querySelectorAll('#rsvp-attend-row label').forEach(x=>x.classList.remove('active'));
    l.classList.add('active');
  });
});

/* ---------- Wishes ---------- */
const wishList = document.getElementById('wish-list');

function renderWish(key, data){
  const el = document.createElement('div');
  el.className = 'wish-card';
  el.id = 'wish-' + key;
  const time = data.createdAt ? new Date(data.createdAt).toLocaleString('vi-VN') : '';
  el.innerHTML = `<div class="wname"></div><div class="wtext"></div><div class="wtime"></div>`;
  el.querySelector('.wname').textContent = data.name || 'Ẩn danh';
  el.querySelector('.wtext').textContent = data.text || '';
  el.querySelector('.wtime').textContent = time;
  wishList.prepend(el);
}

if(db){
  try{
    db.ref('wishes').limitToLast(100).on('child_added', snap=>{
      renderWish(snap.key, snap.val());
    });
    db.ref('wishes').on('child_removed', snap=>{
      const el = document.getElementById('wish-' + snap.key);
      if(el) el.remove();
    });
  }catch(err){
    console.error('Lỗi tải lời chúc:', err);
  }
}

const wishSend = document.getElementById('wish-send');
if(wishSend){
  wishSend.addEventListener('click', ()=>{
    const name = document.getElementById('wish-name').value.trim() || 'Ẩn danh';
    const text = document.getElementById('wish-text').value.trim();
    if(!text) return;

    if(!db){
      alert('Chưa kết nối được hệ thống, vui lòng thử lại sau.');
      return;
    }

    db.ref('wishes').push({
      name, text,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    }).then(()=>{
      document.getElementById('wish-text').value = '';
    }).catch(err=>{
      alert('Không gửi được lời chúc, vui lòng thử lại.');
      console.error(err);
    });
  });
}

/* ---------- Heart / like counter (realtime, shared) ---------- */
const heartBtn = document.getElementById('heart-fab');
if(heartBtn){
  heartBtn.addEventListener('click', ()=>{
    if(db){
      try{ db.ref('likes').transaction(v => (v || 0) + 1); }catch(err){ console.error(err); }
    }
    spawnFloatingHeart();
  });
}

function spawnFloatingHeart(){
  const h = document.createElement('div');
  h.className = 'float-heart';
  h.textContent = '❤';
  const rect = heartBtn.getBoundingClientRect();
  h.style.left = (rect.left + 14) + 'px';
  h.style.top = (rect.top) + 'px';
  document.body.appendChild(h);
  setTimeout(()=>h.remove(), 1600);
}
