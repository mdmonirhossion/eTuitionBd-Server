# eTuitionBd - Server (Tuition Management System API)

A robust, scalable Node.js & Express RESTful API backend for **eTuitionBd** — a complete Tuition Management System platform where students, tutors, and admins manage tuition posts, tutor applications, role-based workflows, financial tracking, and Stripe payment processing.

---

## 🚀 Live Links
- **Live Backend API (Vercel):** [https://etutionbdserver.vercel.app](https://etutionbdserver.vercel.app)
- **Live Frontend (Vercel):** [https://etuitionbd-client.vercel.app](https://etuitionbd-client.vercel.app)
- **GitHub Repository (Server):** [https://github.com/mdmonirhossion/eTuitionBd-Server](https://github.com/mdmonirhossion/eTuitionBd-Server)

---

## 🎯 Purpose of the Project
- **Solve Real-World Problems:** Provide a transparent, verified platform for students/parents to find qualified tutors and for tutors to find reliable tuition opportunities.
- **Automated Workflows:** Streamline tuition posting, tutor applications, application approval/rejection, and payment handling.
- **Security & Integrity:** Implement role-based access control (Student, Tutor, Admin) using JWT & Firebase Authentication.
- **Admin Governance:** Give administrators comprehensive controls for user management, tuition post moderation, and financial analytics.

---

## 🌟 Key Features

### 🔐 Authentication & Role Management
- **Firebase & JWT Integration:** Synchronizes Firebase Auth UIDs with backend JWT tokens.
- **Role-Based Middlewares:** `verifyToken`, `verifyStudent`, `verifyTutor`, `verifyAdmin` to protect routes.

### 📚 Tuition Management (Students)
- **Post Tuition:** Create new tuition requests (Subject, Class, Location, Salary, Days/Week). Saved as `pending` for Admin approval.
- **Edit & Delete:** Update or delete tuition requests with confirmation.
- **Tutor Applications:** View tutor applications for posted tuitions, approve or reject applications.
- **Stripe Payment:** Approval triggers Stripe checkout payment of tutor expected salary before finalizing application approval.

### 🧑‍🏫 Tutor Workflows
- **Apply to Tuitions:** Apply to approved tuition posts with qualifications, experience, and expected salary.
- **My Applications:** Track application status (`pending`, `approved`, `rejected`).
- **Ongoing Tuitions & Earnings:** View active tuitions and track total earnings/transactions.

### 🛡️ Admin Dashboard & Analytics
- **User Management:** View all registered users, modify user roles (Student, Tutor, Admin), and manage user status.
- **Tuition Post Moderation:** Review pending tuition posts, approve or reject posts before public listing.
- **Reports & Analytics:** Monitor total platform revenue, transaction logs, and key platform metrics.

### 🔍 Search, Filter, Sort & Pagination
- **Advanced Filtering:** Filter by Class, Subject, Location, and Search query.
- **Sorting Options:** Sort by budget (high-to-low, low-to-high) or creation date (newest, oldest).
- **Pagination:** Server-side pagination support (`page` and `limit`).

---

## 🛠️ Tech Stack & Packages Used

| Category | Technology / Package |
| :--- | :--- |
| **Runtime** | Node.js (ES Modules) |
| **Framework** | Express.js (`v4.21.2`) |
| **Database & ORM** | MongoDB Atlas & Mongoose (`v8.9.5`) |
| **Authentication** | Firebase Admin SDK (`v13.1.0`), JsonWebToken (`v9.0.2`) |
| **Payment Gateway** | Stripe Node API (`v17.7.0`) |
| **Security & CORS** | CORS (`v2.8.5`), dotenv (`v16.4.7`) |
| **Deployment** | Vercel Serverless (`@vercel/node`) |

---

## ⚙️ Environment Variables

Create a `.env` file in the root of the server directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<DB_USER>:<DB_PASS>@cluster0.9vgajnj.mongodb.net/eTutionBd?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=https://etuitionbd-client.vercel.app
STRIPE_SECRET_KEY=sk_test_...
FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_firebase_json_key
```

---

## 💻 Local Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mdmonirhossion/eTuitionBd-Server.git
   cd eTuitionBd-Server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

4. **Convert Firebase Key to Base64 (Optional Helper):**
   ```bash
   node keyconvert.js
   ```

---

## 📄 License
This project is licensed under the ISC License.
