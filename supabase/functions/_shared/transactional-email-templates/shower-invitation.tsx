import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Bump City"

interface ShowerInvitationProps {
  imageUrl?: string
  guestName?: string
  honoreeName?: string
  rsvpUrl?: string
  eventDate?: string
  location?: string
}

const ShowerInvitationEmail = ({
  imageUrl,
  guestName,
  honoreeName,
  rsvpUrl,
  eventDate,
  location,
}: ShowerInvitationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're invited to {honoreeName || "a"} baby shower!</Preview>
    <Body style={main}>
      <Container style={container}>
        {guestName && (
          <Text style={greeting}>Dear {guestName},</Text>
        )}
        <Text style={introText}>
          You're invited to celebrate {honoreeName ? `${honoreeName}'s` : 'a'} baby shower!
        </Text>

        {imageUrl && (
          <Section style={imageSection}>
            <Img
              src={imageUrl}
              alt="Baby Shower Invitation"
              width="100%"
              style={inviteImage}
            />
          </Section>
        )}

        {(eventDate || location) && (
          <Section style={detailsSection}>
            {eventDate && <Text style={detailText}>📅 {eventDate}</Text>}
            {location && <Text style={detailText}>📍 {location}</Text>}
          </Section>
        )}

        {rsvpUrl && (
          <Section style={buttonSection}>
            <Button style={rsvpButton} href={rsvpUrl}>
              RSVP Now
            </Button>
          </Section>
        )}

        <Text style={footer}>
          With love, The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ShowerInvitationEmail,
  subject: (data: Record<string, any>) =>
    `You're Invited to ${data.honoreeName || 'a'} Baby Shower!`,
  displayName: 'Shower Invitation',
  previewData: {
    guestName: 'Jane',
    honoreeName: 'Sarah',
    imageUrl: 'https://placehold.co/500x700/f5e6e0/8b6b60?text=Baby+Shower',
    rsvpUrl: 'https://bump-city.lovable.app/join?code=DEMO',
    eventDate: 'Saturday, May 10, 2026',
    location: 'Grandma\'s Garden',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Nunito', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }
const greeting = { fontSize: '16px', color: '#3d2b2b', margin: '0 0 8px' }
const introText = { fontSize: '16px', color: '#3d2b2b', lineHeight: '1.5', margin: '0 0 20px' }
const imageSection = { margin: '0 0 24px', textAlign: 'center' as const }
const inviteImage = { borderRadius: '8px', maxWidth: '100%' }
const detailsSection = { margin: '0 0 24px', padding: '16px', backgroundColor: '#fdf5f3', borderRadius: '8px' }
const detailText = { fontSize: '15px', color: '#5a3e3e', margin: '4px 0', lineHeight: '1.4' }
const buttonSection = { textAlign: 'center' as const, margin: '0 0 24px' }
const rsvpButton = {
  backgroundColor: '#c45a5a',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '13px', color: '#999999', margin: '30px 0 0', textAlign: 'center' as const }
