import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, DollarSign, Save, RefreshCw, CheckCircle2, ArrowRightLeft, TrendingUp, AlertCircle, MapPin } from 'lucide-react';

// --- Constants ---
const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD',
  'THB', 'PHP', 'SGD', 'MYR', 'IDR', 'VND', 'INR', 'TWD', 'KRW', 'AED'
];

const MULTIPLIERS = [12, 13, 14, 15];
const STANDARD_FEE_OPTIONS = [0.18, 0.20, 0.23, 0.25, 0.30, 'custom'];
const JAPAN_FEE_OPTIONS = [0.25, 0.30, 0.35, 'custom'];

const BILLING_TYPES = [
  { label: '360 (Full)', value: 1 },
  { label: 'Split 50/50', value: 0.5 }
];

export default function App() {
  // --- State ---
  const [inputs, setInputs] = useState({
    origCurrency: 'THB',
    monthlySalary: '',
    multiplier: 12,
    additionalCash: '',
    signupBonus: '',
    feePercent: 0.23,
    customFee: '',
    billingType: 1,
    isJapanPartner: false,
    target1: 'HKD',
    target2: 'USD',
    target3: 'PHP'
  });

  const [rates, setRates] = useState({});
  const [loadingRates, setLoadingRates] = useState(false);
  const [rateError, setRateError] = useState(null);
  const [savingStatus, setSavingStatus] = useState('idle');

  // --- Forex State ---
  const [forex, setForex] = useState({
    amount: '10,000',
    baseCurrency: 'USD',
    target1: 'EUR',
    target2: 'GBP',
    target3: 'JPY'
  });
  const [forexRates, setForexRates] = useState({});
  const [loadingForexRates, setLoadingForexRates] = useState(false);
  const [forexLastUpdate, setForexLastUpdate] = useState('');

  // Generate random raining elements once
  const rainElements = useMemo(() => {
    const symbolData = [
      { sym: '$', color: '#15803d' }, // Green
      { sym: '¥', color: '#b91c1c' }, // Red
      { sym: '€', color: '#1d4ed8' }, // Blue
      { sym: '£', color: '#7e22ce' }, // Purple
      { sym: '₱', color: '#c2410c' }, // Orange
      { sym: '₩', color: '#0f766e' }, // Teal
      { sym: '฿', color: '#be185d' }, // Pink
    ];
    return Array.from({ length: 40 }).map((_, i) => {
      const data = symbolData[Math.floor(Math.random() * symbolData.length)];
      return {
        id: i,
        symbol: data.sym,
        color: data.color,
        left: `${Math.random() * 100}%`,
        animationDuration: `${15 + Math.random() * 20}s`,
        animationDelay: `-${Math.random() * 20}s`,
        fontSize: `${1 + Math.random() * 1.5}rem`,
        opacity: 0.15 + Math.random() * 0.20,
      };
    });
  }, []);

  // --- Effects ---
  useEffect(() => {
    fetchRates(inputs.origCurrency);
  }, [inputs.origCurrency]);

  useEffect(() => {
    fetchForexRates(forex.baseCurrency);
  }, [forex.baseCurrency]);

  useEffect(() => {
    // Inject keyframes for raining animation
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fall {
        0% { transform: translateY(-10vh) rotate(0deg); }
        100% { transform: translateY(110vh) rotate(360deg); }
      }
      .money-rain {
        position: absolute;
        top: -10%;
        animation-name: fall;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
        user-select: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const fetchRates = async (baseCurrency) => {
    setLoadingRates(true);
    setRateError(null);
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      if (!response.ok) throw new Error('Failed to fetch rates');
      const data = await response.json();
      setRates(data.rates);
    } catch (err) {
      console.error("Error fetching rates:", err);
      setRateError("Could not load live rates. Using 1:1 fallback.");
      setRates({});
    } finally {
      setLoadingRates(false);
    }
  };

  const fetchForexRates = async (baseCurrency) => {
    setLoadingForexRates(true);
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      if (response.ok) {
        const data = await response.json();
        setForexRates(data.rates);
        
        if (data.time_last_update_utc) {
          const updateTime = new Date(data.time_last_update_utc);
          setForexLastUpdate(updateTime.toLocaleString([], { 
            month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit'
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching forex rates:", err);
    } finally {
      setLoadingForexRates(false);
    }
  };

  // --- Handlers & Formatting ---
  const formatInputNumber = (val) => {
    if (!val) return '';
    const clean = val.toString().replace(/[^0-9]/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('en-US').format(parseInt(clean, 10));
  };

  const parseInputNumber = (val) => {
    if (!val) return 0;
    return parseInt(val.toString().replace(/,/g, ''), 10) || 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setInputs(prev => {
      const newInputs = { ...prev };
      
      if (type === 'checkbox') {
        newInputs[name] = checked;
        if (name === 'isJapanPartner') {
          const validOptions = checked ? JAPAN_FEE_OPTIONS : STANDARD_FEE_OPTIONS;
          if (!validOptions.includes(prev.feePercent) && prev.feePercent !== 'custom') {
            newInputs.feePercent = validOptions[0];
          }
          if (checked) {
            newInputs.origCurrency = 'JPY';
          }
        }
      } else if (['monthlySalary', 'additionalCash', 'signupBonus'].includes(name)) {
        newInputs[name] = formatInputNumber(value);
      } else if (name === 'customFee') {
        newInputs[name] = value.replace(/[^0-9.]/g, '');
      } else if (name === 'feePercent') {
        const parsedValue = value === 'custom' ? 'custom' : parseFloat(value);
        newInputs[name] = parsedValue;
      } else {
        newInputs[name] = value;
      }
      
      return newInputs;
    });
  };

  const handleForexChange = (e) => {
    const { name, value } = e.target;
    setForex(prev => ({
      ...prev,
      [name]: name === 'amount' ? formatInputNumber(value) : value
    }));
  };

  const handleReset = () => {
    setInputs({
      origCurrency: 'THB',
      monthlySalary: '',
      multiplier: 12,
      additionalCash: '',
      signupBonus: '',
      feePercent: 0.23,
      customFee: '',
      billingType: 1,
      isJapanPartner: false,
      target1: 'HKD',
      target2: 'USD',
      target3: 'PHP'
    });
    setSavingStatus('idle');
  };

  // --- Calculations ---
  const numMonthly = parseInputNumber(inputs.monthlySalary);
  const numAdditional = parseInputNumber(inputs.additionalCash);
  const numSignup = parseInputNumber(inputs.signupBonus);

  const effectiveMultiplier = inputs.isJapanPartner ? 1 : inputs.multiplier;
  const annualBaseSalary = numMonthly * effectiveMultiplier;
  const totalBillableSalary = annualBaseSalary + numAdditional + numSignup;
  
  const actualFeePercent = inputs.feePercent === 'custom' 
    ? (parseFloat(inputs.customFee) / 100 || 0) 
    : parseFloat(inputs.feePercent);

  const baseGrossFee = totalBillableSalary * actualFeePercent;
  
  // Japan Partner Logic
  let partnerDeduction = 0;
  if (inputs.isJapanPartner) {
    const rawDeduction = baseGrossFee * 0.10;
    const jpyRate = rates['JPY'] || 1; 
    const capInOriginalCurrency = 400000 / jpyRate;
    partnerDeduction = Math.min(rawDeduction, capInOriginalCurrency);
  }

  const grossFeeAfterDeduction = baseGrossFee - partnerDeduction;
  const finalBilledFee = grossFeeAfterDeduction * inputs.billingType;

  const getConvertedAmount = (amount, targetCurrency) => {
    if (inputs.origCurrency === targetCurrency) return amount;
    const rate = rates[targetCurrency] || 1; 
    return amount * rate;
  };

  const getRateForDisplay = (targetCurrency) => {
    if (inputs.origCurrency === targetCurrency) return 1;
    return rates[targetCurrency] || 0;
  };

  const formatMoney = (amount, currency = inputs.origCurrency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const currentFeeOptions = inputs.isJapanPartner ? JAPAN_FEE_OPTIONS : STANDARD_FEE_OPTIONS;

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-pink-50 to-blue-50 text-slate-800 font-sans pb-12">
      
      {/* Animated Raining Cash Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {rainElements.map(el => (
          <div 
            key={el.id} 
            className="money-rain font-extrabold"
            style={{
              left: el.left,
              color: el.color,
              animationDuration: el.animationDuration,
              animationDelay: el.animationDelay,
              fontSize: el.fontSize,
              opacity: el.opacity
            }}
          >
            {el.symbol}
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-pink-400 to-blue-500 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Calculator size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-pink-600">
                Recruitment Billing Calculator
              </h1>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3 w-full md:w-auto">
            <button 
              onClick={handleReset}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm font-medium"
            >
              <RefreshCw size={18} />
              Reset
            </button>
            <button 
              onClick={() => {
                setSavingStatus('saving');
                setTimeout(() => {
                  setSavingStatus('success');
                  setTimeout(() => setSavingStatus('idle'), 3000);
                }, 1500);
              }}
              disabled={savingStatus === 'saving'}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-pink-500 text-white rounded-lg hover:from-blue-700 hover:to-pink-600 transition-all shadow-md shadow-blue-500/20 disabled:opacity-70 font-medium"
            >
              {savingStatus === 'saving' ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : savingStatus === 'success' ? (
                <CheckCircle2 size={18} />
              ) : (
                <Save size={18} />
              )}
              {savingStatus === 'saving' ? 'Saving...' : savingStatus === 'success' ? 'Saved!' : 'Save to Sheet'}
            </button>
          </div>
        </header>

        {rateError && (
          <div className="bg-amber-50/90 backdrop-blur-sm border border-amber-200 text-amber-700 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{rateError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: INPUTS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Japan Partner Toggle */}
            <div className={`p-4 rounded-2xl shadow-sm border transition-all duration-300 flex items-center justify-between ${inputs.isJapanPartner ? 'bg-pink-50/90 border-pink-200 backdrop-blur-md' : 'bg-white/80 border-slate-100 backdrop-blur-md'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${inputs.isJapanPartner ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Japan Partner Billing (R&R Ltd)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Applies 10% deduction (max 400k JPY) to billable fee.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="isJapanPartner" 
                  checked={inputs.isJapanPartner} 
                  onChange={handleInputChange} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>

            {/* Section 1: Salary Inputs */}
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/40">
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-800">
                <DollarSign size={20} className="text-blue-500"/> 
                Salary Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Original Currency</label>
                  <select 
                    name="origCurrency" 
                    value={inputs.origCurrency} 
                    onChange={handleInputChange}
                    disabled={inputs.isJapanPartner}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition-all font-bold ${inputs.isJapanPartner ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-50/50 border-blue-100 text-blue-900 focus:border-blue-400'}`}
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Annual Multiplier</label>
                  <select 
                    name="multiplier" 
                    value={inputs.isJapanPartner ? 1 : inputs.multiplier} 
                    onChange={handleInputChange}
                    disabled={inputs.isJapanPartner}
                    className={`w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition-all text-slate-700 ${inputs.isJapanPartner ? 'bg-slate-100 opacity-60 cursor-not-allowed' : 'bg-slate-50'}`}
                  >
                    {inputs.isJapanPartner ? (
                      <option value={1}>N/A (Annualized)</option>
                    ) : (
                      MULTIPLIERS.map(m => <option key={m} value={m}>x{m} months</option>)
                    )}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-600 flex justify-between">
                    {inputs.isJapanPartner ? 'Annual Base Salary' : 'Monthly Base Salary'}
                    <span className="font-normal text-slate-400">Required</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{inputs.origCurrency}</span>
                    <input 
                      type="text" 
                      name="monthlySalary" 
                      value={inputs.monthlySalary} 
                      onChange={handleInputChange}
                      placeholder={inputs.isJapanPartner ? "e.g. 10,000,000" : "e.g. 100,000"}
                      className="w-full pl-14 p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition-all font-bold text-lg shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Additional Cash Billable</label>
                  <input 
                    type="text" 
                    name="additionalCash" 
                    value={inputs.additionalCash} 
                    onChange={handleInputChange}
                    placeholder="Optional"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Sign-up Bonus</label>
                  <input 
                    type="text" 
                    name="signupBonus" 
                    value={inputs.signupBonus} 
                    onChange={handleInputChange}
                    placeholder="Optional"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Fee Structure */}
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/40">
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-800">
                <TrendingUp size={20} className="text-pink-500"/> 
                Fee Structure
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Recruitment Fee %</label>
                  <div className="flex gap-2">
                    <select 
                      name="feePercent" 
                      value={inputs.feePercent} 
                      onChange={handleInputChange}
                      className="flex-1 p-3 bg-pink-50/50 border border-pink-100 rounded-lg focus:ring-2 focus:ring-pink-400 outline-none transition-all font-bold text-pink-900"
                    >
                      {currentFeeOptions.map(f => (
                        <option key={f} value={f}>
                          {f === 'custom' ? 'Custom %' : `${(f * 100).toFixed(0)}%`}
                        </option>
                      ))}
                    </select>
                    
                    {inputs.feePercent === 'custom' && (
                      <div className="relative w-24">
                        <input 
                          type="text" 
                          name="customFee" 
                          value={inputs.customFee} 
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-full p-3 pr-8 bg-white border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-400 outline-none font-bold text-pink-900 shadow-inner"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-400 font-bold">%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Billing Type</label>
                  <select 
                    name="billingType" 
                    value={inputs.billingType} 
                    onChange={handleInputChange}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition-all text-slate-700 font-medium"
                  >
                    {BILLING_TYPES.map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: OUTPUTS & CONVERSIONS */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Primary Calculation Results */}
            <div className="bg-slate-900/95 backdrop-blur-xl p-6 rounded-2xl shadow-xl text-white border border-slate-800">
              <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-5 flex items-center gap-2">
                Total Billable Summary
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-700/50 pb-3">
                  <span className="text-slate-300 text-sm">Total Billable Salary</span>
                  <span className="text-xl font-medium">{formatMoney(totalBillableSalary)}</span>
                </div>
                
                <div className="flex justify-between items-end border-b border-slate-700/50 pb-3">
                  <span className="text-slate-300 text-sm">Gross Fee Base</span>
                  <span className="text-xl font-medium">{formatMoney(baseGrossFee)}</span>
                </div>

                {inputs.isJapanPartner && (
                  <div className="flex justify-between items-end border-b border-pink-900/50 pb-3">
                    <span className="text-pink-300 text-sm flex flex-col">
                      Partner Deduction
                      <span className="text-[10px] text-pink-400/70">10% of Fee (Max 400k JPY)</span>
                    </span>
                    <span className="text-lg font-medium text-pink-400">-{formatMoney(partnerDeduction)}</span>
                  </div>
                )}

                <div className="flex justify-between items-end pt-3">
                  <span className="text-slate-200 font-medium">
                    Final Billing <br/>
                    <span className="text-xs text-blue-300 font-normal">
                      ({inputs.billingType === 1 ? '360 Full' : 'Split'})
                    </span>
                  </span>
                  <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-400">
                    {formatMoney(finalBilledFee)}
                  </span>
                </div>
              </div>
            </div>

            {/* Currency Conversions */}
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/40">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <ArrowRightLeft size={20} className="text-indigo-500"/> 
                  Live Conversions
                </h2>
                {loadingRates && <RefreshCw size={16} className="text-blue-500 animate-spin" />}
              </div>

              <div className="space-y-4">
                <ConversionRow 
                  name="target1" 
                  val={inputs.target1} 
                  amount={getConvertedAmount(finalBilledFee, inputs.target1)} 
                  rate={getRateForDisplay(inputs.target1)}
                  onChange={handleInputChange} 
                />
                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                <ConversionRow 
                  name="target2" 
                  val={inputs.target2} 
                  amount={getConvertedAmount(finalBilledFee, inputs.target2)} 
                  rate={getRateForDisplay(inputs.target2)}
                  onChange={handleInputChange} 
                />
                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                <ConversionRow 
                  name="target3" 
                  val={inputs.target3} 
                  amount={getConvertedAmount(finalBilledFee, inputs.target3)} 
                  rate={getRateForDisplay(inputs.target3)}
                  onChange={handleInputChange} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* RAS CHEQUE */}
        <div className="mt-8 relative bg-white/80 backdrop-blur-md rounded-2xl p-6 md:p-10 shadow-sm border border-slate-200 overflow-hidden text-slate-800 font-sans">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(45deg, #64748b 0, #64748b 1px, transparent 1px, transparent 12px), repeating-linear-gradient(-45deg, #64748b 0, #64748b 1px, transparent 1px, transparent 12px)` }}></div>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-pink-500"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-5xl font-black tracking-tighter text-slate-800">RAS</span>
                  <div className="w-1.5 h-10 bg-pink-500"></div>
                  <span className="text-sm font-bold leading-tight tracking-widest text-slate-500 ml-1">CURRENCY<br/>CONVERTER</span>
                </div>
                <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 to-pink-500 mt-1.5"></div>
              </div>
              <div className="flex flex-col items-end w-full md:w-auto">
                <div className="text-xs font-bold text-slate-400 mb-1 tracking-widest">DATE</div>
                <div className="border-b border-slate-300 pb-1 px-4 min-w-[200px] text-center font-medium flex items-center justify-center gap-2 text-slate-700">{forexLastUpdate || 'Live Rate'}</div>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-6 items-end mb-6">
              <div className="flex-1 w-full"><div className="flex items-end gap-3"><span className="text-xs font-bold whitespace-nowrap text-slate-500 uppercase leading-tight">Pay to the<br/>order of</span><div className="flex-1 border-b border-slate-300 h-8"></div></div></div>
              <div className="flex items-center gap-2 border border-slate-300 p-2 bg-slate-50/50 rounded-xl shadow-inner w-full lg:w-auto">
                <select name="baseCurrency" value={forex.baseCurrency} onChange={handleForexChange} className="bg-transparent text-slate-800 font-black outline-none text-xl">{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <input type="text" name="amount" value={forex.amount} onChange={handleForexChange} className="bg-transparent text-3xl font-black outline-none w-full md:w-48 text-right text-slate-800" />
              </div>
            </div>
            <div className="flex-1 border-b border-slate-300 pb-1 mb-10 italic text-slate-500/80 text-center text-sm">** Exact amount based on live market exchange rates **</div>
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-6">
              <div className="flex-1 w-full border border-slate-200 rounded-xl p-4 bg-white shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[1, 2, 3].map(num => {
                  const targetKey = `target${num}`;
                  const targetCurrency = forex[targetKey];
                  const rate = forexRates[targetCurrency] || 0;
                  return (
                    <div key={num} className="border-b border-dashed border-slate-200 pb-1 flex flex-col">
                      <div className="flex justify-between items-center mb-1"><select name={targetKey} value={targetCurrency} onChange={handleForexChange} className="bg-transparent font-bold text-sm">{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select><span className="text-[9px] font-bold text-slate-400 tracking-wider">Rate: {rate ? rate.toFixed(4) : '...'}</span></div>
                      <div className="text-xl font-black text-slate-800">{formatNumber(parseInputNumber(forex.amount) * rate)}</div>
                    </div>
                  );
                })}
              </div>
              <div className="w-56 md:w-72 flex flex-col items-center"><div className="border-b border-slate-400 w-full h-10 flex items-end justify-center font-serif text-3xl italic text-slate-700/80 transform translate-y-1">Elon Musk</div><span className="text-[9px] mt-1 font-bold text-slate-400 uppercase tracking-widest">Authorized Signature</span></div>
            </div>
            <div className="font-mono text-lg tracking-[0.4em] text-slate-300 mt-8 flex justify-center">⑆ 01020000 ⑈ 1234567890 ⑆ 0011 ⑈</div>
          </div>
        </div>
      </div>
    </div>
  );

  function ConversionRow({ name, val, amount, rate, onChange }) {
    return (
      <div className="flex items-center justify-between gap-4 group hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors">
        <div className="flex-1">
          <select name={name} value={val} onChange={onChange} className="w-24 p-1.5 bg-slate-100 border border-slate-200 rounded-md text-sm font-bold text-slate-700 outline-none">{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <div className="text-[10px] text-slate-400 mt-1.5 font-medium">RATE: {rate ? rate.toFixed(6) : '...'}</div>
        </div>
        <div className="text-right"><div className="text-xl font-bold text-slate-800 tracking-tight"><span className="text-sm font-normal text-slate-400 mr-1">{val}</span>{formatNumber(amount)}</div></div>
      </div>
    );
  }
}
