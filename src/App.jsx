import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, MapPin, RefreshCw } from 'lucide-react';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'THB', 'HKD', 'PHP'];

export default function App() {
  const [inputs, setInputs] = useState({
    monthlySalary: '',
    multiplier: 12,
    feePercent: 0.23,
    isJapanPartner: false,
    origCurrency: 'THB'
  });

  const [rates, setRates] = useState({});

  useEffect(() => {
    fetch(`https://open.er-api.com/v6/latest/${inputs.origCurrency}`)
      .then(res => res.json())
      .then(data => setRates(data.rates || {}))
      .catch(err => console.log("Rate fetch failed"));
  }, [inputs.origCurrency]);

  const numSalary = parseInt(inputs.monthlySalary.replace(/,/g, '')) || 0;
  const annualBase = numSalary * (inputs.isJapanPartner ? 1 : inputs.multiplier);
  const grossFee = annualBase * inputs.feePercent;
  const deduction = inputs.isJapanPartner ? Math.min(grossFee * 0.10, 400000 / (rates['JPY'] || 1)) : 0;
  const finalTotal = grossFee - deduction;

  const format = (num) => new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: inputs.origCurrency 
  }).format(num);

  return (
    <div className="min-h-screen bg-[#f8faff] p-4 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#a855f7] rounded-2xl text-white shadow-lg shadow-purple-100">
              <Calculator size={28} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Billing Calculator</h1>
          </div>
          <button onClick={() => window.location.reload()} className="p-3 text-slate-400 hover:rotate-180 transition-transform duration-500">
            <RefreshCw size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className={`p-6 rounded-3xl border transition-all ${inputs.isJapanPartner ? 'bg-pink-50 border-pink-200' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <MapPin className={inputs.isJapanPartner ? 'text-pink-500' : 'text-slate-300'} />
                  <span className="font-bold text-slate-700 text-sm uppercase tracking-wider">Japan Partner Mode</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={inputs.isJapanPartner} 
                  onChange={(e) => setInputs({...inputs, isJapanPartner: e.target.checked, origCurrency: e.target.checked ? 'JPY' : inputs.origCurrency})}
                  className="w-6 h-6 accent-pink-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Currency</label>
                  <select 
                    value={inputs.origCurrency} 
                    onChange={(e) => setInputs({...inputs, origCurrency: e.target.value})}
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Multiplier</label>
                  <select 
                    value={inputs.multiplier} 
                    onChange={(e) => setInputs({...inputs, multiplier: parseInt(e.target.value)})}
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    {[12, 13, 14, 15].map(m => <option key={m} value={m}>x{m} months</option>)}
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Monthly Salary</label>
                  <input 
                    type="text" 
                    value={inputs.monthlySalary}
                    onChange={(e) => setInputs({...inputs, monthlySalary: e.target.value.replace(/[^0-9]/g, '')})}
                    placeholder="Enter amount..."
                    className="w-full p-5 bg-slate-50 rounded-2xl font-black text-2xl border-none outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#1e293b] p-8 rounded-[3rem] shadow-2xl text-white border border-slate-700 h-full relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-3xl"></div>
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10">Total Summary</h2>
              <div className="space-y-8">
                <div className="flex justify-between items-end border-b border-slate-700 pb-4">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Base Fee</span>
                  <span className="text-xl font-black tracking-tight">{format(grossFee)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Final Billing</span>
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                    {format(finalTotal)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="font-serif text-5xl text-slate-800 italic opacity-80 mb-2 transform -rotate-2 select-none">
            Elon Musk
          </div>
          <div className="w-48 h-px bg-slate-200"></div>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mt-2">Authorized Signatory</span>
        </div>

      </div>
    </div>
  );
}