# Panduan Integrasi Platform Posting Eksternal

## Overview
Sistem TalentFlow HR mendukung integrasi dengan 5 platform posting pekerjaan utama di Indonesia:
- **JobStreet Indonesia** - Platform rekrutmen terbesar di Asia Tenggara
- **Indeed** - Platform pencarian kerja global dengan jangkauan luas
- **LinkedIn Jobs** - Platform profesional untuk posisi level menengah-tinggi
- **Glints** - Platform untuk fresh graduate dan startup
- **Kalibrr** - Platform teknologi dengan algoritma matching canggih

## Konfigurasi Environment Variables

Tambahkan variable berikut ke environment Anda (.env file atau sistem environment):

### 1. JobStreet Indonesia
```bash
# Daftar di: https://developer.jobstreet.co.id/
JOBSTREET_API_KEY=your_jobstreet_api_key_here
```

**Cara mendapatkan API Key:**
1. Daftar sebagai employer di JobStreet
2. Kunjungi JobStreet Developer Portal
3. Buat aplikasi baru untuk posting otomatis
4. Copy API key yang diberikan

### 2. Indeed Publisher
```bash
# Daftar di: https://ads.indeed.com/jobroll/xmlfeed
INDEED_PUBLISHER_ID=your_publisher_id_here
INDEED_API_KEY=your_indeed_api_key_here
```

**Cara mendapatkan Publisher ID:**
1. Daftar Indeed Publisher account
2. Verifikasi domain perusahaan
3. Dapatkan Publisher ID dari dashboard
4. Generate API key untuk XML feed

### 3. LinkedIn Jobs API
```bash
# Daftar di: https://developer.linkedin.com/
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_ACCESS_TOKEN=your_access_token
```

**Cara mendapatkan LinkedIn API Access:**
1. Buat LinkedIn Company Page
2. Daftar LinkedIn Developer Program
3. Buat aplikasi dengan "Job Postings" permission
4. Dapatkan OAuth 2.0 access token

### 4. Glints API
```bash
# Kontak: business@glints.com untuk enterprise API
GLINTS_API_KEY=your_glints_api_key_here
```

**Cara mendapatkan Glints API:**
1. Daftar sebagai enterprise employer
2. Hubungi tim business development
3. Setup enterprise account dengan API access
4. Dapatkan API key dari dashboard

### 5. Kalibrr API
```bash
# Daftar di: https://www.kalibrr.com/business
KALIBRR_API_KEY=your_kalibrr_api_key_here
```

**Cara mendapatkan Kalibrr API:**
1. Buat business account di Kalibrr
2. Upgrade ke premium subscription
3. Request API access melalui support
4. Dapatkan API credentials

### 6. Company Information (Optional)
```bash
# Informasi perusahaan untuk posting
COMPANY_NAME=PT TalentFlow Indonesia
COMPANY_DESCRIPTION=Leading HR SaaS platform for Indonesian SMEs
COMPANY_EMAIL=hr@talentflow.com
COMPANY_APPLY_URL=https://careers.talentflow.com/apply
```

## Penggunaan

### Posting Otomatis
Setelah konfigurasi API keys, sistem akan otomatis menggunakan integrasi nyata:

1. **Buat lowongan** di dashboard recruitment
2. **Pilih platform** untuk posting eksternal
3. **Klik posting** - sistem akan otomatis mengirim ke platform yang dipilih
4. **Monitoring hasil** melalui dashboard

### Status Integrasi
Cek status integrasi di dashboard admin:
- ✅ **Configured**: Platform siap digunakan
- ❌ **Not Configured**: API key belum disetup
- ⚠️ **Error**: Ada masalah koneksi atau kredensial

### Format Data yang Dikirim

**JobStreet Format:**
```json
{
  "title": "Software Engineer",
  "description": "Job description...",
  "requirements": "Job requirements...",
  "location": "Jakarta",
  "salary_range": "Rp 8.000.000 - Rp 12.000.000",
  "employment_type": "FULL_TIME",
  "openings": 1,
  "company_name": "PT TalentFlow",
  "benefits": ["Health Insurance", "Transport Allowance"]
}
```

**Indeed Format:**
```json
{
  "publisher": "your_publisher_id",
  "title": "Software Engineer",
  "description": "Combined description and requirements",
  "location": "Jakarta, Indonesia",
  "company": "PT TalentFlow",
  "jobtype": "fulltime",
  "salary": "Rp 8.000.000 - Rp 12.000.000"
}
```

**LinkedIn Format:**
```json
{
  "title": "Software Engineer",
  "description": "Job description with requirements",
  "location": {
    "countryCode": "ID",
    "city": "Jakarta"
  },
  "employmentType": "FULL_TIME",
  "companyName": "PT TalentFlow"
}
```

## Error Handling

Sistem menghandle berbagai error scenario:

1. **API Key Tidak Valid**
   - Error: "Invalid API credentials"
   - Solusi: Periksa dan update API key

2. **Rate Limiting**
   - Error: "Too many requests"
   - Solusi: Sistem otomatis retry dengan backoff

3. **Platform Maintenance**
   - Error: "Service temporarily unavailable"
   - Solusi: Coba lagi nanti atau gunakan platform lain

4. **Invalid Job Data**
   - Error: "Required field missing"
   - Solusi: Lengkapi semua field wajib

## Best Practices

### 1. Testing
```bash
# Test koneksi platform
curl -X POST /api/jobs/1/post-external \
  -H "Content-Type: application/json" \
  -d '{"platforms": ["jobstreet"]}'
```

### 2. Monitoring
- Setup alerting untuk failed postings
- Monitor API usage dan rate limits
- Track conversion rate per platform

### 3. Content Optimization
- **JobStreet**: Focus pada benefits dan company culture
- **Indeed**: Optimize untuk SEO keywords
- **LinkedIn**: Highlight career growth opportunities
- **Glints**: Target fresh graduates dengan learning opportunities
- **Kalibrr**: Emphasize technical skills dan challenges

### 4. Compliance
- Pastikan job posting sesuai regulasi ketenagakerjaan
- Include equal opportunity statement
- Comply dengan GDPR untuk data applicant

## Troubleshooting

### Platform Tidak Muncul di List
```javascript
// Check di browser console
fetch('/api/platform-status')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Posting Gagal
1. Cek logs server untuk error details
2. Verifikasi API credentials
3. Test manual posting via platform website
4. Contact platform support jika perlu

### Performance Issues
- Enable caching untuk platform responses
- Implement async posting untuk multiple platforms
- Setup background job queue

## Support

Untuk bantuan teknis:
- **Email**: tech-support@talentflow.com
- **Documentation**: https://docs.talentflow.com/integrations
- **Slack**: #tech-support channel

## API Endpoints Reference

```
GET /api/platform-status - Check integration status
POST /api/jobs/:id/post-external - Post to external platforms
GET /api/external-postings/:id - Get posting status
DELETE /api/external-postings/:id - Remove from external platform
```