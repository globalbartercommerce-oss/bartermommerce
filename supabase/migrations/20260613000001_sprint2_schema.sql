-- Migration: Sprint 2 Database Schema (Marketplace, Wallet, Barter, Escrow, Settlement, Community, AI, Admin)
-- Date: 2026-06-13

-- =========================================================================
-- 1. MARKETPLACE DOMAIN
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

-- RLS Enforcement
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Listings Policies
CREATE POLICY "Listings are viewable by everyone" ON public.listings
    FOR SELECT USING (true);

CREATE POLICY "Owners can manage their own listings" ON public.listings
    USING (
        auth.uid() IN (SELECT owner_id FROM public.businesses WHERE id = business_id)
    );


-- =========================================================================
-- 2. WALLET & LEDGER DOMAIN
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

-- Ledger Transactions Table
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transactionType IN ('barter_payment', 'barter_fee', 'escrow_hold', 'escrow_release', 'topup', 'withdraw')),
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
-- 3. BARTER DOMAIN
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
-- 4. ESCROW DOMAIN
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
-- 5. SETTLEMENT DOMAIN
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
-- 6. COMMUNITY DOMAIN
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
-- 7. AI DOMAIN
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
-- 8. ADMIN DOMAIN
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
-- 9. TRIGGERS & PROCEDURES (Automatic Wallet Creation on Business Registration)
-- =========================================================================

-- Trigger function to automatically create a business wallet when a business is registered
CREATE OR REPLACE FUNCTION public.handle_new_business_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (business_id, balance, hold_balance, currency)
    VALUES (new.id, 0.00, 0.00, 'UNC')
    ON CONFLICT (business_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
CREATE OR REPLACE TRIGGER on_business_registered_create_wallet
    AFTER INSERT ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_business_wallet();
