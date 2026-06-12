import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { 
  Home, 
  Wallet, 
  RefreshCw, 
  ShieldAlert, 
  Lock, 
  ChevronRight, 
  User, 
  Plus, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle, 
  XCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react-native';
import { supabase } from './src/config/supabase';
import { PremiumCard } from './src/components/PremiumCard';
import { generateHybridMatches, type HybridMatchResult, type HybridListing } from './src/utils/ai-matching';

// Typography / Color Palette
const COLORS = {
  bg: '#0A0806',
  card: '#15120F',
  cardLight: '#1E1A16',
  gold: '#C9A96E',
  emerald: '#10B981',
  text: '#F3EFE8',
  textMuted: '#9B9690',
  red: '#EF4444',
  border: 'rgba(255, 255, 255, 0.05)',
  goldMuted: 'rgba(201, 169, 110, 0.15)',
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'wallet' | 'barter' | 'escrow'>('dashboard');
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [industry, setIndustry] = useState('');
  const [countryCode, setCountryCode] = useState('TH');

  // Business / Financial Data state
  const [business, setBusiness] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [aiMatches, setAiMatches] = useState<HybridMatchResult[]>([]);
  const [barterOffers, setBarterOffers] = useState<any[]>([]);
  const [escrows, setEscrows] = useState<any[]>([]);
  const [allActiveListings, setAllActiveListings] = useState<any[]>([]);
  
  // Wallet Modal Simulators
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Barter Swap Builder State
  const [partnerBusinessId, setPartnerBusinessId] = useState('');
  const [partnerListingId, setPartnerListingId] = useState('');
  const [myListingId, setMyListingId] = useState('');
  const [barterTerms, setBarterTerms] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData(session.user.id);
      else setIsLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData(session.user.id);
      else {
        setBusiness(null);
        setWallet(null);
        setIsLoading(false);
      }
    });
  }, []);

  const fetchAllData = async (userId: string) => {
    try {
      setIsRefreshing(true);
      
      // 1. Fetch Business Profile
      const { data: bizData, error: bizError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();

      if (bizError) throw bizError;
      
      if (!bizData) {
        setBusiness(null);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
      
      setBusiness(bizData);

      // 2. Fetch Wallet Info
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('business_id', bizData.id)
        .maybeSingle();

      if (walletError) throw walletError;
      setWallet(walletData);

      if (walletData) {
        // 3. Fetch Ledger Transactions
        const { data: txData } = await supabase
          .from('ledger_transactions')
          .select('*')
          .or(`from_wallet_id.eq.${walletData.id},to_wallet_id.eq.${walletData.id}`)
          .order('created_at', { ascending: false })
          .limit(10);
        setRecentTransactions(txData || []);
      }

      // 4. Fetch All Active Listings to calculate AI matches
      const { data: listingsData } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          category,
          estimated_value,
          business_id,
          business:business_id(company_name, country_code)
        `)
        .eq('status', 'active');

      if (listingsData) {
        setAllActiveListings(listingsData);
        const myListings: HybridListing[] = listingsData
          .filter((l: any) => l.business_id === bizData.id)
          .map((l: any) => ({
            id: l.id,
            title: l.title,
            category: l.category,
            estimated_value: Number(l.estimated_value),
            business_id: l.business_id,
            company_name: bizData.company_name,
            country_code: bizData.country_code || 'TH',
          }));

        const otherListings: HybridListing[] = listingsData
          .filter((l: any) => l.business_id !== bizData.id)
          .map((l: any) => ({
            id: l.id,
            title: l.title,
            category: l.category,
            estimated_value: Number(l.estimated_value),
            business_id: l.business_id,
            company_name: l.business?.company_name || 'Unknown Business',
            country_code: l.business?.country_code || 'TH',
          }));

        const matches = generateHybridMatches(myListings, otherListings);
        setAiMatches(matches);
      }

      // 5. Fetch Barter Offers / Agreements
      const { data: barterData } = await supabase
        .from('barter_agreements')
        .select('*')
        .or(`initiator_id.eq.${bizData.id},receiver_id.eq.${bizData.id}`)
        .order('created_at', { ascending: false });
      setBarterOffers(barterData || []);

      // 6. Fetch Escrow Accounts
      if (walletData) {
        const { data: escrowData } = await supabase
          .from('escrows')
          .select('*')
          .or(`sender_wallet_id.eq.${walletData.id},receiver_wallet_id.eq.${walletData.id}`)
          .order('created_at', { ascending: false });
        setEscrows(escrowData || []);
      }

    } catch (error: any) {
      console.error('Data Fetch Error:', error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', error.message);
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !companyName || !registrationNumber || !industry) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    setIsLoading(true);
    
    // 1. Sign up user via Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !signUpData.user) {
      Alert.alert('ลงทะเบียนไม่สำเร็จ', signUpError?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      setIsLoading(false);
      return;
    }

    const userId = signUpData.user.id;

    // 2. Insert merchant profile business record
    const { error: businessError } = await supabase.from('businesses').insert({
      owner_id: userId,
      company_name: companyName,
      registration_number: registrationNumber,
      country_code: countryCode,
      industry: industry,
      verification_status: 'pending',
    });

    if (businessError) {
      // Clean up user if business insert fails (compensation action)
      Alert.alert('เกิดข้อผิดพลาด', 'บันทึกข้อมูลบริษัทไม่สำเร็จ: ' + businessError.message);
      setIsLoading(false);
      return;
    }

    Alert.alert('สำเร็จ', 'ลงทะเบียนและสร้างโปรไฟล์ธุรกิจเรียบร้อยแล้ว');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Simulated Deposit via Stripe
  const handleDeposit = async () => {
    const amount = Number(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }
    if (!wallet) return;

    try {
      setIsLoading(true);
      const newBalance = Number(wallet.balance) + amount;
      
      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      if (walletError) throw walletError;

      // Log Ledger Transaction
      const { error: ledgerError } = await supabase.from('ledger_transactions').insert({
        to_wallet_id: wallet.id,
        transaction_type: 'topup',
        amount: amount,
        description: 'ฝากเงินสดจำลองผ่านระบบ Stripe (Mobile App)',
        status: 'completed'
      });

      if (ledgerError) throw ledgerError;

      // Add to settlements (Sprint 9 Integration)
      await supabase.from('settlements').insert({
        business_id: business.id,
        direction: 'inbound',
        payment_gateway: 'stripe',
        amount: amount,
        currency: 'USD',
        status: 'completed',
        gateway_transaction_id: 'ch_sim_' + Math.random().toString(36).substring(2, 12),
      });

      setDepositAmount('');
      Alert.alert('สำเร็จ', `ฝากเงินสำเร็จจำนวน ${amount.toLocaleString()} UNC`);
      fetchAllData(session.user.id);
    } catch (error: any) {
      Alert.alert('ข้อผิดพลาด', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulated Withdraw via Wise
  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }
    if (!wallet || Number(wallet.balance) < amount) {
      Alert.alert('ยอดเงินไม่เพียงพอ', 'ยอดเงินพร้อมใช้ในกระเป๋าของคุณไม่เพียงพอสำหรับการถอน');
      return;
    }

    try {
      setIsLoading(true);
      const newBalance = Number(wallet.balance) - amount;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      if (walletError) throw walletError;

      // Log Ledger Transaction
      const { error: ledgerError } = await supabase.from('ledger_transactions').insert({
        from_wallet_id: wallet.id,
        transaction_type: 'credit_transfer',
        amount: amount,
        description: 'ถอนเงินสดจำลองผ่าน Wise (Mobile App)',
        status: 'completed'
      });

      if (ledgerError) throw ledgerError;

      // Add to settlements (Wise status starts as pending)
      await supabase.from('settlements').insert({
        business_id: business.id,
        direction: 'outbound',
        payment_gateway: 'wise',
        amount: amount,
        currency: 'USD',
        status: 'pending',
        gateway_transaction_id: 'tr_sim_' + Math.random().toString(36).substring(2, 12),
      });

      setWithdrawAmount('');
      Alert.alert('สำเร็จ', `ถอนเงินสำเร็จจำนวน ${amount.toLocaleString()} UNC (สถานะ: กำลังประมวลผล Wise)`);
      fetchAllData(session.user.id);
    } catch (error: any) {
      Alert.alert('ข้อผิดพลาด', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Create Barter Agreement (Double Coincidence Match Link)
  const handleCreateBarterOffer = async () => {
    if (!partnerBusinessId || !myListingId || !partnerListingId) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกข้อมูลคู่ค้าและเลือกสินค้าในการแลกเปลี่ยน');
      return;
    }

    try {
      setIsLoading(true);

      // 1. Create barter agreement row
      const { data: agreement, error: agreementError } = await supabase
        .from('barter_agreements')
        .insert({
          initiator_id: business.id,
          receiver_id: partnerBusinessId,
          terms: barterTerms || 'สัญญาการค้าระหว่างประเทศเพื่อแลกเปลี่ยนของตามข้อเสนอปัญญาประดิษฐ์',
          status: 'pending',
        })
        .select()
        .single();

      if (agreementError) throw agreementError;

      // 2. Insert items
      await supabase.from('barter_agreement_items').insert([
        {
          agreement_id: agreement.id,
          listing_id: myListingId,
          quantity: 1,
          direction: 'initiator_to_receiver'
        },
        {
          agreement_id: agreement.id,
          listing_id: partnerListingId,
          quantity: 1,
          direction: 'receiver_to_initiator'
        }
      ]);

      Alert.alert('สำเร็จ', 'ส่งข้อเสนอแลกเปลี่ยนไปยังคู่ค้าเสร็จเรียบร้อย');
      setPartnerBusinessId('');
      setPartnerListingId('');
      setMyListingId('');
      setBarterTerms('');
      setCurrentTab('barter');
      fetchAllData(session.user.id);
    } catch (error: any) {
      Alert.alert('ข้อผิดพลาด', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Release Escrow Locked Balance
  const handleReleaseEscrow = async (escrowId: string) => {
    try {
      setIsLoading(true);
      const { data: escrow } = await supabase
        .from('escrows')
        .select('*')
        .eq('id', escrowId)
        .single();

      if (!escrow || escrow.status !== 'held') {
        Alert.alert('ข้อผิดพลาด', 'สัญญานี้ไม่ได้อยู่ในสถานะที่พร้อมปล่อยวงเงิน');
        return;
      }

      // Call postgres transaction or emulate:
      // 1. Deduct hold balance of sender wallet
      const { data: senderWallet } = await supabase
        .from('wallets')
        .select('hold_balance')
        .eq('id', escrow.sender_wallet_id)
        .single();

      const newHold = Math.max(0, Number(senderWallet?.hold_balance || 0) - Number(escrow.amount));
      await supabase.from('wallets').update({ hold_balance: newHold }).eq('id', escrow.sender_wallet_id);

      // 2. Increase balance of receiver wallet
      const { data: receiverWallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', escrow.receiver_wallet_id)
        .single();

      const newBal = Number(receiverWallet?.balance || 0) + Number(escrow.amount);
      await supabase.from('wallets').update({ balance: newBal }).eq('id', escrow.receiver_wallet_id);

      // 3. Update escrow status
      await supabase.from('escrows').update({ status: 'released' }).eq('id', escrowId);

      // 4. Log Ledger Transaction
      await supabase.from('ledger_transactions').insert({
        from_wallet_id: escrow.sender_wallet_id,
        to_wallet_id: escrow.receiver_wallet_id,
        transaction_type: 'escrow_release',
        amount: escrow.amount,
        description: 'ปล่อยมัดจำสัญญาค้ำประกัน Escrow ปลายทาง',
        status: 'completed',
        reference_id: escrowId
      });

      Alert.alert('สำเร็จ', 'ปล่อยวงเงินค้ำประกันไปยังกระเป๋าปลายทางเรียบร้อย');
      fetchAllData(session.user.id);
    } catch (error: any) {
      Alert.alert('ข้อผิดพลาด', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Refund Escrow Locked Balance
  const handleRefundEscrow = async (escrowId: string) => {
    try {
      setIsLoading(true);
      const { data: escrow } = await supabase
        .from('escrows')
        .select('*')
        .eq('id', escrowId)
        .single();

      if (!escrow || escrow.status !== 'held') {
        Alert.alert('ข้อผิดพลาด', 'สัญญานี้ไม่อยู่ในสถานะขอคืนยอด');
        return;
      }

      // Deduct sender's hold balance and add back to sender's main balance
      const { data: senderWallet } = await supabase
        .from('wallets')
        .select('balance, hold_balance')
        .eq('id', escrow.sender_wallet_id)
        .single();

      const newHold = Math.max(0, Number(senderWallet?.hold_balance || 0) - Number(escrow.amount));
      const newBal = Number(senderWallet?.balance || 0) + Number(escrow.amount);
      await supabase.from('wallets').update({ balance: newBal, hold_balance: newHold }).eq('id', escrow.sender_wallet_id);

      // Update escrow status
      await supabase.from('escrows').update({ status: 'refunded' }).eq('id', escrowId);

      Alert.alert('สำเร็จ', 'ยกเลิกดีลและคืนคะแนนค้ำประกันกลับเข้ากระเป๋าของคุณเสร็จสิ้น');
      fetchAllData(session.user.id);
    } catch (error: any) {
      Alert.alert('ข้อผิดพลาด', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={styles.loadingText}>Unicorn Commerce Loading...</Text>
      </SafeAreaView>
    );
  }

  // Auth Screen (Login / Register)
  if (!session) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <ScrollView contentContainerStyle={styles.authScroll}>
          <View style={styles.authLogoContainer}>
            <View style={styles.authLogoGlow} />
            <Sparkles size={48} color={COLORS.gold} />
            <Text style={styles.authTitle}>UNICORN</Text>
            <Text style={styles.authSubtitle}>Global Barter Commerce</Text>
          </View>

          {authMode === 'login' ? (
            <View style={styles.authForm}>
              <Text style={styles.formLabel}>อีเมลผู้ใช้ธุรกิจ</Text>
              <TextInput
                style={styles.input}
                placeholder="your@company.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.formLabel}>รหัสผ่านความปลอดภัย</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                <Text style={styles.primaryButtonText}>เข้าสู่ระบบ</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.textButton} onPress={() => setAuthMode('register')}>
                <Text style={styles.textButtonText}>ยังไม่มีบัญชีธุรกิจ? ลงทะเบียน KYB</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.authForm}>
              <Text style={styles.formLabel}>ชื่อบริษัทผู้ขอจดทะเบียน</Text>
              <TextInput
                style={styles.input}
                placeholder="บริษัท โกลบอลเทรด จำกัด"
                placeholderTextColor={COLORS.textMuted}
                value={companyName}
                onChangeText={setCompanyName}
              />

              <Text style={styles.formLabel}>เลขทะเบียนนิติบุคคล (Tax / Registration ID)</Text>
              <TextInput
                style={styles.input}
                placeholder="0105560000000"
                placeholderTextColor={COLORS.textMuted}
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
              />

              <Text style={styles.formLabel}>หมวดหมู่ธุรกิจ (Industry)</Text>
              <TextInput
                style={styles.input}
                placeholder="Agriculture / Tech / Energy"
                placeholderTextColor={COLORS.textMuted}
                value={industry}
                onChangeText={setIndustry}
              />

              <Text style={styles.formLabel}>อีเมล</Text>
              <TextInput
                style={styles.input}
                placeholder="info@yourcompany.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.formLabel}>รหัสผ่าน</Text>
              <TextInput
                style={styles.input}
                placeholder="ขั้นต่ำ 6 หลัก"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
                <Text style={styles.primaryButtonText}>ยืนยันการขึ้นทะเบียนธุรกิจ</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.textButton} onPress={() => setAuthMode('login')}>
                <Text style={styles.textButtonText}>มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Dashboard Tab Screen
  const renderDashboard = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => fetchAllData(session.user.id)} tintColor={COLORS.gold} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>ยินดีต้อนรับ</Text>
          <Text style={styles.companyText}>{business?.company_name || 'กำลังดึงข้อมูลบริษัท...'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <User size={18} color={COLORS.text} />
          <Text style={styles.logoutText}>ออกระบบ</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.row}>
        <PremiumCard style={styles.halfCard}>
          <Text style={styles.cardLabel}>UNICORN CREDITS</Text>
          <Text style={[styles.cardVal, { color: COLORS.emerald }]}>
            {wallet ? Number(wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </Text>
          <Text style={styles.cardMuted}>Spendable UNC</Text>
        </PremiumCard>
        
        <PremiumCard style={styles.halfCard}>
          <Text style={styles.cardLabel}>ESCROW LOCKED</Text>
          <Text style={[styles.cardVal, { color: COLORS.gold }]}>
            {wallet ? Number(wallet.hold_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </Text>
          <Text style={styles.cardMuted}>หลักทรัพย์มัดจำสัญญา</Text>
        </PremiumCard>
      </View>

      {/* AI Matches */}
      <Text style={styles.sectionTitle}>🤖 AI Smart Matching Recommendations</Text>
      {aiMatches.length === 0 ? (
        <PremiumCard variant="glass">
          <Text style={styles.emptyText}>ไม่พบดีลแลกเปลี่ยนที่แนะนำในขณะนี้ กรุณาสร้างรายการสินค้าของคุณเพิ่มบนหน้าเว็บ</Text>
        </PremiumCard>
      ) : (
        aiMatches.map((match) => (
          <PremiumCard key={match.id} variant="gold" style={styles.matchCard}>
            <View style={styles.matchHeader}>
              <View style={styles.matchIconGlow}>
                <Sparkles size={16} color={COLORS.gold} />
              </View>
              <Text style={styles.matchScore}>{match.similarity} Match Match</Text>
            </View>
            <Text style={styles.matchTitle}>
              แลกเปลียน: <Text style={{ color: COLORS.gold }}>{match.yourListing}</Text> กับ {match.matchedWith}
            </Text>
            <Text style={styles.matchRationale}>{match.rationale}</Text>
            
            <TouchableOpacity 
              style={styles.matchActionBtn}
              onPress={() => {
                setPartnerBusinessId(match.partnerBusinessId);
                setPartnerListingId(match.partnerListingId);
                setMyListingId(match.myListingId);
                setBarterTerms(`สัญญาการแลกเปลี่ยน ${match.yourListing} กับสินค้า ${match.matchedWith} ประเมินความพึงพอใจโดย AI Matchmaker`);
                setCurrentTab('barter');
                Alert.alert('สร้างสัญญา', 'พอร์ตข้อมูลดีลแนะนำไปยัง Swap Builder หน้ารายการแลกเปลี่ยนแล้ว');
              }}
            >
              <Text style={styles.matchActionText}>เริ่มร่างสัญญาข้อตกลงแลกเปลี่ยน</Text>
              <ChevronRight size={14} color={COLORS.bg} />
            </TouchableOpacity>
          </PremiumCard>
        ))
      )}

      {/* Recent Transactions */}
      <Text style={styles.sectionTitle}>🔄 ประวัติธุรกรรมการเงินล่าสุด</Text>
      <PremiumCard>
        {recentTransactions.length === 0 ? (
          <Text style={styles.emptyText}>ไม่มีประวัติการทำธุรกรรม</Text>
        ) : (
          recentTransactions.map((tx) => {
            const isOutbound = wallet && tx.from_wallet_id === wallet.id;
            return (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txIconContainer}>
                  {isOutbound ? (
                    <ArrowUpRight size={18} color={COLORS.red} />
                  ) : (
                    <ArrowDownLeft size={18} color={COLORS.emerald} />
                  )}
                </View>
                <View style={styles.txDetails}>
                  <Text style={styles.txType}>
                    {tx.transaction_type.toUpperCase()}
                  </Text>
                  <Text style={styles.txDesc}>{tx.description || '-'}</Text>
                  <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.txAmount, { color: isOutbound ? COLORS.red : COLORS.emerald }]}>
                  {isOutbound ? '-' : '+'}{Number(tx.amount).toLocaleString()} UNC
                </Text>
              </View>
            );
          })
        )}
      </PremiumCard>
    </ScrollView>
  );

  // Wallet Tab Screen
  const renderWallet = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => fetchAllData(session.user.id)} tintColor={COLORS.gold} />}
    >
      <Text style={styles.pageTitle}>💼 Unicorn Coin Wallet</Text>
      
      <PremiumCard variant="gold">
        <Text style={styles.cardLabel}>SPENDABLE BALANCE</Text>
        <Text style={styles.walletBalanceText}>
          {wallet ? Number(wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} UNC
        </Text>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.walletDetailLabel}>ยอดล็อกประกันสัญญา (Escrow):</Text>
          <Text style={styles.walletDetailVal}>
            {wallet ? Number(wallet.hold_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} UNC
          </Text>
        </View>
      </PremiumCard>

      <Text style={styles.sectionTitle}>📥 ฝากเครดิตจำลอง (Deposit via Stripe)</Text>
      <PremiumCard>
        <Text style={styles.formLabel}>จำนวนคะแนน UNC ที่ต้องการฝาก</Text>
        <TextInput
          style={styles.input}
          placeholder="1000"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="numeric"
          value={depositAmount}
          onChangeText={setDepositAmount}
        />
        <TouchableOpacity style={styles.depositBtn} onPress={handleDeposit}>
          <DollarSign size={16} color={COLORS.bg} />
          <Text style={styles.depositBtnText}>ชำระจำลอง 1:1 USD สู่ UNC</Text>
        </TouchableOpacity>
      </PremiumCard>

      <Text style={styles.sectionTitle}>📤 ถอนเงินเครดิตจำลอง (Withdraw via Wise)</Text>
      <PremiumCard>
        <Text style={styles.formLabel}>จำนวนคะแนน UNC ที่ต้องการถอน</Text>
        <TextInput
          style={styles.input}
          placeholder="500"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="numeric"
          value={withdrawAmount}
          onChangeText={setWithdrawAmount}
        />
        <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
          <ArrowUpRight size={16} color={COLORS.bg} />
          <Text style={styles.withdrawBtnText}>เบิกจ่าย Wise (สถานะ: Pending)</Text>
        </TouchableOpacity>
      </PremiumCard>
    </ScrollView>
  );

  // Barter Offers Tab Screen
  const renderBarter = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => fetchAllData(session.user.id)} tintColor={COLORS.gold} />}
    >
      <Text style={styles.pageTitle}>🤝 Smart Swap & Barter Agreements</Text>

      {/* Barter Swap Builder */}
      <Text style={styles.sectionTitle}>🛠️ Interactive Swap Builder</Text>
      <PremiumCard variant="gold">
        <Text style={styles.formLabel}>รหัสคู่ค้า (Partner Business ID)</Text>
        <TextInput
          style={styles.input}
          placeholder="กรอก UUID คู่ค้า หรือกดจาก AI Match ด้านล่าง"
          placeholderTextColor={COLORS.textMuted}
          value={partnerBusinessId}
          onChangeText={setPartnerBusinessId}
        />

        <Text style={styles.formLabel}>สินค้าที่คุณต้องการแลก (My Listing ID)</Text>
        <TextInput
          style={styles.input}
          placeholder="กรอก UUID สินค้าของคุณ"
          placeholderTextColor={COLORS.textMuted}
          value={myListingId}
          onChangeText={setMyListingId}
        />

        <Text style={styles.formLabel}>สินค้าที่ต้องการรับจากคู่ค้า (Partner Listing ID)</Text>
        <TextInput
          style={styles.input}
          placeholder="กรอก UUID สินค้าคู่ค้า"
          placeholderTextColor={COLORS.textMuted}
          value={partnerListingId}
          onChangeText={setPartnerListingId}
        />

        <Text style={styles.formLabel}>ข้อตกลงและสัญญาเพิ่มเติม</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="ระบุเงื่อนไขสัญญาเพิ่มเติม..."
          placeholderTextColor={COLORS.textMuted}
          value={barterTerms}
          onChangeText={setBarterTerms}
          multiline
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateBarterOffer}>
          <Text style={styles.primaryButtonText}>ยื่นข้อตกลงการแลกเปลี่ยน</Text>
        </TouchableOpacity>
      </PremiumCard>

      <Text style={styles.sectionTitle}>📄 รายการสัญญาในระบบ</Text>
      {barterOffers.length === 0 ? (
        <Text style={styles.emptyText}>ไม่มีรายการสัญญาเสนอแลกเปลี่ยน</Text>
      ) : (
        barterOffers.map((offer) => (
          <PremiumCard key={offer.id}>
            <View style={styles.offerHeader}>
              <Text style={styles.offerId}>สัญญา ID: #{offer.id.substring(0, 8)}</Text>
              <View style={[
                styles.statusBadge,
                offer.status === 'completed' ? styles.statusSuccess :
                offer.status === 'pending' ? styles.statusWarning :
                styles.statusInfo
              ]}>
                <Text style={styles.statusText}>{offer.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.offerTerms}>ข้อตกลง: {offer.terms}</Text>
            <Text style={styles.offerDate}>วันที่เริ่มสัญญา: {new Date(offer.created_at).toLocaleDateString()}</Text>
          </PremiumCard>
        ))
      )}
    </ScrollView>
  );

  // Escrow monitor Tab Screen
  const renderEscrow = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => fetchAllData(session.user.id)} tintColor={COLORS.gold} />}
    >
      <Text style={styles.pageTitle}>🛡️ Escrow Accounts Monitor</Text>

      {escrows.length === 0 ? (
        <PremiumCard variant="glass">
          <Text style={styles.emptyText}>ไม่มีประวัติการค้ำประกันแต้มมัดจำในระบบขณะนี้</Text>
        </PremiumCard>
      ) : (
        escrows.map((escrow) => {
          const isSender = wallet && escrow.sender_wallet_id === wallet.id;
          return (
            <PremiumCard key={escrow.id} variant={escrow.status === 'held' ? 'gold' : 'glass'}>
              <View style={styles.escrowHeader}>
                <View style={styles.escrowTitleWrap}>
                  <Lock size={16} color={escrow.status === 'held' ? COLORS.gold : COLORS.textMuted} />
                  <Text style={styles.escrowId}> ESCROW ID: #{escrow.id.substring(0, 8)}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  escrow.status === 'released' ? styles.statusSuccess :
                  escrow.status === 'held' ? styles.statusWarning :
                  styles.statusDanger
                ]}>
                  <Text style={styles.statusText}>{escrow.status.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.escrowAmountText}>
                ยอดค้ำประกัน: <Text style={{ color: COLORS.gold }}>{Number(escrow.amount).toLocaleString()} UNC</Text>
              </Text>

              <Text style={styles.escrowRoleText}>
                บทบาทของคุณ: <Text style={{ color: COLORS.text }}>{isSender ? 'ผู้ฝากประกัน (Sender)' : 'ผู้รับหลักประกัน (Receiver)'}</Text>
              </Text>

              {escrow.status === 'held' && isSender && (
                <View style={styles.escrowActions}>
                  <TouchableOpacity 
                    style={styles.releaseBtn} 
                    onPress={() => {
                      Alert.alert(
                        'ปล่อยแต้มประกัน', 
                        'คุณต้องการปล่อยยอดค้ำประกันนี้ไปยังคู่ค้าปลายทางทันทีหรือไม่?',
                        [
                          { text: 'ยกเลิก', style: 'cancel' },
                          { text: 'ปล่อยยอด', onPress: () => handleReleaseEscrow(escrow.id) }
                        ]
                      );
                    }}
                  >
                    <CheckCircle size={14} color={COLORS.bg} />
                    <Text style={styles.releaseBtnText}>Release Escrow</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.refundBtn} 
                    onPress={() => {
                      Alert.alert(
                        'ขอคืนคะแนน', 
                        'ยืนยันคืนแต้มมัดจำกลับสู่ยอดเงินปกติ กรณีสัญญาดีลถูกยกเลิก?',
                        [
                          { text: 'ยกเลิก', style: 'cancel' },
                          { text: 'ดึงแต้มคืน', onPress: () => handleRefundEscrow(escrow.id) }
                        ]
                      );
                    }}
                  >
                    <XCircle size={14} color={COLORS.bg} />
                    <Text style={styles.refundBtnText}>Refund Back</Text>
                  </TouchableOpacity>
                </View>
              )}
            </PremiumCard>
          );
        })
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      
      {/* Active Tab rendering */}
      {currentTab === 'dashboard' && renderDashboard()}
      {currentTab === 'wallet' && renderWallet()}
      {currentTab === 'barter' && renderBarter()}
      {currentTab === 'escrow' && renderEscrow()}

      {/* Navigation Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, currentTab === 'dashboard' && styles.tabItemActive]} 
          onPress={() => setCurrentTab('dashboard')}
        >
          <Home size={22} color={currentTab === 'dashboard' ? COLORS.gold : COLORS.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'dashboard' && styles.tabLabelActive]}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, currentTab === 'wallet' && styles.tabItemActive]} 
          onPress={() => setCurrentTab('wallet')}
        >
          <Wallet size={22} color={currentTab === 'wallet' ? COLORS.gold : COLORS.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'wallet' && styles.tabLabelActive]}>Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, currentTab === 'barter' && styles.tabItemActive]} 
          onPress={() => setCurrentTab('barter')}
        >
          <RefreshCw size={22} color={currentTab === 'barter' ? COLORS.gold : COLORS.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'barter' && styles.tabLabelActive]}>Swap Builder</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, currentTab === 'escrow' && styles.tabItemActive]} 
          onPress={() => setCurrentTab('escrow')}
        >
          <ShieldAlert size={22} color={currentTab === 'escrow' ? COLORS.gold : COLORS.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'escrow' && styles.tabLabelActive]}>Escrow</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  authContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  authScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  authLogoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
    position: 'relative',
  },
  authLogoGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.gold,
    opacity: 0.1,
  },
  authTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 3,
    marginTop: 12,
  },
  authSubtitle: {
    fontSize: 14,
    color: COLORS.gold,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 4,
  },
  authForm: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: COLORS.cardLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButtonText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: 'bold',
  },
  textButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  textButtonText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  welcomeText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  companyText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  logoutText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardVal: {
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 4,
  },
  cardMuted: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
  matchCard: {
    marginBottom: 14,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  matchIconGlow: {
    backgroundColor: COLORS.goldMuted,
    padding: 6,
    borderRadius: 8,
  },
  matchScore: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  matchRationale: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginVertical: 8,
  },
  matchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 4,
    marginTop: 4,
  },
  matchActionText: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: 'bold',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  txIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txType: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 'bold',
  },
  txDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  txDate: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  walletBalanceText: {
    color: COLORS.emerald,
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  walletDetailLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  walletDetailVal: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  depositBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.emerald,
    padding: 14,
    borderRadius: 12,
    gap: 6,
    marginTop: 8,
  },
  depositBtnText: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: 'bold',
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    padding: 14,
    borderRadius: 12,
    gap: 6,
    marginTop: 8,
  },
  withdrawBtnText: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: 'bold',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerId: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  offerTerms: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 6,
  },
  offerDate: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusWarning: {
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
  },
  statusInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  escrowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  escrowTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  escrowId: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  escrowAmountText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 6,
  },
  escrowRoleText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 12,
  },
  escrowActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  releaseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.emerald,
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  releaseBtnText: {
    color: COLORS.bg,
    fontSize: 11,
    fontWeight: 'bold',
  },
  refundBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  refundBtnText: {
    color: COLORS.bg,
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 10,
    paddingBottom: 22,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabItemActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.gold,
  },
});
