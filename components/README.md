# Component Guidelines

## Directory Structure

```
components/
├── shared/        # Reusable across the app
├── features/      # Feature-specific components
└── ui/            # UI primitives (button, input, etc.)
```

## Naming Conventions

- **File names**: PascalCase for components (e.g., `DepositForm.tsx`)
- **Export names**: PascalCase (e.g., `export const DepositForm = () => {}`)
- **Props type names**: ComponentNameProps (e.g., `DepositFormProps`)

## Component Template

```typescript
import React from 'react';

interface ComponentNameProps {
  // Props definition
  label: string;
  onSubmit?: (value: string) => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  label,
  onSubmit,
}) => {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

export default ComponentName;
```

## Best Practices

1. **Keep components focused** - Single responsibility principle
2. **Use TypeScript** - Define PropTypes as interfaces
3. **Extract props interfaces** - Makes testing easier
4. **Use absolute imports** - Avoid `../../../` paths
5. **Document complex props** - Add JSDoc comments
6. **Memoize when needed** - Use `React.memo()` for performance
7. **Keep components under 300 lines** - Split if larger

## Example Directory

### Shared Components
- `Navigation.tsx` - Main navigation
- `SupportChat.tsx` - Support chat widget
- `Header.tsx` - Page headers
- `Footer.tsx` - Page footer

### Feature Components
- `features/transactions/DepositForm.tsx`
- `features/transactions/WithdrawalForm.tsx`
- `features/transactions/TransactionHistory.tsx`
- `features/auth/LoginForm.tsx`

## Exporting Components

Always export from index files for cleaner imports:

```typescript
// components/shared/index.ts
export { Navigation } from './Navigation';
export { SupportChat } from './SupportChat';
```

Then import as:
```typescript
import { Navigation, SupportChat } from '@/components/shared';
```
