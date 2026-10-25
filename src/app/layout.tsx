import type { Metadata } from 'next';
import './globals.css';
import { BRANDING } from '@/config/branding';
import { AuthProvider } from '@/context/auth-context';
import { ChatProvider } from '@/context/chat-context';
import { CallProvider } from '@/context/call-context';
import { DiscordVoiceProvider } from '@/context/discord-voice-context';
import { CallModal } from '@/components/call/CallModal';
import { ScreenShareViewerModal } from '@/components/chat/ScreenShareViewerModal';

export const metadata: Metadata = {
  title: BRANDING.meta.title,
  description: BRANDING.meta.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var grad = localStorage.getItem('genzoku_app_gradient');
                var primary = localStorage.getItem('genzoku_app_primary');
                if (grad) document.documentElement.style.setProperty('--brand-gradient', grad);
                if (primary) document.documentElement.style.setProperty('--brand-primary', primary);
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-brand-500 selection:text-white">
        <AuthProvider>
          <ChatProvider>
            <DiscordVoiceProvider>
              <CallProvider>
                {children}
                <CallModal />
                <ScreenShareViewerModal />
              </CallProvider>
            </DiscordVoiceProvider>
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
