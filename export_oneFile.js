const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { createObjectCsvWriter } = require('csv-writer');

// 1️⃣ Initialize client with persistent auth
const client = new Client({ authStrategy: new LocalAuth() });

client.on('qr', qr => qrcode.generate(qr, { small: true }) );
client.on('ready', async () => {
  console.log('✅ Logged in, exporting chats…');
  const chats = await client.getChats();
  const csvWriter = createObjectCsvWriter({
    path: 'whatsapp_all_chats.csv',
    header: [
      {id:'chat',   title:'Chat'},
      {id:'date',   title:'Date'},
      {id:'time',   title:'Time'},
      {id:'author', title:'Name'},
      {id:'body',   title:'Message'}
    ]
  });

  const records = [];
  for (const chat of chats) {
    const title = chat.name || chat.formattedTitle || 'Unknown';
    let last = null, batch;
    // 2️⃣ Page through history 1 000 msgs at a time
    do {
      batch = await chat.fetchMessages({ limit: 1000, ...(last && { before: last.id }) });
      for (const msg of batch.reverse()) {
        const dt = new Date(msg.timestamp * 1000);
        records.push({
          chat: title,
          date: dt.toLocaleDateString(),
          time: dt.toLocaleTimeString(),
          author: msg.author?.split('@')[0] || msg.fromMe ? 'Me' : title,
          body: msg.body.replace(/[\r\n]+/g,' ')
        });
      }
      last = batch[0];
    } while(batch.length);
  }

  // 3️⃣ Write out CSV
  await csvWriter.writeRecords(records);
  console.log('✅ Export complete: whatsapp_all_chats.csv');
  process.exit(0);
});

client.initialize();
