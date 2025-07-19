# WhatsApp Chat Exporter

A Node.js script that uses `whatsapp-web.js` to export all your WhatsApp chats and messages into a single CSV file.

## Features

* **Persistent Authentication** via `LocalAuth` (stores session in `.wwebjs_auth` directory)
* **Automatic QR Code Generation** in the terminal for first-time login
* **Batch Paging**: Fetches up to 1000 messages per batch to handle large chat histories
* **Detailed CSV Output** including chat name, date, time, author, and message body

## Prerequisites

* **Node.js** v14 or higher
* **npm** or **yarn**
* A **WhatsApp** account accessible via WhatsApp Web

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install dependencies**

   ```bash
   npm install whatsapp-web.js qrcode-terminal csv-writer
   # or
   yarn add whatsapp-web.js qrcode-terminal csv-writer
   ```

## Usage

1. **Run the exporter script**

   ```bash
   node export.js
   ```

2. **Authenticate**

   * A QR code will be displayed in your terminal.
   * Open WhatsApp on your phone → Settings → Linked Devices → Link a Device.
   * Scan the QR code to authenticate.

3. **Export**

   * After successful login, the script will fetch all chats and messages.
   * A file named `whatsapp_all_chats.csv` will be created in the project root.

4. **Exit**

   * The script will automatically exit once exporting is complete.

## Configuration

* **Output Path**

  * By default, the CSV is written to `whatsapp_all_chats.csv`. To change this, edit the `path` in the `createObjectCsvWriter` configuration.

* **Batch Size**

  * The script currently fetches 1000 messages per batch. To adjust the batch size, modify the `limit` value in the `chat.fetchMessages({ limit: 1000, ... })` call.

* **Authentication Storage**

  * Session data is stored in the `.wwebjs_auth` folder by default. To clear your session and re-authenticate, delete this folder.

## Troubleshooting

* **QR Code Not Displaying**

  * Ensure your terminal supports UTF-8 characters.
  * Try increasing the terminal window size.

* **Session Errors**

  * If the script cannot find your session, delete `.wwebjs_auth` and re-run the script to generate a new QR code.

* **Incomplete Exports**

  * Confirm you have internet connectivity and that your phone remains connected to WhatsApp Web during export.

## License

This project is licensed under the **MIT License**.
