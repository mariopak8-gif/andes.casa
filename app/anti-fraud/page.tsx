import Image from 'next/image';

export default function AntiFraudPage() {
  return (
    <div className="font-montserrat text-gray-800 overflow-x-hidden bg-gray-50">
     

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Background Image with Team */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&q=80"
            alt="ANDES Team"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30" />
        </div>

        {/* Curved Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" style={{ clipPath: 'ellipse(100% 100% at 50% 100%)' }} />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-32">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">JOIN OUR JOURNEY</h1>
          <p className="text-2xl md:text-3xl text-white">Collaborate and Innovate with ANDES</p>
        </div>
      </section>

      {/* Empowering Global Collaboration Section */}
      <section className="py-16 px-[5%] bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Images */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative overflow-hidden rounded-2xl shadow-lg">
              <Image
                src="/GlobalNetwork.png"
                alt="Certificate"
                width={400}
                height={256}
                className="w-full h-64 object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-2xl shadow-lg mt-8">
              <Image
                src="/Safe&SecureRides.jpg"
                alt="Business professional"
                width={400}
                height={256}
                className="w-full h-64 object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Empowering Global Collaboration</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              Join us in fostering a robust sharing economy that benefits communities worldwide. At ANDES, we are
              committed to transparency, integrity, and innovation.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-16 px-[5%] bg-gray-50">
        <div className="max-w-5xl mx-auto">
          {/* Common Scams Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Common Scams to Be Aware Of</h2>

            <div className="space-y-8">
              {[
                {
                  title: '1. Impersonation of Influencer Popularity',
                  desc: 'Scammers use the popularity and influence of well-known individuals to promote fraudulent investment schemes, often asking for a non-refundable deposit.',
                },
                {
                  title: '2. Fake Investment Platforms',
                  desc: '(Forex, Bitcoin, Cryptocurrency) → Scammers use social media or WhatsApp to lure victims with promises of high returns and then disappear with the money.',
                },
                {
                  title: '3. Online Shopping Scams and Phishing Sites',
                  desc: '(through platforms such as Mercado Libre, Linio) → They create fake websites to deceive consumers, charge for products that were never delivered or steal bank details.',
                },
                {
                  title: '4. "Get Paid to Review a Movie" Scams',
                  desc: 'These scams claim to hire individuals to boost the ratings of a movie and require an upfront deposit. In reality, this is a scam that is very similar to earlier fraud tactics.',
                },
              ].map((scam, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-md">
                  <h3 className="text-xl font-semibold text-cyan-600 mb-3">{scam.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{scam.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Common Features Section */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">After analysis, we can identify the common features of all these scams:</h3>

            <div className="space-y-4 mb-8">
              {[
                'No real industry support; they promise extremely high returns and guaranteed compensation for losses.',
                'Lack of transparency in revenue sources.',
                'Heavy reliance on word-of-mouth promotion and exaggerated promises.',
                'Unregulated financial transactions.',
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-red-500 text-2xl mt-1">✕</span>
                  <p className="text-gray-700">{feature}</p>
                </div>
              ))}
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">In contrast, ANDES is completely different:</h3>

            <div className="space-y-4">
              {[
                'Backed by real assets: shared bike infrastructure. We do not promise high returns - the profit is only a few dollars a day.',
                'Revenue comes from the real rental market.',
                'Clear and well-defined development plan.',
                'All business operations are transparent, official and verifiable.',
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-green-500 text-2xl mt-1">✓</span>
                  <p className="text-gray-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Special Reminder */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-8 mb-16 rounded-r-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Special reminder:</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Scammers often impersonate legitimate companies to deceive people. Just as fake versions of well-known brands such as LV, Chanel, Nike and Adidas are widely available in the market, criminals may use ANDES's growing brand awareness for illegal purposes in the future.
            </p>
            <p className="text-gray-700 leading-relaxed">
              As the ANDES brand continues to expand in Australia and New Zealand, fraudulent activities involving imitation, counterfeiting or misuse of the ANDES name are increasingly likely to occur.
            </p>
          </div>

          {/* How to Join ANDES Safely */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">How to Join ANDES Safely</h2>

            <div className="space-y-4">
              {[
                'Only register through official recommendations or authorized channels.',
                'Reject any offers that promise abnormally high returns or unauthorized promotions.',
                'If you have any questions or concerns, please contact your official marketing manager or ANDES customer service immediately. Exercise caution, make good judgments, and work together to protect the integrity and bright future of the ANDES brand.',
              ].map((tip, index) => (
                <div key={index} className="flex items-start gap-3 bg-white p-6 rounded-xl shadow-md">
                  <span className="text-green-500 text-2xl mt-1">✓</span>
                  <p className="text-gray-700">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Registration Information */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-8 rounded-2xl mb-16">
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>ANDES Sharing Technology Co., Ltd.</strong> is registered in Hong Kong and the United Kingdom (Hong Kong Registration Number: 77172511 / UK Registration Number: 16449598) and is duly authorized as a Money Service Business (MSB) by the US Financial Crimes Enforcement Network (FinCEN).
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              The MSB Registration Search webpage is updated weekly and includes entities officially registered as Money Service Businesses (MSBs). These entities are regulated by FinCEN under 31 CFR §1022.380(a)–(f) of the Bank Secrecy Act (BSA).
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>ANDES Shared Technology Co., Ltd. (MSB Registration No. 31000030308227)</strong> is authorized by the U.S. financial authorities to provide the following services:
            </p>
          </div>

          {/* Services List */}
          <div className="bg-white p-8 rounded-2xl shadow-lg mb-16">
            <ol className="space-y-3 text-gray-700 list-decimal list-inside">
              {[
                'Remittance services',
                'Currency exchange services',
                'Check cashing',
                'Issuance or sale of prepaid cards, traveler\'s checks, money orders, etc.',
                'Cryptocurrency-related services (such as virtual asset trading platforms)',
              ].map((service, index) => (
                <li key={index} className="text-cyan-600 font-medium">
                  {service}
                </li>
              ))}
            </ol>
            <p className="text-gray-600 mt-6 leading-relaxed">
              Investment services are provided by ANDES Shared Technology Co., Ltd., which is headquartered in Hong Kong and the United Kingdom and is a Money Services Business (MSB) duly authorized and regulated by the U.S. financial authorities.
            </p>
          </div>

          {/* Verification Notice */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-8 rounded-r-xl mb-16">
            <p className="text-gray-700 leading-relaxed mb-4">
              All official documents, licenses and registrations related to ANDES can be freely verified through official channels to ensure their legitimacy and authenticity. YS is committed to operating in a transparent, open and fully legal manner. We strongly encourage all business partners and potential investors to conduct appropriate verification through official sources to protect their right to know and build trust in our partnership.
            </p>
          </div>

          {/* Our Commitment */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Commitment:</h2>
            {[
              'Joining the ANDES bike-sharing program means that you have confidence in the potential and development prospects of the industry. This not only represents a market opportunity, but also a commitment to the future of sustainable mobility.',
              'However, if you do not have a strong willingness to cooperate, lack confidence in the growth potential of the industry, or remain skeptical, we respectfully urge you to carefully reconsider your decision and choose to withdraw from the partnership. In this case, we will process your refund within 10 minutes.',
              'When you lack confidence in the future of an industry, you may find yourself living in fear of losing your investment every day - a state that is neither necessary nor healthy.',
              'In China, the bike-sharing industry actively supports the government\'s initiatives to attract investment and adopts a mutually beneficial business model to promote local development and shared prosperity.',
              'We are committed to positioning the ANDES brand as a market leader, creating jobs in the region, breaking the traditional work model, helping people generate additional income, and thus making a positive contribution to the economy and society.',
            ].map((paragraph, index) => (
              <p key={index} className="text-gray-700 leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Closing Message */}
          <div className="bg-gray-100 p-8 rounded-2xl">
            <p className="text-gray-700 leading-relaxed mb-4 font-semibold">Thank you for taking the time to read this article.</p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Raising risk awareness may not make you rich immediately, but it can protect your assets and personal safety at critical moments and prevent significant losses due to negligence.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Risk prevention is a long-term investment - it may not produce immediate, amazing results, but it provides lasting peace of mind and a lasting sense of security.
            </p>
            <p className="text-gray-600 leading-relaxed">
              In this era of opportunity and uncertainty, staying vigilant and making wise, rational decisions are undoubtedly the wisest and most prudent choices for yourself and your loved ones.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-[5%]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-playfair text-xl font-bold">ANDES</span>
            </div>
            <p className="text-gray-400 text-sm">Empowering a Global Sharing Economy for Tomorrow's Leaders</p>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="/" className="hover:text-cyan-500 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/about" className="hover:text-cyan-500 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="/anti-fraud" className="hover:text-cyan-500 transition-colors">
                  Anti-fraud
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="#faq" className="hover:text-cyan-500 transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-cyan-500 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-cyan-500 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Connect</h4>
            <p className="text-gray-400 text-sm mb-4">Follow us on social media</p>
            <div className="flex gap-4">
              {['f', 't', 'in'].map((icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center hover:bg-cyan-600 transition-colors"
                >
                  <span className="text-white font-bold">{icon}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2026 ANDES. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}