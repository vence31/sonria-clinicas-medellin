const sessionId = 'sonria_session_' + Math.random().toString(36).substring(2, 9);

// Sede Data
const SEDE_DATA = {
  laureles: { name: 'Sede Laureles - Naranjal', addr: 'Carrera 70 # 44B-29 (Barrio Naranjal)', hours: 'Lun-Vie 7:00 AM - 7:00 PM | Sáb 8:00 AM - 2:00 PM' },
  centro: { name: 'Sede Medellín Centro - El Palo', addr: 'Calle 52 # 45-06 (Sector El Palo)', hours: 'Lun-Vie 7:00 AM - 7:00 PM | Sáb 8:00 AM - 2:00 PM' },
  envigado: { name: 'Sede Envigado', addr: 'Calle 37 Sur # 43-57/59', hours: 'Lun-Vie 7:00 AM - 7:00 PM | Sáb 8:00 AM - 2:00 PM' },
  belen: { name: 'Sede Belén', addr: 'Calle 30 # 75-57', hours: 'Lun-Vie 7:30 AM - 6:30 PM | Sáb 8:00 AM - 1:00 PM' },
  itagui: { name: 'Sede Itagüí', addr: 'Calle 51 # 50-66', hours: 'Lun-Vie 7:00 AM - 6:30 PM | Sáb 8:00 AM - 1:00 PM' },
  bello: { name: 'Sede Bello', addr: 'Carrera 50 # 48-41', hours: 'Lun-Vie 7:00 AM - 7:00 PM | Sáb 8:00 AM - 2:00 PM' },
  rionegro: { name: 'Sede Rionegro', addr: 'Calle 50 # 48-27 (C.C. Multicompra)', hours: 'Lun-Vie 8:00 AM - 6:00 PM | Sáb 8:00 AM - 1:00 PM' }
};

const PRICE_MAP = {
  resinas: 350000,
  porcelana: 1400000,
  implante: 2800000,
  ortodoncia: 1800000,
  blanqueamiento: 450000,
  limpieza: 120000
};

// 1. Theme Management (Rule #12: Semantic Theming)
function initTheme() {
  const saved = localStorage.getItem('sonria-theme');
  const btn = document.getElementById('theme-toggle');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (btn) btn.innerText = '☀️';
  } else if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    if (btn) btn.innerText = '🌙';
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (btn) btn.innerText = '☀️';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('sonria-theme', next);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.innerText = next === 'dark' ? '☀️' : '🌙';
  }
}

// 2. Calculator
function runCopCalculator() {
  const treatmentEl = document.getElementById('calc-treatment');
  const qtyEl = document.getElementById('calc-qty');
  if (!treatmentEl || !qtyEl) return;

  const treatment = treatmentEl.value;
  const qty = parseInt(qtyEl.value) || 1;
  const unitPrice = PRICE_MAP[treatment] || 350000;
  
  const total = (treatment === 'ortodoncia' || treatment === 'blanqueamiento') ? unitPrice : (unitPrice * qty);
  const monthly = Math.round(total / 12);

  const totalEl = document.getElementById('res-total-cop');
  const monthlyEl = document.getElementById('res-monthly-cop');
  if (totalEl) totalEl.innerText = '$' + total.toLocaleString('es-CO') + ' COP';
  if (monthlyEl) monthlyEl.innerText = '$' + monthly.toLocaleString('es-CO') + ' COP/mes';
}

// 3. Sede Selector
function updateSedeDetails() {
  const dropdown = document.getElementById('sede-dropdown');
  if (!dropdown) return;
  const key = dropdown.value;
  const data = SEDE_DATA[key] || SEDE_DATA.laureles;
  const box = document.getElementById('sede-info-box');
  if (!box) return;
  box.innerHTML = `
    <p><strong>Dirección:</strong> ${data.addr}</p>
    <p><strong>Horario:</strong> ${data.hours}</p>
    <button class="btn-book-sede" onclick="bookInSede()">Agendar en esta Sede</button>
  `;
}

function bookInSede() {
  const dropdown = document.getElementById('sede-dropdown');
  const key = dropdown ? dropdown.value : 'laureles';
  const data = SEDE_DATA[key] || SEDE_DATA.laureles;
  sendQuickMessage('Hola, quiero agendar mi cita en la ' + data.name);
}

// 4. Voice Engine & Speech Recognition
let sonriaVoiceEnabled = true;
let sonriaAudio = null;
let sonriaRecognition = null;
let sonriaIsRecording = false;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  sonriaRecognition = new SpeechRec();
  sonriaRecognition.lang = 'es-CO';
  sonriaRecognition.continuous = false;
  sonriaRecognition.interimResults = false;

  sonriaRecognition.onstart = () => {
    sonriaIsRecording = true;
    const micBtn = document.getElementById('sonria-mic-btn');
    if (micBtn) micBtn.classList.add('mic-active');
    const callMicBtn = document.getElementById('call-mic-btn');
    if (callMicBtn) {
      callMicBtn.innerText = '🔴 Escuchando... Habla ahora';
      callMicBtn.style.background = '#ef4444';
    }
  };

  sonriaRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (transcript) {
      const dialModal = document.getElementById('dial-modal');
      if (dialModal && dialModal.style.display === 'flex') {
        const ivr = document.getElementById('ivr-output');
        if (ivr) ivr.innerText = 'Tú dijiste: "' + transcript + '"';
        sendQuickMessage(transcript);
      } else {
        const input = document.getElementById('user-input');
        if (input) input.value = transcript;
        submitMessage();
      }
    }
  };

  sonriaRecognition.onerror = (e) => {
    console.warn('Sonria Speech Recognition Error:', e);
    stopSonriaRecording();
  };

  sonriaRecognition.onend = () => {
    stopSonriaRecording();
  };
}

function stopSonriaRecording() {
  sonriaIsRecording = false;
  const micBtn = document.getElementById('sonria-mic-btn');
  if (micBtn) micBtn.classList.remove('mic-active');
  const callMicBtn = document.getElementById('call-mic-btn');
  if (callMicBtn) {
    callMicBtn.innerText = '🎙️ Hablar por Micrófono';
    callMicBtn.style.background = '#10b981';
  }
}

function toggleSonriaVoice() {
  if (!sonriaRecognition) {
    alert('Reconocimiento de voz no disponible en este navegador. Puedes escribir o escuchar la voz de Camila.');
    return;
  }
  if (sonriaIsRecording) {
    sonriaRecognition.stop();
  } else {
    try {
      sonriaRecognition.start();
    } catch (e) {
      console.error(e);
    }
  }
}

function playSonriaNeuralVoice(text) {
  if (!sonriaVoiceEnabled || !text) return;
  if (sonriaAudio) {
    sonriaAudio.pause();
  }

  const voiceInd = document.getElementById('voice-indicator');
  if (voiceInd) voiceInd.style.display = 'flex';

  const cleanText = text.replace(/[\n\r]/g, ' ').replace(/[*_#`]/g, '').trim().substring(0, 350);
  const audioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}&voice=es-CO-SalomeNeural`;
  sonriaAudio = new Audio(audioUrl);

  sonriaAudio.onended = () => {
    if (voiceInd && !sonriaIsRecording) voiceInd.style.display = 'none';
  };

  sonriaAudio.onerror = () => {
    // Web Speech API fallback if server-side TTS endpoint not available (e.g. GitHub Pages)
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.lang = 'es-CO';
      utter.onend = () => { if (voiceInd) voiceInd.style.display = 'none'; };
      utter.onerror = () => { if (voiceInd) voiceInd.style.display = 'none'; };
      window.speechSynthesis.speak(utter);
    } else {
      if (voiceInd && !sonriaIsRecording) voiceInd.style.display = 'none';
    }
  };

  sonriaAudio.play().catch(e => {
    if (voiceInd && !sonriaIsRecording) voiceInd.style.display = 'none';
  });
}

// 5. Chat & Funnel State Machine (Supports local Node API & Static GitHub Pages)
let clientFunnelStep = 1;
let clientFunnelData = { treatment: 'Diseño de Sonrisa', sede: 'Laureles', date: '', name: '', phone: '' };

function getLocalAgentReply(msg) {
  const lower = msg.toLowerCase();

  if (clientFunnelStep === 1 || lower.includes('diseño') || lower.includes('carilla') || lower.includes('implante') || lower.includes('ortodoncia') || lower.includes('limpieza') || lower.includes('cita')) {
    clientFunnelStep = 2;
    return '¡Excelente elección! Para tu valoración, ¿En qué sede de Medellín te gustaría agendar? Tenemos sedes en Laureles, Centro, Envigado, Belén, Itagüí, Bello y Rionegro.';
  }

  if (clientFunnelStep === 2 || lower.includes('laureles') || lower.includes('centro') || lower.includes('envigado') || lower.includes('belen') || lower.includes('itagui') || lower.includes('bello') || lower.includes('rionegro')) {
    clientFunnelStep = 3;
    let sedeFound = 'Laureles';
    if (lower.includes('centro')) sedeFound = 'Centro';
    else if (lower.includes('envigado')) sedeFound = 'Envigado';
    else if (lower.includes('belen')) sedeFound = 'Belén';
    else if (lower.includes('itagui')) sedeFound = 'Itagüí';
    else if (lower.includes('bello')) sedeFound = 'Bello';
    else if (lower.includes('rionegro')) sedeFound = 'Rionegro';
    clientFunnelData.sede = sedeFound;
    return `Perfecto, Sede ${sedeFound} seleccionada. ¿Para qué día y horario te gustaría tu cita? (Ej: Este viernes en la mañana o sábado 10 AM)`;
  }

  if (clientFunnelStep === 3) {
    clientFunnelStep = 4;
    clientFunnelData.date = msg;
    return 'Entendido. Para confirmar tu reserva en el sistema de Sonría, por favor compártenos tu Nombre completo y número de celular (o WhatsApp):';
  }

  if (clientFunnelStep === 4) {
    clientFunnelStep = 1;
    clientFunnelData.name = msg;
    
    // Save to local leads storage
    try {
      const stored = JSON.parse(localStorage.getItem('sonria_local_leads') || '[]');
      const newLead = {
        id: stored.length + 1,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        treatment: clientFunnelData.treatment,
        sede: clientFunnelData.sede,
        preferred_date: clientFunnelData.date,
        name: clientFunnelData.name,
        estimated_cop: 2100000,
        status: 'agendado'
      };
      stored.unshift(newLead);
      localStorage.setItem('sonria_local_leads', JSON.stringify(stored));
      const badge = document.getElementById('lead-count-badge');
      if (badge) badge.innerText = stored.length;
    } catch (e) {}

    return `¡Tu solicitud de cita en Sonría Clínicas Odontológicas ha quedado registrada con éxito! Te hemos agendado en la Sede ${clientFunnelData.sede}. Un asesor de la línea #262 te contactará para confirmar el horario exacto. ¡Esperamos verte sonreír!`;
  }

  return '¡Con gusto te ayudamos! Puedes consultar nuestros precios en el cotizador, seleccionar tu sede más cercana o marcar gratis al #262 desde tu celular.';
}

function appendMessage(sender, text) {
  const stream = document.getElementById('chat-stream');
  if (!stream) return;
  const msgDiv = document.createElement('div');
  msgDiv.className = 'msg ' + (sender === 'user' ? 'outgoing' : 'incoming');

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  let formatted = (text || '')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  const now = new Date();
  const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

  bubble.innerHTML = `<p>${formatted}</p><span class="msg-time">${timeStr}</span>`;
  msgDiv.appendChild(bubble);
  stream.appendChild(msgDiv);
  stream.scrollTop = stream.scrollHeight;
}

async function submitMessage() {
  const input = document.getElementById('user-input');
  if (!input) return;
  const msg = input.value.trim();
  if (!msg) return;

  input.value = '';
  appendMessage('user', msg);

  const notice = document.getElementById('typing-notice');
  if (notice) notice.style.display = 'block';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message: msg })
    });
    
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    if (notice) notice.style.display = 'none';
    if (data.reply) {
      appendMessage('agent', data.reply);
      refreshLeadCount();
      playSonriaNeuralVoice(data.reply);
      const ivr = document.getElementById('ivr-output');
      if (ivr) ivr.innerText = '🔊 ' + data.reply.substring(0, 140) + '...';
    }
  } catch (err) {
    // Graceful static fallback (GitHub Pages)
    setTimeout(() => {
      if (notice) notice.style.display = 'none';
      const fallbackReply = getLocalAgentReply(msg);
      appendMessage('agent', fallbackReply);
      refreshLeadCount();
      playSonriaNeuralVoice(fallbackReply);
      const ivr = document.getElementById('ivr-output');
      if (ivr) ivr.innerText = '🔊 ' + fallbackReply.substring(0, 140) + '...';
    }, 450);
  }
}

function sendQuickMessage(msg) {
  const input = document.getElementById('user-input');
  if (input) {
    input.value = msg;
    submitMessage();
  }
}

async function resetChat() {
  try {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message: 'reiniciar' })
    });
  } catch (e) {}

  clientFunnelStep = 1;
  const stream = document.getElementById('chat-stream');
  if (stream) {
    stream.innerHTML = `
      <div class="date-badge">Hoy</div>
      <div class="msg incoming">
        <div class="bubble">
          <p>¡Hola! Bienvenido a <strong>Sonría Clínicas Odontológicas Medellín</strong> 🦷✨</p>
          <p>Soy <strong>Camila</strong>, tu asesora virtual. Puedes agendar tu valoración aquí o marcando gratis al <strong>#262</strong> desde tu celular.</p>
          <p>¿Para qué tratamiento o en qué sede te gustaría tu cita?</p>
          <span class="msg-time">09:00</span>
        </div>
      </div>
    `;
  }
}

// 6. Speed Dial #262 Simulator
function openDialModal() {
  const modal = document.getElementById('dial-modal');
  if (modal) modal.style.display = 'flex';
  const status = document.getElementById('call-status');
  if (status) status.innerText = 'Llamada conectada a Línea #262 Sonría...';
  const ivr = document.getElementById('ivr-output');
  if (ivr) ivr.innerText = '🔊 "¡Hola! Gracias por llamar a Sonría al #262. Soy Camila, tu asesora odontológica."';

  playSonriaNeuralVoice("Gracias por comunicarte con Sonría Clínicas Odontológicas al número 262. Soy Camila, ¿en qué sede te gustaría tu cita de valoración?");
}

function closeDialModal() {
  const modal = document.getElementById('dial-modal');
  if (modal) modal.style.display = 'none';
  if (sonriaAudio) sonriaAudio.pause();
  stopSonriaRecording();
}

async function pressIvr(opt) {
  const out = document.getElementById('ivr-output');
  if (out) out.innerText = 'Procesando opción ' + opt + '...';
  
  try {
    const res = await fetch('/api/speed-dial-262', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '3001234567', option: opt })
    });
    if (!res.ok) throw new Error('API dial failed');
    const data = await res.json();
    if (out) out.innerText = '🔊 ' + data.ivr_message;
    playSonriaNeuralVoice(data.ivr_message);
  } catch (e) {
    // Client-side fallback for static GitHub Pages
    const msgs = {
      '1': 'Opción 1 seleccionada: Nueva cita de valoración en Sonría Medellín. Por favor indica tu sede preferida.',
      '2': 'Opción 2 seleccionada: Confirmación de cita existente. Indícanos tu número de documento.',
      '3': 'Opción 3 seleccionada: Atención de urgencias odontológicas. Te conectaremos con la clínica de turno.'
    };
    const msg = msgs[opt] || 'Opción procesada correctamente.';
    if (out) out.innerText = '🔊 ' + msg;
    playSonriaNeuralVoice(msg);
  }
}

// 7. Admin CRM Modal
function openAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.style.display = 'flex';
  loadLeads();
}

function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.style.display = 'none';
}

async function loadLeads() {
  try {
    const res = await fetch('/api/leads');
    if (!res.ok) throw new Error('Failed to load server leads');
    const data = await res.json();
    if (!data.success) return;

    renderLeadsTable(data.leads, data.count);
  } catch (e) {
    // Render local leads fallback
    try {
      const stored = JSON.parse(localStorage.getItem('sonria_local_leads') || '[]');
      renderLeadsTable(stored, stored.length);
    } catch (err) {}
  }
}

function renderLeadsTable(leads, count) {
  const countEl = document.getElementById('stat-leads-count');
  const badgeEl = document.getElementById('lead-count-badge');
  if (countEl) countEl.innerText = count;
  if (badgeEl) badgeEl.innerText = count;

  let totalVal = 0;
  const tbody = document.getElementById('leads-tbody');
  if (!tbody) return;

  if (!leads || leads.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No hay citas registradas todavía.</td></tr>';
    const valEl = document.getElementById('stat-leads-val');
    if (valEl) valEl.innerText = '$0 COP';
    return;
  }

  tbody.innerHTML = '';
  leads.forEach(l => {
    totalVal += (l.estimated_cop || 0);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>#${l.id}</strong></td>
      <td>${l.created_at}</td>
      <td>${l.treatment}</td>
      <td><span style="color:#004b93;font-weight:600;">${l.sede}</span></td>
      <td>${l.preferred_date}</td>
      <td>${l.name}</td>
      <td>$${(l.estimated_cop || 0).toLocaleString('es-CO')} COP</td>
      <td><span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:10px;font-size:11px;">${l.status}</span></td>
    `;
    tbody.appendChild(tr);
  });

  const valEl = document.getElementById('stat-leads-val');
  if (valEl) valEl.innerText = '$' + totalVal.toLocaleString('es-CO') + ' COP';
}

async function refreshLeadCount() {
  try {
    const res = await fetch('/api/leads');
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const badge = document.getElementById('lead-count-badge');
        if (badge) badge.innerText = data.count;
        return;
      }
    }
  } catch (e) {}

  try {
    const stored = JSON.parse(localStorage.getItem('sonria_local_leads') || '[]');
    const badge = document.getElementById('lead-count-badge');
    if (badge) badge.innerText = stored.length;
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  runCopCalculator();
  updateSedeDetails();
  refreshLeadCount();

  const input = document.getElementById('user-input');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        submitMessage();
      }
    });
  }
});


// --- THREE.JS 3D DENTAL STUDIO ---
let studio3DInitialized = false;
let scene3D, camera3D, renderer3D, toothGroup3D, crownMesh3D, rootMesh3D, alignerMesh3D;
let isDragging3D = false, prevMousePos = { x: 0, y: 0 };

function init3DStudio() {
  if (studio3DInitialized) return;
  const container = document.getElementById('threejs-canvas-container');
  if (!container || typeof THREE === 'undefined') return;

  studio3DInitialized = true;
  scene3D = new THREE.Scene();
  const width = container.clientWidth || 550;
  const height = container.clientHeight || 400;
  camera3D = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera3D.position.set(0, 0, 7.5);

  renderer3D = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer3D.setSize(width, height);
  renderer3D.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = '';
  container.appendChild(renderer3D.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  scene3D.add(ambient);

  const keyLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
  keyLight.position.set(5, 5, 6);
  scene3D.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffb703, 0.7);
  fillLight.position.set(-5, -3, 4);
  scene3D.add(fillLight);

  toothGroup3D = new THREE.Group();

  // Anatomical Crown
  const crownGeo = new THREE.CylinderGeometry(1.3, 1.0, 1.8, 32, 16);
  const crownMat = new THREE.MeshPhysicalMaterial({
    color: 0xfdfdfd,
    roughness: 0.15,
    metalness: 0.05,
    transmission: 0.35,
    thickness: 0.8,
    clearcoat: 1.0
  });
  crownMesh3D = new THREE.Mesh(crownGeo, crownMat);
  crownMesh3D.position.y = 0.9;
  toothGroup3D.add(crownMesh3D);

  // Anatomical Root
  const rootGeo = new THREE.ConeGeometry(0.85, 2.4, 24);
  const rootMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.3,
    metalness: 0.85
  });
  rootMesh3D = new THREE.Mesh(rootGeo, rootMat);
  rootMesh3D.rotation.x = Math.PI;
  rootMesh3D.position.y = -1.2;
  toothGroup3D.add(rootMesh3D);

  // Invisible Aligner Shell
  const alignerGeo = new THREE.CylinderGeometry(1.4, 1.1, 2.0, 32, 8, true);
  const alignerMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    transmission: 0.9,
    opacity: 0.45,
    transparent: true
  });
  alignerMesh3D = new THREE.Mesh(alignerGeo, alignerMat);
  alignerMesh3D.position.y = 0.9;
  alignerMesh3D.visible = false;
  toothGroup3D.add(alignerMesh3D);

  scene3D.add(toothGroup3D);

  // Drag controls
  const dom = renderer3D.domElement;
  dom.addEventListener('mousedown', e => { isDragging3D = true; prevMousePos = { x: e.clientX, y: e.clientY }; });
  dom.addEventListener('mousemove', e => {
    if (!isDragging3D) return;
    const dx = e.clientX - prevMousePos.x;
    const dy = e.clientY - prevMousePos.y;
    toothGroup3D.rotation.y += dx * 0.01;
    toothGroup3D.rotation.x += dy * 0.01;
    prevMousePos = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('mouseup', () => { isDragging3D = false; });

  // Touch controls
  dom.addEventListener('touchstart', e => {
    if (e.touches.length === 1) { isDragging3D = true; prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
  });
  dom.addEventListener('touchmove', e => {
    if (!isDragging3D || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - prevMousePos.x;
    const dy = e.touches[0].clientY - prevMousePos.y;
    toothGroup3D.rotation.y += dx * 0.012;
    toothGroup3D.rotation.x += dy * 0.012;
    prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  });
  window.addEventListener('touchend', () => { isDragging3D = false; });

  function animate() {
    requestAnimationFrame(animate);
    if (!isDragging3D) { toothGroup3D.rotation.y += 0.006; }
    renderer3D.render(scene3D, camera3D);
  }
  animate();

  window.addEventListener('resize', () => {
    if (!container || !camera3D || !renderer3D) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera3D.aspect = w / h;
    camera3D.updateProjectionMatrix();
    renderer3D.setSize(w, h);
  });
}

function switch3DMode(mode) {
  const title = document.getElementById('current-procedure-title');
  const desc = document.getElementById('current-procedure-desc');
  const buttons = document.querySelectorAll('.btn-procedure');
  buttons.forEach(b => b.classList.remove('active'));

  if (mode === 'veneer') {
    buttons[0]?.classList.add('active');
    if (title) title.innerText = 'Diseño de Sonrisa (Carilla E-Max)';
    if (desc) desc.innerText = 'Capa ultra-delgada de disilicato de litio adherida sobre el esmalte dental con brillo natural, micro-textura y translucidez incisal perfecta.';
    if (crownMesh3D) crownMesh3D.material.color.setHex(0xfdfdfd);
    if (rootMesh3D) rootMesh3D.material.color.setHex(0x94a3b8);
    if (alignerMesh3D) alignerMesh3D.visible = false;
  } else if (mode === 'implant') {
    buttons[1]?.classList.add('active');
    if (title) title.innerText = 'Implante Dental Titanio 3D';
    if (desc) desc.innerText = 'Perno de titanio grado médico osteointegrado que reemplaza la raíz dental perdida, rematado con corona de porcelana atornillada.';
    if (crownMesh3D) crownMesh3D.material.color.setHex(0xffffff);
    if (rootMesh3D) {
      rootMesh3D.material.color.setHex(0x475569);
      rootMesh3D.material.metalness = 0.95;
    }
    if (alignerMesh3D) alignerMesh3D.visible = false;
  } else if (mode === 'aligner') {
    buttons[2]?.classList.add('active');
    if (title) title.innerText = 'Ortodoncia Invisible (Alineador SELF)';
    if (desc) desc.innerText = 'Funda biomecánica termoformada transparente que ejerce micromovimientos indoloros para alinear tus dientes sin alambres.';
    if (alignerMesh3D) alignerMesh3D.visible = true;
  }
}

// Hook 3D studio initialization to load events
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init3DStudio);
} else {
  init3DStudio();
}
