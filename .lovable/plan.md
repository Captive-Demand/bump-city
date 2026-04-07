

## Plan: Add Custom Invite Upload Option

### What changes

**1. InviteBuilderPage.tsx** — Add a "custom" template mode
- Add state for `customImageFile` and `customImagePreviewUrl`
- Add a small text link below the template picker: "Or upload your own design"
- When clicked, open a file input for image upload (PNG/JPG)
- When a custom image is selected, set `templateId` to `"custom"` and show the uploaded image as the preview
- On save: skip `renderInviteToBlob` entirely — upload the custom file directly to storage as the invite image
- The rest of the flow (saving `invite_image_url` to the event, email sending) stays identical since emails already use the saved image URL

**2. InviteTemplatePicker.tsx** — Minor adjustment
- Accept an optional `onUploadCustom` callback prop
- Render a small text link below the template grid: "Or upload your own design"

**3. Save logic adjustment**
- When `templateId === "custom"`, upload the raw file blob instead of calling `renderInviteToBlob`
- Save `invite_template: "custom"` to the event so it restores correctly on reload
- When loading a saved event with `invite_template === "custom"`, show the saved image URL as the custom preview

**4. Preview mode**
- When custom is selected, preview shows the uploaded image directly (full-width `<img>`) instead of rendering a template component

**5. Email — no changes needed**
- The transactional email template (`shower-invitation.tsx`) already renders whatever `imageUrl` is provided — it will work with the custom upload URL identically to generated invites

### Technical notes
- File upload path: `{user.id}/invites/{event.id}/invite.png` (same as current)
- No database migration needed — existing `invite_template` column stores the string `"custom"`
- No edge function changes — email already uses `invite_image_url` from the event

