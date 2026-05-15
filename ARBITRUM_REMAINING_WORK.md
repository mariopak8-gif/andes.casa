# UI & Remaining Work - Action Plan

## 📋 Remaining Tasks (Phase 2)

### Priority: HIGH (Needed for Launch)

#### 1. Update DepositForm Component
**File**: `components/DepositForm.tsx`
**Current**: Shows only one network
**Required**: Add network selection dropdown

```typescript
// Changes needed:
export const SUPPORTED_NETWORKS = [
  { 
    id: 'arbitrum', 
    name: 'Arbitrum One (Recommended)', 
    minDeposit: 10,
    network: 'Arbitrum L2',
    confirmationTime: '~10 seconds'
  },
  // { 
  //   id: 'trc20', 
  //   name: 'Tron (TRC20)', 
  //   minDeposit: 10,
  //   network: 'Tron Mainnet',
  //   confirmationTime: '~60 seconds'
  // }, // Deprecated
];

// Add state
const [selectedNetwork, setSelectedNetwork] = useState('arbitrum');

// Add UI element
<select value={selectedNetwork} onChange={(e) => setSelectedNetwork(e.target.value)}>
  {SUPPORTED_NETWORKS.map(net => (
    <option key={net.id} value={net.id}>
      {net.name} - Min: {net.minDeposit} USDT
    </option>
  ))}
</select>

// Pass network to useDepositAddress hook
const { address, balance } = useDepositAddress(selectedNetwork);
```

**Time Estimate**: 30 minutes

---

#### 2. Update useDepositAddress Hook
**File**: `lib/hooks/useDepositAddress.ts`
**Current**: Likely defaults to one network
**Required**: Accept network parameter

```typescript
// Changes needed:
export function useDepositAddress(network: string = 'arbitrum') {
  const [address, setAddress] = useState<string>('');
  
  useEffect(() => {
    const fetchAddress = async () => {
      // Include network in query params if needed
      const response = await fetch(`/api/${network}/deposit/address`);
      const data = await response.json();
      setAddress(data.depositAddress);
    };
    
    fetchAddress();
  }, [network]); // Re-fetch if network changes
  
  return { address };
}
```

**Time Estimate**: 20 minutes

---

#### 3. Update Deposit Check Button
**File**: `app/(dashboard)/deposit/DepositContent.tsx`
**Current**: Calls `/api/tron/check-deposits` or similar
**Required**: Call appropriate network endpoint

```typescript
// Changes needed:
const checkDeposits = async () => {
  const response = await fetch(`/api/${selectedNetwork}/check-deposits`);
  const data = await response.json();
  // Handle response
};

// Show network name in UI
<p>Network: {selectedNetwork === 'arbitrum' ? 'Arbitrum One' : 'Tron'}</p>
```

**Time Estimate**: 20 minutes

---

#### 4. Update Admin Dashboard
**File**: `app/(admin)/admin/dashboard/page.tsx`
**Current**: Shows "Arbitrum" but may need updates
**Required**: Distinguish between networks in stats

```typescript
// Changes needed:
// Update pending deposit count to show per-network
const arbitrumPending = users.filter(u => 
  u.depositAddresses?.arbitrum && 
  (u.lastDepositCheck ?? 0) > Date.now() - 60000
).length;

// Update transaction display
<p>Network: {tx.network}</p> // Already works

// Add network filter to reports
```

**Time Estimate**: 15 minutes

---

### Priority: MEDIUM (Recommended Before Production)

#### 5. Update README & Documentation
**File**: `README.md`, `DEVELOPMENT.md`
**Changes**:
- Add Arbitrum support notice
- Update setup instructions to mention Arbitrum
- Add link to `ARBITRUM_MIGRATION_GUIDE.md`

**Time Estimate**: 15 minutes

---

#### 6. Create E2E Test Suite
**File**: `__tests__/arbitrum.e2e.test.ts` (new)
**Tests Needed**:
- Address generation flow
- Balance queries
- Transaction detection
- Sweep execution
- Database recording

**Recommended Framework**: Jest + API testing

**Time Estimate**: 2-3 hours

---

#### 7. Setup Cron Job Service
**Required**: Configure cron service
**Options**:
- Vercel Cron (easiest if using Vercel)
- EasyCron (free, external)
- AWS EventBridge
- Self-hosted (PM2, systemd)

**Setup Instructions**:
```bash
# Vercel Cron
# Create crons.json or add to vercel.json
{
  "crons": [{
    "path": "/api/arbitrum/poll-deposits",
    "schedule": "*/2 * * * *"  // Every 2 minutes
  }]
}

# Add secret header
curl -X POST https://your-app.vercel.app/api/arbitrum/poll-deposits \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Time Estimate**: 15-30 minutes

---

### Priority: LOW (Nice to Have)

#### 8. Add Analytics Dashboard
**Suggested Location**: `app/(admin)/admin/analytics/page.tsx`
**Metrics**:
- Total deposits by network
- Sweep success rate
- Average sweep time
- Gas costs

**Time Estimate**: 2-3 hours

---

#### 9. Add Notifications System
**Options**:
- Email on deposit detection
- SMS alerts
- In-app notifications

**Time Estimate**: 1-2 hours per channel

---

#### 10. Multi-Network Support UI
**Allow users to create addresses on multiple networks simultaneously**
- Update DepositForm to generate multiple addresses
- Update dashboard to show all addresses
- Update balance display

**Time Estimate**: 2-3 hours

---

## 🔧 Implementation Guide

### Step 1: DepositForm Network Selection (30 min)

1. Open `components/DepositForm.tsx`
2. Find the deposit address display section
3. Add network dropdown above it:

```tsx
import { useState } from 'react';

export function DepositForm() {
  const [selectedNetwork, setSelectedNetwork] = useState('arbitrum');
  
  return (
    <div>
      <div className="mb-4">
        <label htmlFor="network" className="block text-sm font-medium">
          Select Network
        </label>
        <select
          id="network"
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          <option value="arbitrum">Arbitrum One (Recommended)</option>
          {/* <option value="trc20">Tron (Deprecated)</option> */}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {selectedNetwork === 'arbitrum' 
            ? 'Fast & cheap on Arbitrum L2'
            : 'Classic Tron network'
          }
        </p>
      </div>
      
      {/* Pass network to deposit address hook */}
      {/* Rest of component */}
    </div>
  );
}
```

### Step 2: Hook Update (20 min)

1. Open `lib/hooks/useDepositAddress.ts`
2. Accept `network` parameter:

```typescript
export function useDepositAddress(network: string = 'arbitrum') {
  // Add network to dependency array
  // Use in fetch URL: `/api/${network}/deposit/address`
}
```

### Step 3: Manual Check Handler (20 min)

1. Open `app/(dashboard)/deposit/DepositContent.tsx`
2. Find "Check Deposits" button handler
3. Update to use selected network:

```typescript
const handleCheckDeposits = async () => {
  setIsChecking(true);
  try {
    const response = await fetch(`/api/${selectedNetwork}/check-deposits`);
    const data = await response.json();
    setCheckResult(data);
  } catch (error) {
    setError(error.message);
  } finally {
    setIsChecking(false);
  }
};
```

### Step 4: Admin Dashboard (15 min)

1. Open `app/(admin)/admin/dashboard/page.tsx`
2. Update pending transaction filter to show per-network
3. Add network column to transaction display

---

## 📊 Testing After UI Updates

### Test Checklist
- [ ] Can select Arbitrum network
- [ ] Deposit address generates correctly
- [ ] Address persists after page reload
- [ ] Check deposits button calls correct endpoint
- [ ] Admin dashboard shows correct network
- [ ] All networks still work (if keeping Tron)

### Manual Test Flow
```bash
1. Navigate to deposit page
2. Verify Arbitrum is default network
3. Click "Check for New Deposits"
4. Verify API call to /api/arbitrum/check-deposits
5. Check admin dashboard for deposit records
6. Verify network shows "arbitrum" in database
```

---

## 🚀 Deployment Checklist

Before going to production:

- [ ] All environment variables set
- [ ] Hot wallet funded with ETH
- [ ] Cron job configured
- [ ] UI tests passing
- [ ] E2E tests passing
- [ ] Admin dashboard shows correct data
- [ ] Database backups enabled
- [ ] Monitoring/alerting configured
- [ ] Rollback plan documented
- [ ] User documentation updated

---

## 📈 Rollout Plan

### Phase 1: Deploy (Day 1)
- [ ] Deploy code changes
- [ ] Verify endpoints work
- [ ] Check admin dashboard

### Phase 2: Enable Cron (Day 2)
- [ ] Start cron job
- [ ] Monitor first 24 hours
- [ ] Verify sweeps working

### Phase 3: User Rollout (Week 1)
- [ ] Notify users of network switch
- [ ] Migrate users to Arbitrum
- [ ] Support team monitoring
- [ ] Track metrics

### Phase 4: Cleanup (Week 2)
- [ ] Sunset Tron endpoints (optional)
- [ ] Archive old code
- [ ] Update documentation

---

## ⏱️ Total Time Estimates

| Task | Time |
|------|------|
| DepositForm network selection | 30 min |
| useDepositAddress hook update | 20 min |
| Deposit check button handler | 20 min |
| Admin dashboard updates | 15 min |
| Testing | 30 min |
| Documentation updates | 30 min |
| Cron job setup | 30 min |
| **Total** | **2-3 hours** |

---

## 🔗 Dependencies

### Files That Need Updates
1. `components/DepositForm.tsx`
2. `lib/hooks/useDepositAddress.ts`
3. `app/(dashboard)/deposit/DepositContent.tsx`
4. `app/(admin)/admin/dashboard/page.tsx`
5. `README.md`
6. `DEVELOPMENT.md`

### Files Already Working (No Changes Needed)
- `app/api/arbitrum/*` - All endpoints ready
- `lib/arbitrum/*` - All utilities ready
- `server/arbitrumService.ts` - Sweep service ready
- `convex/schema.ts` - Schema ready

---

## 📝 Rollback Instructions

If issues occur:
1. Revert DepositForm to single network
2. Comment out Arbitrum in dropdown
3. Use Tron endpoints as fallback
4. Investigate issue
5. Redeploy when fixed

---

## 🎯 Success Criteria

- [ ] Users can generate Arbitrum deposit addresses
- [ ] System detects USDT deposits correctly
- [ ] Sweeps execute within 60 seconds
- [ ] User balances update correctly
- [ ] Cron job runs every 1-2 minutes
- [ ] Admin dashboard shows all metrics
- [ ] Zero missed deposits
- [ ] No double-sweeps
- [ ] Hot wallet never runs out of ETH

---

## 📞 Support

If you encounter issues:
1. Check `ARBITRUM_MIGRATION_GUIDE.md` troubleshooting section
2. Review logs in browser console & server logs
3. Verify environment variables
4. Check hot wallet balance
5. Verify RPC endpoint is responsive

---

**Estimated Start Date**: Immediately after infrastructure deployment  
**Estimated Completion**: 1-2 days  
**Launch Date**: Once UI updates + testing complete
