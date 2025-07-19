#!/usr/bin/env node

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { createObjectCsvWriter } = require('csv-writer');

/**
 * Sanitize a string into a safe filename:
 * - Replace illegal filesystem chars with '_'
 * - Trim to 50 chars
 * - Fallback to "Unknown"
 */
function sanitizeFilename(name) {
  const cleaned = name
    .replace(/[<>:"\/\\|?*\x00-\x1F]/g, '_')
    .trim();
  return cleaned.length > 0 ? cleaned.slice(0, 50) : 'Unknown';
}

const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', qr => {
  console.log('🔗 Scan this QR code:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('✅ Logged in — starting export…');

  try {
    const chats = await client.getChats();
    console.log(`🗨️  Found ${chats.length} chats`);

    for (const chat of chats) {
      const title     = chat.name || chat.formattedTitle || chat.id.user;
      const safeTitle = sanitizeFilename(title);
      console.log(`\n📂 Processing "${title}" → file "${safeTitle}.csv"`);

      // Prepare to fetch messages in pages
      const records = [];
      const LIMIT = 1000;
      let lastId = null;

      while (true) {
        // Build fetch options
        const opts = { limit: LIMIT };
        if (lastId) opts.before = lastId;

        console.log(`  ↳ Fetching up to ${LIMIT} messages before ${opts.before || 'start'}`);
        const batch = await chat.fetchMessages(opts);
        console.log(`  ↳ Retrieved ${batch.length} messages`);

        // No more messages?
        if (batch.length === 0) break;

        // Process in chronological order
        for (const msg of batch.reverse()) {
          const dt = new Date(msg.timestamp * 1000);
          records.push({
            chat:   title,
            date:   dt.toLocaleDateString(),
            time:   dt.toLocaleTimeString(),
            author: msg.author?.split('@')[0] || (msg.fromMe ? 'Me' : title),
            body:   msg.body.replace(/\r?\n+/g, ' ')
          });
        }

        // If fewer than LIMIT, we've reached the end
        if (batch.length < LIMIT) break;

        // Prepare for next page: use the raw message ID string
        lastId = batch[0].id.id;
      }

      console.log(`  ✅ Fetched ${records.length} messages`);

      // Write out CSV
      const csvWriter = createObjectCsvWriter({
        path: `${safeTitle}.csv`,
        header: [
          { id: 'chat',   title: 'Chat' },
          { id: 'date',   title: 'Date' },
          { id: 'time',   title: 'Time' },
          { id: 'author', title: 'Name' },
          { id: 'body',   title: 'Message' }
        ]
      });

      console.log(`  ✏️  Writing ${safeTitle}.csv (${records.length} rows)…`);
      await csvWriter.writeRecords(records);
      console.log(`  🏁 Wrote ${safeTitle}.csv`);
    }

  } catch (err) {
    console.error('❌ Export failed:', err);
  } finally {
    process.exit(0);
  }
});

client.initialize();
