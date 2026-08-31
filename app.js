const sessionId = 'sonria_session_' + Math.random().toString(36).substring(2, 9);

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

// 1. Calculator
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

// 2. Sede Selector
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

let sonriaVoiceEnabled = true;
let sonriaAudio = null;
let sonriaRecognition = null;
let sonriaIsRecording = false;

// Initialize Speech Recognition
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
    if (voiceInd && !sonriaIsRecording) voiceInd.style.display = 'none';
  };

  sonriaAudio.play().catch(e => {
    console.warn('Sonria audio autoplay blocked until user interaction:', e);
    if (voiceInd && !sonriaIsRecording) voiceInd.style.display = 'none';
  });
}

// 3. Chat Stream
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
    if (notice) notice.style.display = 'none';
    appendMessage('agent', 'Disculpa, hubo un problema conectando con el servidor de Sonría.');
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
  } catch (e) {}
}

// 4. Speed Dial #262 Simulator
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
    const data = await res.json();
    if (out) out.innerText = '🔊 ' + data.ivr_message;
    playSonriaNeuralVoice(data.ivr_message);
  } catch (e) {
    if (out) out.innerText = 'Error al procesar la llamada.';
  }
}

// 5. Admin CRM Modal
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
    const data = await res.json();
    if (!data.success) return;

    const countEl = document.getElementById('stat-leads-count');
    const badgeEl = document.getElementById('lead-count-badge');
    if (countEl) countEl.innerText = data.count;
    if (badgeEl) badgeEl.innerText = data.count;

    let totalVal = 0;
    const tbody = document.getElementById('leads-tbody');
    if (!tbody) return;

    if (data.leads.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No hay citas registradas todavía.</td></tr>';
      const valEl = document.getElementById('stat-leads-val');
      if (valEl) valEl.innerText = '$0 COP';
      return;
    }

    tbody.innerHTML = '';
    data.leads.forEach(l => {
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
  } catch (e) {}
}

async function refreshLeadCount() {
  try {
    const res = await fetch('/api/leads');
    const data = await res.json();
    if (data.success) {
      const badge = document.getElementById('lead-count-badge');
      if (badge) badge.innerText = data.count;
    }
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
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
