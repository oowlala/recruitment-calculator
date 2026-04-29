import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, DollarSign, Save, RefreshCw, CheckCircle2, ArrowRightLeft, TrendingUp, MapPin, ChevronDown } from 'lucide-react';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD', 'THB', 'PHP', 'SGD', 'MYR', 'IDR', 'VND', 'INR', 'TWD', 'KRW', 'AED'];
const MULTIPLIERS = [12, 13, 14, 15];
const STANDARD_FEE_OPTIONS = [0.18, 0.20, 0.23, 0.25, 0.30, 'custom'];
const JAPAN_FEE_OPTIONS = [0.25, 0.30, 0.35, 'custom'];
const BILLING_TYPES = [{ label: '360 (Full)', value: 1 }, { label: 'Split 50/50', value: 0.5 }];

export default function App() {
  const [inputs, setInputs] = useState({
    origCurrency: 'THB', monthlySalary: '', multiplier: 12, additionalCash: '',
    signupBonus: '', feePercent: 0.23, customFee: '', billingType: 1,
    isJapanPartner: false, target1: 'HKD', target2: 'USD', target3: 'PHP'
  });

  const [rates, setRates] = useState({});
  const [savingStatus, setSavingStatus] = useState('idle');
  const [forex, setForex] = useState({ amount: '10,000', baseCurrency: 'USD', target1: 'EUR', target2: 'GBP', target3: 'JPY' });
  const [forexRates, setForexRates] = useState({});
  const [forexLastUpdate, setForexLastUpdate] = useState('');

  const rainElements = useMemo(() => {
    const symbolData = [{ sym: '$', color: '#15803d' }, { sym: '¥', color: '#b91c1c' }, { sym: '€', color: '#1d4ed8' }, { sym: '£', color: '#7e22ce' }, { sym: '฿', color: '#be185d' }];
    return Array.from({ length: 30 }).map((_, i) => {
      const data = symbolData[Math.floor(Math.random() * symbolData.length)];
      return { id: i, symbol: data.sym, color: data.color, left: `${Math.random() * 100}%`, duration: `${15 + Math.random() * 20}s`, delay: `-${Math.random() * 20}s`, size: `${1 + Math.random() * 1.5}rem`, opacity: 0.1 };
    });
  }, []);

  useEffect(() => { fetchRates(inputs.origCurrency); }, [inputs.origCurrency]);
  useEffect(() => { fetchForexRates(forex.baseCurrency); }, [forex.baseCurrency]);

  const fetchRates = async (base) => {
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      const data = await res.json();
      setRates(data.rates || {});
    } catch (e) { console.error(e); }
  };

  const fetchForexRates = async (base) => {
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      const data = await res.json();
      setForexRates(data.rates || {});
      if (data.time_last_update_utc) setForexLastUpdate(new Date(data.time_last_update_utc).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    } catch (e) { console.error(e); }
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
      const next = { ...prev };
      if (type === 'checkbox') {
        next[name] = checked;
        if (name === 'isJapanPartner') {
          if (checked) next.origCurrency = 'JPY';
          const options = checked ? JAPAN_FEE_OPTIONS : STANDARD_FEE_OPTIONS;
          if (!options.includes(prev.feePercent) && prev.feePercent !== 'custom') next.feePercent = options[0];
        }
      } else if (['monthlySalary', 'additionalCash', 'signupBonus'].includes(name)) {
        next[name] = formatInputNumber(value);
      } else {
        next[name] = value;
      }
      return next;
    });
  };

  const handleForexChange = (e) => {
    const { name, value } = e.target;
    setForex(prev => ({ ...prev, [name]: name === 'amount' ? formatInputNumber(value) : value }));
  };

  const numMonthly = parseInputNumber(inputs.monthlySalary);
  const totalSalary = (numMonthly * (inputs.isJapanPartner ? 1 : inputs.multiplier)) + parseInputNumber(inputs.additionalCash) + parseInputNumber(inputs.signupBonus);
  const feePercent = inputs.feePercent === 'custom' ? (parseFloat(inputs.customFee) / 100 || 0) : parseFloat(inputs.feePercent);
  const baseGrossFee = totalSalary * feePercent;
  const deduction = inputs.isJapanPartner ? Math.min(baseGrossFee * 0.10, 400000 / (rates['JPY'] || 1)) : 0;
  const finalFee = (baseGrossFee - deduction) * inputs.billingType;

  const formatMoney = (amount, curr = inputs.origCurrency) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: curr, minimumFractionDigits: 2 }).format(amount);
  
  const formatNumber = (amount) => 
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);

  return (
    <div className="min-h-screen bg-[#f8faff] text-slate-800 font-sans pb-12 relative overflow-x-hidden">
      <style>{`
        @keyframes fall { 0% { transform: translateY(-10vh) rotate(0deg); } 100% { transform: translateY(110vh) rotate(360deg); } }
        .money-rain { position: absolute; top: -10%; animation-name: fall; animation-timing-function: linear; animation-iteration-count: infinite; user-select: none; }
        select { appearance: none; }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {rainElements.map(el => (
          <div key={el.id} className="money-rain font-black" style={{ left: el.left, color: el.color, animationDuration: el.duration, animationDelay: el.delay, fontSize: el.size, opacity: el.opacity }}>{el.symbol}</div>
        ))}
      </div>
      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#a855f7] rounded-2xl text-white shadow-lg shadow-purple-200"><Calculator size={28} /></div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#1e293b]">Recruitment Billing Calculator</h1>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
             <button onClick={() => setInputs({ origCurrency: 'THB', monthlySalary: '', multiplier: 12, additionalCash: '', signupBonus: '', feePercent: 0.23, customFee: '', billingType: 1, isJapanPartner: false, target1: 'HKD', target2: 'USD', target3: 'PHP' })} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"><RefreshCw size={18} /></button>
             <button className="px-8 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#a855f7] text-white rounded-xl shadow-lg font-bold text-sm transition-all hover:scale-[1.02]">Save to Sheet</button>
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className={`p-5 rounded-3xl border transition-all ${inputs.isJapanPartner ? 'bg-[#fdf2f8] border-pink-100' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${inputs.isJapanPartner ? 'bg-pink-500 text-white shadow-md shadow-pink-100' : 'bg-slate-50 text-slate-400'}`}><MapPin size={22} /></div>
                  <div><h3 className="font-bold text-slate-800">Japan Partner Billing (R&R Ltd)</h3><p className="text-[11px] text-slate-500 leading-tight">10% deduction (max 400k JPY) applied to fee.</p></div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input type="checkbox" name="isJapanPartner" checked={inputs.isJapanPartner} onChange={handleInputChange} className="sr-only peer" />
                  <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-sm font-black text-[#4f46e5] uppercase tracking-widest flex items-center gap-2"><DollarSign size={18} /> Salary Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Currency</label>
                   <select name="origCurrency" value={inputs.origCurrency} onChange={handleInputChange} disabled={inputs.isJapanPartner} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none transition-all disabled:opacity-50">
                     {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Multiplier</label>
                   <select name="multiplier" value={inputs.isJapanPartner ? 1 : inputs.multiplier} onChange={handleInputChange} disabled={inputs.isJapanPartner} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none transition-all disabled:opacity-50">
                     {MULTIPLIERS.map(m => <option key={m} value={m}>x{m} months</option>)}
                   </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Base Salary</label>
                   <input type="text" name="monthlySalary" value={inputs.monthlySalary} onChange={handleInputChange} placeholder="Required" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xl text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all" />
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-[#1e293b] p-8 rounded-[2.5rem] shadow-2xl text-white border border-slate-700 relative overflow-hidden">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Total Summary</h2>
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-slate-700/50 pb-4"><span className="text-slate-400 text-xs font-bold uppercase">Gross Fee</span><span className="text-xl font-black tracking-tight">{formatMoney(baseGrossFee)}</span></div>
                <div className="pt-6 relative">
                  <span className="block text-slate-200 text-sm font-black mb-1 text-right">Final Billing</span>
                  <div className="text-5xl font-black text-right text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-pink-300">{formatMoney(finalFee)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-8">
            <div className="flex items-center gap-3"><span className="text-6xl font-black text-[#1e293b] tracking-tighter">RAS</span><div className="w-1.5 h-12 bg-pink-500 rounded-full"></div><div className="flex flex-col uppercase font-black text-slate-400 tracking-[0.3em] text-xs"><span>Currency</span><span>Converter</span></div></div>
            <div className="text-right"><div className="text-sm font-black text-slate-600">{forexLastUpdate || 'LIVE MARKET RATE'}</div></div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-[1.5rem] border border-slate-100 shadow-inner mb-12">
            <select name="baseCurrency" value={forex.baseCurrency} onChange={(e) => setForex({...forex, baseCurrency: e.target.value})} className="pl-4 pr-10 py-2 bg-white border-none rounded-xl font-black text-xl text-indigo-600 shadow-sm outline-none">{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input type="text" value={forex.amount} onChange={(e) => setForex({...forex, amount: formatInputNumber(e.target.value)})} className="bg-transparent text-4xl font-black text-right w-full outline-none" placeholder="0" />
          </div>
          <div className="flex flex-col items-center">
            <div className="font-serif text-5xl text-slate-700/80 italic transform -rotate-1 mb-1 select-none">Elon Musk</div>
            <div className="w-64 h-0.5 bg-slate-200 mb-1"></div>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Authorized Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
}