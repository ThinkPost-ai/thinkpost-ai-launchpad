
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <Header />
      
      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-6 max-w-4xl">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-4xl font-bold text-deep-blue dark:text-white mb-4">
              Privacy Policy
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              <strong>Effective Date:</strong> June 3, 2025
            </p>
            
            <p className="text-gray-700 dark:text-gray-300 mb-8">
              Welcome to <strong>ThinkPost</strong>. We are committed to protecting your personal information and your right to privacy. This Privacy Policy describes how we collect, use, and protect your data when you use our platform.
            </p>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                1. Information We Collect
              </h2>
              
              <h3 className="text-xl font-medium text-deep-blue dark:text-white mb-3">
                a. Personal Information
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                When you register or use ThinkPost, we may collect:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6">
                <li>Your name and email address</li>
                <li>Your restaurant's name, location, and basic business info</li>
                <li>Account credentials (username, password)</li>
                <li>TikTok account details (if you connect it)</li>
              </ul>

              <h3 className="text-xl font-medium text-deep-blue dark:text-white mb-3">
                b. Usage Data
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may collect:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6">
                <li>Media you upload (e.g. food photos, videos)</li>
                <li>AI-generated captions created through our platform</li>
                <li>Interaction logs (time spent, features used)</li>
              </ul>

              <h3 className="text-xl font-medium text-deep-blue dark:text-white mb-3">
                c. Device & Technical Info
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We automatically collect:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Device type, browser, OS</li>
                <li>IP address and location (approximate)</li>
                <li>Cookies and usage analytics</li>
              </ul>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                2. How We Use Your Data
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use your data to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Operate and maintain the ThinkPost platform</li>
                <li>Generate marketing content using AI</li>
                <li>Schedule and publish your posts to TikTok</li>
                <li>Improve the platform based on usage analytics</li>
                <li>Communicate with you (support, updates, etc.)</li>
              </ul>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                3. Sharing Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We do <strong>not</strong> sell your personal data. We may share it only with:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Trusted service providers (e.g. hosting, analytics, OpenAI, TikTok API)</li>
                <li>Legal authorities when required to comply with laws</li>
                <li>Partners that support our platform operations (under strict privacy terms)</li>
              </ul>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                4. Data Security
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We protect your data through:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                <li>Encrypted storage and secure transmission</li>
                <li>Access controls to prevent unauthorized use</li>
                <li>Regular reviews of our infrastructure and codebase</li>
              </ul>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                5. Your Privacy Rights
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Access or correct your personal data</li>
                <li>Request deletion of your account and data</li>
                <li>Object to how we process your data (in some cases)</li>
                <li>Withdraw TikTok or other app authorizations at any time</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                To make any requests, email us at: <strong>support@thinkpost.co</strong>
              </p>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                6. Cookies & Tracking
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use cookies to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Keep you logged in</li>
                <li>Save preferences (like language)</li>
                <li>Understand how users interact with our platform</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                You can control cookies via your browser settings.
              </p>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                7. Third-Party Services
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                If you connect TikTok or other third-party platforms, their data usage is subject to their own privacy policies. We recommend reviewing them separately.
              </p>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                8. Children's Privacy
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                ThinkPost is not intended for children under 13. We do not knowingly collect data from users under this age.
              </p>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                9. Changes to This Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may update this policy as we grow. If we make significant changes, we'll notify you via email or app notification.
              </p>
            </section>

            <hr className="my-8 border-gray-200 dark:border-gray-700" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-deep-blue dark:text-white mb-4">
                10. Contact Us
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                For any questions or concerns about your privacy, please contact:
              </p>
              <div className="text-gray-700 dark:text-gray-300">
                <p className="font-semibold">ThinkPost Team</p>
                <p>Email: support@<strong>thinkpost.co</strong></p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
