# Oga Landlord - Changelog

### SETUP
- Initialized project folder structure and `CHANGELOG.md`.
- Completed installation of VS Code, Node.js, and Git.
- Created accounts on GitHub, Supabase, and Vercel.

### BACKEND
- Set up Supabase project and database schema.
- Created all tables: `profiles`, `properties`, `buildings`, `applications`, `tenancies`, `maintenance_requests`.
- Implemented robust `ENUM` types for data integrity (roles, statuses, etc.).
- Configured secure Row Level Security (RLS) policies for all tables and actions.
- Created database triggers and functions (`rpc`) for automation and secure data fetching (e.g., `handle_new_user`, `search_properties`).
- Set up private and public Storage buckets with secure access policies.

### CORE FEATURES
- Built a secure, role-based Authentication System (`Landlord`, `Renter`, `Admin`).
- Implemented a professional, non-blocking notification system with `react-hot-toast`.
- Created a robust, role-based Dashboard and Sidebar navigation system.
- Built a comprehensive Settings page allowing users to update profiles, change passwords, and manage roles.
- Resolved numerous bugs, including a critical sign-up race condition.

### LANDLORD FLOW
- [MILESTONE] **Property Management** is 100% complete, including a multi-step flow to Add/Edit/Delete single and multi-unit properties with advanced details (fees, documents, media uploads).
- [MILESTONE] **Application Management** pipeline is complete, allowing landlords to review, manage, and approve/reject applications from start to finish.
- [MILESTONE] **Tenants Module** is complete, allowing landlords to view a list of active tenants and their details.
- Landlord Dashboard displays dynamic, real-time stats.

### RENTER FLOW
- Built a public **"Find Properties"** page with a feature-rich search and filter bar.
- Renters can view detailed property pages.
- [MILESTONE] The **Renter Application Flow** is complete. Renters can apply, see an "Already Applied" status, upload documents, and cancel applications.
- The "My Applications" page correctly displays property names, inspection times, and required actions.

### ADMIN
- Created a secure, separate **Admin Panel** at `/admin`.
- Admins can view a list of landlords pending verification.
- Admins can securely view submitted documents and **approve or reject** verification requests.

### MAINTENANCE MODULE
- **[NEW]** The Maintenance Module is now complete for both Renters and Landlords. Renters can submit requests, and Landlords can view and manage them.