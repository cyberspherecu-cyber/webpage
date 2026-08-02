# 👻 Ghost Protocol — Complete Walkthrough

This document explains the 7-step hidden easter egg challenge. Use it to test the challenge yourself or show others how it works.

---

## Step 1: Open DevTools Console

1. Visit the **Home page** (`/`)
2. Open **Chrome DevTools** → **Console** tab
3. Look for styled console messages starting with `[BOOT_SEQUENCE]`
4. You'll see a **hex string**: `2f67686f73742d70726f746f636f6c`

## Step 2: Decode the Hex

Decode the hex string:
```
2f67686f73742d70726f746f636f6c
```

**Method 1** — In the browser console:
```js
// The console already decodes it for you, but if you want to do it manually:
const hex = '2f67686f73742d70726f746f636f6c';
const decoded = hex.match(/.{1,2}/g).map(b => String.fromCharCode(parseInt(b, 16))).join('');
console.log(decoded); // → /ghost-protocol
```

**Method 2** — Using terminal:
```bash
echo -n '2f67686f73742d70726f746f636f6c' | xxd -r -p
# → /ghost-protocol
```

## Step 3: Visit the Hidden Page

Navigate to `/ghost-protocol` in your browser:
```
https://your-site.com/ghost-protocol
```

You'll see a terminal-like page with a boot sequence. Wait for all messages to appear.

## Step 4: Check the Page Source

Open **View Page Source** (Right-click → "View Page Source" or `Ctrl+U`).

Scroll to find HTML comments containing clues:

```html
<!-- [CLUE 1/2] The protocol handshake requires an authentication token. -->
<!--             Send it as: X-Ghost-Protocol                    -->
```

```html
<!-- [CLUE 2/2] The token is base64 encoded below:               -->
<!--             Q1NQSEVSRXtnaDBzdF8xbl90aDNfc2gzbGx9             -->
<!--             Decode it to reveal the handshake password.      -->
```

## Step 5: Decode the Base64 Token

Decode `Q1NQSEVSRXtnaDBzdF8xbl90aDNfc2gzbGx9`:

**Using terminal:**
```bash
echo 'Q1NQSEVSRXtnaDBzdF8xbl90aDNfc2gzbGx9' | base64 -d
# → CSPHERE{gh0st_1n_th3_sh3ll}
```

**Using browser console:**
```js
atob('Q1NQSEVSRXtnaDBzdF8xbl90aDNfc2gzbGx9')
// → "CSPHERE{gh0st_1n_th3_sh3ll}"
```

## Step 6: Call the Hidden API

Send a request to the hidden API endpoint with the token as a header:

**Using curl:**
```bash
curl -H 'X-Ghost-Protocol: CSPHERE{gh0st_1n_th3_sh3ll}' \
     https://your-site.com/api/ghost-key
```

**Response:**
```json
{
  "success": true,
  "key": "47d3e8a1c9f2b4d6",
  "message": "Ghost Protocol verified. Proceed to /hacked/47d3e8a1c9f2b4d6"
}
```

## Step 7: Claim Victory!

Navigate to:
```
https://your-site.com/hacked/47d3e8a1c9f2b4d6
```

🎉 **You've successfully hacked Cysecsphere!**

The victory page shows:
- Matrix Rain background
- Floating particle effects
- Glitch animation every 3 seconds
- Your personalized "Ghost Protocol — Cracked" trophy card
- A fake SHA-256 hash of your achievement

---

## Quick Reference

| Step | Action | Result |
|------|--------|--------|
| 1 | Open console on Home page | See hex string |
| 2 | Decode hex | `/ghost-protocol` |
| 3 | Visit `/ghost-protocol` | Terminal page |
| 4 | View page source | Find base64 token |
| 5 | Decode base64 | `CSPHERE{gh0st_1n_th3_sh3ll}` |
| 6 | Send header to `/api/ghost-key` | Get access key |
| 7 | Visit `/hacked/[key]` | **YOU HACKED CYSECSPHERE!** 🏆 |
