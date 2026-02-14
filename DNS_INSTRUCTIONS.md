# DNS Configuration Guide for mereach.com

To activate your professional email (`gilang@mereach.com`) and ensure your automated emails (Auth.js Magic Links) don't go to spam, please add the following records to your domain provider (GoDaddy, Namecheap, etc.).

## 1. Outbound Email (Enable Sending via Resend)
| Type | Name | Value | Purpose |
| :--- | :--- | :--- | :--- |
| **TXT** | `@` | `v=spf1 include:resend.com ~all` | Authorize Resend to send emails |
| **TXT** | `resend._domainkey` | (Check Resend Dashboard for unique key) | Digital Signature (DKIM) |
| **TXT** | `_dmarc` | `v=DMARC1; p=none;` | Email Security Policy |

## 2. Inbound Email (Choose ONE Solution)

### Option A: ImprovMX (Easiest - Forwarding to Gmail)
1. Go to [ImprovMX.com](https://improvmx.com).
2. Enter `mereach.com` and your personal Gmail.
3. Add these MX records:
| Type | Name | Value | Priority |
| :--- | :--- | :--- | :--- |
| **MX** | `@` | `mx1.improvmx.com` | 10 |
| **MX** | `@` | `mx2.improvmx.com` | 20 |

### Option B: Zoho Mail (Professional Separate Inbox)
1. Go to [Zoho Mail Forever Free](https://www.zoho.com/mail/zohomail-pricing.html).
2. Follow their setup wizard to add these MX records:
| Type | Name | Value | Priority |
| :--- | :--- | :--- | :--- |
| **MX** | `@` | `mx.zoho.com` | 10 |
| **MX** | `@` | `mx2.zoho.com` | 20 |
| **MX** | `@` | `mx3.zoho.com` | 50 |

---
> [!NOTE]
> DNS changes can take up to 24 hours to propagate globally, but usually work within 1 hour.
