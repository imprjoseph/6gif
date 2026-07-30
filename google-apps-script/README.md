# 2026 6G Summit Taipei registration service

This Google Apps Script web app receives the public registration form, calculates
the subtotal server-side, records the registration in a private Google Sheet, and
sends a bilingual confirmation email through `chengi.joseph@gmail.com`.

## One-time deployment

1. Create a standalone project at <https://script.google.com/>.
2. Replace `Code.gs` with the contents of this directory's `Code.gs`.
3. In Project Settings, enable the manifest file and replace it with
   `appsscript.json`.
4. Run `setupRegistrationService` once and approve the requested permissions.
5. Select **Deploy → New deployment → Web app**.
6. Execute as **Me** and allow access to **Anyone**.
7. Copy the `/exec` web app URL into the registration form's `action` attribute.

Never place a Gmail password or OAuth token in the GitHub repository.
