const EVENT_NAME = '2026 6G Summit Taipei';
const EVENT_DATES = '23–24 September 2026';
const EVENT_VENUE = 'Taipei International Convention Center (TICC)';
const EVENT_WEBSITE = 'https://imprjoseph.github.io/6gif/';
const SENDER_EMAIL = 'chengi.joseph@gmail.com';
const SHEET_PROPERTY = 'REGISTRATION_SHEET_ID';

const PRICES = {
  member: {
    'conference-only': 8000,
    'conference-and-gala': 10000,
  },
  'non-member': {
    'conference-only': 10000,
    'conference-and-gala': 13000,
  },
};

function doGet() {
  return HtmlService.createHtmlOutput(
    '<p>2026 6G Summit Taipei registration service is ready.</p>'
  );
}

function doPost(event) {
  try {
    const data = normalizeRegistration_(event && event.parameter);
    validateRegistration_(data);

    if (data.website) {
      return response_({ ok: true });
    }

    const registrationId = createRegistrationId_();
    const amount = PRICES[data.membership_status][data.registration_option];
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      appendRegistration_(registrationId, data, amount);
    } finally {
      lock.releaseLock();
    }

    sendConfirmation_(registrationId, data, amount);
    return response_({ ok: true, registrationId: registrationId });
  } catch (error) {
    console.error(error);
    return response_({
      ok: false,
      message: 'Registration could not be completed. Please try again or contact the organizer.',
    });
  }
}

function setupRegistrationService() {
  const properties = PropertiesService.getScriptProperties();
  let sheetId = properties.getProperty(SHEET_PROPERTY);

  if (!sheetId) {
    const spreadsheet = SpreadsheetApp.create(EVENT_NAME + ' Registrations');
    const sheet = spreadsheet.getSheets()[0];
    sheet.setName('Registrations');
    sheet.appendRow([
      'Submitted At',
      'Registration ID',
      'Full Name',
      'Email',
      'Mobile Number',
      'Company / Organization',
      'Job Title',
      'Country / Region',
      '6GIF Membership Status',
      'Registration Option',
      'Invoice Tax ID',
      'Invoice Company Name',
      'Dietary Preference',
      'Polo Shirt Size',
      'Subtotal (NT$)',
      'Privacy Consent',
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 16).setFontWeight('bold');
    sheet.autoResizeColumns(1, 16);
    sheetId = spreadsheet.getId();
    properties.setProperty(SHEET_PROPERTY, sheetId);
  }

  return 'Registration service is ready. Spreadsheet: https://docs.google.com/spreadsheets/d/' + sheetId;
}

function normalizeRegistration_(parameters) {
  const source = parameters || {};
  return {
    name: clean_(source.name),
    email: clean_(source.email).toLowerCase(),
    phone: clean_(source.phone),
    company: clean_(source.company),
    title: clean_(source.title),
    country: clean_(source.country),
    membership_status: clean_(source.membership_status),
    registration_option: clean_(source.registration_option),
    invoice_tax_id: clean_(source.invoice_tax_id),
    invoice_company_name: clean_(source.invoice_company_name),
    diet: clean_(source.diet),
    shirt: clean_(source.shirt),
    privacy_consent: clean_(source.privacy_consent),
    website: clean_(source.website),
  };
}

function validateRegistration_(data) {
  const required = [
    'name',
    'email',
    'phone',
    'company',
    'title',
    'country',
    'membership_status',
    'registration_option',
    'privacy_consent',
  ];

  required.forEach(function (field) {
    if (!data[field]) {
      throw new Error('Missing required field: ' + field);
    }
  });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('Invalid email address.');
  }

  if (!PRICES[data.membership_status] ||
      !PRICES[data.membership_status][data.registration_option]) {
    throw new Error('Invalid registration selection.');
  }

  if (data.invoice_tax_id && !/^\d{8}$/.test(data.invoice_tax_id)) {
    throw new Error('Invalid invoice tax ID.');
  }
}

function appendRegistration_(registrationId, data, amount) {
  const spreadsheet = getRegistrationSpreadsheet_();
  const sheet = spreadsheet.getSheetByName('Registrations') || spreadsheet.getSheets()[0];
  sheet.appendRow([
    new Date(),
    registrationId,
    safeSheetValue_(data.name),
    safeSheetValue_(data.email),
    safeSheetValue_(data.phone),
    safeSheetValue_(data.company),
    safeSheetValue_(data.title),
    safeSheetValue_(data.country),
    membershipLabel_(data.membership_status),
    optionLabel_(data.registration_option),
    safeSheetValue_(data.invoice_tax_id),
    safeSheetValue_(data.invoice_company_name),
    dietLabel_(data.diet),
    safeSheetValue_(data.shirt),
    amount,
    'Agreed',
  ]);
}

function sendConfirmation_(registrationId, data, amount) {
  const subject = '[Registration Confirmed] ' + EVENT_NAME + ' — ' + registrationId;
  const textBody = [
    'Dear ' + data.name + ',',
    '',
    'Thank you for registering for ' + EVENT_NAME + '.',
    'Registration ID: ' + registrationId,
    'Registration Option: ' + optionLabel_(data.registration_option),
    'Estimated Subtotal: NT$' + formatAmount_(amount),
    '',
    EVENT_DATES,
    EVENT_VENUE,
    '',
    'Event website: ' + EVENT_WEBSITE,
    '',
    '您好，' + data.name + '：',
    '',
    '感謝您報名「2026 6G Summit Taipei」。',
    '報名編號：' + registrationId,
    '報名方案：' + optionLabelZh_(data.registration_option),
    '費用小計：NT$' + formatAmount_(amount),
    '',
    '活動日期：2026 年 9 月 23–24 日',
    '活動地點：台北國際會議中心（TICC）',
  ].join('\n');

  const htmlBody =
    '<div style="font-family:Arial,Helvetica,sans-serif;color:#17203c;line-height:1.65;max-width:680px;margin:auto">' +
      '<div style="background:linear-gradient(90deg,#ec168c,#7137ee,#007bff);padding:28px 32px;color:#fff">' +
        '<div style="font-size:13px;letter-spacing:.12em;font-weight:700">REGISTRATION CONFIRMED</div>' +
        '<h1 style="margin:8px 0 0;font-size:28px">' + escapeHtml_(EVENT_NAME) + '</h1>' +
      '</div>' +
      '<div style="padding:30px 32px;border:1px solid #e4e7f0;border-top:0">' +
        '<p>Dear ' + escapeHtml_(data.name) + ',</p>' +
        '<p>Thank you for registering. Your registration details are shown below.</p>' +
        registrationTable_(registrationId, data, amount) +
        '<p style="margin-top:28px"><strong>' + EVENT_DATES + '</strong><br>' +
          EVENT_VENUE + '<br>' +
          '1, Hsin-Yi Road, Section 5, Taipei 11049, Taiwan</p>' +
        '<p><a href="' + EVENT_WEBSITE + '" style="color:#075bd8;font-weight:700">Visit event website</a></p>' +
        '<hr style="border:0;border-top:1px solid #e4e7f0;margin:30px 0">' +
        '<p>您好，' + escapeHtml_(data.name) + '：</p>' +
        '<p>感謝您報名「2026 6G Summit Taipei」，您的報名資料如下。</p>' +
        '<p><strong>報名編號：</strong>' + escapeHtml_(registrationId) + '<br>' +
          '<strong>報名方案：</strong>' + escapeHtml_(optionLabelZh_(data.registration_option)) + '<br>' +
          '<strong>費用小計：</strong>NT$' + formatAmount_(amount) + '</p>' +
        '<p><strong>活動日期：</strong>2026 年 9 月 23–24 日<br>' +
          '<strong>活動地點：</strong>台北國際會議中心（TICC）</p>' +
        '<p style="font-size:12px;color:#69708a;margin-top:28px">This is an automated confirmation email. If you need assistance, reply to ' +
          escapeHtml_(SENDER_EMAIL) + '.</p>' +
      '</div>' +
    '</div>';

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    body: textBody,
    htmlBody: htmlBody,
    name: EVENT_NAME,
    replyTo: SENDER_EMAIL,
  });
}

function registrationTable_(registrationId, data, amount) {
  const rows = [
    ['Registration ID', registrationId],
    ['Full Name', data.name],
    ['Company / Organization', data.company],
    ['Registration Option', optionLabel_(data.registration_option)],
    ['Gala Dinner', data.registration_option === 'conference-and-gala' ? 'Included' : 'Not included'],
    ['Dietary Preference', dietLabel_(data.diet)],
    ['Polo Shirt Size', data.shirt || 'Not selected'],
    ['Estimated Subtotal', 'NT$' + formatAmount_(amount)],
  ];

  return '<table style="width:100%;border-collapse:collapse;margin:24px 0">' +
    rows.map(function (row) {
      return '<tr><th style="text-align:left;padding:10px 12px;background:#f4f6fb;border:1px solid #dfe3ee;width:42%">' +
        escapeHtml_(row[0]) + '</th><td style="padding:10px 12px;border:1px solid #dfe3ee">' +
        escapeHtml_(row[1]) + '</td></tr>';
    }).join('') +
  '</table>';
}

function getRegistrationSpreadsheet_() {
  const sheetId = PropertiesService.getScriptProperties().getProperty(SHEET_PROPERTY);
  if (!sheetId) {
    throw new Error('Run setupRegistrationService before accepting registrations.');
  }
  return SpreadsheetApp.openById(sheetId);
}

function response_(payload) {
  const message = JSON.stringify({
    source: '6gif-registration',
    ok: Boolean(payload.ok),
    registrationId: payload.registrationId || '',
    message: payload.message || '',
  }).replace(/</g, '\\u003c');

  return HtmlService.createHtmlOutput(
    '<!doctype html><meta charset="utf-8"><script>' +
    'window.top.postMessage(' + message + ',"*");' +
    '</script>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function createRegistrationId_() {
  const date = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyyMMdd');
  return '6G-' + date + '-' + Utilities.getUuid().slice(0, 8).toUpperCase();
}

function membershipLabel_(value) {
  return value === 'member' ? '6GIF Member' : 'Non-member';
}

function optionLabel_(value) {
  return value === 'conference-and-gala'
    ? 'Conference + VIP Gala Dinner'
    : 'Conference Only (No Gala Dinner)';
}

function optionLabelZh_(value) {
  return value === 'conference-and-gala'
    ? '會議及 VIP 晚宴'
    : '僅參加會議（不參加晚宴）';
}

function dietLabel_(value) {
  const labels = {
    regular: 'Regular',
    vegetarian: 'Vegetarian',
    'no-meal': 'No Meal',
  };
  return labels[value] || 'Not selected';
}

function formatAmount_(amount) {
  return Number(amount).toLocaleString('en-US');
}

function clean_(value) {
  return String(value || '').trim().slice(0, 500);
}

function safeSheetValue_(value) {
  const text = clean_(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
