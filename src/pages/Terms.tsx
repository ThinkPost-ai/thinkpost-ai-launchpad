
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <Header />
      
      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-6 max-w-4xl">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-4xl font-bold text-deep-blue dark:text-white mb-4">
              Terms of Service
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              <strong>Effective Date:</strong> June 3, 2025
            </p>
            
            <p className="text-gray-700 dark:text-gray-300 mb-8">
              Welcome to <strong>ThinkPost</strong>! These Terms of Service ("Terms") govern your use of the ThinkPost platform and services. By accessing or using ThinkPost, you agree to be bound by these Terms. If you do not agree, please do not use our services.
            </p>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                1. Overview
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                ThinkPost is an AI-powered platform that helps restaurant owners generate marketing captions (in Arabic and local dialects) and schedule posts to platforms like TikTok. Our goal is to simplify content creation and social media engagement.
              </p>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                2. Eligibility
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To use ThinkPost, you must:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Be at least 18 years old</li>
                <li>Have the legal capacity to enter into a contract</li>
                <li>Be the authorized representative of your restaurant or business</li>
              </ul>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                3. User Accounts
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You must create an account to access most ThinkPost features.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Provide accurate, complete information</li>
                <li>Keep your login credentials secure</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                You are responsible for all activity under your account.
              </p>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                4. Acceptable Use
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By using ThinkPost, you agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Use the platform only for lawful, authorized purposes</li>
                <li>Not upload or share content that is illegal, harmful, or violates the rights of others</li>
                <li>Not misuse the AI features to generate harmful or misleading content</li>
                <li>Not attempt to reverse engineer or interfere with the platform's functionality</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                We reserve the right to suspend or terminate accounts that violate these terms.
              </p>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                5. Intellectual Property
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                All content, trademarks, and software on ThinkPost are owned by ThinkPost or its licensors. You may use our services only as permitted under these Terms.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                You retain ownership of the media you upload and the captions generated for your business, but we may use anonymized data to improve our services.
              </p>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                6. AI-Generated Content Disclaimer
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                ThinkPost uses AI to generate captions and suggestions. While we aim for relevance and quality, you acknowledge that:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>AI output is generated automatically and may occasionally contain errors or inaccuracies</li>
                <li>You are solely responsible for reviewing and approving any content before posting</li>
                <li>We are not liable for any consequences resulting from use of AI-generated captions</li>
              </ul>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                7. TikTok Integration
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you connect your TikTok account:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>You authorize ThinkPost to upload content and schedule posts via TikTok's API</li>
                <li>You are responsible for complying with TikTok's community guidelines and terms</li>
                <li>You may revoke access at any time through TikTok or ThinkPost settings</li>
              </ul>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                8. Subscription & Payment
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If ThinkPost introduces paid plans in the future:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Pricing, billing cycles, and features will be clearly communicated</li>
                <li>You agree to provide valid payment information and authorize recurring charges if applicable</li>
                <li>All fees are non-refundable unless otherwise stated</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                Currently, ThinkPost is in MVP stage and free to use.
              </p>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                9. Termination
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You may delete your account at any time.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may suspend or terminate your access if you:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Violate these Terms</li>
                <li>Misuse the platform</li>
                <li>Engage in fraud or abuse</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                We may also discontinue or change any part of the platform without notice.
              </p>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                10. Limitation of Liability
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                ThinkPost is provided <strong>"as is"</strong> and <strong>"as available."</strong> We do not guarantee uninterrupted service or perfect accuracy of AI outputs.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To the fullest extent permitted by law, ThinkPost is <strong>not liable</strong> for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Loss of data, business, or profits</li>
                <li>Errors or inaccuracies in AI-generated content</li>
                <li>TikTok API changes or outages</li>
              </ul>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                11. Privacy
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Your use of ThinkPost is also governed by our{' '}
                <Link 
                  to="/privacy" 
                  className="text-deep-blue dark:text-blue-400 hover:underline font-medium"
                >
                  Privacy Policy
                </Link>, which explains how we collect and use your data.
              </p>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                12. Changes to Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may update these Terms from time to time. If we make material changes, we will notify you via email or in-app notification.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Your continued use of the platform constitutes acceptance of the updated Terms.
              </p>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                13. Governing Law
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                These Terms are governed by the laws of the Kingdom of Saudi Arabia (or specify a jurisdiction of your choice). Any disputes will be resolved in the appropriate courts of that jurisdiction.
              </p>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                14. Contact Us
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have questions or concerns about these Terms, contact us at:
              </p>
              <div className="text-gray-700 dark:text-gray-300">
                <p className="font-semibold">ThinkPost Team</p>
                <p>📧 Email: support@thinkpost.ai</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
