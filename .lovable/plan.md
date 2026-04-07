
Fix missing invitation image in app emails

What I found
- The app email send is succeeding, but the invite image upload is failing first.
- Network logs show the storage write to `uploads/invites/{eventId}/invite.png` is rejected by storage rules.
- `src/pages/GuestListPage.tsx` does not stop when that upload fails. It still builds a public URL and sends the email, which is why the email can arrive with a blank/missing image.
- The current path also uses `upsert: true` on a shared `invites/...` path. That makes resends fragile under the current storage rules.
- There is also a second reliability issue: the image is generated at send time from an off-screen browser render, so every email depends on a live capture succeeding in that moment.

Plan
1. Save a real invite image on the event
   - Generate the invitation PNG when the host saves the design in Invite Builder.
   - Upload it to a user-owned path like `{user.id}/invites/{event.id}/invite.png` so it matches the project’s existing storage pattern and supports resends safely.
   - Store that image URL on the event record.

2. Send the saved image, not a fresh render
   - Update the guest email flow to use the saved invite image from the selected event.
   - If no saved image exists yet, stop and show a clear error like “Please save your invite first.”
   - Never continue to send the email if image generation or upload fails.

3. Make image export more reliable
   - Move the PNG generation into a dedicated export helper/component with explicit width, height, and background.
   - Keep the bundled-image data URI conversion, but use it in the export helper rather than relying on the interactive preview tree.
   - This makes the exported PNG stable and avoids transparent captures.

4. Keep resend support
   - Reuse the saved event image for resends instead of re-rendering on every click.
   - Keep the unique idempotency key so repeated sends are treated as separate attempts.
   - This gives consistent output every time the host resends.

5. Fix the RSVP URL source
   - Replace the hardcoded `https://bump-city.lovable.app` in `GuestListPage.tsx`.
   - Use the same origin logic already used by the share-invite flow so the RSVP button respects the custom domain.

Files to update
- `src/pages/InviteBuilderPage.tsx` — generate/upload the canonical invite PNG when saving
- `src/pages/GuestListPage.tsx` — use the saved event invite image, fail on upload/generation errors, fix RSVP origin
- `src/components/invites/InviteTemplates.tsx` or a new shared export helper — stable export rendering
- `src/contexts/ActiveEventContext.tsx` — add typed invite image fields instead of relying on `any`
- backend migration — add `invite_image_url` (and optionally `invite_image_path`) to `events`

Technical details
- The confirmed root cause is the failed storage upload, not just the email template.
- The current `invites/{eventId}/invite.png` path is the wrong shape for the app’s normal storage ownership pattern.
- Because the code ignores the upload error, users see “sent” even when the email image URL is invalid or stale.
- The most reliable architecture is: save one canonical invite image per event, then reuse that exact image in every email.

Verification after implementation
- Save an invite in Invite Builder and confirm the saved image loads correctly.
- Send to yourself from Guest List and confirm the exact chosen design appears in the email.
- Resend the same invite and confirm it still works.
- Click the RSVP button and confirm it opens on the custom domain, not the Lovable URL.
