

## Problem

The `advanced_story_prompt_template` still appears under "EN PRODUCTION" because the grouping logic in `groupedTemplates` places any template found in `ACTIVE_PROMPTS_CONFIG` into the "active" list — regardless of its category. Since this template was kept in the config (with `category: 'other'`), it's still shown as active.

## Fix

Update the grouping logic (line 154-159) to treat templates with `category: 'other'` as inactive/archived:

```typescript
templates.forEach(t => {
  const config = ACTIVE_PROMPTS_CONFIG[t.key];
  if (config && config.category !== 'other') {
    active.push(t);
  } else {
    inactive.push(t);
  }
});
```

This single change moves `advanced_story_prompt_template` (and any future "other" category templates) into the "Archives" section.

