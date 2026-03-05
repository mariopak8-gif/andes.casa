# Andes Project Structure

## 📁 Project Organization

This project follows a professional, scalable structure optimized for maintainability and growth.

### Root Level
```
andes/
├── app/                    # Next.js App Router
├── components/             # React Components (organized by type)
├── convex/                 # Backend API (Convex)
├── lib/                    # Utilities and helpers
├── public/                 # Static assets
├── types/                  # TypeScript type definitions
├── constants/              # App-wide constants
├── next.config.ts          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS config
├── biome.json              # Biome linter/formatter config
└── package.json            # Dependencies
```

---

## 🎯 Detailed Folder Structure

### `/app` - Next.js Application
```
app/
├── (features)/             # Grouped feature routes (hidden in URL)
│   ├── auth/               # Authentication pages
│   │   ├── layout.tsx
│   │   ├── forgot-password/
│   │   ├── register/
│   │   ├── reset-password/
│   │   └── sign-in/
│   ├── dashboard/          # User dashboard
│   ├── transactions/       # Transaction features
│   │   ├── deposit/
│   │   └── withdraw/
│   └── onboarding/         # User onboarding flow
│       ├── joining-process/
│       ├── occupation/
│       └── anti-fraud/
├── api/                    # API routes
│   └── auth/
│       ├── [...nextauth]/
│       └── convex-auth/
├── about/                  # Public pages
├── layout.tsx              # Root layout
├── page.tsx                # Home page
├── globals.css             # Global styles
├── ClerkProvider.tsx       # Auth provider setup
└── SessionProvider.tsx     # Session management
```

### `/components` - React Components
```
components/
├── shared/                 # Reusable components
│   ├── Navigation.tsx
│   └── SupportChat.tsx
├── features/               # Feature-specific components
│   ├── auth/
│   │   └── VerifyPageContent.tsx
│   ├── transactions/
│   │   ├── DepositForm.tsx
│   │   ├── WithdrawalForm.tsx
│   │   └── TransactionHistory.tsx
│   └── [other features]/
├── ui/                     # UI primitives
│   ├── button.tsx
│   ├── input.tsx
│   └── [other UI components]/
└── README.md              # Component guidelines
```

### `/convex` - Backend API
```
convex/
├── schema.ts              # Database schema
├── user.ts                # User operations
├── transaction.ts         # Transaction operations
├── tsconfig.json
└── _generated/            # Auto-generated types
```

### `/lib` - Utilities
```
lib/
└── utils.ts               # Helper functions, validators, etc.
```

### `/types` - TypeScript Types
```
types/
├── user.ts               # User-related types
├── transaction.ts        # Transaction types
├── api.ts                # API response types
└── index.ts              # Export all types
```

### `/constants` - App Constants
```
constants/
├── routes.ts             # Route paths
├── messages.ts           # UI messages and copy
├── validation.ts         # Validation rules
└── index.ts              # Export all constants
```

---

## 🎨 Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| **Folders** | kebab-case | `joining-process/` |
| **Components** | PascalCase | `DepositForm.tsx` |
| **Files** | PascalCase (components) | `Navigation.tsx` |
| **Files** | kebab-case (utilities) | `validation-rules.ts` |
| **Routes** | kebab-case | `forgot-password/` |
| **Variables** | camelCase | `userEmail` |

---

## 🔄 Feature Organization Rules

1. **Group Related Routes** - Use parentheses `(features)` to hide route groups from URL
2. **Keep Features Modular** - Each feature should be self-contained
3. **Use Shared Components** - Common UI in `/components/shared`
4. **Feature Components** - Feature-specific components in `/components/features`
5. **Centralize Types** - All TypeScript types in `/types`
6. **Centralize Constants** - Shared constants in `/constants`

---

## 📋 Import Examples

```typescript
// ✅ Good - Absolute imports (configure in tsconfig.json)
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/lib/store';
import { User } from '@/types/user';
import { ROUTES } from '@/constants/routes';

// ❌ Avoid - Relative imports for distant files
import { Button } from '../../../../components/ui/button';
```

---

## 🚀 Best Practices

1. **Keep components under 300 lines** - Split large components
2. **One component per file** - Unless tightly coupled
3. **Use TypeScript interfaces** - Define contracts early
4. **Export from index files** - Makes imports cleaner
5. **Group related logic** - Keep domain logic together
6. **Document complex features** - Add README in feature folders

---

## 📝 Adding New Features

1. Create folder in `/app/(features)/feature-name`
2. Create related components in `/components/features/feature-name`
3. Add types in `/types/feature.ts`
4. Add constants in `/constants/feature.ts`
5. Create API routes if needed in `/app/api`
6. Update `/constants/routes.ts` with new routes

---

## 🔍 Quick Navigation

- **Authentication**: `app/(features)/auth/`
- **User Dashboard**: `app/(features)/dashboard/`
- **Transactions**: `app/(features)/transactions/`
- **Onboarding**: `app/(features)/onboarding/`
- **UI Components**: `components/ui/`
- **Shared Components**: `components/shared/`
- **Backend API**: `convex/`
- **Utilities**: `lib/`

---

## 💡 Development Tips

- Use absolute imports for consistency
- Keep feature logic in separate files
- Use TypeScript strict mode
- Run `pnpm format` before commits
- Keep components testable and focused
- Document API contracts in Convex schema
