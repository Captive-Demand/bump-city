

## Plan: Custom Upload Shows Image Only (No Text Overlay)

### What changes

When `templateId === "custom"`, the form fields (title, date, location, message, time) should be hidden since the uploaded image already contains all the design/text the user wants.

### Changes

**1. `src/pages/InviteBuilderPage.tsx`**
- Wrap the form `Card` (title, date, time, location, message fields) in a condition: only show when `templateId !== "custom"`
- When custom is selected, show just the uploaded image preview and the action buttons (Preview / Save)
- On save with custom template, skip rendering — upload the raw file directly (already implemented)

This is a small conditional visibility change — no logic changes needed since the save flow already handles custom uploads correctly.

