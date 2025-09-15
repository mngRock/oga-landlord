Oga Landlord - V1.0
Oga Landlord is a comprehensive, two-sided platform designed to streamline the entire rental lifecycle for the Nigerian market. It serves as a centralized hub connecting landlords and property managers directly with renters, aiming to build trust, reduce friction, and create a fair and efficient rental ecosystem.

This repository contains the complete V1.0 of the application, built with a modern, scalable tech stack.

Core Features (V1.0)
The V1.0 of Oga Landlord is feature-complete, providing a full end-to-end user journey for all three user roles.

Landlord Flow
✅ Full Property Management: Add, view, edit, and delete both single-unit properties and multi-unit buildings.

✅ Advanced Listings: Include multiple photos/videos, required documents, inspection schedules, and additional fees for each property.

✅ Application Pipeline: Review incoming tenant applications and manage them through a multi-step pipeline (Inspection, Documents, Payment, Contract).

✅ Tenant Management: View a directory of active tenants and their lease details.

✅ Onboard Existing Tenants: Invite tenants who are already in your properties to join the platform.

✅ Maintenance & Payments: View and manage maintenance requests and manually track rent payments.

✅ Verification System: Submit documents to become a "Verified Landlord".

Renter Flow
✅ Property Discovery: Find available properties with a powerful search and filter bar (location, state, LGA, price, bedrooms).

✅ Detailed Property View: See all property details, including a full media gallery, required documents, and all associated fees.

✅ Seamless Application: Apply for properties and include an optional introductory message to the landlord.

✅ Application Tracking: View the status of all submitted applications on a personal dashboard.

✅ Tenancy Management: Review and accept tenancy agreements directly on the platform.

✅ "My Rental" Hub: View active tenancy details, payment history, and submit maintenance requests.

Core Platform Features
✅ Role-Based System: Dedicated dashboards and permissions for Landlords, Renters, and Admins.

✅ Dual Profiles: A single user can have both a Landlord and a Renter profile and switch between them.

✅ Real-Time Messaging: Direct, real-time chat between landlords and tenants for each property.

✅ Notification System: A persistent in-app notification bell for key events like new applications and status updates.

✅ Admin Panel: A secure area for admins to review and approve landlord verification requests.

Technology Stack
Frontend: Next.js (React Framework) with TypeScript

Styling: Tailwind CSS

Backend & Database: Supabase (PostgreSQL, Auth, Storage, Edge Functions)

UI/Notifications: react-hot-toast

Local Development Setup
To run this project on your local machine, follow these steps.

Prerequisites
Node.js (v18 or later recommended)

npm (or yarn/pnpm)

Supabase CLI (npm install -g supabase)

1. Clone the Repository
git clone [YOUR_REPOSITORY_URL]
cd oga-landlord

2. Set Up Supabase
Log in to the Supabase CLI:

supabase login

Link your local project to your online Supabase project (find your Project ID in your Supabase dashboard's settings):

supabase link --project-ref YOUR_PROJECT_ID

Deploy the Edge Function:

supabase functions deploy onboard-tenant --no-verify-jwt

Push the latest database schema (if you have local migrations):

supabase db push

3. Set Up Frontend Environment Variables
Navigate into the frontend directory:

cd frontend

Create a new environment file. You can copy the example if one exists or create it manually:

# If .env.local.example exists:
cp .env.local.example .env.local
# Otherwise, create the file:
touch .env.local

Go to your Supabase project dashboard, navigate to Project Settings > API.

Copy your Project URL and the anon public key.

Paste these values into your .env.local file:

NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

4. Install Dependencies
npm install

5. Run the Application
npm run dev

The application should now be running at http://localhost:3000.