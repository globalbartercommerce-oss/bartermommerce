-- Migration: Complete Master Database Schema (Sprint 1 + Sprint 2)
-- Date: 2026-06-13
-- Description: Unified database schema containing all 12 Business Domains in correct dependency order.

-- Enable pgcrypto for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. IDENTITY DOMAIN (Sprint 1)
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
-- 2. MERCHANT DOMAIN (Sprint 1)
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
-- 3. MEMBERSHIP DOMAIN (Sprint 1)
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
-- 4. DIRECTORY DOMAIN (Sprint 1)
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
ALTER TABLE public.trade_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_association_members ENABLE ROW LEVEL SECURITY;

-- Policies for Categories
CREATE POLICY "Categories are viewable by everyone" ON public.directory_categories
    FOR SELECT USING (true);

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
-- 5. MARKETPLACE DOMAIN (Sprint 2)
-- =========================================================================

-- Listings Table
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.directory_categories(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('goods', 'service')),
    estimated_value NUMERIC(12, 2) NOT NULL,
    price_credits NUMERIC(12, 2) NOT NULL,
    condition VARCHAR(50) NOT NULL CHECK (condition IN ('new', 'used_like_new', 'used_good', 'used_fair')),
    images TEXT[] DEFAULT '{}'::text[] NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'draft', 'sold', 'inactive')),
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Business Directory Listings Table (Links Business to Listing Metadata & Category)
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

-- RLS Enforcement
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_directory_listings ENABLE ROW LEVEL SECURITY;

-- Listings Policies
CREATE POLICY "Listings are viewable by everyone" ON public.listings
    FOR SELECT USING (true);

CREATE POLICY "Owners can manage their own listings" ON public.listings
    USING (
        auth.uid() IN (SELECT owner_id FROM public.businesses WHERE id = business_id)
    );

-- Listings Directory Policies
CREATE POLICY "Listings directory is viewable by everyone" ON public.business_directory_listings
    FOR SELECT USING (true);

CREATE POLICY "Owners can manage their listings directory entry" ON public.business_directory_listings
    USING (
        auth.uid() IN (SELECT owner_id FROM public.businesses WHERE id = business_id)
    );


-- =========================================================================
-- 6. WALLET & LEDGER DOMAIN (Sprint 2)
-- =========================================================================

-- Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID UNIQUE NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    hold_balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    currency VARCHAR(10) DEFAULT 'UNC' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ledger Transactions Table (Fixed Typo: transaction_type instead of transactionType in CHECK)
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('barter_payment', 'barter_fee', 'escrow_hold', 'escrow_release', 'topup', 'withdraw')),
    amount NUMERIC(15, 2) NOT NULL,
    reference_id UUID, -- Reference ID to barter agreements, settlements, etc.
    description TEXT,
    status VARCHAR(50) DEFAULT 'completed' NOT NULL CHECK (status IN ('completed', 'pending', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Enforcement
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;

-- Wallets Policies
CREATE POLICY "Owners can view their own wallet" ON public.wallets
    FOR SELECT USING (
        auth.uid() IN (SELECT owner_id FROM public.businesses WHERE id = business_id)
    );

-- Ledger Transactions Policies
CREATE POLICY "Owners can view their own ledger logs" ON public.ledger_transactions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM public.businesses WHERE id IN (
                SELECT business_id FROM public.wallets WHERE id IN (from_wallet_id, to_wallet_id)
            )
        )
    );


-- =========================================================================
-- 7. BARTER DOMAIN (Sprint 2)
-- =========================================================================

-- Barter Offers Table (Contracts)
CREATE TABLE IF NOT EXISTS public.barter_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    receiver_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'escrowed', 'completed', 'cancelled')),
    terms_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Barter Offer Items Table
CREATE TABLE IF NOT EXISTS public.barter_offer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES public.barter_offers(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 NOT NULL,
    credits_value NUMERIC(12, 2) NOT NULL,
    direction VARCHAR(50) NOT NULL CHECK (direction IN ('sender_to_receiver', 'receiver_to_sender'))
);

-- RLS Enforcement
ALTER TABLE public.barter_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barter_offer_items ENABLE ROW LEVEL SECURITY;

-- Barter Offers Policies
CREATE POLICY "Owners involved in the barter can view their offers" ON public.barter_offers
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM public.businesses WHERE id IN (sender_business_id, receiver_business_id)
        )
    );

CREATE POLICY "Sender can initiate barter offer" ON public.barter_offers
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT owner_id FROM public.businesses WHERE id = sender_business_id)
    );

CREATE POLICY "Parties involved can update the barter status" ON public.barter_offers
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT owner_id FROM public.businesses WHERE id IN (sender_business_id, receiver_business_id)
        )
    );

-- Barter Offer Items Policies
CREATE POLICY "Parties involved can view offer items" ON public.barter_offer_items
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM public.businesses WHERE id IN (
                SELECT sender_business_id FROM public.barter_offers WHERE id = offer_id
                UNION
                SELECT receiver_business_id FROM public.barter_offers WHERE id = offer_id
            )
        )
    );


-- =========================================================================
-- 8. ESCROW DOMAIN (Sprint 2)
-- =========================================================================

-- Escrows Table
CREATE TABLE IF NOT EXISTS public.escrows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES public.barter_offers(id) ON DELETE CASCADE,
    sender_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    receiver_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'held' NOT NULL CHECK (status IN ('held', 'released', 'refunded', 'disputed')),
    dispute_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Enforcement
ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;

-- Escrows Policies
CREATE POLICY "Parties involved can view escrow status" ON public.escrows
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM public.businesses WHERE id IN (
                SELECT business_id FROM public.wallets WHERE id IN (sender_wallet_id, receiver_wallet_id)
            )
        )
    );


-- =========================================================================
-- 9. SETTLEMENT DOMAIN (Sprint 2)
-- =========================================================================

-- Settlements Table
CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    payment_gateway VARCHAR(50) NOT NULL CHECK (payment_gateway IN ('stripe', 'wise')),
    gateway_transaction_id VARCHAR(255) UNIQUE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Enforcement
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Settlements Policies
CREATE POLICY "Owners can view their own settlements" ON public.settlements
    FOR SELECT USING (
        auth.uid() IN (SELECT owner_id FROM public.businesses WHERE id = business_id)
    );


-- =========================================================================
-- 10. COMMUNITY DOMAIN (Sprint 2)
-- =========================================================================

-- Communities Table
CREATE TABLE IF NOT EXISTS public.communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name JSONB NOT NULL,
    description JSONB NOT NULL,
    logo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Community Members Join Table
CREATE TABLE IF NOT EXISTS public.community_members (
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' NOT NULL CHECK (role IN ('member', 'moderator', 'admin')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (community_id, business_id)
);

-- Referral Programs Table
CREATE TABLE IF NOT EXISTS public.referral_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    referred_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    reward_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'rewarded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Enforcement
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_programs ENABLE ROW LEVEL SECURITY;

-- Communities Policies
CREATE POLICY "Communities are viewable by everyone" ON public.communities
    FOR SELECT USING (true);

-- Community Members Policies
CREATE POLICY "Members list is viewable by everyone" ON public.community_members
    FOR SELECT USING (true);

CREATE POLICY "Owners can manage their membership" ON public.community_members
    USING (
        auth.uid() IN (SELECT owner_id FROM public.businesses WHERE id = business_id)
    );

-- Referral Policies
CREATE POLICY "Referral log viewable by parties involved" ON public.referral_programs
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM public.businesses WHERE id IN (referrer_business_id, referred_business_id)
        )
    );


-- =========================================================================
-- 11. AI DOMAIN (Sprint 2)
-- =========================================================================

-- AI Matches Table
CREATE TABLE IF NOT EXISTS public.ai_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID REFERENCES public.barter_offers(id) ON DELETE SET NULL,
    listing_a_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    listing_b_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    similarity_score NUMERIC(5, 4) NOT NULL,
    match_rationale TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Enforcement
ALTER TABLE public.ai_matches ENABLE ROW LEVEL SECURITY;

-- AI Matches Policies
CREATE POLICY "AI matches are viewable by listing owners" ON public.ai_matches
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM public.businesses WHERE id IN (
                SELECT business_id FROM public.listings WHERE id IN (listing_a_id, listing_b_id)
            )
        )
    );


-- =========================================================================
-- 12. ADMIN DOMAIN (Sprint 2)
-- =========================================================================

-- Admin Disputes Table
CREATE TABLE IF NOT EXISTS public.admin_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id UUID NOT NULL REFERENCES public.escrows(id) ON DELETE CASCADE,
    raised_by_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    assigned_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    resolution_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Enforcement
ALTER TABLE public.admin_disputes ENABLE ROW LEVEL SECURITY;

-- Admin Disputes Policies
CREATE POLICY "Disputes viewable by parties involved or assigned admin" ON public.admin_disputes
    FOR SELECT USING (
        auth.uid() = assigned_admin_id
        OR
        auth.uid() IN (
            SELECT owner_id FROM public.businesses WHERE id = raised_by_business_id
            UNION
            SELECT owner_id FROM public.businesses WHERE id IN (
                SELECT business_id FROM public.wallets WHERE id IN (
                    SELECT sender_wallet_id FROM public.escrows WHERE id = escrow_id
                    UNION
                    SELECT receiver_wallet_id FROM public.escrows WHERE id = escrow_id
                )
            )
        )
    );


-- =========================================================================
-- AUTOMATED FUNCTIONS & TRIGGERS FOR PROFILE & WALLET SYNC
-- =========================================================================

-- 1. Trigger function to automatically create a public profile when a user signs up (from auth.users)
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

-- Trigger execution for auth
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Trigger function to automatically create a business wallet when a business is registered
CREATE OR REPLACE FUNCTION public.handle_new_business_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (business_id, balance, hold_balance, currency)
    VALUES (new.id, 0.00, 0.00, 'UNC')
    ON CONFLICT (business_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution for wallet
CREATE OR REPLACE TRIGGER on_business_registered_create_wallet
    AFTER INSERT ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_business_wallet();
