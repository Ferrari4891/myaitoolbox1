import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
  Section,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface NewMemberEmailProps {
  displayName?: string;
  email: string;
  tempPassword: string;
}

export const NewMemberEmail = ({
  displayName = 'New Member',
  email,
  tempPassword,
}: NewMemberEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Smart Guide Books - Your Account Details</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to Smart Guide Books!</Heading>
        
        <Text style={text}>Hello {displayName},</Text>
        
        <Text style={text}>
          An administrator has created an account for you on Smart Guide Books. 
          Below are your login credentials:
        </Text>

        <Section style={credentialsBox}>
          <Text style={credentialsTitle}>Your Login Credentials:</Text>
          <Text style={credentialsText}>
            <strong>Email:</strong> {email}
          </Text>
          <Text style={credentialsText}>
            <strong>Temporary Password:</strong> {tempPassword}
          </Text>
        </Section>

        <Text style={importantText}>
          🔒 <strong>Important:</strong> Please change your password after your first login for security.
        </Text>

        <Link
          href={`${Deno.env.get('SITE_URL') || 'https://gallopinggeezers.online'}/sign-in`}
          style={button}
        >
          Sign In to Your Account
        </Link>

        <Hr style={hr} />

        <Text style={text}>
          As a member of Smart Guide Books, you can:
        </Text>
        
        <Text style={benefitsList}>
          • 📍 Discover great venues and restaurants<br />
          • 🎉 Create and join community events<br />
          • ⭐ Rate and review venues<br />
          • 🤝 Connect with other community members
        </Text>

        <Text style={text}>
          If you have any questions or need assistance, please don't hesitate to reach out to our support team.
        </Text>

        <Text style={footer}>
          Best regards,<br />
          The Smart Guide Books Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default NewMemberEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 20px',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
  padding: '0 20px',
};

const credentialsBox = {
  backgroundColor: '#f8f9fa',
  border: '2px solid #e9ecef',
  borderRadius: '8px',
  margin: '24px 20px',
  padding: '20px',
};

const credentialsTitle = {
  color: '#495057',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const credentialsText = {
  color: '#495057',
  fontSize: '16px',
  margin: '8px 0',
  fontFamily: 'monospace',
};

const importantText = {
  color: '#dc3545',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '20px 0',
  padding: '16px 20px',
  backgroundColor: '#fff5f5',
  border: '1px solid #fed7d7',
  borderRadius: '6px',
  marginLeft: '20px',
  marginRight: '20px',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '24px 20px',
};

const benefitsList = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.8',
  margin: '16px 0',
  padding: '0 20px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 20px',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '32px 0 16px 0',
  padding: '0 20px',
};