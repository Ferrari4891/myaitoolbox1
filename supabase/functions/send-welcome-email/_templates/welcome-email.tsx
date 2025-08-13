import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Img,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  displayName?: string;
  email: string;
}

export const WelcomeEmail = ({
  displayName = 'New Member',
  email,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to our community! Get started with your member benefits.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>Welcome to Smart Guide Books! 🎉</Heading>
        </Section>
        
        <Section style={content}>
          <Text style={greeting}>
            Hi {displayName},
          </Text>
          
          <Text style={text}>
            Thank you for joining our community! We're excited to have you on board and can't wait for you to explore all the amazing venues and experiences we have to offer.
          </Text>
          
          <Text style={text}>
            As a member, you now have access to:
          </Text>
          
          <ul style={list}>
            <li style={listItem}>🏆 Exclusive venue recommendations</li>
            <li style={listItem}>⭐ Rate and review your favorite places</li>
            <li style={listItem}>📚 Curated collections of top venues</li>
            <li style={listItem}>🎯 Personalized suggestions based on your preferences</li>
            <li style={listItem}>👥 Connect with other community members</li>
          </ul>
          
          <Text style={text}>
            Ready to get started? Log in to your account and begin discovering amazing places in your area!
          </Text>
          
          <Section style={buttonContainer}>
            <Link
              href={`${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovableproject.com`}
              style={button}
            >
              Explore Venues Now
            </Link>
          </Section>
          
          <Text style={text}>
            If you have any questions or need assistance, don't hesitate to reach out to our support team. We're here to help make your experience amazing!
          </Text>
          
          <Text style={signature}>
            Welcome aboard! 🚀<br />
            The Smart Guide Books Team
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            You're receiving this email because you signed up for Smart Guide Books.
          </Text>
          <Text style={footerText}>
            If you didn't create this account, you can safely ignore this email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  padding: '32px 24px',
  textAlign: 'center' as const,
}

const content = {
  padding: '0 24px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
}

const greeting = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  margin: '16px 0',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const list = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  paddingLeft: '20px',
}

const listItem = {
  margin: '8px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#000000',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const signature = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '32px 0 16px',
  fontWeight: '500',
}

const footer = {
  borderTop: '1px solid #e5e7eb',
  padding: '24px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '4px 0',
}