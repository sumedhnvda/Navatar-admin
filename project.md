build me a admin dashboard for 
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyB4x-lZJ-WkkICdmXVOzlTzaFWxHojNzks"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="navatar-1c32e.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="navatar-1c32e"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="navatar-1c32e.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="773942921499"
NEXT_PUBLIC_FIREBASE_APP_ID="1:773942921499:web:6162b7576cbfd20d0a2bbe"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-JVFYEDRNH6"
Authentication Rules

Use Firebase Authentication.

Only allow login if:

The user exists in Firebase Auth
The user has been authorized by Super Admin
The user has role:
admin

Flow:

Login
→ Verify Firebase auth
→ Fetch user profile from Firestore
→ Check role = admin
→ Check hospitalId
→ Grant access

Unauthorized users must be redirected to login page.

Database Rules

The dashboard must read existing Firebase collections.

DO NOT redesign database unless necessary.

Agent must:

Inspect Firebase collections
Understand schema
Build UI based on it

Likely collections:

users
hospitals
doctors
navatars
navatar_usage
Core Admin Dashboard Features
1. Dashboard Overview

Show hospital statistics:

Total doctors
Total Navatars
Total interactions
Recent usage activity

Components:

Stats cards
Recent activity list
Navatar usage chart
2. Doctor Management

Admins must be able to:

Add Doctor

Fields:

name
email
designation
photo
hospitalId
createdAt

Requirements:

Upload photo to Firebase Storage
Save photo URL in Firestore
Validate email format
Prevent duplicate doctor emails
View Doctors

Table view with:

Photo
Name
Email
Designation
Actions

Actions:

Edit
Disable
Delete
Edit Doctor

Editable fields:

name
designation
photo

Email should remain immutable.

3. Navatar Management

Admins must be able to manage Navatars deployed in their hospital.

Each Navatar belongs to:

hospitalId

Navatar fields may include:

name
doctorId
specialization
status
createdAt

Admin must be able to:

View all Navatars
Enable / disable Navatar
Edit Navatar information
4. Navatar Usage History

Admins must be able to click a Navatar and view its usage.

Page:

/navatars/[id]

Display:

Total interactions
Daily usage
Recent conversations
Timestamp logs

Possible usage fields:

navatarId
patientQuery
response
timestamp
duration

UI Components:

Usage chart
Conversation logs
Activity timeline
5. File Upload

Doctor photos must use:

Firebase Storage

Workflow:

Upload → Storage → Get URL → Save in Firestore
6. UI Layout

Sidebar:

Dashboard
Doctors
Navatars
Usage Analytics
Settings
Logout

Pages:

/dashboard
/doctors
/doctors/add
/navatars
/navatars/[id]
/settings
7. Important Development Rules

The agent must:

DO NOT:

Hardcode hospitals
Hardcode doctors
Hardcode Navatars

Instead:

Fetch everything from Firebase

Follow these principles:

clean component architecture
reusable UI components
TypeScript types
server components where possible
loading and error states
Suggested Folder Structure
app/
 dashboard/
 doctors/
 navatars/
 components/
 lib/firebase/
 services/
 types/
Security Rules

Admins must only access data belonging to:

hospitalId

Never allow cross-hospital access.

All queries must filter by:

hospitalId