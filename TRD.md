# Technical Requirements Document (TRD)
## StudySpace Admin Dashboard

**Version:** 1.0  
**Last Updated:** January 14, 2026  
**Author:** StudySpace Engineering Team

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Client (Browser)                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  index.html │ styles.css │ mobile.css │ app.js │ auth.js │ dashboard.js ││
│  │  notices-syllabus.js │ upload-resource.js │ users.js │ motion.js         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────────┐
                    │                                     │
                    ▼                                     ▼
         ┌─────────────────────┐              ┌─────────────────────┐
         │      Supabase       │              │   Backend API       │
         │   (Database + Auth) │              │   (Node.js/Express) │
         │  ──────────────────  │              │  api.mystudyspace.me │
         │  • Resources table   │              │  ──────────────────   │
         │  • Notices table     │              │  • /api/admin/users  │
         │  • Syllabi table     │              │    /ban              │
         │  • Banned_users      │              │  • /api/admin/users  │
         │  • Row Level Security│              │    /unban            │
         └─────────────────────┘              └─────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │     Cloudinary      │
         │   (File Storage)    │
         │  ──────────────────  │
         │  • PDF uploads       │
         │  • Notice attachments│
         │  • Syllabus files    │
         └─────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| HTML5 | - | Semantic markup and structure |
| CSS3 | - | Styling with CSS variables for theming |
| JavaScript (ES6+) | - | Client-side logic and interactivity |
| Lucide Icons | Latest | SVG icon library |
| Google Fonts (Inter) | - | Typography |

### 2.2 Backend Services
| Service | Purpose | Details |
|---------|---------|---------|
| **Supabase** | Database & Auth | PostgreSQL with Row Level Security |
| **Cloudinary** | File Storage | CDN-backed media storage |
| **Custom Backend** | Admin Operations | Node.js/Express API at `api.mystudyspace.me` |
| **Vercel** | Hosting | Static site deployment |

### 2.3 External Dependencies
```html
<!-- CDN Dependencies -->
<script src="https://unpkg.com/lucide@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://www.google.com/recaptcha/api.js?render=SITE_KEY"></script>
```

---

## 3. File Structure

```
admin-studyspace/
├── index.html              # Main HTML entry point (Single Page App)
├── styles.css              # Desktop and base styles (~37KB)
├── mobile.css              # Mobile-responsive styles (~12KB)
├── config.js               # Configuration (Supabase, Cloudinary, Backend URLs)
├── app.js                  # Main application logic, navigation, initialization
├── auth.js                 # Authentication & role-based permission system
├── dashboard.js            # Resource management & dashboard functionality
├── notices-syllabus.js     # Notices and syllabus CRUD operations
├── upload-resource.js      # Resource upload modal & file handling
├── users.js                # User ban/unban functionality
├── motion.js               # Theme toggle & 3D motion effects
├── create_banned_users_table.sql  # SQL schema for banned users
├── package.json            # NPM configuration (minimal)
├── vercel.json             # Vercel deployment configuration
└── api/                    # API proxy (if needed)
```

---

## 4. Database Schema

### 4.1 Resources Table (Supabase)
```sql
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL,           -- 'notes', 'pyq', 'video'
    semester INTEGER NOT NULL,
    branch TEXT NOT NULL,
    subject TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    uploader_name TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    college_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Notices Table (Supabase)
```sql
CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    department TEXT NOT NULL,      -- 'all', 'cse', 'ece', etc.
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    attachment_url TEXT,
    attachment_type TEXT,          -- 'pdf', 'video'
    college_id TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 Syllabi Table (Supabase)
```sql
CREATE TABLE syllabi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    semester INTEGER NOT NULL,
    branch TEXT NOT NULL,
    subject TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    file_url TEXT NOT NULL,
    college_id TEXT,
    uploaded_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 Banned Users Table (Supabase)
```sql
CREATE TABLE banned_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    reason TEXT,
    banned_by TEXT,
    college_id TEXT,               -- NULL for global bans
    banned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX idx_banned_users_email ON banned_users(email);
```

---

## 5. Authentication System

### 5.1 Admin Key Authentication Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Login Form     │────▶│  hashAdminKey()  │────▶│  Match against   │
│   (Secret Key)   │     │   SHA-256 hash   │     │  predefined keys │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                            │
                                                            ▼
                         ┌──────────────────┐     ┌──────────────────┐
                         │  localStorage    │◀────│  Create session  │
                         │  SESSION_KEY     │     │  with role data  │
                         └──────────────────┘     └──────────────────┘
```

### 5.2 Session Structure
```javascript
{
    key_hash: "sha256_hash_of_admin_key",
    name: "Admin Name",
    role: "super_admin" | "college_admin" | "department_admin" | "teacher",
    college_id: "kiet" | null,
    departments: ["cse", "ece"] | ["all"],
    subjects: { "cse": ["DSA", "DBMS"], "ece": ["Signals"] } | null,
    expires: 1736956609000  // Timestamp
}
```

### 5.3 Session Management
| Parameter | Value |
|-----------|-------|
| Storage Key | `admin_session` |
| Duration | 24 hours |
| Storage | `localStorage` |
| Expiry Check | On every permission check |

### 5.4 Permission Functions
```javascript
// Check if current user is authenticated
isAdmin() → boolean

// Check if super admin (full access)
isSuperAdmin() → boolean

// Check if can post to a specific department
canPostToDepartment(department) → boolean

// Check if can upload syllabus for subject
canUploadSyllabus(department, subject) → boolean

// Get allowed departments for current admin
getAllowedDepartments() → string[]

// Get allowed subjects for a department
getAllowedSubjects(department) → string[]
```

---

## 6. Security Implementation

### 6.1 Security Measures Overview

| Security Layer | Implementation |
|----------------|----------------|
| **Authentication** | SHA-256 hashed admin keys |
| **Session Security** | 24-hour expiring sessions in localStorage |
| **Bot Protection** | Google reCAPTCHA v3 on login |
| **Data Isolation** | Row Level Security (RLS) in Supabase |
| **API Authorization** | Bearer token authentication for backend API |
| **Input Validation** | Client-side validation before submission |
| **XSS Prevention** | HTML escaping in dynamic content rendering |
| **HTTPS** | All communications over TLS |
| **CORS** | Configured allowed origins on backend |

### 6.2 Row Level Security (RLS) Policies

```sql
-- Resources: Admins can only see their college's resources
CREATE POLICY "college_resource_access" ON resources
    FOR ALL USING (
        college_id = current_setting('app.college_id', true)
        OR current_setting('app.role', true) = 'super_admin'
    );

-- Notices: College-scoped access
CREATE POLICY "college_notice_access" ON notices
    FOR ALL USING (
        college_id = current_setting('app.college_id', true)
        OR current_setting('app.role', true) = 'super_admin'
    );

-- Banned Users: College-scoped bans
CREATE POLICY "college_ban_access" ON banned_users
    FOR ALL USING (
        college_id IS NULL  -- Global bans visible to all admins
        OR college_id = current_setting('app.college_id', true)
        OR current_setting('app.role', true) = 'super_admin'
    );
```

### 6.3 API Security

```javascript
// Backend API Authentication
// users.js - Ban User Request
const response = await fetch(`${backendUrl}/api/admin/users/ban`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${session.key_hash}`,  // Hashed key as token
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: email,
        reason: reason,
        college_id: session.role === 'super_admin' ? null : session.college_id
    })
});
```

### 6.4 reCAPTCHA Integration
```javascript
// Login form includes reCAPTCHA v3
// Site Key: 6LezUEAsAAAAAGQMAgp33ulSj4B_lRs2S_Q3G8ha
// Invisible protection, score-based bot detection
grecaptcha.execute('SITE_KEY', {action: 'login'}).then(token => {
    // Token included in login request for server-side verification
});
```

### 6.5 Credential Security

> ⚠️ **IMPORTANT:** Admin secret keys are never stored in plaintext.

| Credential | Storage Method |
|------------|----------------|
| Admin Keys | SHA-256 hashed before comparison |
| Supabase Keys | Stored in `config.js` (anon key only, public) |
| Cloudinary Keys | Upload preset (unsigned, no secret exposed) |
| Session Data | localStorage with expiry timestamps |

### 6.6 Content Security
```javascript
// HTML escaping for user-generated content
function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

// File type validation
const ALLOWED_FILE_TYPES = {
    notes: ['application/pdf'],
    video: ['url']  // Only URLs, no file upload
};
```

---

## 7. API Endpoints

### 7.1 Backend API (api.mystudyspace.me)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/admin/users/ban` | POST | Ban a user | Yes (Bearer token) |
| `/api/admin/users/unban` | POST | Unban a user | Yes (Bearer token) |
| `/api/admin/users/banned` | GET | List banned users | Yes (Bearer token) |

### 7.2 Supabase Direct Queries

| Table | Operations | RLS Applied |
|-------|------------|-------------|
| `resources` | SELECT, UPDATE, DELETE | Yes (college_id) |
| `notices` | SELECT, INSERT, UPDATE, DELETE | Yes (college_id) |
| `syllabi` | SELECT, INSERT, DELETE | Yes (college_id) |
| `banned_users` | SELECT, INSERT, DELETE | Yes (college_id) |

### 7.3 Cloudinary Upload

| Endpoint | Parameters |
|----------|------------|
| `https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload` | `file`, `upload_preset`, `folder`, `public_id` |

---

## 8. Performance Optimizations

### 8.1 Implemented Optimizations

| Optimization | Implementation |
|--------------|----------------|
| **Debounced Search** | 300ms delay before executing search queries |
| **Pagination** | 20 resources per page with "Load More" |
| **Local Caching** | 30-second cache for resource lists |
| **Filter Persistence** | Filters saved to localStorage |
| **Lazy Icon Loading** | Lucide icons created on-demand |
| **CSS Variables** | Theme switching without re-render |

### 8.2 Performance Configuration
```javascript
// dashboard.js
const CACHE_KEY = 'admin_resources_cache';
const CACHE_TTL = 30000;  // 30 seconds
const PAGE_SIZE = 20;

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
```

---

## 9. Deployment Configuration

### 9.1 Vercel Configuration
```json
// vercel.json
{
    "rewrites": [
        { "source": "/(.*)", "destination": "/" }
    ]
}
```

### 9.2 Environment-Specific Configurations

| Environment | Backend URL | Supabase Project |
|-------------|-------------|------------------|
| Production | `https://api.mystudyspace.me` | `iayuwsvguwfqjgjsvjiy.supabase.co` |
| Development | `http://localhost:3000` | Same or local |

---

## 10. Error Handling

### 10.1 Error Display Pattern
```javascript
try {
    // Operation
} catch (error) {
    console.error('Error:', error);
    showToast('User-friendly message: ' + error.message, 'error');
}
```

### 10.2 Toast Notification Types
| Type | Color | Use Case |
|------|-------|----------|
| `success` | Green | Successful operations |
| `error` | Red | Failed operations |
| `warning` | Orange | Cautionary messages |
| `info` | Blue | Informational messages |

---

## 11. Browser Compatibility

### 11.1 Required Browser Features
- ES6 Classes and Arrow Functions
- Fetch API
- CSS Grid and Flexbox
- CSS Custom Properties (Variables)
- LocalStorage API
- Crypto API (SubtleCrypto for SHA-256)

### 11.2 Polyfills Required
None - Modern browsers only (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

---

## 12. Monitoring & Logging

### 12.1 Console Logging
```javascript
// Module load confirmation
console.log('✅ Auth.js loaded with role-based permissions');
console.log('✅ Supabase client initialized (public only)');
console.log('✅ Cloudinary configured for uploads');

// Operation logging
console.log('🚫 Banning user:', email);
console.log('✅ Unbanning user:', email);
```

### 12.2 Error Tracking
Currently client-side only via `console.error()`. Future integration recommended:
- Sentry for error tracking
- Analytics for usage patterns

---

## 13. Testing Strategy

### 13.1 Recommended Test Coverage

| Test Type | Scope |
|-----------|-------|
| **Unit Tests** | Permission functions in auth.js |
| **Integration Tests** | Supabase CRUD operations |
| **E2E Tests** | Login flow, resource approval flow |
| **Manual Testing** | Cross-browser, mobile responsive |

### 13.2 Critical Test Scenarios

1. **Authentication**
   - Valid admin key login
   - Invalid key rejection
   - Session expiration handling
   - Role-based menu visibility

2. **Resource Management**
   - Filter by status, semester, branch
   - Approve/reject updates database
   - Delete confirmation and removal

3. **User Management**
   - Ban user creates database entry
   - Unban removes entry
   - College-scoped bans working

---

## 14. Maintenance & Updates

### 14.1 Configuration Updates
| Item | File | Variable |
|------|------|----------|
| Supabase URL | `config.js` | `SUPABASE_CONFIG.url` |
| Supabase Key | `config.js` | `SUPABASE_CONFIG.anonKey` |
| Backend URL | `config.js` | `BACKEND_CONFIG.baseUrl` |
| Cloudinary Cloud | `config.js` | `CLOUDINARY_CONFIG.cloudName` |
| reCAPTCHA Key | `index.html` | Script src parameter |

### 14.2 Adding New Admin Keys
Admin keys are defined in the authentication system. To add new admins:
1. Define the admin profile (name, role, college_id, departments)
2. Generate a secret key
3. Hash the key with SHA-256
4. Add to the admin keys configuration

---

## 15. Known Limitations

| Limitation | Workaround |
|------------|------------|
| No real-time updates | Manual refresh or page reload |
| No bulk operations | Process items one at a time |
| No audit log UI | Check database directly |
| Mobile upload limitations | Use desktop for file uploads |
| No offline support | Requires internet connection |

---

## 16. Future Technical Improvements

1. **Real-time Subscriptions** - Supabase realtime for instant updates
2. **Service Worker** - PWA support for offline capability
3. **Web Vitals** - Performance monitoring integration
4. **Error Boundary** - Graceful error handling
5. **Bundle Optimization** - Code splitting and lazy loading
6. **TypeScript Migration** - Type safety for maintainability
