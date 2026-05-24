# Internship & Job Application Tracker

**Description:** A web application for university students to track their job and internship applications, monitor interview statuses, and keep their job hunt organized.

## Entities & Attributes
1. **Users** (Handled by Supabase Auth)
   - `id` (UUID, Primary Key)
   - `email` (String)
2. **Applications**
   - `id` (Integer, Primary Key)
   - `user_id` (UUID, Foreign Key referencing Users)
   - `company_name` (String)
   - `role_title` (String)
   - `status` (String - e.g., "Applied", "Interviewing", "Offer", "Rejected")
   - `applied_date` (Date)

## Relationships
- **One-to-Many:** One User can have many Applications. The `user_id` in the `Applications` table acts as a foreign key pointing to the `id` in the Supabase `auth.users` table.

## User Flows
1. **Authentication Flow:** A new student visits the site, enters their email and password to register. Supabase creates their account, and they are redirected to their empty dashboard.
2. **Application Creation Flow:** The student clicks "Add Application", fills out a form with the company name, role, and date applied. They submit the form, and the new application appears immediately on their dashboard list.
3. **Update & Delete Flow:** The student hears back from a company. They click "Edit" on that specific application to change the status from "Applied" to "Interviewing". Later, if they accidentally created a duplicate application, they click "Delete" to remove it from the database entirely.

## SQL Schema
```sql
-- Create the applications table
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Applied',
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security (RLS) so users only see their own data
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only select/read their own applications
CREATE POLICY "Users can view their own applications" 
ON applications FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert applications for themselves
CREATE POLICY "Users can insert their own applications" 
ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own applications
CREATE POLICY "Users can update their own applications" 
ON applications FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own applications
CREATE POLICY "Users can delete their own applications" 
ON applications FOR DELETE USING (auth.uid() = user_id);
