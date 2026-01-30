# Product Requirements Document (PRD)
## StudySpace Admin Dashboard

**Version:** 1.0  
**Last Updated:** January 14, 2026  
**Product Owner:** StudySpace Team

---

## 1. Executive Summary

The StudySpace Admin Dashboard is a comprehensive web-based administration interface designed for managing educational resources, publishing notices, uploading syllabi, and moderating user access across the StudySpace platform. It provides college administrators and teachers with role-based access controls to efficiently moderate content and manage users within their respective departments.

---

## 2. Product Vision & Goals

### 2.1 Vision
To provide a secure, intuitive, and efficient content moderation system that empowers educational institutions to manage their StudySpace resources effectively while maintaining academic integrity and data isolation between colleges.

### 2.2 Key Goals
1. **Content Moderation** - Enable admins to approve, reject, or delete student-uploaded resources
2. **Notice Management** - Allow publishing and managing department-wide notices with priority levels
3. **Syllabus Distribution** - Facilitate organized upload and distribution of course syllabi
4. **User Moderation** - Provide ability to ban/unban users who violate platform policies
5. **Role-Based Access** - Ensure administrators can only access content relevant to their college/department

---

## 3. Target Users

| User Type | Description | Permissions |
|-----------|-------------|-------------|
| **Super Admin** | Platform-level administrator | Full access to all colleges, departments, and features |
| **College Admin** | College-specific administrator | Access limited to their college's resources, notices, syllabi |
| **Department Admin** | Department-specific administrator | Access restricted to specific departments within their college |
| **Teacher/Faculty** | Individual subject teachers | Can upload resources for their assigned subjects |

---

## 4. Core Features

### 4.1 Authentication & Authorization

| Feature | Description |
|---------|-------------|
| **Secret Key Login** | Secure login using hashed admin secret keys |
| **Session Management** | 24-hour session duration with automatic expiration |
| **Role-Based Permissions** | Granular access control based on admin role, college, and department |
| **Password Visibility Toggle** | User-friendly password field with show/hide functionality |
| **reCAPTCHA v3 Integration** | Bot protection on login to prevent automated attacks |

### 4.2 Resource Management (Dashboard)

| Feature | Description |
|---------|-------------|
| **Resource Statistics** | Real-time display of pending, approved, rejected, and total resources |
| **Advanced Filtering** | Filter by semester, branch, subject, and status |
| **Search Functionality** | Full-text search across resource titles with debouncing |
| **Resource Actions** | Approve, reject, or permanently delete resources |
| **Pagination** | Load resources in pages (20 per page) with "Load More" functionality |
| **Filter Persistence** | Save and load filter preferences to localStorage |
| **PDF Preview** | In-line preview of document resources before approval |
| **Upload Resources** | Direct upload of notes (PDF) or video links by administrators |

### 4.3 Notice Management

| Feature | Description |
|---------|-------------|
| **Create Notices** | Post notices with title, content, department targeting, and priority |
| **Priority Levels** | Low, Normal, High, and Urgent priority settings |
| **Expiration Dates** | Optional expiry dates for time-sensitive notices |
| **File Attachments** | Attach PDFs or video URLs to notices |
| **Active/Hidden Toggle** | Show or hide notices without permanent deletion |
| **Department Filtering** | Filter notices by target department |
| **Search & Sort** | Search notices by title/content; sort by date or priority |
| **Delete Notices** | Permanently remove notices with confirmation |

### 4.4 Syllabus Management

| Feature | Description |
|---------|-------------|
| **Upload Syllabi** | Upload PDF syllabi with semester, branch, subject, and academic year |
| **Subject Selection** | Dynamic subject dropdown based on selected branch |
| **Title & Metadata** | Custom title and academic year tagging |
| **Delete Syllabi** | Permanently remove syllabi with confirmation |
| **Cloud Storage** | Syllabi stored on Cloudinary for reliable delivery |

### 4.5 User Management

| Feature | Description |
|---------|-------------|
| **Ban Users** | Ban users by email with optional reason |
| **College-Specific Bans** | Non-super admins ban users only within their college |
| **Global Bans** | Super admins can issue platform-wide bans |
| **Unban Users** | Reinstate previously banned users |
| **Banned Users List** | View all banned users with ban dates and reasons |
| **Ban Audit Trail** | Track who banned each user and when |

---

## 5. User Interface

### 5.1 Design Principles
- **Glass Morphism** - Modern frosted glass aesthetic with semi-transparent cards
- **Dark/Light Theme** - Toggle between dark and light modes
- **Responsive Design** - Fully functional on desktop, tablet, and mobile devices
- **Animated Background** - Subtle particle animations for visual appeal
- **3D Motion Effects** - Interactive card tilt effects on hover (desktop)

### 5.2 Layout
- **Desktop** - Sidebar navigation with main content area
- **Mobile** - Bottom navigation bar with collapsible header actions
- **Modals** - Overlay modals for upload forms and previews

### 5.3 Visual Feedback
- **Toast Notifications** - Success, error, warning, and info messages
- **Loading States** - Spinners and skeleton loaders during data fetch
- **Empty States** - Friendly illustrations when no data is available
- **Status Badges** - Color-coded badges for resource status (pending/approved/rejected)

---

## 6. Non-Functional Requirements

### 6.1 Performance
| Requirement | Target |
|-------------|--------|
| Initial page load | < 3 seconds |
| API response time | < 500ms |
| Search debounce | 300ms delay |
| Cache TTL | 30 seconds for resource lists |

### 6.2 Compatibility
- **Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Devices**: Desktop (1024px+), Tablet (768px-1023px), Mobile (320px-767px)

### 6.3 Accessibility
- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Sufficient color contrast ratios

---

## 7. Integration Points

| Service | Purpose |
|---------|---------|
| **Supabase** | Database, authentication, and real-time subscriptions |
| **Cloudinary** | File storage and CDN for PDFs and media |
| **Backend API** | Custom Node.js API for admin operations (user banning) |
| **Google reCAPTCHA v3** | Bot protection for login form |
| **Lucide Icons** | Iconography throughout the UI |
| **Google Fonts** | Inter font family for typography |

---

## 8. Success Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Resource Approval Time | Average time from submission to approval decision | < 24 hours |
| Admin Adoption Rate | Percentage of admins actively using the dashboard | > 80% |
| Mobile Usage | Percentage of sessions from mobile devices | Tracked |
| User Ban Effectiveness | Reduction in policy violations post-ban | > 50% |
| System Uptime | Dashboard availability | 99.5% |

---

## 9. Future Roadmap

### Phase 2 Enhancements
- [ ] Real-time notifications for new pending resources
- [ ] Bulk approve/reject functionality
- [ ] Admin activity audit logs
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

### Phase 3 Enhancements
- [ ] AI-powered content moderation suggestions
- [ ] Automated duplicate detection
- [ ] Integration with college LMS systems
- [ ] Mobile native apps for administrators

---

## 10. Glossary

| Term | Definition |
|------|------------|
| **Resource** | Educational content (notes, PYQs, videos) uploaded by students |
| **Notice** | Announcements published by administrators to students |
| **Syllabus** | Official course syllabus documents for subjects |
| **Super Admin** | Administrator with platform-wide access |
| **College ID** | Unique identifier for each educational institution on the platform |
| **RLS** | Row Level Security - Supabase feature for data isolation |
