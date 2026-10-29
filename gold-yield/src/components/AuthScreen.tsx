/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Coins, Shield, Sparkles, User, Lock, Phone, Gift, Play } from 'lucide-react';
import imgRefinery from '../assets/images/gold_refinery_1783873491748.jpg';

const COUNTRIES = [
  // Afrique de l'Ouest
  { code: 'CI', dial: '+225', name: 'Côte d’Ivoire', flag: '🇨🇮' },
  { code: 'SN', dial: '+221', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'BF', dial: '+226', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'ML', dial: '+223', name: 'Mali', flag: '🇲🇱' },
  { code: 'GN', dial: '+224', name: 'Guinée', flag: '🇬🇳' },
  { code: 'BJ', dial: '+229', name: 'Bénin', flag: '🇧🇯' },
  { code: 'TG', dial: '+228', name: 'Togo', flag: '🇹🇬' },
  { code: 'NE', dial: '+227', name: 'Niger', flag: '🇳🇪' },
  { code: 'MR', dial: '+222', name: 'Mauritanie', flag: '🇲🇷' },
  { code: 'GH', dial: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: 'NG', dial: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'SL', dial: '+232', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'LR', dial: '+231', name: 'Libéria', flag: '🇱🇷' },
  { code: 'GM', dial: '+220', name: 'Gambie', flag: '🇬🇲' },
  { code: 'GW', dial: '+245', name: 'Guinée-Bissau', flag: '🇬🇼' },
  { code: 'CV', dial: '+238', name: 'Cap-Vert', flag: '🇨🇻' },

  // Afrique Centrale
  { code: 'CM', dial: '+237', name: 'Cameroun', flag: '🇨🇲' },
  { code: 'GA', dial: '+241', name: 'Gabon', flag: '🇬🇦' },
  { code: 'CG', dial: '+242', name: 'Congo-Brazzaville', flag: '🇨🇬' },
  { code: 'CD', dial: '+243', name: 'RDC Kinshasa', flag: '🇨🇩' },
  { code: 'TD', dial: '+235', name: 'Tchad', flag: '🇹🇩' },
  { code: 'CF', dial: '+236', name: 'Centrafrique', flag: '🇨🇫' },
  { code: 'GQ', dial: '+240', name: 'Guinée Équatoriale', flag: '🇬🇶' },

  // Afrique de l'Est & Océan Indien
  { code: 'MG', dial: '+261', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'RW', dial: '+250', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'BI', dial: '+257', name: 'Burundi', flag: '🇧🇮' },
  { code: 'KM', dial: '+269', name: 'Comores', flag: '🇰🇲' },
  { code: 'DJ', dial: '+253', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'KE', dial: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: 'TZ', dial: '+255', name: 'Tanzanie', flag: '🇹🇿' },
  { code: 'UG', dial: '+256', name: 'Ouganda', flag: '🇺🇬' },
  { code: 'ET', dial: '+251', name: 'Éthiopie', flag: '🇪🇹' },
  { code: 'MU', dial: '+230', name: 'Île Maurice', flag: '🇲🇺' },

  // Afrique du Nord
  { code: 'MA', dial: '+212', name: 'Maroc', flag: '🇲🇦' },
  { code: 'DZ', dial: '+213', name: 'Algérie', flag: '🇩🇿' },
  { code: 'TN', dial: '+216', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'EG', dial: '+20', name: 'Égypte', flag: '🇪🇬' },

  // Afrique Australe
  { code: 'AO', dial: '+244', name: 'Angola', flag: '🇦🇴' },
  { code: 'ZA', dial: '+27', name: 'Afrique du Sud', flag: '🇿🇦' },
  { code: 'MZ', dial: '+258', name: 'Mozambique', flag: '🇲🇿' },

  // Europe & Diaspora
  { code: 'FR', dial: '+33', name: 'France', flag: '🇫🇷' },
  { code: 'BE', dial: '+32', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', dial: '+41', name: 'Suisse', flag: '🇨🇭' },
  { code: 'DE', dial: '+49', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'GB', dial: '+44', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'ES', dial: '+34', name: 'Espagne', flag: '🇪🇸' },
  { code: 'IT', dial: '+39', name: 'Italie', flag: '🇮🇹' },
  { code: 'PT', dial: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: 'LU', dial: '+352', name: 'Luxembourg', flag: '🇱🇺' },

  // Amériques & Caraïbes
  { code: 'CA', dial: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: 'US', dial: '+1', name: 'États-Unis', flag: '🇺🇸' },
  { code: 'HT', dial: '+509', name: 'Haïti', flag: '🇭🇹' },
  { code: 'GP', dial: '+590', name: 'Guadeloupe', flag: '🇬🇵' },
  { code: 'MQ', dial: '+596', name: 'Martinique', flag: '🇲🇶' },
  { code: 'GF', dial: '+594', name: 'Guyane', flag: '🇬🇫' },
  { code: 'BR', dial: '+55', name: 'Brésil', flag: '🇧🇷' },

  // Saisie universelle
  { code: 'INT', dial: '+', name: 'Autre / International (+...)', flag: '🌐' },
];

function guessUserCountryDial(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Dakar')) return '+221';
    if (tz.includes('Ouagadougou')) return '+226';
    if (tz.includes('Bamako')) return '+223';
    if (tz.includes('Conakry')) return '+224';
    if (tz.includes('Cotonou') || tz.includes('Porto-Novo')) return '+229';
    if (tz.includes('Lome')) return '+228';
    if (tz.includes('Niamey')) return '+227';
    if (tz.includes('Douala') || tz.includes('Yaounde')) return '+237';
    if (tz.includes('Libreville')) return '+241';
    if (tz.includes('Brazzaville')) return '+242';
    if (tz.includes('Kinshasa') || tz.includes('Lubumbashi')) return '+243';
    if (tz.includes('Ndjamena')) return '+235';
    if (tz.includes('Bangui')) return '+236';
    if (tz.includes('Antananarivo')) return '+261';
    if (tz.includes('Kigali')) return '+250';
    if (tz.includes('Bujumbura')) return '+257';
    if (tz.includes('Nouakchott')) return '+222';
    if (tz.includes('Casablanca')) return '+212';
    if (tz.includes('Algiers')) return '+213';
    if (tz.includes('Tunis')) return '+216';
    if (tz.includes('Cairo')) return '+20';
    if (tz.includes('Paris')) return '+33';
    if (tz.includes('Brussels')) return '+32';
    if (tz.includes('Zurich') || tz.includes('Geneva')) return '+41';
    if (tz.includes('London')) return '+44';
    if (tz.includes('Berlin')) return '+49';
    if (tz.includes('Madrid')) return '+34';
    if (tz.includes('Rome')) return '+39';
    if (tz.includes('Toronto') || tz.includes('Montreal') || tz.includes('Vancouver')) return '+1';
    if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles')) return '+1';
    if (tz.includes('Port-au-Prince')) return '+509';
  } catch {}
  return '+225';
}

interface AuthScreenProps {
  onLoginSuccess: (user: any, activeInvestments: any[], transactions: any[], isStale?: boolean, isNewUser?: boolean) => void;
  onOpenVideoAd?: () => void;
}

export function AuthScreen({ onLoginSuccess, onOpenVideoAd }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [phone, setPhone] = useState('');
  const [countryDial, setCountryDial] = useState('+225');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('GOLDYIELD');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('invite') || params.get('code');
      if (ref) {
        setInviteCode(ref);
        setIsSignUp(true);
      }

      // 1. Prefer previously saved country dial if available, else auto-detect from browser timezone
      const savedDial = localStorage.getItem('gy_selected_country_dial');
      if (savedDial) {
        setCountryDial(savedDial);
      } else {
        const detected = guessUserCountryDial();
        setCountryDial(detected);
      }

      // 2. Pre-fill last known phone if available
      const savedPhone = localStorage.getItem('gy_current_phone') || localStorage.getItem('gy_last_phone');
      if (savedPhone) {
        let p = savedPhone.trim();
        if (p.startsWith('+')) {
          const matchedCountry = COUNTRIES.find(c => c.dial !== '+' && p.startsWith(c.dial));
          if (matchedCountry) {
            setCountryDial(matchedCountry.dial);
            setPhone(p.replace(matchedCountry.dial, ''));
          } else {
            setPhone(p);
          }
        } else {
          setPhone(p);
        }
      }
    }
  }, []);

  const handleCountryChange = (dial: string) => {
    setCountryDial(dial);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gy_selected_country_dial', dial);
    }
  };

  const handlePhoneInputChange = (rawVal: string) => {
    const trimmed = rawVal.trim();
    // Auto-detect country code if user types or pastes international format with +
    if (trimmed.startsWith('+')) {
      const afterPlus = trimmed.substring(1).replace(/\s+/g, '');
      const matched = COUNTRIES.find(c => c.dial !== '+' && afterPlus.startsWith(c.dial.substring(1)));
      if (matched) {
        handleCountryChange(matched.dial);
        setPhone(afterPlus.substring(matched.dial.length - 1));
        return;
      }
    }
    setPhone(rawVal);
  };

  const handleToggle = () => {
    setIsSignUp(!isSignUp);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || !password) {
      setError('Veuillez remplir les champs obligatoires.');
      return;
    }

    setLoading(true);

    // Format phone number with country dial prefix cleanly
    let cleanInput = phone.trim().replace(/\s+/g, '');
    let finalPhone = cleanInput;

    if (cleanInput.startsWith('+')) {
      finalPhone = cleanInput;
    } else if (countryDial === '+') {
      finalPhone = `+${cleanInput.replace(/^\+*/, '')}`;
    } else {
      const dialDigits = countryDial.replace(/\D+/g, '');
      if (cleanInput.startsWith(dialDigits)) {
        finalPhone = `+${cleanInput}`;
      } else {
        finalPhone = `${countryDial}${cleanInput}`;
      }
    }

    const rawDigits = finalPhone.replace(/\D+/g, '');
    const cleanPassword = password.trim();

    try {
      if (isSignUp) {
        if (!name) {
          setError('Veuillez saisir votre nom complet.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: finalPhone, name, password: cleanPassword, inviteCode }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erreur lors de l\'inscription.');
        }

        // Persist account locally for reliable future login across restarts
        if (typeof window !== 'undefined') {
          const accountInfo = {
            phone: data.user.phone || finalPhone,
            name: data.user.name || name,
            password: cleanPassword,
            inviteCode: data.user.inviteCode || inviteCode || 'GOLDYIELD',
            balance: data.user.balance !== undefined ? data.user.balance : 1000
          };
          localStorage.setItem('gy_last_phone', finalPhone);
          localStorage.setItem('gy_last_user_account', JSON.stringify(accountInfo));
          const accountsMap = JSON.parse(localStorage.getItem('gy_accounts_store') || '{}');
          accountsMap[finalPhone] = accountInfo;
          accountsMap[rawDigits] = accountInfo;
          if (rawDigits.length >= 8) {
            accountsMap[rawDigits.slice(-8)] = accountInfo;
          }
          localStorage.setItem('gy_accounts_store', JSON.stringify(accountsMap));
        }

        // Proceed with login success for new registration
        onLoginSuccess(data.user, [], [], data.schemaCacheStale, true);
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: finalPhone, password: cleanPassword }),
        });

        const data = await res.json();

        // RESILIENT RECOVERY: If the server database was reset or couldn't find the phone
        if (!res.ok) {
          if (typeof window !== 'undefined') {
            const accountsMap = JSON.parse(localStorage.getItem('gy_accounts_store') || '{}');
            let localAccount = accountsMap[finalPhone] || accountsMap[rawDigits];
            if (!localAccount && rawDigits.length >= 8) {
              const suffix = rawDigits.slice(-8);
              localAccount = accountsMap[suffix];
              if (!localAccount) {
                const keys = Object.keys(accountsMap);
                const foundKey = keys.find(k => k.endsWith(suffix) || suffix.endsWith(k.slice(-8)));
                if (foundKey) localAccount = accountsMap[foundKey];
              }
            }

            if (!localAccount) {
              const lastAccStr = localStorage.getItem('gy_last_user_account');
              if (lastAccStr) {
                try {
                  const lastAcc = JSON.parse(lastAccStr);
                  const lastDigits = (lastAcc.phone || '').replace(/\D+/g, '');
                  if (lastDigits.endsWith(rawDigits.slice(-8)) || rawDigits.endsWith(lastDigits.slice(-8))) {
                    localAccount = lastAcc;
                  }
                } catch {}
              }
            }

            if (!localAccount) {
              const savedName = localStorage.getItem(`gy_${finalPhone}_name`) || 
                                localStorage.getItem(`gy_${rawDigits}_name`) ||
                                (rawDigits.length >= 8 ? localStorage.getItem(`gy_+225${rawDigits.slice(-8)}_name`) : null) ||
                                (rawDigits.length >= 8 ? localStorage.getItem(`gy_+2250${rawDigits.slice(-8)}_name`) : null);
              if (savedName) {
                localAccount = {
                  phone: finalPhone,
                  name: savedName,
                  password: cleanPassword,
                  inviteCode: localStorage.getItem(`gy_${finalPhone}_invite`) || 'GOLDYIELD',
                  balance: parseInt(localStorage.getItem(`gy_${finalPhone}_balance`) || '1000')
                };
              }
            }

            // If account was found on this device and password matches (or was saved)
            if (localAccount && (localAccount.password === cleanPassword || !localAccount.password)) {
              try {
                // Auto-register / re-sync with server to restore database entry
                const regRes = await fetch('/api/auth/register', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    phone: localAccount.phone || finalPhone,
                    name: localAccount.name || 'Investisseur Gold',
                    password: cleanPassword,
                    inviteCode: localAccount.inviteCode || 'GOLDYIELD',
                    balance: localAccount.balance || 1000
                  })
                });
                const regData = await regRes.json();
                if (regRes.ok && regData.user) {
                  localStorage.setItem('gy_last_phone', finalPhone);
                  onLoginSuccess(regData.user, [], [], false, false);
                  return;
                }
              } catch {
                // Fallback local recovery
                localStorage.setItem('gy_last_phone', finalPhone);
                onLoginSuccess({
                  phone: localAccount.phone || finalPhone,
                  name: localAccount.name || 'Investisseur Gold',
                  inviteCode: localAccount.inviteCode || 'GOLDYIELD',
                  balance: localAccount.balance || 1000,
                  claimableSum: 0,
                  lastTickTime: Date.now()
                }, [], [], false, false);
                return;
              }
            }
          }

          throw new Error(data.error || 'Erreur de connexion.');
        }

        // On successful login, save credentials locally for guaranteed future resilience
        if (typeof window !== 'undefined') {
          const accountInfo = {
            phone: data.user.phone || finalPhone,
            name: data.user.name,
            password: cleanPassword,
            inviteCode: data.user.inviteCode || 'GOLDYIELD',
            balance: data.user.balance !== undefined ? data.user.balance : 1000
          };
          localStorage.setItem('gy_last_phone', finalPhone);
          localStorage.setItem('gy_last_user_account', JSON.stringify(accountInfo));
          const accountsMap = JSON.parse(localStorage.getItem('gy_accounts_store') || '{}');
          accountsMap[finalPhone] = accountInfo;
          accountsMap[rawDigits] = accountInfo;
          if (rawDigits.length >= 8) {
            accountsMap[rawDigits.slice(-8)] = accountInfo;
          }
          localStorage.setItem('gy_accounts_store', JSON.stringify(accountsMap));
        }

        // Proceed with login success for existing user login
        onLoginSuccess(data.user, data.activeInvestments || [], data.transactions || [], data.schemaCacheStale, false);
      }
    } catch (err: any) {
      const rawMsg = err?.message || '';
      if (rawMsg.includes('fetch failed') || rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError') || rawMsg.includes('TypeError')) {
        setError('Impossible de joindre le serveur. Veuillez vérifier votre connexion internet ou réessayer dans un instant.');
      } else {
        setError(rawMsg || 'Une erreur de connexion au serveur s\'est produite.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Gold Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-yellow-500/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-gold-500/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(212,175,55,0.08)] relative z-10 overflow-hidden"
      >
        {/* Banner image related to site for proof & credibility */}
        <div className="-mx-8 -mt-8 mb-6 h-40 overflow-hidden relative border-b border-gold-500/20">
          <img
            src={imgRefinery}
            alt="Raffinerie d'or certifiée"
            className="w-full h-full object-cover brightness-95"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          <span className="absolute bottom-3 left-4 text-[9px] bg-gold-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg font-mono flex items-center gap-1 shadow-md">
            <Shield className="w-3 h-3" /> RAFFINERIE PARTENAIRE CERTIFIÉE
          </span>

          {onOpenVideoAd && (
            <button
              type="button"
              onClick={onOpenVideoAd}
              className="absolute bottom-2.5 right-4 bg-slate-950/90 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer group"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                <Play className="w-2 h-2 fill-slate-950 ml-0.5" />
              </div>
              <span>Pub Vidéo</span>
              <span className="text-[8px] font-mono bg-red-600 text-white px-1 rounded font-black animate-pulse">HD</span>
            </button>
          )}
        </div>

        {/* App Logo & Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 p-0.5 shadow-lg shadow-gold-500/15 mb-4"
          >
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Coins className="w-8 h-8 text-gold-400" />
            </div>
          </motion.div>

          <h1 id="auth-title" className="text-3xl font-bold font-display tracking-tight text-white mb-2">
            {isSignUp ? 'Créer un compte' : 'Gold Yield'}
          </h1>
          <p id="auth-subtitle" className="text-slate-400 text-sm">
            {isSignUp ? 'Rejoignez Gold Yield dès aujourd’hui et investissez malin' : 'Connectez-vous pour gérer vos investissements dans l’or'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3 mb-5 flex items-center gap-2"
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (Sign Up only) */}
          {isSignUp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1"
            >
              <label className="text-xs font-semibold text-slate-300 block">Nom Complet</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ex: Jean Dupont"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-gold-500/50 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                />
              </div>
            </motion.div>
          )}

          {/* Phone Number / Account with Country Code Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Numéro de Téléphone</label>
            <div className="flex gap-2">
              {/* Country select */}
              <div className="relative shrink-0 w-36">
                <select
                  value={countryDial}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full h-full pl-2.5 pr-6 py-3 bg-slate-950/70 border border-slate-800 focus:border-gold-500/50 rounded-xl text-xs text-white outline-none transition-all cursor-pointer appearance-none truncate"
                  title="Choisir votre pays / indicatif"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.dial} className="bg-slate-900 text-white text-xs">
                      {c.flag} {c.dial} ({c.name})
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                  ▼
                </div>
              </div>

              {/* Main Phone Input */}
              <div className="relative flex-1">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  placeholder="Ex: 0102030405 ou +..."
                  value={phone}
                  onChange={(e) => handlePhoneInputChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-gold-500/50 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                  required
                />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
              <span>🌍</span> <span>Accès mondial : tous les pays sont pris en charge.</span>
            </span>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-gold-500/50 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Invitation Code (Sign Up only) */}
          {isSignUp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1"
              id="invitation-group"
            >
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 block">Code de Parrainage (Optionnel)</label>
                <span className="text-[10px] text-gold-400 flex items-center gap-1">
                  <Gift className="w-3 h-3" /> +1 000 FCFA Bonus
                </span>
              </div>
              <div className="relative">
                <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ex: GOLDYIELD"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-gold-500/50 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                />
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={loading ? {} : { scale: 1.01 }}
            whileTap={loading ? {} : { scale: 0.99 }}
            type="submit"
            id="submit-btn"
            disabled={loading}
            className={`w-full py-3.5 px-4 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-gold-500/10 hover:shadow-gold-500/20 transition-all mt-6 ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {loading ? "Traitement..." : (isSignUp ? "S'inscrire" : "Se connecter")}
          </motion.button>
        </form>

        {/* Auth Toggle */}
        <div className="text-center mt-6">
          <button
            onClick={handleToggle}
            id="toggle-btn"
            className="text-xs text-slate-400 hover:text-gold-400 transition-colors duration-150 cursor-pointer underline underline-offset-4"
          >
            {isSignUp ? 'Déjà inscrit ? Se connecter' : 'Pas de compte ? S’inscrire'}
          </button>
        </div>

        {/* Security / Trust Note */}
        <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-slate-800/60 text-[10px] text-slate-500">
          <Shield className="w-3.5 h-3.5 text-gold-500/40" />
          <span>Plateforme cryptée et investissements sécurisés</span>
        </div>
      </motion.div>
    </div>
  );
}
