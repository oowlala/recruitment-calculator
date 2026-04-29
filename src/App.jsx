import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, DollarSign, Save, RefreshCw, CheckCircle2, ArrowRightLeft, TrendingUp, MapPin, ChevronDown } from 'lucide-react';

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
  const [savingStatus, setSavingStatus] = useState('idle');

  const [forex, setForex] = useState({
    amount: '10,000',
    baseCurrency: 'USD',
    target1: 'EUR',
    target2: 'GBP',
    target3: 'JPY'
  });
  const [forexRates, setForexRates] = useState({});
  const [forexLastUpdate, setForexLastUpdate] = useState('');

  const rainElements = useMemo(() => {
    const symbolData = [
      { sym: '$', color: '#15803d' }, { sym: '¥', color: '#b91c1c' }, 
      { sym: '€', color: '#1d4ed8' }, { sym: '£', color: '#7e22ce' }, 
      { sym: '₱', color: '#c2410c' }, { sym: '₩', color: '#0f766e' }, { sym: '฿', color: '#be185d' },
    ];
    return Array.from({ length: 30 }).map((_, i) => {
      const data = symbolData[Math.floor(Math.random() * symbolData.length)];
      return {
        id: i, symbol: data.sym, color: data.color, left: `${Math.random() * 100}%`,
        animationDuration: `${15 + Math.random() * 20}s`, animationDelay: `-${Math.random() * 20}s`,
        fontSize: `${1 + Math.random() * 1.5}rem`, opacity: 0.1,
      };
    });
  }, []);

  useEffect(() => { fetchRates(inputs.origCurrency); }, [inputs.origCurrency]);
  useEffect(() => { fetchForexRates(forex.baseCurrency); }, [forex.baseCurrency]);

  const fetchRates = async (baseCurrency) => {
    setLoadingRates(true);
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      const data = await response.json();
      setRates(data.rates);
    } catch (err) { console.error(err); } finally { setLoadingRates(false); }
  };

  const fetchForexRates = async (baseCurrency) => {
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      const data = await response.json();
      setForexRates(data.rates);
      if (data.time_last_update_utc) {
        setForexLastUpdate(new Date(data.time_last_update_utc).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) { console.error(err); }
  };

  const formatInputNumber = (val) => {
    if (!val) return '';
    const clean = val.toString().replace(/[^0-9]/g, '');
    return clean ? new Intl.NumberFormat('en-US').format(parseInt(clean, 10)) : '';
  };

  const parseInputNumber = (val) => val ? parseInt(val.toString().replace(/,/g, ''), 10) || 0 : 0;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInputs(prev => {
      const newInputs = { ...prev };
      if (type === 'checkbox') {
        newInputs[name] = checked;
        if (name === 'isJapanPartner') {
          if (checked) newInputs.origCurrency = 'JPY';
          const validOptions = checked ? JAPAN_FEE_OPTIONS : STANDARD_FEE_OPTIONS;
          if (!validOptions.includes(prev.feePercent) && prev.feePercent !== 'custom') newInputs.feePercent = validOptions[0];
        }
      } else if (['monthlySalary', 'additionalCash', 'signupBonus'].includes(name)) {
        newInputs[name] = formatInputNumber(value);
      } else if (name === 'customFee') {
        newInputs[name] = value.replace(/[^0-9.]/g, '');
      } else if (name === 'feePercent') {
        newInputs[name] = value === 'custom' ? 'custom' : parseFloat(value);
      } else {
        newInputs[name] = value;
      }
      return newInputs;
    });
  };

  const handleForexChange = (e) => {
    const { name, value } = e.target;
    setForex(prev => ({ ...prev, [name]: name === 'amount' ? formatInputNumber(value) : value }));
  };

  const numMonthly = parseInputNumber(inputs.monthlySalary);
  const numAdditional = parseInputNumber(inputs.additionalCash);
  const numSignup = parseInputNumber(inputs.signupBonus);
  const effectiveMultiplier = inputs.isJapanPartner ? 1 : inputs.multiplier;
  const totalBillableSalary = (numMonthly * effectiveMultiplier) + numAdditional + numSignup;
  const actualFeePercent = inputs.feePercent === 'custom' ? (parseFloat(inputs.customFee) / 100 || 0) : parseFloat(inputs.feePercent);
  const baseGrossFee = totalBillableSalary * actualFeePercent;
  
  let partnerDeduction = 0;
  if (inputs.isJapanPartner) {
    const jpyRate = rates['JPY'] || 1; 
    partnerDeduction = Math.min(baseGrossFee * 0.10, 400000 / jpyRate);
  }

  const finalBilledFee = (baseGrossFee - partnerDeduction) * inputs.billingType;

  const formatMoney = (amount, currency = inputs.origCurrency) => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
  const formatNumber = (amount) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);

  return (
    <div className="min-h-screen bg-[#f8faff] text-slate-800 font-sans pb-12 relative overflow-x-hidden">
      <style>{`
        @keyframes fall { 0% { transform: translateY(-10vh) rotate(0deg); } 100% { transform: translateY(110vh) rotate(360deg); } }
        .money-rain { position: absolute; top: -10%; animation-name: fall; animation-timing-function: linear; animation-iteration-count: infinite; user-select: none; }
        select { appearance: none; }
      `}</style>

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {rainElements.map(el => (
          <div key={el.id} className="money-rain font-extrabold" style={{ left: el.left, color: el.color, animationDuration: el.animationDuration, animationDelay: el.animationDelay, fontSize: el.fontSize, opacity: el.opacity }}>{el.symbol}</div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#a855f7] rounded-2xl text-white shadow-lg shadow-purple-200">
              <Calculator size={28} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#1e293b]">Recruitment Billing Calculator</h1>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3 w-full md:w-auto">
            <button onClick={() => setInputs({ origCurrency: 'THB', monthlySalary: '', multiplier: 12, additionalCash: '', signupBonus: '', feePercent: 0.23, customFee: '', billingType: 1, isJapanPartner: false, target1: 'HKD', target2: 'USD', target3: 'PHP' })} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm">
              <RefreshCw size={18} /> Reset
            </button>
            <button onClick={() => { setSavingStatus('saving'); setTimeout(() => setSavingStatus('success'), 1200); setTimeout(() => setSavingStatus('idle'), 3500); }} disabled={savingStatus === 'saving'} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#a855f7] text-white rounded-xl shadow-lg shadow-indigo-100 font-bold text-sm transition-all hover:scale-[1.02] active:scale-95">
              {savingStatus === 'saving' ? <RefreshCw size={18} className="animate-spin" /> : savingStatus === 'success' ? <CheckCircle2 size={18} /> : <Save size={18} />}
              {savingStatus === 'saving' ? 'Saving...' : savingStatus === 'success' ? 'Saved!' : 'Save to Sheet'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className={`p-5 rounded-3xl border transition-all ${inputs.isJapanPartner ? 'bg-[#fdf2f8] border-pink-100' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${inputs.isJapanPartner ? 'bg-pink-500 text-white shadow-md shadow-pink-100' : 'bg-slate-50 text-slate-400'}`}>
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Japan Partner Billing (R&R Ltd)</h3>
                    <p className="text-[11px] text-slate-500 leading-tight">10% deduction (max 400k JPY) applied to fee.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input type="checkbox" name="isJapanPartner" checked={inputs.isJapanPartner} onChange={handleInputChange} className="sr-only peer" />
                  <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <h2 className="text-sm font-black text-[#4f46e5] uppercase tracking-widest mb-6 flex items-center gap-2"><DollarSign size={18} /> Salary Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Currency</label>
                  <div className="relative">
                    <select name="origCurrency" value={inputs.origCurrency} onChange={handleInputChange} disabled={inputs.isJapanPartner} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none transition-all disabled:opacity-50">
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Multiplier</label>
                  <div className="relative">
                    <select name="multiplier" value={inputs.isJapanPartner ? 1 : inputs.multiplier} onChange={handleInputChange} disabled={inputs.isJapanPartner} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none transition-all disabled:opacity-50">
                      {MULTIPLIERS.map(m => <option key={m} value={m}>x{m} months</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Base Salary</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-indigo-300 transition-colors group-focus-within:text-indigo-500">{inputs.origCurrency}</span>
                    <input type="text" name="monthlySalary" value={inputs.monthlySalary} onChange={handleInputChange} placeholder="Required" className="w-full pl-16 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xl text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-50 shadow-inner outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Additional</label>
                  <input type="text" name="additionalCash" value={inputs.additionalCash} onChange={handleInputChange} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Signup Bonus</label>
                  <input type="text" name="signupBonus" value={inputs.signupBonus} onChange={handleInputChange} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600 outline-none" />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <h2 className="text-sm font-black text-pink-500 uppercase tracking-widest mb-6 flex items-center gap-2"><TrendingUp size={18} /> Fee Structure</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Recruitment Fee %</label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <select name="feePercent" value={inputs.feePercent} onChange={handleInputChange} className="w-full p-3.5 bg-[#fff1f2] border border-pink-50 rounded-2xl font-black text-pink-700 outline-none">
                        {(inputs.isJapanPartner ? JAPAN_FEE_OPTIONS : STANDARD_FEE_OPTIONS).map(f => (
                          <option key={f} value={f}>{f === 'custom' ? 'Custom %' : `${(f * 100).toFixed(0)}%`}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-300 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Billing Type</label>
                  <div className="relative">
                    <select name="billingType" value={inputs.billingType} onChange={handleInputChange} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none">
                      {BILLING_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="bg-[#1e293b] p-8 rounded-[2.5rem] shadow-2xl text-white border border-slate-700 relative overflow-hidden">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Total Summary</h2>
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-slate-700/50 pb-4">
                  <span className="text-slate-400 text-xs font-bold uppercase">Billable Salary</span>
                  <span className="text-xl font-black tracking-tight">{formatMoney(totalBillableSalary)}</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-700/50 pb-4">
                  <span className="text-slate-400 text-xs font-bold uppercase">Gross Fee</span>
                  <span className="text-xl font-black tracking-tight">{formatMoney(baseGrossFee)}</span>
                </div>
                {inputs.isJapanPartner && (
                  <div className="flex justify-between items-end border-b border-pink-900/40 pb-4">
                    <span className="text-pink-400 text-[10px] font-black uppercase">Partner Deduction</span>
                    <span className="text-lg font-black text-pink-400">-{formatMoney(partnerDeduction)}</span>
                  </div>
                )}
                <div className="pt-6 relative">
                  <span className="block text-slate-200 text-sm font-black mb-1">Final Billing</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">({inputs.billingType === 1 ? '360 Full' : 'Split'})</span>
                    <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-pink-300">
                      {formatMoney(finalBilledFee)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative">
              <h2 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-2"><ArrowRightLeft size={18} /> Live Conversions</h2>
              <div className="space-y-6">
                {[1, 2, 3].map(idx => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all group">
                    <div className="relative">
                      <select name={`target${idx}`} value={inputs[`target${idx}`]} onChange={handleInputChange} className="pl-3 pr-8 py-1.5 bg-slate-100 border-none rounded-xl text-xs font-black text-slate-600 outline-none cursor-pointer">
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1">{inputs[`target${idx}`]} Equivalent</span>
                      <div className="text-2xl font-black text-slate-800 tracking-tighter">
                        {formatNumber(finalBilledFee * (rates[inputs[`target${idx}`]] || 0))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-8">
            <div className="flex items-center gap-3">
              <span className="text-6xl font-black text-[#1e293b] tracking-tighter">RAS</span>
              <div className="w-1.5 h-12 bg-pink-500 rounded-full"></div>
              <div className="flex flex-col"><span className="text-xs font-black text-slate-400 tracking-[0.3em] uppercase">Currency</span><span className="text-xs font-black text-slate-400 tracking-[0.3em] uppercase">Converter</span></div>
            </div>
            <div className="flex flex-col items-end"><span className="text-[10px] font-black text-slate-300 uppercase mb-1">DATE</span><div className="border-b-2 border-slate-100 pb-1 px-4 text-sm font-black text-slate-600">{forexLastUpdate || 'LIVE MARKET RATE'}</div></div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-[1.5rem] border border-slate-100 shadow-inner mb-12">
            <div className="relative">
              <select name="baseCurrency" value={forex.baseCurrency} onChange={handleForexChange} className="pl-4 pr-10 py-2 bg-white border-none rounded-xl font-black text-xl text-indigo-600 shadow-sm outline-none">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300" />
            </div>
            <input type="text" name="amount" value={forex.amount} onChange={handleForexChange} className="bg-transparent text-4xl font-black text-right w-full outline-none" placeholder="10,000" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {[1, 2, 3].map(i => {
              const key = `target${i}`;
              const curr = forex[key];
              const rate = forexRates[curr] || 0;
              return (
                <div key={i} className="flex flex-col border-b border-dashed border-slate-200 pb-4">
                  <div className="flex justify-between items-center mb-3">
                    <select name={key} value={curr} onChange={handleForexChange} className="bg-transparent font-black text-slate-500 uppercase tracking-widest outline-none text-sm">{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <span className="text-[10px] font-bold text-slate-300">FX: {rate?.toFixed(4)}</span>
                  </div>
                  <div className="text-3xl font-black text-slate-800 tracking-tighter">{formatNumber(parseInputNumber(forex.amount) * rate)}</div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col items-center">
            <div className="font-serif text-5xl text-slate-700/80 italic mb-2">Elon Musk</div>
            <div className="w-64 h-0.5 bg-slate-200 mb-1"></div>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Authorized Signature</span>
          </div>
        </div>

      </div>
    </div>
  );
}
