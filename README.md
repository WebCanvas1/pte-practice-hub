# PTE Practice Hub

Build the foundation for an AI-powered PTE practice test portal.

The platform will allow students to create an account, purchase practice tests, complete tests across the four PTE modules, receive automated scoring and AI feedback, and track their progress.

The four modules are:

Speaking

Reading

Writing

Listening

Each module will have three difficulty levels:

Easy

Intermediate

Hard

Individual module tests will initially be priced at AUD $1 each.

A complete mock test covering all four modules will be priced at AUD $5.

For now, focus only on the frontend foundation, navigation, authentication screens and dashboard structure. Do not implement payments or AI evaluation yet.

Technology requirements:

React

TypeScript

Vite

Tailwind CSS

Cloudflare-compatible architecture

Responsive design

Accessible form controls

Clean reusable component structure

No dependency on Lovable Cloud

Do not use Supabase

Prepare the project for Cloudflare Workers, D1, R2 and KV

Store environment-specific values in environment variables

Ensure the project can be deployed through GitHub to Cloudflare

Create the following public pages:

Home

How It Works

Test Modules

Pricing

About

Contact

Login

Register

Forgot Password

Privacy Policy

Terms and Conditions

Disclaimer

Create a modern educational design that feels trustworthy, affordable and easy to use.

Suggested visual direction:

Clean white background

Blue and purple accent colours

Rounded cards

Clear progress indicators

Modern dashboard layouts

Large readable typography

Mobile-friendly navigation

Professional rather than playful

Avoid excessive animations

The home page should include:

Hero section

“Practice PTE from just $1” message

Four module cards

Explanation of AI-powered feedback

Progress tracking features

How it works section

Pricing summary

Student benefits

Frequently asked questions

Strong registration call-to-action

Create a student dashboard shell with:

Dashboard overview

Browse Tests

My Tests

Test History

Progress

AI Recommendations

Purchases

Profile

Account Settings

Logout

Create an admin dashboard shell with:

Overview

Questions

Test Templates

Content Imports

Students

Test Attempts

Payments

AI Evaluations

Coupons

Reports

Platform Settings

Audit Logs

Logout

Add placeholder dashboard data so the interfaces can be reviewed before backend integration.

Use route protection placeholders for student and admin pages.

Create a reusable design system for:

Buttons

Form fields

Cards

Badges

Tables

Modal dialogs

Loading states

Empty states

Alerts

Progress bars

Charts

Dashboard navigation

Do not hardcode the website name throughout the application. Store the platform name, logo, support email, pricing labels and main colours in a central configuration file so they can later be edited through the admin portal.

At the end:

Run the build

Fix all TypeScript errors

Fix routing issues

Confirm responsive layouts

Provide a summary of files created and any environment variables that will eventually be required

## Development

Install Bun, then run the Cloudflare-backed local development environment.

```sh
git clone https://github.com/WebCanvas1/pte-practice-hub.git
cd pte-practice-hub
bun install --frozen-lockfile
bun run dev
```
