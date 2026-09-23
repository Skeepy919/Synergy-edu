const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session_auth');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexión cerrada. Reconectando...', shouldReconnect);
            if (shouldReconnect) iniciarBot();
        } else if (connection === 'open') {
            console.log('====================================');
            console.log('✅ Shinra xzy conectado con éxito');
            console.log('====================================');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const texto = m.message.conversation || m.message.extendedTextMessage?.text || '';
        const remitente = m.key.remoteJid;

        if (texto.toLowerCase() === '.menu' || texto.toLowerCase() === '.ping') {
            await sock.sendMessage(remitente, { text: '⚡ *Shinra xzy está activo y en línea 24/7*' });
        }
    });
}

iniciarBot();
