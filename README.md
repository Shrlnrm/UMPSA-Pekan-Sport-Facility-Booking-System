# UMPSA Pekan Sport Facility Booking System

A web-based sport facility booking system for Universiti Malaysia Pahang Al-Sultan Abdullah (UMPSA) Pekan campus. Students and staff can browse, search, and book sport facilities — and admins can manage bookings, facilities, announcements, and reports all in one place.

## Features

- **Public Landing Page**: Browse popular sport facilities without logging in.
- **User Dashboard**: View booking history (All, Confirmed, Cancelled, Passed), book facilities, submit issue reports, and read announcements.
- **Admin Dashboard**: Manage facilities, approve/cancel bookings, post announcements, handle maintenance reports, and generate PDF reports.
- **Weekly Availability Grid**: Visual slot calendar (Free / Booked / Closed) for each facility.
- **Real-time Data**: All bookings and facility status sync live via Supabase.
- **PWA Support**: Installable as a Progressive Web App on mobile devices.

## Facilities (7 total)

| # | Name | Type | Max Capacity | Location |
|---|------|------|:---:|---------|
| 1 | Open Indoor Court | Indoor | — | Multipurpose Hall, UMPSA Pekan |
| 2 | Open Court B | Outdoor | 15 | Multipurpose Court, UMPSA Pekan |
| 3 | Petanque Court | Outdoor | 15 | Petanque Court, UMPSA Pekan |
| 4 | UMPSA Football Playground | Outdoor | 23 | Football Playground, UMPSA Pekan |
| 5 | Basketball Court | Outdoor | 10 | Student Activity Center (PAP), UMPSA Pekan |
| 6 | Open Court A | Outdoor | 15 | Multipurpose Court, UMPSA Pekan |
| 7 | Futsal Court | Outdoor | 10 | Futsal Open Court, UMPSA Pekan |

## Account Types

| Role | How to Get | Access |
|------|-----------|--------|
| **Student / Staff (User)** | Register with a valid UMPSA email (`@adab.umpsa.edu.my` or `@umpsa.edu.my`) | Book facilities, view own bookings, submit reports, read announcements |
| **Admin** | Account created manually in Supabase by a super-admin | Full dashboard: manage facilities, approve/cancel bookings, post announcements, handle reports, export PDF |

> **Note:** Only UMPSA students and staff are allowed to use the facilities. Strict action or fines will be imposed if outsiders are involved.

## How to Register

1. Go to the live site or open `index.html` locally.
2. Click the **Register** button on the landing page hero section.
3. Fill in your details:
   - **Full Name**
   - **UMPSA Email** (must be an official UMPSA email address)
   - **Password** (minimum 6 characters)
4. Click **Register** — you will be redirected to the Login page.
5. Log in with your email and password to access the User Dashboard.

> To reset your password, click **Forgot Password?** on the Login page and follow the email link.

## Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Shrlnrm/UMPSA-Pekan-Sport-Facility-Booking-System.git
   cd UMPSA-Pekan-Sport-Facility-Booking-System
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Supabase**:
   Open `js/supabaseClient.js` and ensure the project URL and anon key match your Supabase project:
   ```js
   const SUPABASE_URL = 'https://<your-project>.supabase.co';
   const SUPABASE_ANON_KEY = '<your-anon-key>';
   ```

4. **Run the site**:

   The project is a static multi-page HTML site. No build step is needed. Simply open `index.html` in a browser, or serve it using any local static server:
   ```bash
   # Option A – VS Code Live Server (recommended)
   # Right-click index.html → "Open with Live Server"

   # Option B – Python
   python -m http.server 8080

   # Option C – npx serve
   npx serve .
   ```
   Then open `http://localhost:8080` (or whichever port your server uses).

5. **Live Site**:
   The site is also deployed via GitHub Pages / CI. See the GitHub Actions workflow in `.github/workflows/deploy.yml`.

## Tech Stack

- **Frontend**: Vanilla HTML5, Tailwind CSS (CDN), Vanilla JavaScript
- **Icons**: Lucide Icons (CDN)
- **Database & Auth**: Supabase (PostgreSQL + Supabase Auth)
- **Storage**: Supabase Storage (facility images, report photo proofs)
- **PWA**: Web App Manifest + Service Worker
- **Fonts**: Inter (Google Fonts)
- **PDF Export**: Admin dashboard report export (client-side)
- **CI/CD**: GitHub Actions (`deploy.yml`)

## Project Structure

```
├── index.html                  # Landing page
├── LogInPage/
│   └── LogInPage.html          # Login
├── RegisterPage/
│   └── RegisterPage.html       # Registration
├── ResetPasswordPage/
│   └── ResetPasswordPage.html  # Password reset request
├── NewPasswordPage/
│   └── NewPasswordPage.html    # Set new password
├── UserDashboard/
│   └── UserDashboard.html      # Authenticated user portal
├── AdminDashboard/
│   └── AdminDashboard.html     # Admin portal
├── js/
│   ├── supabaseClient.js       # Supabase init (URL + anon key)
│   └── auth.js                 # Auth helpers
├── icons/                      # PWA icons (72px – 512px)
├── ImagesForHeaderandFooter/   # Logo + banner assets
├── manifest.json               # PWA manifest
├── service-worker.js           # PWA service worker
└── supabase/
    └── config.toml             # Supabase CLI config
```

## Contact

- 📞 +60 176270664
- 📧 umpsasportsbooking@gmail.com
- 🌐 [UMPSA Sports Centre](https://sukan.umpsa.edu.my/)
- 🌐 [Official UMPSA Site](https://umpsa.edu.my/en)
