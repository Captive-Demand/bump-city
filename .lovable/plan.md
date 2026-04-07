

# Send Visual Invitation via Email

## Problem
Currently "Send" on the guest list opens a plain-text `mailto:` link. You want it to send the actual designed invitation image with an RSVP button.

## Solution

### Flow
1. Host designs invite in Invite Builder → saves chosen template + text to the `events` table
2. On Guest List, tapping "Send" renders the invite template to a canvas image client-side, uploads it to storage, then sends a branded HTML email containing the invitation image + RSVP button

### Steps

**1. Add invite settings columns to `events` table**
- `invite_template` (text, nullable) — selected template ID (e.g. "baby-blocks")
- `invite_title` (text, nullable)
- `invite_message` (text, nullable)

This lets the Invite Builder save the host's choices so the Guest List page can retrieve them.

**2. Update Invite Builder to save settings**
- Add a "Save Invite" action that writes the selected template, title, and message to the event record
- Auto-load saved values when the page loads

**3. Scaffold transactional email infrastructure**
- Call `setup_email_infra` + `scaffold_transactional_email` to create the `send-transactional-email` Edge Function

**4. Create invitation email template**
- New file: `supabase/functions/_shared/transactional-email-templates/shower-invitation.tsx`
- Contains: a centered invitation image (from a URL passed via `templateData`), event details text below it, and a prominent "RSVP Now" button linking to the join/event page

**5. Render invite to image + upload to storage**
- In `GuestListPage`, when "Send" is tapped:
  - Render the chosen invite template off-screen using `html-to-image` (or `html2canvas`)
  - Upload the PNG to Supabase Storage (`uploads` bucket, path like `invites/{eventId}.png`)
  - Cache the URL so subsequent sends don't re-render

**6. Update `sendInvite` to use transactional email**
- Replace the `mailto:` approach with `supabase.functions.invoke('send-transactional-email', { body: { templateName: 'shower-invitation', recipientEmail, templateData: { imageUrl, rsvpUrl, guestName, honoreeName } } })`
- The RSVP URL links to `/join?code=XXXX` (uses existing invite code system)

### Technical Details

**Image rendering**: Use `html-to-image` library — renders a React component to a PNG data URL client-side. The invite template component is mounted in a hidden div, captured, then uploaded.

**Storage**: Use the existing `uploads` bucket. Path: `invites/{eventId}/invite.png`. Public URL is passed to the email template.

**Email template**: Uses `<Img>` from React Email to display the invitation image at full width, followed by a styled RSVP button.

## Files Changed
- **Migration**: add `invite_template`, `invite_title`, `invite_message` to `events`
- `src/pages/InviteBuilderPage.tsx` — save/load invite settings to event
- `supabase/functions/_shared/transactional-email-templates/shower-invitation.tsx` — new email template
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — register template
- `src/pages/GuestListPage.tsx` — render invite to image, upload, send via transactional email
- `package.json` — add `html-to-image` dependency

