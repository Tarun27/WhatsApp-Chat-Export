#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { createObjectCsvWriter } = require('csv-writer');

// 1️⃣ Make sure exports/ exists
const OUT_DIR = path.join(__dirname, 'exports');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// 2️⃣ Simple filename sanitizer
function sanitizeFilename(name) {
  return name
    .replace(/[<>:"\/\\|?*\x00-\x1F]/g, '_')
    .trim()
    .slice(0, 50) || 'Unknown';
}

const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', qr => {
  console.log('🔗 Scan this QR code:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('✅ Logged in — exporting chats…');

  try {
    const chats = await client.getChats();
    console.log(`🗨️  Found ${chats.length} chats (individual & group)`);

    for (const chat of chats) {
      // Name for file: group chats use chat.name, one‑to‑one use formattedTitle
      const title     = chat.name || chat.formattedTitle || chat.id.user;
      const safeTitle = sanitizeFilename(title);
      console.log(`\n📂 Processing "${title}" → exports/${safeTitle}.csv`);

      // 3️⃣ Fetch in pages of LIMIT
      const LIMIT = 1000;
      let lastId = null;
      const records = [];

      while (true) {
        const opts = { limit: LIMIT };
        if (lastId) opts.before = lastId;

        console.log(`  ↳ Fetching up to ${LIMIT} messages before ${opts.before || 'start'}`);
        const batch = await chat.fetchMessages(opts);
        console.log(`  ↳ Retrieved ${batch.length} messages`);

        if (batch.length === 0) break;

        // reverse so we push oldest→newest
        batch.reverse().forEach(msg => {
          const dt = new Date(msg.timestamp * 1000);
          records.push({
            chat:   title,
            date:   dt.toLocaleDateString(),
            time:   dt.toLocaleTimeString(),
            author: msg.author?.split('@')[0] || (msg.fromMe ? 'Me' : title),
            body:   msg.body.replace(/\r?\n+/g, ' ')
          });
        });

        // if less than a full page, we’re done
        if (batch.length < LIMIT) break;

        // next page should end just before the oldest we just got
        lastId = batch[0].id._serialized;
      }

      console.log(`  ✅ Fetched ${records.length} messages`);

      // 4️⃣ Write CSV into exports/ folder
      const csvWriter = createObjectCsvWriter({
        path: path.join(OUT_DIR, `${safeTitle}.csv`),
        header: [
          { id: 'chat',   title: 'Chat' },
          { id: 'date',   title: 'Date' },
          { id: 'time',   title: 'Time' },
          { id: 'author', title: 'Name' },
          { id: 'body',   title: 'Message' }
        ]
      });

      console.log(`  ✏️  Writing exports/${safeTitle}.csv (${records.length} rows)…`);
      await csvWriter.writeRecords(records);
      console.log(`  🏁 Done: exports/${safeTitle}.csv`);
    }

    console.log('\n🎉 All chats exported into the exports/ folder.');
  } catch (err) {
    console.error('❌ Export failed:', err);
  } finally {
    process.exit(0);
  }
});

client.initialize();
