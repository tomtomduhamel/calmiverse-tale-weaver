

## Plan: Archive "advanced_story_prompt_template"

### Context

The prompt `advanced_story_prompt_template` is currently used as a **fallback** in `useN8nStoryFromTitle.tsx` (line 152): if no objective-specific prompt (`story_prompt_sleep`, `story_prompt_fun`, etc.) is found, it falls back to this generic template.

Now that the 4 objective-specific prompts have been created, this fallback is no longer necessary.

### Changes

**1. Update fallback logic in `src/hooks/stories/useN8nStoryFromTitle.tsx`**
- Remove the fallback to `advanced_story_prompt_template` (lines 149-153)
- Keep a warning log if no specific prompt is found, but don't fall back to the generic one
- This makes the system rely exclusively on objective-specific prompts

**2. Update `src/hooks/prompts/useActivePrompts.ts`**
- Remove `advanced_story_prompt_template` from the `ActivePrompts` interface (optional cleanup)

**3. Update `src/pages/admin/PromptAdmin.tsx`**
- Change the config entry for `advanced_story_prompt_template` to mark it as archived/inactive (move its icon or label to reflect "archived" status), or remove it from the active config list

### Pre-condition

Before implementing, the 4 objective-specific prompts (`story_prompt_sleep`, `story_prompt_relax`, `story_prompt_focus`, `story_prompt_fun`) must be confirmed as active in the `prompt_templates` table. If any is missing, the fallback would be needed.

### Risk

Low. The fallback is only triggered when an objective-specific prompt is absent. Once all 4 are active, it will never be reached.

