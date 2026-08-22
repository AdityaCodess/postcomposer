import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 font-sans selection:bg-zinc-800 selection:text-white py-12 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium mb-10 inline-flex items-center gap-2 transition-colors">
          &larr; Back to Home
        </Link>
        
        <header className="mb-12 pb-8 border-b border-zinc-800/80">
          <h1 className="text-4xl font-bold text-zinc-100 mb-4 tracking-tight">Privacy Policy</h1>
          <p className="text-zinc-500">Effective Date: August 2026</p>
        </header>

        <div className="space-y-10 text-zinc-400 leading-relaxed text-sm md:text-base">
          
          <section>
            <h2 className="text-2xl font-semibold text-zinc-200 mb-4">1. Introduction</h2>
            <p>
              Welcome to Postifye. We are committed to protecting your personal information and your right to privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our application 
              and use our social media scheduling and AI generation services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-200 mb-4">2. Information We Collect</h2>
            <div className="space-y-3">
              <p>We collect personal information that you voluntarily provide to us when registering for the application, including:</p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-400">
                <li><strong className="text-zinc-300">Account Credentials:</strong> Your name, email address, and encrypted password.</li>
                <li><strong className="text-zinc-300">Authentication Data:</strong> When logging in via Google Auth, we collect your basic profile information (name and email) strictly for account creation and secure access.</li>
                <li><strong className="text-zinc-300">OAuth Tokens:</strong> When you connect third-party platforms (Twitter, LinkedIn), we securely store the required OAuth 2.0 access and refresh tokens to publish content on your behalf.</li>
                <li><strong className="text-zinc-300">User Content:</strong> The text, media, and prompts you input into our composer and save to your dashboard history.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-200 mb-4">3. AI Processing and Data Usage</h2>
            <p className="mb-3">
              Postifye utilizes generative AI to assist in creating social media content. When you use our AI generation features:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The topics, keywords, and prompts you provide are securely transmitted to Google's Gemini AI API for processing.</li>
              <li>We do not use your personal social media data or connected account history to train these AI models.</li>
              <li>The generated content is returned to your dashboard and is not published anywhere until you explicitly initiate the publish action.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-200 mb-4">4. Third-Party Integrations</h2>
            <p className="mb-3">Our application acts as a conduit to authorized third-party platforms. By connecting these platforms, you agree to their respective privacy policies:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-zinc-300">Twitter/X API:</strong> We utilize this connection solely to publish tweets based on your explicit commands. We do not read your timeline or direct messages.</li>
              <li><strong className="text-zinc-300">LinkedIn API:</strong> We utilize this connection to publish User-Generated Content (UGC) to your authenticated profile.</li>
            </ul>
            <p className="mt-3 text-xs italic">
              You may revoke Postifye's access to these accounts at any time via the "Disconnect" button in your dashboard or directly through the security settings of the respective third-party platforms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-200 mb-4">5. Cookies and Local Storage</h2>
            <p>
              We use strictly necessary browser storage mechanisms (such as LocalStorage) to maintain your secure session. Specifically, we store a JSON Web Token (JWT) locally on your device to keep you authenticated across page reloads. We do not use tracking cookies or third-party advertising pixels.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-200 mb-4">6. Data Security</h2>
            <p>
              We implement industry-standard security measures, including bcrypt password hashing, JWT-based route protection, and environment-secured API keys. While we strive to use commercially acceptable means to protect your personal data, no transmission method over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-200 mb-4">7. Data Retention & Account Deletion</h2>
            <p>
              We retain your information only as long as your account is active. You maintain the right to complete data erasure. 
              Using the "Delete Account" feature in your dashboard settings will immediately and permanently destroy:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Your user profile and credentials.</li>
              <li>All stored OAuth 2.0 connection tokens.</li>
              <li>Your entire database history of drafted and published posts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-200 mb-4">8. Contact Us</h2>
            <p>
              If you have questions or comments about this policy, or wish to exercise your data rights, please contact us at: <a href="mailto:privacy@postifye.com" className="text-indigo-400 hover:underline">privacy@postifye.com</a>.
            </p>
          </section>
          
        </div>
        
        <footer className="mt-16 pt-8 border-t border-zinc-800/80 text-center text-sm text-zinc-600">
          <p>© {new Date().getFullYear()} Postifye. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Privacy;