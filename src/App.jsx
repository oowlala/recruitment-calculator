import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, DollarSign, RefreshCw, MapPin, ChevronDown, TrendingUp, ArrowRightLeft } from 'lucide-react';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD', 'THB', 'PHP', 'SGD', 'MYR', 'IDR', 'VND', 'INR', 'TWD', 'KRW', 'AED'];
const MULTIPLIERS = [12, 13, 14, 15];
const STANDARD_FEE = [0.18, 0.20, 0.23, 0.25, 0.30];
const JAPAN_FEE = [0.25, 0.30, 0.35];

export default function App() {
  const [inputs, setInputs] = useState({
    origCurrency: 'THB', monthlySalary: '', multiplier: 12, additionalCash: '',
    signupBonus: '', feePercent: 0.23, billingType: 1, isJapanPartner: false,
    target1: 'HKD', target2: 'USD', target3: 'PHP'
  });

  const [rates, setRates] = useState({});
  const [forex, setForex] = useState({ amount: '10,000', baseCurrency: 'USD', t1: 'EUR', t2: 'GBP', t3: 'JPY' });
  const [forexRates, setForexRates] = useState({});

  useEffect(() => {
    fetch(`https://open.er-api.com/v6/latest/${inputs.origCurrency}`).then(res => res.json()).then(data => setRates(data.rates || {}));
    fetch(`https://open.er-api.com/v6/latest/${forex.baseCurrency}`).then(res => res.json()).then(data => setForexRates(data.rates || {}));
  }, [inputs.origCurrency, forex.baseCurrency]);

  const parseNum = (val) => parseInt(val.toString().replace(/,/g, ''), 10) || 0;
  const formatInp = (val) => val ? new Intl.NumberFormat('en-US').format(parseInt(val.toString().replace(/[^0-9]/g, ''), 10)) : '';

  const numMonthly = parseNum(inputs.monthlySalary);
  const totalSal = (numMonthly * (inputs.isJapanPartner ? 1 : inputs.multiplier)) + parseNum(inputs.additionalCash) + parseNum(inputs.signupBonus);
  const baseGross = totalSal * inputs.feePercent;
  const deduction = inputs.isJapanPartner ? Math.min(baseGross * 0.10, 400000 / (rates['JPY'] || 1)) : 0;
  const finalFee = (baseGross - deduction) * inputs.billingType;

  return (
    <div className="min-h-screen bg-[#f8faff] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#a855f7] rounded-2xl text-white"><Calculator size={28} /></div>
            <h1 className="text-2xl font-black text-slate-800">Recruitment Billing Calculator</h1>
          </div>
          <button onClick={() => window.location.reload()} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100"><RefreshCw size={20} /></button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className={`p-5 rounded-3xl border transition-all ${inputs.isJapanPartner ? 'bg-pink-50 border-pink-100' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${inputs.isJapanPartner ? 'bg-pink-500 text-white' : 'bg-slate-50 text-slate-400'}`}><MapPin size={22} /></div>
                  <div><h3 className="font-bold text-slate-800">Japan Partner Billing (R&R Ltd)</h3><p className="text-xs text-slate-500">10% deduction applies.</p></div>
                </div>
                <input type="checkbox" checked={inputs.isJapanPartner} onChange={(e) => setInputs({...inputs, isJapanPartner: e.target.checked, origCurrency: e.target.checked ? 'JPY' : inputs.origCurrency})} className="w-6 h-6 accent-indigo-600" />
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-sm font-black text-[#4f46e5] uppercase tracking-widest flex items-center gap-2"><DollarSign size={18} /> Salary Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Currency</label>
                  <select value={inputs.origCurrency} onChange={(e) => setInputs({...inputs, origCurrency: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none">{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Multiplier</label>
                  <select value={inputs.multiplier} onChange={(e) => setInputs({...inputs, multiplier: parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none">{MULTIPLIERS.map(m => <option key={m} value={m}>x{m} months</option>)}</select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Monthly Salary</label>
                  <input type="text" value={inputs.monthlySalary} onChange={(e) => setInputs({...inputs, monthlySalary: formatInp(e.target.value)})} placeholder="Required" className="w-full p-4 bg-slate-50 rounded-xl font-black text-xl border-none outline-none focus:ring-2 focus:ring-indigo-100" />
                </div>
              </div>
            </div>
          </div>

          {/* Navy Summary */}
          <div className="lg:col-span-5">
            <div className="bg-[#1e293b] p-8 rounded-[2.5rem] shadow-2xl text-white border border-slate-700 relative overflow-hidden h-full">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Total Summary</h2>
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-slate-700 pb-4"><span className="text-slate-400 text-xs font-bold uppercase">Base Fee</span><span className="text-xl font-black">{new Intl.NumberFormat('en-US', {style:'currency', currency: inputs.origCurrency}).format(baseGross)}</span></div>
                <div className="pt-6 text-right">
                  <span className="block text-slate-400 text-sm font-black mb-1">Final Billing</span>
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-pink-300">{new Intl.NumberFormat('en-US', {style:'currency', currency: inputs.origCurrency}).format(finalFee)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cheque Footer */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-pink-500"></div>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-6xl font-black text-[#1e293b] tracking-tighter">RAS</span>
            <div className="w-1.5 h-12 bg-pink-500 rounded-full"></div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Currency<br/>Converter</span>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl mb-8">
            <select value={forex.baseCurrency} onChange={(e) => setForex({...forex, baseCurrency: e.target.value})} className="bg-white p-2 rounded-lg font-black text-indigo-600">{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input type="text" value={forex.amount} onChange={(e) => setForex({...forex, amount: formatInp(e.target.value)})} className="bg-transparent text-4xl font-black text-right w-full outline-none" />
          </div>
          <div className="flex flex-col items-center border-t border-slate-100 pt-8">
             <div className="font-serif text-5xl text-slate-700/80 italic transform -rotate-1 mb-2">Elon Musk</div>
             <div className="w-64 h-px bg-slate-200"></div>
             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Authorized Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
}