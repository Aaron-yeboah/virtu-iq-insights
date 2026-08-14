# Virtu-IQ Insights

Virtu-IQ — Complete Lovable PWA Build Prompt

Build a production-quality Progressive Web App called Virtu-IQ.

Virtu-IQ is a modern AI-powered visual analytics platform. Users can upload screenshots containing structured visual information, and the system uses AI image analysis to extract and organize information into a clear, easy-to-understand report.

The product must feel like a premium technology startup rather than a gambling, casino, or betting website.

1. BRAND IDENTITY

The official brand name is:

Virtu-IQ

The supplied logo assets are the source of truth for the visual identity.

There are two logo versions:

Full Logo

The full logo contains:

Virtu-IQ

Use this version on:

Desktop landing-page navbar

Login page

Registration page

Desktop dashboard header

Payment pages

Marketing pages

Footer

About page

Symbol Logo

The symbol is the stylized blue V/I mark.

Use this version on:

Mobile navbar

PWA app icon

Browser favicon

Dashboard sidebar when collapsed

Loading screen

Small cards where the complete wordmark would be too large

Notification/application icon

Mobile dashboard

Do not recreate the logo using CSS or text.

Use the provided logo assets directly.

Do not modify the logo proportions, colours, shape, or typography.

Maintain sufficient clear space around both logo variations.

2. BRAND COLOURS

Use only the Virtu-IQ brand palette.

Primary Blue:
#2563EB

Deep Blue:
#1D4ED8

Dark:
#0F172A

White:
#FFFFFF

Light Background:
#F8FAFC

Border:
#E2E8F0

Muted Text:
#64748B

The interface should primarily use white and very light backgrounds.

Blue should be used for:

Primary buttons

Active navigation

Links

Important indicators

Progress states

Brand accents

Dark navy/black should be used for:

Main headings

Important text

Navigation text

Dashboard numbers

Do not introduce unrelated colours.

Avoid excessive gradients.

3. DESIGN LANGUAGE

Create a premium SaaS/AI dashboard aesthetic.

The interface should be:

Minimal

Professional

Modern

Fast

Clean

Spacious

Highly accessible

Mobile-first

Easy for non-technical users

Visually consistent

Use subtle:

Border radius

Shadows

Borders

Hover states

Transitions

Loading animations

Do not make the UI overly flashy.

Avoid:

Casino aesthetics

Gambling imagery

Neon colours

Excessive animations

Cluttered dashboards

Large decorative illustrations that distract from the product

4. TYPOGRAPHY

Use a modern sans-serif font such as:

Inter

Typography hierarchy:

H1:
Large, bold, dark navy.

H2:
Bold, dark navy.

Body:
Regular, readable, dark gray.

Labels:
Medium weight.

Buttons:
Medium/semi-bold.

Maintain excellent spacing and readability.

5. TECHNOLOGY STACK

Use:

Frontend:

React

TypeScript

Vite

Tailwind CSS

shadcn/ui

Backend:

Supabase

Use:

Supabase Authentication

PostgreSQL

Supabase Storage

Supabase Edge Functions where appropriate

Row Level Security

Build the application as a PWA.

The application must be responsive across:

Desktop

Laptop

Tablet

Mobile

6. APPLICATION STRUCTURE

Create these major sections:

PUBLIC WEBSITE

Landing Page

How It Works

Packages

FAQ

About

Contact

Login

Register

Privacy Policy

Terms

MEMBER APPLICATION

Dashboard

Account

Subscription

Upload Analysis

Analysis Results

Analysis History

Payment History

Notifications

Settings

ADMIN APPLICATION

Admin Dashboard

Members

Payments

Packages

Partners

Referrals

Commissions

Analytics

Analysis Activity

Audit Logs

Settings

PARTNER APPLICATION

Partner Dashboard

Referral Link

Registrations

Revenue Generated

Commission

Commission History

Profile

7. LANDING PAGE

Create a premium landing page.

Navbar:

Left:
Full Virtu-IQ logo.

Center/right:

How It Works

Features

Packages

FAQ

Actions:

Log In

Get Started

On mobile:

Show the symbol logo on the left.

Use a hamburger menu for navigation.

Hero Section

Create a strong hero section.

Headline:

"Turn Screenshots Into Intelligent Insights"

Supporting text:

"Upload visual information and let Virtu-IQ's AI analyze, organize, and explain what it sees."

Primary CTA:

"Get Started"

Secondary CTA:

"See How It Works"

Include a sophisticated visual representation of an AI image-analysis workflow.

Do not use gambling imagery.

Feature Section

Create four feature cards:

AI Image Analysis

Upload screenshots and extract relevant visual information.

Smart Insights

Transform detected information into an easy-to-understand report.

Secure Platform

Protect user accounts and uploaded information.

Simple Workflow

Upload, analyze, and review results in a few simple steps.

How It Works

Show three steps:

01 — Upload

Upload a supported screenshot.

02 — Analyze

Virtu-IQ processes the image using AI.

03 — Review

Receive a structured analysis report.

Packages

Create three clean pricing cards.

Starter:
GH₵250
2 analysis credits

Plus:
GH₵350
3 analysis credits

Premium:
GH₵500
5 analysis credits

Clearly describe these as AI analysis credits.

Do not describe the packages as purchasing predictions, betting picks, guaranteed results, or winning outcomes.

The Premium package should have a subtle "Most Popular" badge.

Trust Section

Include:

Secure authentication

Protected uploads

Usage tracking

Transparent billing

FAQ

Include questions about:

How analysis works

Supported images

Credits

Account security

Payment verification

Analysis history

Footer

Full Virtu-IQ logo.

Footer navigation:

Product
Company
Support
Legal

Include copyright information.

8. AUTHENTICATION

Use Supabase Authentication.

Registration fields:

Full name

Email

Phone number

Password

Confirm password

Include:

Password visibility toggle

Password strength indicator

Form validation

Email validation

Clear error messages

Loading state

Login:

Email

Password

Remember session

Forgot password

After successful authentication, route users according to their role.

9. MEMBER DASHBOARD

Create a clean SaaS dashboard.

Desktop:

Left sidebar.

Top navigation:

Notifications

Profile

Account menu

Sidebar:

Show the full Virtu-IQ logo at the top.

Navigation:

Dashboard
Analyze Screenshot
History
Subscription
Payments
Account
Settings

When the sidebar collapses, replace the full logo with the Virtu-IQ symbol.

Dashboard Header

Display:

"Welcome back, [Name]"

Supporting text:

"Your AI analysis workspace."

Dashboard cards

Show:

Available Credits
Total Analyses
Current Package
Account Status

Example:

Available Credits
3

Total Analyses
12

Current Package
Plus

Account Status
Active

Primary action

Large card:

"Analyze a Screenshot"

Button:

"Upload Screenshot"

10. SCREENSHOT ANALYSIS PAGE

Create a very user-friendly upload interface.

Page title:

"Analyze Screenshot"

Supporting text:

"Upload a clear screenshot and Virtu-IQ will extract and organize the information it detects."

Upload area should support:

Drag and drop

File picker

Mobile camera/gallery selection where supported

Accepted:

PNG
JPG
JPEG
WEBP

Show maximum file size.

After selecting an image:

Display preview.

Actions:

Remove
Analyze Screenshot

Before analysis, show:

"1 analysis credit will be used."

Require confirmation.

Processing state

Show a professional loading interface:

Uploading...
Reading image...
Detecting information...
Generating analysis...
Preparing report...

Do not claim that the AI can know or guarantee future events.

11. ANALYSIS RESULTS

Create a beautiful results page.

Header:

"Analysis Complete"

Show:

Uploaded image

Analysis timestamp

Analysis ID

Sections:

Detected Information

Extracted Text

Visual Elements

AI Observations

Confidence Indicators

Important Notes

Use cards and structured sections.

Provide:

Download Report
Start New Analysis

Do not generate gambling predictions, betting picks, guaranteed outcomes, or instructions for wagering.

12. ANALYSIS HISTORY

Create a table/list showing:

Analysis ID
Date
Image
Status
Package/Credit Used
View

Mobile should transform the table into cards.

Add:

Search
Date filter
Status filter

13. SUBSCRIPTION PAGE

Show current package:

Package name
Price
Credits allocated
Credits remaining
Purchase date
Status

Show all three packages.

Allow the user to select another package.

Clearly explain what credits represent.

14. PAYMENT SYSTEM

Create a payment workflow where a user selects a package and submits payment information/reference according to the configured payment provider.

Payment states:

Pending
Approved
Rejected

Never trust frontend payment status.

Payment confirmation must be validated server-side where automated payment verification is available.

If manual verification is being used:

User submits payment.

Payment is recorded as Pending.

Admin reviews it.

Admin approves or rejects.

User's access/credits are updated only after approval.

Show users clear payment status.

15. ADMIN DASHBOARD

Create a professional administration interface.

Sidebar:

Dashboard
Members
Payments
Packages
Partners
Referrals
Commissions
Analytics
Analysis Activity
Audit Logs
Settings

Use the full Virtu-IQ logo in the desktop admin sidebar.

Use the symbol when collapsed.

Admin overview cards

Total Members

Active Members

Pending Payments

Approved Payments

Total Revenue

Active Partners

Total Commissions

Total Analyses

Revenue chart

Show:

Daily
Weekly
Monthly

Use clean blue visualizations.

Recent activity

Display:

New registration
Payment submitted
Payment approved
Payment rejected
New partner
Analysis completed

16. MEMBER MANAGEMENT

Admin can:

Search members

Filter members

View profile

View payment history

View subscription

View analysis usage

Activate/deactivate account where appropriate

Never expose passwords.

17. PAYMENT MANAGEMENT

Create a dedicated payment verification page.

Columns:

Member
Package
Amount
Reference
Date
Status
Action

Actions:

View
Approve
Reject

Before approval, show a confirmation modal.

Record:

Admin who performed action

Timestamp

Previous status

New status

18. PARTNER MANAGEMENT

Admin can:

Create partner
Edit partner
Deactivate partner
Delete partner where appropriate
Assign commission percentage
Generate referral code
View partner performance

Partner fields:

Name
Email
Phone
Referral Code
Commission Percentage
Status
Created Date

Referral URL format:

yourdomain.com/register?ref=REFERRAL_CODE

19. PARTNER DASHBOARD

Partners should only see their own data.

Dashboard cards:

Total Registrations
Verified Registrations
Revenue Generated
Commission Earned

Show:

Referral URL

Button:

Copy Referral Link

Performance chart:

Registrations over time.

Revenue generated over time.

Commission summary.

20. COMMISSION SYSTEM

Commission percentage must be stored in the database.

Example:

Partner commission:
10%

Eligible transaction:
GH₵350

Commission:
GH₵35

Never calculate commission based on frontend values.

Create immutable commission records after qualifying payments are approved.

Partners must not be able to modify:

Commission percentage

Revenue

Referral attribution

Payment status

Only authorized admins can modify commission settings.

21. DATABASE

Create a clean Supabase PostgreSQL schema.

Tables:

profiles

Fields:
id
full_name
email
phone
role
status
avatar_url
created_at
updated_at

packages

Fields:
id
name
price
credits
description
active
created_at

payments

Fields:
id
user_id
package_id
amount
reference
status
verified_by
verified_at
created_at

subscriptions

Fields:
id
user_id
package_id
credits_remaining
status
created_at
updated_at

analyses

Fields:
id
user_id
subscription_id
image_url
status
extracted_data
analysis_result
created_at
completed_at

partners

Fields:
id
user_id
referral_code
commission_percentage
status
created_at

referrals

Fields:
id
partner_id
referred_user_id
registration_status
created_at

commissions

Fields:
id
partner_id
payment_id
percentage
amount
status
created_at

audit_logs

Fields:
id
admin_id
action
target_type
target_id
metadata
created_at

notifications

Fields:
id
user_id
title
message
read
created_at

22. ROW LEVEL SECURITY

Implement strict Supabase RLS.

Members can only read their own:

Profile

Payments

Subscription

Analyses

Notifications

Partners can only access:

Their own partner profile

Their own referrals

Their own commissions

Their own statistics

Admins can access administrative records through secure authorization.

Never rely solely on frontend route protection.

Never expose Supabase service-role credentials in the browser.

23. FILE STORAGE

Create a private Supabase Storage bucket for uploaded images.

Do not make uploaded screenshots publicly accessible by default.

Use secure access policies.

Validate:

File type

File size

Authenticated user

Ownership

Do not trust the file extension alone.

24. PWA

Configure the application as a Progressive Web App.

Include:

Manifest

App icon

Splash screen

Install prompt

Responsive layout

Offline-friendly shell

Mobile navigation

Use the Virtu-IQ symbol as the primary PWA icon.

Use the full logo inside the application where space allows.

25. RESPONSIVE DESIGN

Desktop:

Sidebar + content.

Tablet:

Compact sidebar.

Mobile:

Bottom navigation or compact drawer.

Mobile navigation should prioritize:

Dashboard
Analyze
History
Account

The symbol logo should be used in the mobile header.

26. COMPONENT SYSTEM

Create reusable components:

Button
Input
Select
Modal
Dialog
Card
Badge
Table
Avatar
Dropdown
Toast
Sidebar
Navbar
FileUploader
ProgressIndicator
EmptyState
LoadingState
ErrorState
ConfirmationDialog
StatsCard

Maintain consistent spacing and typography.

27. EMPTY STATES

Every section should have a useful empty state.

Example:

"No analyses yet."

Supporting text:

"Upload your first screenshot to begin your AI analysis."

Button:

"Analyze Screenshot"

28. ERROR HANDLING

Never show raw technical errors.

Use friendly messages.

Examples:

"Something went wrong. Please try again."

"Your image could not be processed. Please upload a clearer image."

"Your session has expired. Please log in again."

29. SECURITY

Implement:

Supabase Auth

RLS

Secure storage

Server-side validation

Input validation

Role-based authorization

Audit logging

Rate limiting where appropriate

Secure environment variables

No secret keys in frontend code

Never place private API keys in React components.

Never trust:

User-submitted prices

User-submitted roles

User-submitted commission percentages

Frontend payment status

Frontend credit balances

All important values must be validated server-side.

30. UI DETAILS

Use subtle animations:

Page transitions

Button hover

Card hover

Upload progress

Loading skeletons

Modal transitions

Keep animations fast and professional.

Buttons should have clear loading states.

Disable buttons while important operations are processing.

31. ACCESSIBILITY

Implement:

Proper labels

Keyboard navigation

Focus states

Accessible dialogs

Good contrast

Semantic HTML

Screen-reader-friendly controls

Large enough mobile touch targets

32. FINAL EXPERIENCE

The application should feel similar in quality to a premium modern SaaS product.

The user should immediately understand:

What Virtu-IQ does.

How to create an account.

How to purchase analysis credits.

How to upload an image.

How to view their AI analysis.

How many credits remain.

The admin should immediately understand:

Revenue

Members

Pending payments

Partners

Referrals

Commissions

Analysis activity

Partners should immediately understand:

Their referral link

Registrations

Revenue generated

Commission percentage

Commission earned

33. IMPORTANT IMPLEMENTATION RULE

Do not create a fake/demo-only application.

Build the UI and architecture so it is ready to connect to Supabase.

Use realistic loading, error, empty, success, and pending states.

Do not hard-code dashboard statistics.

Do not hard-code user information.

Do not hard-code payment statuses.

Do not hard-code partner statistics.

All dynamic information must come from the database.

34. BUILD ORDER

Implement in this order:

Brand/design system

Landing page

Authentication

Supabase database

Member dashboard

Package/subscription interface

Payment workflow

Screenshot upload

AI analysis workflow

Analysis history

Admin dashboard

Payment verification

Partner system

Commission system

Notifications

Audit logs

PWA functionality

Responsive optimization

Security/RLS

Final UI polish

Before moving between major sections, ensure the previous section works correctly.

Start by creating the complete design system and landing page using the supplied Virtu-IQ logo assets, then progressively build the authenticated application.

The finished product should look like a cohesive, polished product from one company—not a collection of separate dashboard templates.

use the logo for a beautiful splash screen that will open in the beginning

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d99a42d2-30b2-46cd-9104-c5737dffd608).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
