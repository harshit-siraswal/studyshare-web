# StudySpace (Explanify) — Comprehensive Product Document

**Version:** 2.0  
**Product:** StudySpace Enterprise & Explanify Student Portal  

---

## 1. Executive Summary

**StudySpace** (featuring the student-facing portal **Explanify**) is a comprehensive, centralized educational web platform engineered for both college students and administrators. The product resolves the chronic fragmentation of college communication by unifying syllabus management, academic resource sharing, sophisticated AI study tools, social networking, and peer-to-peer discourse into a single, cohesive application.

The core pain point solved is the reliance on scattered platforms for academic coordination. By bringing everything under one roof within a premium, "glassmorphism" UI, StudySpace improves collaboration, accelerates learning via AI, and organizes the academic journey.

---

## 2. Product Ecosystem

The product ecosystem is bifurcated into two specialized interfaces:

### 2.1 Explanify (Student Portal)
A modern, mobile-responsive web application designed for students to access everything they need for their academic life. It is highly interactive, featuring real-time updates and AI-driven study acceleration.

### 2.2 StudySpace Admin Dashboard
A robust, secure administration interface designed for college staff, teachers, and system administrators. It provides granular role-based access control (RBAC) to moderate content, publish notices, and manage user behavior.

---

## 3. Core Features: Student Experience (Explanify)

### 3.1 AI-Powered Study Studio (New)
The platform features an advanced AI suite specifically tailored for students:
- **AI RAG Chat (Buddy):** Students can chat directly with their uploaded PDFs, documents, or video transcripts. The AI grounds its answers strictly in the provided materials (with inline source citations) to prevent hallucinations.
- **Smart Summaries:** Generates clean, exam-focused digests of key concepts from long documents or video transcripts.
- **Auto-Generated Quizzes:** Instantly creates MCQs based on specific course materials for self-assessment.
- **Recall Flashcards:** Automatically generates flip-style flashcards for spaced repetition and rapid recall.
- **Advanced OCR Support:** Built-in Optical Character Recognition (supporting both Google Vision and Sarvam OCR) to extract text from scanned documents and images.

### 3.2 Academic Resources Hub
- **Resources Feed:** A centralized repository for notes, Previous Year Questions (PYQs), and videos. Features a virtualized grid for high-performance scrolling.
- **Advanced Filtering:** Granular search sorted by Semester, Branch, Subject, and Type.
- **Teacher Content Prioritization:** Notes uploaded by faculty/admins are highlighted and prioritized in search results.
- **Smart Bookmarking:** Save resources for immediate access later.

### 3.3 Advanced Chatrooms & Direct Messaging
- **Community Chatrooms:** Reddit/Discord-style discussion spaces. Rooms can be public or private (locked/code-based).
- **Rich Messaging:** Support for threaded replies (comments on messages), upvoting/downvoting, and image uploads.
- **Saved Posts:** Students can bookmark specific chat messages to a dedicated "Saved" repository.
- **Direct Messaging (1-on-1):** Dedicated interface for private peer-to-peer or student-teacher communication.

### 3.4 Social & Productivity Features
- **Social Following:** Students can follow their peers or teachers to curate a personalized "Following Feed" of resources and activities.
- **Study Mode & Timer:** A built-in customizable Pomodoro timer paired with an integrated Lofi/Music player for deep focus sessions.
- **Real-time Notifications:** In-app notification center for updates, replies, and new resources.

### 3.5 Premium Tier Subscription
A freemium model powered by Razorpay:
- **Monthly/Yearly Plans:** Unlock expanded offline app storage, the ability to create more chat rooms (up to 12), extended room expiry (1 year), and an exclusive Premium badge.

---

## 4. Core Features: Admin Experience (StudySpace Dashboard)

1. **Granular Role-Based Access Control (RBAC):**
   - Super Admin, College Admin, Department Admin, and Teacher roles with strict data isolation.
2. **Content Moderation Engine:**
   - Real-time statistics, inline PDF previews, and the ability to approve or permanently delete student-uploaded resources.
3. **Advanced Notice Management:**
   - Publish targeted notices (by department) with priority levels, attachments, and expiration dates in a Twitter/X-style feed format.
4. **Syllabus Distribution:** Structured uploading of syllabi tagged to specific academic years, semesters, branches, and subjects.
5. **User Moderation:** Capability to issue scoped bans based on email to prevent platform abuse.

---

## 5. Technical Architecture Overview

The application follows a modern decoupled architecture prioritizing speed, AI integration, and real-time capabilities.

- **Frontend Application:** React.js powered by Vite. Features a highly premium UI utilizing Tailwind CSS, Shadcn UI, and custom CSS variables for smooth theming and glassmorphism. Data fetching is optimized heavily (Virtualized Grids, Debounced searches).
- **Backend & Database:** **Supabase (PostgreSQL)** serves as the primary data backend. 
  - **Realtime:** Uses Supabase Realtime channels for live chatrooms and active user presence tracking.
  - **Security:** Extensive reliance on Row Level Security (RLS) policies to enforce data isolation across colleges, departments, and user roles.
- **Media & File Storage:** **Cloudinary** handles massive file payloads (PDFs, images, syllabus).
- **AI & Processing:** Integration with external OCR APIs (Sarvam, Google Vision) and LLM providers for the RAG and Study generation workflows.
- **Payments:** **Razorpay** integration for secure handling of Premium subscription plans.

---

## 6. Product Success Metrics

- **AI Engagement:** Number of PDFs processed, questions asked via RAG Chat, and quizzes/flashcards generated.
- **Community Health:** Active daily users in Chatrooms, total upvotes/interactions, and direct messaging volume.
- **Resource Velocity:** Average time from a student submitting a resource to admin approval (< 24 hours).
- **Monetization:** Conversion rate of free users to Premium Monthly/Yearly tiers.

---

## 7. Future Roadmap
- **Real-time Push Notifications:** Extending in-app notifications to native web/mobile push notifications.
- **AI Content Moderation:** Auto-flagging inappropriate images or text in chatrooms using computer vision.
- **Mobile Native Apps:** Deployment of fully native iOS/Android applications mapping back to the Supabase backend.
