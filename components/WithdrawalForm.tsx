"use client";

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useSession } from 'next-auth/react';
import { MIN_WITHDRAWAL } from '@/constants';

const MIN_WITHDRAWAL_MAP = {
  trc20: MIN_WITHDRAWAL,
  erc20: MIN_WITHDRAWAL,
};

export default function WithdrawalForm() {
  const { user } = useUser();
  const { data: session } = useSession();
  const requestWithdrawal = useMutation(api.withdrawal.requestWithdrawal);
  const saveWithdrawalPreferences = useMutation(api.user.saveWithdrawalPreferences);

  // Use the authenticated session contact to resolve the Convex user
  const convexUser = useQuery(
    api.user.getUserByContact,
    session?.user?.contact ? { contact: session.user.contact } : "skip"
  );

  // Query saved preferences once the Convex user is loaded
  const savedPreferences = useQuery(
    api.user.getSavedWithdrawalPreferences,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<'trc20' | 'erc20'>('trc20');

  const [formData, setFormData] = useState({
    amount: '',
    address: '',
    transactionPassword: '',
  });

  // Load saved preferences into form
  useEffect(() => {
    if (savedPreferences) {
      setFormData((prev) => ({
        ...prev,
        address: savedPreferences.savedWithdrawalAddress || '',
        transactionPassword: savedPreferences.savedTransactionPassword || '',
      }));
    }
  }, [savedPreferences]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: name === 'amount' ? (value === '' ? '' : parseFloat(value) || '') : value,
      };
      return updated;
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validation
      const amount = typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount;
      if (!amount || amount <= 0) {
        setError('Please enter a valid amount');
        setLoading(false);
        return;
      }

      const minAmount = MIN_WITHDRAWAL_MAP[selectedNetwork];
      if (amount < minAmount) {
        setError(`Minimum withdrawal is ${minAmount} USDT`);
        setLoading(false);
        return;
      }

      if (!formData.address.trim()) {
        setError('Please enter a withdrawal address');
        setLoading(false);
        return;
      }

      if (!formData.transactionPassword.trim()) {
        setError('Please enter transaction password');
        setLoading(false);
        return;
      }

      // Accept either Clerk user id or next-auth session (fallback to email)
      if (!convexUser?._id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Choose endpoint based on selected network
      const endpoint = selectedNetwork === 'erc20' ? '/api/arbitrum/withdraw' : '/api/tron/withdraw';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          network: selectedNetwork,
          address: formData.address,
          transactionPassword: formData.transactionPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Withdrawal failed');
        setLoading(false);
        return;
      }

      const result = await response.json();
      setSuccess(`Withdrawal successful! Transaction ID: ${result.txId}`);
      
      // Save withdrawal preferences for autofill
      try {
        await saveWithdrawalPreferences({
          userId: convexUser._id,
          savedWithdrawalAddress: formData.address,
          savedTransactionPassword: formData.transactionPassword,
        });
      } catch (saveErr) {
        console.warn('Failed to save withdrawal preferences:', saveErr);
        // Don't show error to user as withdrawal was successful
      }
      
      setFormData({
        amount: '',
        address: '',
        transactionPassword: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Withdrawal Request</h2>

        {/* Network Selection */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Select Network
          </label>
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value as 'trc20' | 'erc20')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="trc20">TRC20 (Tron)</option>
            <option value="erc20">ERC20 (Arbitrum)</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Choose the blockchain network for your withdrawal
          </p>
        </div>

        {/* Amount */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Amount (USDT)
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="Enter withdrawal amount"
            step="0.01"
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Minimum: {MIN_WITHDRAWAL_MAP[selectedNetwork]} USDT
          </p>
        </div>


        {/* Withdrawal Address */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Withdrawal Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Enter your wallet address for receiving USDT"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Make sure this address is correct - funds will be sent here
          </p>
        </div>

        {/* Information: Withdrawal to your address */}
        <div className="mb-8 p-4 bg-green-50 border border-green-300 rounded-lg">
          <p className="text-sm text-green-800 font-semibold">
            ✓ Your withdrawal will be sent to the address you provide above on the network you select.
          </p>
        </div>

        {/* Transaction Password */}
        <div className="mb-8">
          <label className="block text-gray-700 font-semibold mb-2">
            Transaction Password
          </label>
          <input
            type="password"
            name="transactionPassword"
            value={formData.transactionPassword}
            onChange={handleInputChange}
            placeholder="Please enter the payment password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-lg rounded-full hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Submit Withdrawal'}
        </button>

        {/* Information Box */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-gray-900 font-semibold mb-3">Withdrawal Information:</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>✓ {selectedNetwork === 'trc20' ? '🔗 TRC20 (Tron Network)' : '🔗 ERC20 (Arbitrum Network)'}</li>
            <li>✓ Minimum: {MIN_WITHDRAWAL_MAP[selectedNetwork]} USDT</li>
            <li>✓ Instant processing - no hidden fees</li>
            <li>✓ Double-check your address before submitting</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
