-- Migration: Sprint 1 Database Schema (Identity, Membership, Merchant, Directory)
-- Date: 2026-06-13

-- Enable pgcrypto for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. IDENTITY DOMAIN
-- =========================================================================

-- Profiles Table (links to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url VARCHAR(500),
    role VARCHAR(50) DEFAULT 'member' NOT NULL CHECK (role IN ('admin', 'merchant', 'member', 'agent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User Activity Logs Table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Enforcement
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- User Activity Logs Policies
CREATE POLICY "Users can view their own activity logs" ON public.user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" ON public.user_activity_logs
    FOR INSERT WITH CHECK (true);


-- =========================================================================
-- 2. MERCHANT DOMAIN
-- =========================================================================

-- Businesses Table (KYB Profile)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verification_notes TEXT,
    country_code VARCHAR(10) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    phone VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Business Verification Documents Table
CREATE TABLE IF NOT EXISTS public.business_verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Enforcement
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_verification_documents ENABLE ROW LEVEL SECURITY;

-- Businesses Policies
CREATE POLICY "Businesses are viewable by everyone" ON public.businesses
    FOR SELECT USING (true);

CREATE POLICY "Owners can insert their own business" ON public.businesses
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own business" ON public.businesses
    FOR UPDATE USING (auth.uid() = owner_id);

-- Business Verification Documents Policies
CREATE POLICY "Owners can view their own documents" ON public.business_verification_documents
    FOR SELECT USING (
        auth.uid() IN (SELECT owner_id FROM public.businesses WHERE id = business_id)
    );

CREATE POLICY "Owners can upload their own documents" ON public.business_verification_documents
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT owner_id FROM public.businesses WHERE id = business_id)
    );


-- =========================================================================
-- 3. MEMBERSHIP DOMAIN
-- =========================================================================

-- Membership Plans Table
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name JSONB NOT NULL, -- e.g. {"th": "...", "en": "..."}
    description JSONB NOT NULL,
    price_monthly NUMERIC(12, 2) NOT NULL,
    price_yearly NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    features JSONB DEFAULT '[]'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'trialing' NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Enforcement
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Membership Plans Policies
CREATE POLICY "Plans are viewable by everyone" ON public.membership_plans
    FOR SELECT USING (true);

CREATE POLICY "Only Admin can manage plans" ON public.membership_plans
    USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- Subscriptions Policies
CREATE POLICY "Owners can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (
        auth.uid() IN (SELECT owner_id FROM public.businesses WHERE id = business_id)
    );


-- =========================================================================
-- 4. DIRECTORY DOMAIN
-- =========================================================================

-- Directory Categories Table
CREATE TABLE IF NOT EXISTS public.directory_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name JSONB NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES public.directory_categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Business Directory Listings Table
CREATE TABLE IF NOT EXISTS public.business_directory_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID UNIQUE NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.directory_categories(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT false NOT NULL,
    search_vector TSVECTOR,
    reviews_avg_rating NUMERIC(3, 2) DEFAULT 0.00 NOT NULL,
    reviews_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trade Associations Table
CREATE TABLE IF NOT EXISTS public.trade_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name JSONB NOT NULL,
    description JSONB NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    logo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Business Association Members Table (Many-to-Many Join Table)
CREATE TABLE IF NOT EXISTS public.business_association_members (
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    association_id UUID REFERENCES public.trade_associations(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (business_id, association_id)
);

-- RLS Enforcement
ALTER TABLE public.directory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_directory_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_association_members ENABLE ROW LEVEL SECURITY;

-- Policies for Categories
CREATE POLICY "Categories are viewable by everyone" ON public.directory_categories
    FOR SELECT USING (true);

-- Policies for Listings
CREATE POLICY "Listings are viewable by everyone" ON public.business_directory_listings
    FOR SELECT USING (true);

CREATE POLICY "Owners can manage their listings" ON public.business_directory_listings
    USING (
        auth.uid() IN (SELECT owner_id FROM public.businesses WHERE id = business_id)
    );

-- Policies for Trade Associations
CREATE POLICY "Associations are viewable by everyone" ON public.trade_associations
    FOR SELECT USING (true);

-- Policies for Association Members
CREATE POLICY "Association members are viewable by everyone" ON public.business_association_members
    FOR SELECT USING (true);

CREATE POLICY "Owners can manage their association membership" ON public.business_association_members
    USING (
        auth.uid() IN (SELECT owner_id FROM public.businesses WHERE id = business_id)
    );


-- =========================================================================
-- AUTOMATED FUNCTIONS & TRIGGERS FOR PROFILE SYNC (from auth.users)
-- =========================================================================

-- Trigger function to automatically create a public profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
        COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
        'member'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
