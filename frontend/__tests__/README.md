# راهنمای تست‌های React Testing Library

این دایرکتوری شامل تست‌های کامپوننت‌های React با استفاده از React Testing Library است.

## ساختار تست‌ها

```
__tests__/
  ├── components/        # تست‌های کامپوننت‌ها
  │   ├── Button.test.tsx
  │   ├── Input.test.tsx
  │   ├── Card.test.tsx
  │   ├── Header.test.tsx
  │   ├── ProtectedRoute.test.tsx
  │   └── PurchaseButton.test.tsx
  ├── utils/             # ابزارهای تست
  │   └── test-utils.tsx # توابع کمکی و mock ها
  └── lib/               # تست‌های utility functions
      └── utils.test.ts
```

## اجرای تست‌ها

### اجرای تمام تست‌ها
```bash
npm test
```

### اجرای تست‌ها در watch mode
```bash
npm run test:watch
```

### اجرای تست‌ها با coverage
```bash
npm run test:coverage
```

### اجرای تست یک فایل خاص
```bash
npm test -- Button.test.tsx
```

## کامپوننت‌های تست شده

### 1. Button Component
- ✅ Rendering با متن و children
- ✅ Variants (default, outline, destructive, secondary, ghost, link)
- ✅ Sizes (default, sm, lg, icon)
- ✅ Interactions (click, keyboard)
- ✅ Disabled state
- ✅ Customization (className, ref)
- ✅ Accessibility (aria-label, type)

### 2. Input Component
- ✅ Rendering با placeholder و value
- ✅ User input handling
- ✅ onChange events
- ✅ Disabled state
- ✅ Different input types (text, password, email, number)
- ✅ Custom className و ref forwarding
- ✅ Accessibility (aria-label, required, maxLength)

### 3. Card Components
- ✅ Card, CardHeader, CardTitle, CardDescription
- ✅ CardContent, CardFooter
- ✅ Custom className
- ✅ Complete card structure

### 4. Header Component
- ✅ Rendering logo و navigation
- ✅ Theme toggle
- ✅ Authentication states (logged in/out, loading)
- ✅ Admin vs regular user views
- ✅ Navigation links
- ✅ Logout functionality

### 5. ProtectedRoute Component
- ✅ Loading state
- ✅ Authentication check
- ✅ Redirect behavior
- ✅ Admin-only routes
- ✅ Access denied messages
- ✅ Custom redirect paths

### 6. PurchaseButton Component
- ✅ Unauthenticated state (login link)
- ✅ Enrolled state (continue learning)
- ✅ Free course enrollment
- ✅ Paid course enrollment
- ✅ Payment intent creation
- ✅ Error handling
- ✅ Loading states

## Test Utilities

### renderWithProviders

تابع کمکی برای render کردن کامپوننت‌ها با providers:

```typescript
import { renderWithProviders, mockUser } from '../utils/test-utils';

test('example', () => {
  renderWithProviders(<MyComponent />, {
    authUser: mockUser,
    authLoading: false,
  });
});
```

### Mock Data

```typescript
import { mockUser, mockAdminUser } from '../utils/test-utils';

// mockUser: کاربر عادی
// mockAdminUser: کاربر ادمین
```

## Mock Setup

### Auth Context Mock

در `jest.setup.js`، `useAuth` mock شده است و می‌تواند در تست‌ها کنترل شود:

```typescript
// در test-utils.tsx
renderWithProviders(<Component />, {
  authUser: mockUser,      // کاربر لاگین شده
  authLoading: false,      // حالت loading
});
```

### Next.js Router Mock

Router در `jest.setup.js` mock شده است:

```typescript
// استفاده در تست‌ها
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    // ...
  }),
}));
```

### API Mocks

برای mock کردن API calls:

```typescript
jest.mock('@/lib/api', () => ({
  paymentsAPI: {
    createIntent: jest.fn(),
    verify: jest.fn(),
  },
  enrollmentsAPI: {
    enroll: jest.fn(),
  },
}));
```

## Best Practices

### 1. استفاده از screen queries
```typescript
// ✅ Good
const button = screen.getByRole('button', { name: /submit/i });

// ❌ Bad
const button = container.querySelector('button');
```

### 2. استفاده از user-event برای interactions
```typescript
// ✅ Good
const user = userEvent.setup();
await user.click(button);

// ❌ Bad
button.click();
```

### 3. استفاده از waitFor برای async operations
```typescript
await waitFor(() => {
  expect(mockAPI).toHaveBeenCalled();
});
```

### 4. تست کردن behavior نه implementation
```typescript
// ✅ Good - تست کردن رفتار
expect(screen.getByText('Success')).toBeInTheDocument();

// ❌ Bad - تست کردن implementation
expect(component.state.success).toBe(true);
```

## نکات مهم

1. **Act Warnings**: هشدارهای `act()` معمولاً مشکلی ایجاد نمی‌کنند و فقط هشدار هستند.

2. **Async Operations**: همیشه از `waitFor` یا `findBy` queries برای async operations استفاده کنید.

3. **Mock Cleanup**: در `beforeEach` یا `afterEach`، mock ها را reset کنید:
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

4. **Testing Library Queries Priority**:
   - `getByRole` (اولویت اول)
   - `getByLabelText`
   - `getByText`
   - `getByTestId` (آخرین گزینه)

## Coverage Thresholds

تست‌ها باید حداقل coverage زیر را داشته باشند:
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## منابع

- [React Testing Library Documentation](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)














