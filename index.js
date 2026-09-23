const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');

// Tu número configurado con código de país (Perú +51)
const NUMERO_TELEFONO = '51910745575';

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session_auth');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    });

    // Solicita el código de vinculación de 8 dígitos para WhatsApp
    if (!sock.authState.creds.registered) {
        await delay(3000);
        try {
            const code = await sock.requestPairingCode(NUMERO_TELEFONO);
            console.log('\n====================================');
            console.log('⚡ TU CÓDIGO DE VINCULACIÓN ES:', code);
            console.log('====================================\n');
        } catch (err) {
            console.log('Error al solicitar pairing code:', err);
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexión cerrada. Reconectando...', shouldReconnect);
            if (shouldReconnect) iniciarBot();
        } else if (connection === 'open') {
            console.log('\n====================================');
            console.log('✅ Shinra xzy conectado con éxito');
            console.log('====================================\n');
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
