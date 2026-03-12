

## Diagnostic

The problem is a **Popover inside a Dialog** conflict. The `DatePickerWithInput` uses a Radix `Popover`, and it's rendered inside `AddChildModal` which uses a Radix `Dialog`. When you click the date button:

1. The Popover tries to open
2. The Dialog detects a click "outside" its content (the PopoverContent portal renders outside the DialogContent DOM)
3. The Dialog intercepts focus/pointer events, blocking the Popover from appearing

This is a well-known Radix UI issue: **nested Popover inside Dialog requires `modal={false}` on the Popover** to prevent the Dialog's focus trap from stealing events.

Additionally, the current "12 mars 2026" shown in the screenshot is the **default `new Date()`** value passed as `birthDate` — it's today's date, not a user selection. So the button displays a date but clicking it does nothing because the Popover never opens.

## Plan

### 1. Fix Popover inside Dialog — `DatePickerWithInput.tsx`

Add `modal={false}` to the `<Popover>` component so it works inside Dialogs:

```tsx
<Popover modal={false} open={...} onOpenChange={...}>
```

This single prop fixes the focus trap conflict and allows the PopoverContent to receive clicks normally.

### 2. Improve default value handling — `DatePickerWithInput.tsx`

Change the component to accept `value: Date | undefined` instead of `value: Date`. When no date is selected yet, show the placeholder "Choisir une date" instead of today's date. This prevents confusion where the user sees "12 mars 2026" and thinks they already selected a date.

Update the interface:
```tsx
value: Date | undefined;
```

### 3. Update callers — `ChildForm.tsx` and `AddChildModal.tsx`

Ensure the initial `birthDate` state starts as `undefined` (or a sensible default) rather than `new Date()`, so the placeholder is shown by default. Trace the birthDate initialization in the parent components to confirm.

### Files to modify

| File | Change |
|------|--------|
| `src/components/ui/date-picker/DatePickerWithInput.tsx` | Add `modal={false}` to Popover; accept `Date \| undefined` |
| `src/components/children/ChildForm.tsx` | No change needed (already passes through) |
| Parent components initializing `birthDate` | Check if `new Date()` should be `undefined` |

This is a minimal, targeted fix — one prop addition solves the core blocking issue.

