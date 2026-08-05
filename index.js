const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// ==========================================
// PASTE URL GOOGLE APPS SCRIPT ANDA DI SINI:
// ==========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbxRTcIGiHB7-rHgigpsYyqBwmhq_ZTlzFnake9t5jG8RZh4CxlvFR9Z-Eaw6NbFcd59/exec";

// Server Express agar Render.com tidak mematikan bot
app.use(express.json());
app.get('/', (req, res) => res.send('✅ Gateway Bot WhatsApp Keuangan Online 24/7!'));
app.listen(port, () => console.log(`🌐 Server Web berjalan di port ${port}`));

// Konfigurasi WhatsApp Client (Anti-Crash untuk Server Cloud)
const client = new Client({
    authStrategy: new LocalAuth(), // Menyimpan sesi login WA agar tidak perlu scan berkali-kali
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// Event: Menampilkan QR Code
client.on('qr', (qr) => {
    console.log('\n=========================================');
    console.log('📱 SCAN QR CODE DI BAWAH INI DENGAN WHATSAPP:');
    qrcode.generate(qr, { small: true });
    console.log('=========================================\n');
});

// Event: Berhasil Login
client.on('ready', () => {
    console.log('✅ WhatsApp Bot Berhasil Terhubung dan Siap Mencatat Transaksi!');
});

// Event: Gagal Login / Logout
client.on('auth_failure', msg => {
    console.error('❌ Kegagalan Autentikasi:', msg);
});

// Event: WA Terputus (Otomatis nyambung ulang)
client.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp terputus (Alasan: ', reason, ')');
    console.log('🔄 Mencoba menyambungkan kembali...');
    client.initialize();
});

// Event: Menerima Pesan Masuk
client.on('message', async msg => {
    // 1. Abaikan pesan dari Grup, Status/Story, atau Broadcast agar bot tidak spam
    if (msg.isStatus || msg.from.includes('@g.us') || msg.from === 'status@broadcast') return;

    console.log(`[📥 Pesan Masuk] Dari: ${msg.from} | Teks: ${msg.body}`);

    try {
        // 2. Kirim teks pesan ke Google Apps Script
        const response = await axios.post(GAS_URL, {
            sender: msg.from,
            message: msg.body
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        // 3. Tangkap balasan dari Google Apps Script dan kirim balik ke WhatsApp Anda
        if (response.data && response.data.reply) {
            await msg.reply(response.data.reply);
            console.log(`[📤 Balasan Terkirim Sukses]`);
        }

    } catch (error) {
        console.error('❌ Gagal menghubungi Google Apps Script:', error.message);
        // Fallback balasan jika server sedang gangguan
        await msg.reply('⚠️ Maaf, Bot tidak dapat terhubung ke server Google Sheets saat ini. Silakan coba sebentar lagi.');
    }
});

// Jalankan Bot
client.initialize();