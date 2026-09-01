const express = require('express');
const cors = require('cors');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

process.on('uncaughtException', (err) => {
  console.error('[Sonria Uncaught Exception]', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Sonria Unhandled Rejection]', reason);
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Initialize SQLite Database
const dbPath = path.join(__dirname, 'sonria_leads.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS sonria_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    treatment TEXT,
    sede TEXT,
    preferred_date TEXT,
    name TEXT,
    phone TEXT,
    estimated_cop INTEGER DEFAULT 0,
    source TEXT DEFAULT 'whatsapp',
    status TEXT DEFAULT 'agendado'
  );

  CREATE TABLE IF NOT EXISTS call_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caller_phone TEXT,
    option_selected TEXT,
    transcript TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
// In-memory active session state
const activeSessions = {};

// 2. Sonría Sedes Database
const SEDES = [
  { id: "laureles", name: "Sede Laureles - Naranjal", address: "Carrera 70 # 44B-29", phone: "#262", hours: "Lun-Vie: 7:00 AM - 7:00 PM | Sáb: 8:00 AM - 2:00 PM" },
  { id: "centro", name: "Sede Medellín Centro - El Palo", address: "Calle 52 # 45-06", phone: "#262", hours: "Lun-Vie: 7:00 AM - 7:00 PM | Sáb: 8:00 AM - 2:00 PM" },
  { id: "belen", name: "Sede Belén", address: "Calle 30 # 75-57", phone: "#262", hours: "Lun-Vie: 7:30 AM - 6:30 PM | Sáb: 8:00 AM - 1:00 PM" },
  { id: "envigado", name: "Sede Envigado", address: "Calle 37 Sur # 43-57/59", phone: "#262", hours: "Lun-Vie: 7:00 AM - 7:00 PM | Sáb: 8:00 AM - 2:00 PM" },
  { id: "itagui", name: "Sede Itagüí", address: "Calle 51 # 50-66", phone: "#262", hours: "Lun-Vie: 7:00 AM - 6:30 PM | Sáb: 8:00 AM - 1:00 PM" },
  { id: "bello", name: "Sede Bello", address: "Carrera 50 # 48-41", phone: "#262", hours: "Lun-Vie: 7:00 AM - 7:00 PM | Sáb: 8:00 AM - 2:00 PM" },
  { id: "rionegro", name: "Sede Rionegro (C.C. Multicompra)", address: "Calle 50 # 48-27", phone: "#262", hours: "Lun-Vie: 8:00 AM - 6:00 PM | Sáb: 8:00 AM - 1:00 PM" }
];

// 3. Sonría Treatment Catalog (COP)
const TREATMENTS = {
  limpieza: { name: "Limpieza & Profilaxis Profunda", cop: 120000, desc: "Remoción de cálculo, ultrasonido y pulido coronario." },
  blanqueamiento: { name: "Blanqueamiento Dental LED", cop: 450000, desc: "Aclaramiento dental en consultorio con lámpara LED." },
  resinas: { name: "Diseño de Sonrisa en Resina (Por diente)", cop: 350000, desc: "Carillas de resina de alta estética esculpidas en clínica." },
  porcelana: { name: "Carillas en Porcelana / E-Max (Por diente)", cop: 1400000, desc: "Disilicato de litio de alta resistencia y duración 10+ años." },
  implante: { name: "Implante Dental de Titanio", cop: 2800000, desc: "Fijación de titanio grado quirúrgico + pilar protésico." },
  ortodoncia: { name: "Ortodoncia / Brackets Autoligados", cop: 1800000, desc: "Tratamiento correctivo de alineación dental sin fricción." }
};

function processSonriaMessage(sessionId, userMessage) {
  if (!activeSessions[sessionId]) {
    activeSessions[sessionId] = { step: 1, data: {} };
  }
  const session = activeSessions[sessionId];
  const text = (userMessage || '').trim().toLowerCase();

  if (text === 'reiniciar' || text === 'reset') {
    activeSessions[sessionId] = { step: 1, data: {} };
    return {
      reply: "¡Hola! Bienvenido a **Sonría Clínicas Odontológicas Medellín** 🦷✨\n\nSoy **Camila**, tu asesora virtual de Sonría (Línea directa **#262**).\n\n¿En qué podemos ayudarte hoy?\n1️⃣ Agendar Valoración Odontológica\n2️⃣ Precios y Tratamientos\n3️⃣ Consultar Sedes en Medellín y Valle de Aburrá",
      session: activeSessions[sessionId]
    };
  }

  if (text.includes('sede') || text.includes('donde') || text.includes('direccion') || text.includes('ubicacion')) {
    return {
      reply: "Contamos con **7 sedes en el Valle de Aburrá**:\n\n📍 **Laureles:** Cra 70 # 44B-29\n📍 **Centro:** Calle 52 # 45-06 (El Palo)\n📍 **Belén:** Calle 30 # 75-57\n📍 **Envigado:** Calle 37 Sur # 43-57/59\n📍 **Itagüí:** Calle 51 # 50-66\n📍 **Bello:** Cra 50 # 48-41\n📍 **Rionegro:** Calle 50 # 48-27\n\n¿En cuál de estas sedes te gustaría ser atendido?",
      session
    };
  }

  if (text.includes('#262') || text.includes('telefono') || text.includes('llamar') || text.includes('contacto')) {
    return {
      reply: "📞 Puedes comunicarte gratis desde tu celular en Colombia marcando **#262** (Línea Transformam Sonría) o a nuestro PBX nacional `(601) 314 4313`.",
      session
    };
  }

  // Multi-step booking funnel
  if (session.step === 1) {
    session.data.treatment_query = userMessage;
    session.step = 2;
    return {
      reply: "¡Excelente! Con gusto te orientamos. ¿En qué **sede de Medellín o el área metropolitana** prefieres tu cita de valoración?\n\n• Laureles\n• Centro\n• Envigado\n• Belén\n• Itagüí / Bello",
      session
    };
  }

  if (session.step === 2) {
    session.data.sede = userMessage;
    session.step = 3;
    return {
      reply: `Perfecto, agendaremos en la **Sede ${userMessage}**.\n\n¿Para qué día u horario te queda mejor? (Ej: Mañana en la tarde, o este viernes)`,
      session
    };
  }

  if (session.step === 3) {
    session.data.preferred_date = userMessage;
    session.step = 4;
    return {
      reply: "Entendido. Para confirmar tu cita en el sistema de Sonría, por favor indícanos tu **Nombre completo** y **Número de celular / WhatsApp**.",
      session
    };
  }

  if (session.step === 4) {
    session.data.contact_info = userMessage;
    session.step = 5;

    let estVal = 350000;
    if (session.data.treatment_query && session.data.treatment_query.toLowerCase().includes('implante')) estVal = 2800000;
    if (session.data.treatment_query && session.data.treatment_query.toLowerCase().includes('carilla')) estVal = 1400000;

    try {
      const stmt = db.prepare(`
        INSERT INTO sonria_leads (session_id, treatment, sede, preferred_date, name, phone, estimated_cop, source, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'whatsapp_simulator', 'agendado')
      `);
      
      stmt.run(
        sessionId,
        session.data.treatment_query || 'Valoracion General',
        session.data.sede || 'Laureles',
        session.data.preferred_date || 'Pronto',
        session.data.contact_info.split(',')[0] || userMessage,
        session.data.contact_info.split(',')[1] || 'Registrado',
        estVal
      );
    } catch (e) {
      console.error("DB Insert Error:", e);
    }

    return {
      reply: "🎉 ¡Tu solicitud de cita en **Sonría Clínicas Odontológicas** ha quedado registrada exitosamente!\n\n📋 **Resumen de la cita:**\n• **Sede:** " + (session.data.sede || 'Laureles') + "\n• **Tratamiento:** " + (session.data.treatment_query || 'Valoración Odontológica') + "\n• **Disponibilidad:** " + (session.data.preferred_date || 'A convenir') + "\n\nUn asesor de la sede se comunicará contigo vía WhatsApp o al celular registrado para confirmar la hora exacta. También puedes llamar gratis al **#262** en cualquier momento con tu número de documento.",
      session
    };
  }

  return {
    reply: "Gracias por comunicarte con Sonría. ¿Deseas agendar otra valoración o consultar los beneficios de nuestro plan de financiación?",
    session
  };
}

// API Routes
app.get('/api/sedes', (req, res) => {
  res.json({ success: true, sedes: SEDES });
});

app.get('/api/treatments', (req, res) => {
  res.json({ success: true, treatments: TREATMENTS });
});

app.post('/api/chat', (req, res) => {
  const { sessionId = 'default_sonria', message = '' } = req.body;
  const result = processSonriaMessage(sessionId, message);
  res.json({ success: true, ...result });
});

// Speed Dial #262 Simulator
app.post('/api/speed-dial-262', (req, res) => {
  const { phone = '3001234567', option = '1' } = req.body;
  let responseText = "";

  switch (option) {
    case '1':
      responseText = "Opción 1 seleccionada: Agendamiento de cita nueva. Te conectamos con la central de citas de Medellín y Valle de Aburrá.";
      break;
    case '2':
      responseText = "Opción 2 seleccionada: Confirmación y reprogramación de tratamientos activos.";
      break;
    case '3':
      responseText = "Opción 3 seleccionada: Urgencias odontológicas y dolor dental prioritario.";
      break;
    default:
      responseText = "Bienvenido a la línea nacional Sonría #262. Gracias por marcar desde tu móvil.";
  }

  try {
    const stmt = db.prepare("INSERT INTO call_logs (caller_phone, option_selected, transcript) VALUES (?, ?, ?)");
    stmt.run(phone, option, responseText);
  } catch (e) {
    console.error("DB Call Log Error:", e);
  }

  res.json({
    success: true,
    dialed: "#262",
    caller: phone,
    ivr_message: "Gracias por llamar a Sonría Clínicas Odontológicas (Transformam #262). " + responseText,
    timestamp: new Date().toISOString()
  });
});

// Lead CRM API
app.get('/api/leads', (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM sonria_leads ORDER BY id DESC");
    const leads = stmt.all();
    res.json({ success: true, count: leads.length, leads });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/export-csv', (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM sonria_leads ORDER BY id DESC");
    const leads = stmt.all();
    
    let csv = "ID,Fecha,Tratamiento,Sede,Disponibilidad,Nombre,Telefono,Estimado_COP,Estado\n";
    leads.forEach(l => {
      csv += `${l.id},"${l.created_at}","${l.treatment}","${l.sede}","${l.preferred_date}","${l.name}","${l.phone}",${l.estimated_cop},"${l.status}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('sonria_medellin_leads.csv');
    res.send(csv);
  } catch (e) {
    res.status(500).send('Error generating CSV');
  }
});

// Drip Sequence Nurturing Generator
app.get('/api/admin/drip-sequences', (req, res) => {
  try {
    const leads = db.prepare("SELECT * FROM sonria_leads ORDER BY id DESC LIMIT 10").all();
    const sequences = leads.map(l => {
      const name = l.name || 'Paciente';
      const treatment = l.treatment || 'Tratamiento Odontológico';
      const sede = l.sede || 'Medellín';
      return {
        leadId: l.id,
        patient: name,
        treatment: treatment,
        sede: sede,
        messages: [
          {
            step: 'Seguimiento 24h (Confirmación de Sede)',
            msg: `¡Hola ${name}! Te habla Camila de Sonría Clínicas Odontológicas. Confirmamos tu interés en ${treatment} en la ${sede}. Tenemos agenda disponible con el especialista esta semana. ¿Te agendamos en la mañana o en la tarde?`
          },
          {
            step: 'Seguimiento 48h (Financiación Plan Cuotas)',
            msg: `Hola ${name}, recuerda que en Sonría contamos con Plan Cuotas para financiar tu ${treatment} hasta en 24 meses sin cuota inicial. ¿Deseas hacer el cálculo en línea o llamando gratis al #262?`
          },
          {
            step: 'Seguimiento 7 Días (Bono de Limpieza Dental)',
            msg: `¡Hola ${name}! Si agendas tu valoración de ${treatment} esta semana en Sonría ${sede}, te obsequiamos una profilaxis ultrasónica profunda. Responde este mensaje para separar tu turno.`
          }
        ]
      };
    });
    res.json({ success: true, sequences });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Neural Voice Synthesis Endpoint (Microsoft Salome Colombian Accent)
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

app.get('/api/tts', (req, res) => {
  const rawText = req.query.text || '';
  const cleanText = rawText.replace(/[\n\r]/g, ' ').replace(/[#*_`]/g, '').trim().substring(0, 500);
  const voice = req.query.voice || 'es-CO-SalomeNeural';

  if (!cleanText) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const hash = crypto.createHash('md5').update(`${voice}_${cleanText}`).digest('hex');
  const tmpFile = path.join(os.tmpdir(), `tts_sonria_${hash}.mp3`);

  if (fs.existsSync(tmpFile)) {
    res.setHeader('Content-Type', 'audio/mpeg');
    return fs.createReadStream(tmpFile).pipe(res);
  }

  // Escape text for CLI
  const safeText = cleanText.replace(/"/g, '\\"');
  exec(`edge-tts --voice "${voice}" --text "${safeText}" --write-media "${tmpFile}"`, (err) => {
    if (err) {
      console.error("Sonria Neural TTS Error:", err);
      return res.status(500).json({ error: 'TTS Synthesis failed' });
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    fs.createReadStream(tmpFile).pipe(res);
  });
});

function startServer() {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sonria Medellin Simulator] Running on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} in use/TIME_WAIT, retrying in 2 seconds...`);
      setTimeout(startServer, 2000);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();


