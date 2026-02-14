/**
 * MEREACH Website Backend - Google Apps Script
 * Handles Partner/Teman submissions + Dashboard API.
 */

// Configuration
const CONFIG = {
  SPREADSHEET_ID: '1t9DMH3tem2GCfsPuzYI3YKBOncWUaEUQjDZM5MQbUdI', // <--- GANTI INI DENGAN ID SPREADSHEET KAMU!
  SHEET_NAME_PARTNER: 'Partner MEREACH',
  SHEET_NAME_TEMAN: 'Teman MEREACH',
  SHEET_NAME_TEAM: 'Team MEREACH',
  NOTIFICATION_EMAIL: 'lifeatmereach@gmail.com',
  EMAIL_SUBJECT_PARTNER: 'Pendaftaran Partner MEREACH Berhasil!',
  EMAIL_SENDER_NAME: 'MEREACH Team',
  DASHBOARD_URL: 'https://life-at-mereach.vercel.app/dashboard.html'
};

// Check if placeholder is still used
if (CONFIG.SPREADSHEET_ID === '1t9DMH3tem2GCfsPuzYI3YKBOncWUaEUQjDZM5MQbUdI') {
  // We'll throw an error inside the functions to be more visible
}


// ========== RESPONSE HELPERS ==========
function createJsonResponse(obj, callback) {
  if (callback) {
    // JSONP: wraps JSON in callback function so it bypasses CORS
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(obj) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle GET requests — ALL dashboard operations go through here
 * Supports JSONP via ?callback=functionName to bypass CORS
 */
function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback; // JSONP callback

  try {
    if (action === 'getPartnerData') {
      return createJsonResponse({ status: 'success', data: getSheetData(CONFIG.SHEET_NAME_PARTNER) }, callback);
    }
    if (action === 'getTemanData') {
      return createJsonResponse({ status: 'success', data: getSheetData(CONFIG.SHEET_NAME_TEMAN) }, callback);
    }
    if (action === 'ping') {
      return createJsonResponse({ status: 'success', message: 'pong' }, callback);
    }
    if (action === 'loginTeam') {
      return handleLoginTeamGet(e.parameter.email, e.parameter.password, callback);
    }
    if (action === 'updateStatus') {
      const result = handleUpdateStatus({
        sheetType: e.parameter.sheetType,
        email: e.parameter.email,
        newStatus: e.parameter.newStatus
      });
      // Re-wrap with callback if needed
      if (callback) {
        const body = JSON.parse(result.getContent());
        return createJsonResponse(body, callback);
      }
      return result;
    }
    if (action === 'sendAcceptanceEmail') {
      const result = handleSendAcceptanceEmail({
        sheetType: e.parameter.sheetType,
        email: e.parameter.email,
        nama: e.parameter.nama
      });
      if (callback) {
        const body = JSON.parse(result.getContent());
        return createJsonResponse(body, callback);
      }
      return result;
    }
    // Default — health check
    return ContentService.createTextOutput("MEREACH Backend is Active!")
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() }, callback);
  }
}

// Login handler for GET (with JSONP support)
function handleLoginTeamGet(email, password, callback) {
  if (!email || !password) {
    return createJsonResponse({ status: 'error', message: 'Email dan password wajib diisi.' }, callback);
  }

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_TEAM);
  if (!sheet) {
    return createJsonResponse({ status: 'error', message: 'Sheet Team MEREACH tidak ditemukan.' }, callback);
  }

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const rowEmail = String(rows[i][1]).trim().toLowerCase();
    const rowPass = String(rows[i][2]).trim();
    if (rowEmail === email.trim().toLowerCase() && rowPass === password) {
      return createJsonResponse({ status: 'success', name: String(rows[i][0]).trim() }, callback);
    }
  }

  return createJsonResponse({ status: 'error', message: 'Email atau password salah.' }, callback);
}

/**
 * Handle POST requests — form submissions + dashboard actions
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || data.type;

    switch (action) {
      case 'partner':
        return handlePartnerSubmission(data);
      case 'teman':
        return handleTemanSubmission(data);
      case 'updateStatus':
        return handleUpdateStatus(data);
      case 'sendAcceptanceEmail':
        return handleSendAcceptanceEmail(data);
      default:
        throw new Error('Invalid action: ' + action);
    }
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}



// ========== DASHBOARD: FETCH SHEET DATA ==========
function getSheetData(sheetName) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      console.error('Sheet not found: ' + sheetName);
      return [];
    }

    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return [];

    const headers = rows[0].map(h => String(h).trim());
    const result = [];

    for (let i = 1; i < rows.length; i++) {
      const obj = {};
      headers.forEach((header, idx) => {
        let val = rows[i][idx];
        // Convert Date objects to ISO strings
        if (val instanceof Date) {
          val = val.toISOString();
        }
        obj[header] = val;
      });
      obj._row = i + 1; // 1-based row number for updates
      result.push(obj);
    }

    return result;
  } catch (err) {
    console.error('Error in getSheetData: ' + err.toString());
    throw new Error('Gagal membuka Spreadsheet. Pastikan SPREADSHEET_ID sudah benar dan script memiliki izin. Error: ' + err.toString());
  }
}

// ========== DASHBOARD: UPDATE STATUS ==========
function handleUpdateStatus(data) {
  const { sheetType, email, newStatus } = data;
  const sheetName = sheetType === 'partner' ? CONFIG.SHEET_NAME_PARTNER : CONFIG.SHEET_NAME_TEMAN;

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return createJsonResponse({ status: 'error', message: 'Sheet tidak ditemukan: ' + sheetName });
  }

  const rows = sheet.getDataRange().getValues();
  const headers = rows[0].map(h => String(h).trim());

  // Find or create Status column
  let statusColIdx = headers.indexOf('Status');
  if (statusColIdx === -1) {
    // Add Status header at the end
    statusColIdx = headers.length;
    sheet.getRange(1, statusColIdx + 1).setValue('Status');
  }

  // Find row by email
  const emailColIdx = headers.indexOf('Email');
  if (emailColIdx === -1) {
    return createJsonResponse({ status: 'error', message: 'Kolom Email tidak ditemukan di sheet.' });
  }

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][emailColIdx]).trim().toLowerCase() === String(email).trim().toLowerCase()) {
      sheet.getRange(i + 1, statusColIdx + 1).setValue(newStatus);
      return createJsonResponse({ status: 'success', message: 'Status berhasil diupdate ke: ' + newStatus });
    }
  }

  return createJsonResponse({ status: 'error', message: 'Email tidak ditemukan: ' + email });
}

// ========== DASHBOARD: SEND ACCEPTANCE EMAIL ==========
function handleSendAcceptanceEmail(data) {
  const { sheetType, email, nama } = data;
  const typeName = sheetType === 'partner' ? 'Partner MEREACH' : 'Teman MEREACH';

  const htmlTemplate = buildAcceptanceEmailHTML(nama, typeName);

  MailApp.sendEmail({
    to: email,
    subject: 'Selamat! Kamu Diterima sebagai ' + typeName + ' 🎉',
    htmlBody: htmlTemplate,
    name: CONFIG.EMAIL_SENDER_NAME
  });

  // Also update status to Approved
  handleUpdateStatus({ sheetType: sheetType, email: email, newStatus: 'Approved' });

  return createJsonResponse({ status: 'success', message: 'Email penerimaan berhasil dikirim ke: ' + email });
}

function buildAcceptanceEmailHTML(nama, typeName) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Selamat, Kamu Diterima sebagai ${typeName}!</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body { margin: 0; padding: 0; background-color: #F7F7F8; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #0F1724; }
    .btn { display: block; width: 100%; max-width: 280px; margin: 0 auto; text-align: center; padding: 14px 20px; border-radius: 8px; font-weight: 600; font-size: 16px; text-decoration: none; background-color: #ff751f; color: #ffffff !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F7F8;">
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F7F7F8; padding: 40px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <tr>
          <td align="center" style="padding: 40px 20px; background: linear-gradient(180deg, #0a0f18 0%, #05070a 100%);">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; line-height: 1.3;">
              Selamat, ${nama}! 🎉<br>
              <span style="color: #ff751f;">Kamu Diterima!</span>
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 40px;">
            <p style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #0F1724;">
              Hai, ${nama}! 👋
            </p>
            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #64748B;">
              Dengan senang hati kami mengabarkan bahwa kamu telah <strong>resmi diterima</strong> sebagai <strong style="color: #ff751f;">${typeName}</strong>.
            </p>
            <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #64748B;">
              Kami sangat antusias untuk memulai perjalanan ini bersamamu. Tim MEREACH akan segera menghubungimu untuk langkah selanjutnya.
            </p>
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
              <tr><td align="center">
                <a href="https://chat.whatsapp.com/K7Zlyc9cFjg6zp7e6r3KvG" class="btn" style="margin-bottom:12px;">Join Community (WhatsApp)</a>
                <a href="https://instagram.com/mereach" class="btn" style="margin-bottom:12px;">Follow Instagram MEREACH</a>
              </td></tr>
            </table>
            <div style="background-color: #F0FDF4; padding: 20px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #22C55E;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #166534;">
                <strong>✅ Status Kamu: APPROVED</strong><br>
                Kamu sekarang resmi tergabung sebagai ${typeName}. Selamat bergabung!
              </p>
            </div>
            <p style="margin: 0 0 10px; font-size: 16px; line-height: 1.6; color: #0F1724;">
              Sampai jumpa di komunitas MEREACH!
            </p>
            <p style="margin: 0; font-size: 16px; font-weight: 600; font-style: italic; color: #ff751f;">
              Together we MEREACH higher! 🚀
            </p>
            <br><br>
            <p style="margin: 0; font-size: 14px; color: #0F1724;">
              Warm Regards,<br>
              <strong>MEREACH Team.</strong>
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="background-color: #F7F7F8; padding: 20px 40px; border-top: 1px solid #eeeeee;">
            <p style="margin: 0; font-size: 12px; color: #94A3B8;">
              © 2026 MEREACH. All rights reserved.<br>Jakarta, Indonesia
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ========== REGISTRATION: PARTNER ==========
function handlePartnerSubmission(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_PARTNER);

  const timestamp = new Date();
  const rowData = [
    timestamp,
    data.namaLengkap,
    data.namaPanggilan,
    data.email,
    data.usia,
    data.whatsapp,
    data.instagram,
    data.tiktok,
    data.domisili,
    data.pekerjaan,
    data.pendidikan,
    data.kendaraan,
    data.waktuProduktif,
    data.waktuProduktifLain || '-',
    data.sumberInfo,
    data.namaTeman || '-',
    'Waiting Approval' // Default status
  ];

  sheet.appendRow(rowData);

  sendPartnerConfirmationEmail(data.email, data.namaPanggilan);
  sendAdminNotification('Partner MEREACH', data);

  return createJsonResponse({ status: 'success', message: 'Data Partner berhasil disimpan' });
}

// ========== REGISTRATION: TEMAN ==========
function handleTemanSubmission(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_TEMAN);

  const timestamp = new Date();
  const rowData = [
    timestamp,
    data.namaLengkap,
    data.email,
    data.whatsapp,
    'Waiting Approval' // Default status
  ];

  sheet.appendRow(rowData);
  sendAdminNotification('Teman MEREACH', data);

  return createJsonResponse({ status: 'success', message: 'Data Teman berhasil disimpan' });
}

/**
 * Send HTML Personalized Email to Partner
 */
function sendPartnerConfirmationEmail(recipientEmail, nickname) {
  const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Selamat, Pendaftaran Partner MEREACH Berhasil!</title>
    <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { margin: 0; padding: 0; background-color: #F7F7F8; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #0F1724; }
        .bg-navy { background-color: #0F1724; }
        .btn { display: block; width: 100%; max-width: 280px; margin: 0 auto; text-align: center; padding: 14px 20px; border-radius: 8px; font-weight: 600; font-size: 16px; text-decoration: none; background-color: #ff751f; color: #ffffff !important; }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F7F8;">
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F7F7F8; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                    <tr>
                        <td class="bg-navy" align="center" style="padding: 40px 20px; background: linear-gradient(180deg, #0a0f18 0%, #05070a 100%);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                                Pendaftaran Partner<br>
                                <span style="color: #ff751f;">MEREACH</span> Berhasil!
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 40px;">
                            <p style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #0F1724;">
                                Hai, ${nickname}! 👋
                            </p>
                            <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #64748B;">
                                Selamat! Pendaftaran kamu sudah berhasil masuk ke sistem MEREACH. Kami senang sekali kamu tertarik untuk bergabung dan bertumbuh bersama kami.
                            </p>
                            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td align="center">
                                        <a href="https://chat.whatsapp.com/K7Zlyc9cFjg6zp7e6r3KvG" class="btn" style="margin-bottom:12px;">Join Community (WhatsApp)</a>
                                        <a href="https://instagram.com/mereach" class="btn" style="margin-bottom:12px;">Follow Instagram MEREACH</a>
                                        <a href="https://tiktok.com/@mereach" class="btn">Follow TikTok MEREACH</a>
                                    </td>
                                </tr>
                            </table>
                            <div style="background-color: #F7F7F8; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #64748B;">
                                    <strong>Status Pendaftaran:</strong><br>
                                    Saat ini, tim MEREACH sedang melakukan peninjauan lebih lanjut data kamu. Tenang saja, proses ini tidak akan lama.
                                </p>
                                <br>
                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #64748B;">
                                    <strong>🔒 Privasi Data:</strong><br>
                                    Penting untuk diketahui bahwa data kamu hanya digunakan untuk penyesuaian event yang paling relevan (sorting), dan <strong>tidak akan disebarluaskan</strong> kepada pihak manapun.
                                </p>
                            </div>
                            <p style="margin: 0 0 10px; font-size: 16px; line-height: 1.6; color: #0F1724;">
                                Terima kasih sudah mengirimkan proposal menjadi Partner MEREACH.
                            </p>
                            <p style="margin: 0; font-size: 16px; font-weight: 600; font-style: italic; color: #ff751f;">
                                Hopefully we could be a good partner, MEREACH ya! :)
                            </p>
                            <br><br>
                            <p style="margin: 0; font-size: 14px; color: #0F1724;">
                                Warm Regards,<br>
                                <strong>MEREACH Team.</strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="background-color: #F7F7F8; padding: 20px 40px; border-top: 1px solid #eeeeee;">
                             <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                                © 2026 MEREACH. All rights reserved.<br>
                                Jakarta, Indonesia
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

  MailApp.sendEmail({
    to: recipientEmail,
    subject: CONFIG.EMAIL_SUBJECT_PARTNER,
    htmlBody: htmlTemplate,
    name: CONFIG.EMAIL_SENDER_NAME
  });
}

/**
 * Send Notification Email to Admin
 */
function sendAdminNotification(type, data) {
  const subject = `[NEW SUBMISSION] ${type} - ${data.namaLengkap}`;
  const htmlBody = buildAdminNotificationHTML(type, data);

  MailApp.sendEmail({
    to: CONFIG.NOTIFICATION_EMAIL,
    subject: subject,
    htmlBody: htmlBody,
    name: 'MEREACH Website Bot'
  });
}

/**
 * Build HTML Body for Admin Notification
 */
function buildAdminNotificationHTML(type, data) {
  let tableRows = '';
  // Map internal keys to friendly labels if needed, or just capitalize
  const labels = {
    namaLengkap: 'Nama Lengkap',
    namaPanggilan: 'Nama Panggilan',
    email: 'Email',
    usia: 'Usia',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    domisili: 'Domisili',
    pekerjaan: 'Pekerjaan',
    pendidikan: 'Pendidikan',
    kendaraan: 'Kendaraan',
    waktuProduktif: 'Waktu Produktif',
    sumberInfo: 'Sumber Info'
  };

  for (let key in data) {
    if (key !== 'type' && key !== 'action' && key !== 'waktuProduktifLain' && key !== 'namaTeman') {
      let val = data[key];
      if (key === 'waktuProduktif' && data.waktuProduktif === 'Lainnya') val = data.waktuProduktifLain;
      if (key === 'sumberInfo' && data.sumberInfo === 'Temen') val = `Teman (${data.namaTeman})`;
      
      tableRows += `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; color: #4a5568; font-size: 14px; font-weight: 600; width: 35%;">${labels[key] || key}</td>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; color: #2d3748; font-size: 14px;">${val || '-'}</td>
        </tr>`;
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body { font-family: 'Inter', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f7fafc; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background: #0F1724; padding: 30px; text-align: center; }
    .content { padding: 40px; }
    .btn { display: inline-block; padding: 14px 30px; background-color: #ff751f; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: all 0.3s ease; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Submission Baru Berhasil!</h2>
      <p style="color: #ff751f; margin: 5px 0 0; font-weight: bold;">${type}</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; color: #4a5568;">Halo Tim MEREACH, ada pendaftar baru yang baru saja mengirimkan formulir dari website.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
        ${tableRows}
      </table>
      
      <div style="text-align: center; margin-top: 35px;">
        <a href="${CONFIG.DASHBOARD_URL}" class="btn">Buka Dashboard</a>
      </div>
      
      <p style="margin-top: 40px; font-size: 12px; color: #a0aec0; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
        Notifikasi Otomatis Backend MEREACH<br>© 2026 MEREACH Official
      </p>
    </div>
  </div>
</body>
</html>`;
}
/**
 * TEST SYSTEM
 * Run this function from the Apps Script editor to verify your setup.
 * It will check sheet access and send a test notification.
 */
function testSystem() {
  try {
    if (CONFIG.SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE' || CONFIG.SPREADSHEET_ID === '') {
      throw new Error('SPREADSHEET_ID belum diisi! Silakan ganti "YOUR_SPREADSHEET_ID_HERE" dengan ID Spreadsheet Anda di baris ke-8.');
    }

    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const ssName = ss.getName();
    Logger.log('✅ Spreadsheet ditemukan: ' + ssName);
    
    const partnerSheet = ss.getSheetByName(CONFIG.SHEET_NAME_PARTNER);
    if (partnerSheet) {
      Logger.log('✅ Sheet "' + CONFIG.SHEET_NAME_PARTNER + '" ditemukan.');
    } else {
      Logger.log('❌ Sheet "' + CONFIG.SHEET_NAME_PARTNER + '" TIDAK DITEMUKAN! Pastikan nama tab di bawah sama persis.');
    }
    
    const temanSheet = ss.getSheetByName(CONFIG.SHEET_NAME_TEMAN);
    if (temanSheet) {
      Logger.log('✅ Sheet "' + CONFIG.SHEET_NAME_TEMAN + '" ditemukan.');
    } else {
      Logger.log('❌ Sheet "' + CONFIG.SHEET_NAME_TEMAN + '" TIDAK DITEMUKAN!');
    }
    
    // Test Email Notification
    sendAdminNotification('TEST SYSTEM', {
      namaLengkap: 'Sistem Test',
      status: 'SUCCESS',
      message: 'Sistem backend MEREACH sudah aktif dan terhubung!',
      timestamp: new Date()
    });
    Logger.log('✅ Email notifikasi percobaan telah dikirim ke: ' + CONFIG.NOTIFICATION_EMAIL);
    
    return "Tes Berhasil! Silakan cek Execution Log dan Email Anda.";
  } catch (error) {
    const errorMsg = error.toString();
    if (errorMsg.includes('not found') || errorMsg.includes('Unexpected error')) {
      Logger.log('❌ ERROR: Spreadsheet tidak ditemukan. Pastikan ID Spreadsheet di baris 8 sudah benar.');
    } else if (errorMsg.includes('permission')) {
      Logger.log('❌ ERROR: Script tidak punya izin. Klik "Run" sekali lagi dan berikan Review Permissions.');
    } else {
      Logger.log('❌ TEST FAILED: ' + errorMsg);
    }
    return "Tes Gagal: " + errorMsg;
  }
}
