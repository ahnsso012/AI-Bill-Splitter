
import React, { ChangeEvent } from 'react';
import type { ParsedReceipt, Assignments } from '../types';
import { DocumentPlusIcon, UserCircleIcon, SparklesIcon } from './Icons';

interface ReceiptPaneProps {
  onImageUpload: (file: File) => void;
  receiptData: ParsedReceipt | null;
  isLoading: boolean;
  tip: number;
  setTip: (tip: number) => void;
  assignments: Assignments;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const SkeletonLoader = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-slate-200 rounded-md w-3/4 mb-6"></div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <div className="h-5 bg-slate-200 rounded w-1/2"></div>
          <div className="h-5 bg-slate-200 rounded w-1/4"></div>
        </div>
      ))}
    </div>
    <div className="border-t border-slate-200 my-4"></div>
    <div className="space-y-3">
       <div className="flex justify-between items-center">
          <div className="h-5 bg-slate-200 rounded w-1/3"></div>
          <div className="h-5 bg-slate-200 rounded w-1/4"></div>
        </div>
         <div className="flex justify-between items-center">
          <div className="h-5 bg-slate-200 rounded w-1/3"></div>
          <div className="h-5 bg-slate-200 rounded w-1/4"></div>
        </div>
    </div>
  </div>
);

const FileUploader: React.FC<{ onImageUpload: (file: File) => void }> = ({ onImageUpload }) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
        <DocumentPlusIcon className="h-16 w-16 text-slate-400 mb-4" />
      <h2 className="text-xl font-semibold text-slate-700 mb-2">Upload Your Receipt</h2>
      <p className="text-slate-500 mb-6 max-w-sm">
        Snap a picture of your bill, and our AI will automatically scan and itemize it for you.
      </p>
      <label htmlFor="file-upload" className="cursor-pointer px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all">
        Select Image
      </label>
      <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  );
};


export const ReceiptPane: React.FC<ReceiptPaneProps> = ({ onImageUpload, receiptData, isLoading, tip, setTip, assignments }) => {
  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (!receiptData) {
    return <FileUploader onImageUpload={onImageUpload} />;
  }

  const assignedPeople = (itemName: string) => {
    return assignments[itemName] || [];
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-slate-800">Scanned Receipt</h2>
      <div className="space-y-2 mb-4">
        {receiptData.items.map((item, index) => (
          <div key={index} className="flex justify-between items-start p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
            <div>
                <p className="font-medium text-slate-700">{item.name}</p>
                {assignedPeople(item.name).length > 0 && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <UserCircleIcon className="h-4 w-4" />
                        <span>{assignedPeople(item.name).join(', ')}</span>
                    </div>
                )}
            </div>
            <p className="font-mono text-slate-600">{formatCurrency(item.price)}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 pt-4 space-y-2">
        <div className="flex justify-between text-slate-600">
          <p>Subtotal</p>
          <p className="font-mono">{formatCurrency(receiptData.subtotal)}</p>
        </div>
        <div className="flex justify-between text-slate-600">
          <p>Tax</p>
          <p className="font-mono">{formatCurrency(receiptData.tax)}</p>
        </div>
        <div className="flex justify-between items-center">
            <label htmlFor="tip-amount" className="text-slate-600">Tip</label>
            <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                    id="tip-amount"
                    type="number"
                    value={tip > 0 ? tip : ''}
                    onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-28 font-mono text-right pr-3 pl-7 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
        </div>
        <div className="border-t border-slate-300 my-2"></div>
        <div className="flex justify-between font-bold text-xl text-slate-800">
          <p>Total</p>
          <p className="font-mono">{formatCurrency(receiptData.total + tip)}</p>
        </div>
      </div>
    </div>
  );
};
