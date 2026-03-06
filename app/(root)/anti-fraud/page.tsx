"use client";

import Footer from "@/components/Footer";
import Link from "next/link";

export default function Page() {
  return (
    <div className="w-full">
      <main className="font-montserrat text-gray-800 overflow-x-hidden bg-gray-50">
        

        <section className="relative pt-24 pb-20 overflow-hidden mt-12 md:mt-24 ">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&q=80"
              alt="ANDES Team"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30" />
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 h-20 bg-white"
            style={{ clipPath: "ellipse(100% 100% at 50% 100%)" }}
          />

          <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-32">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              JOIN OUR JOURNEY
            </h1>
            <p className="text-2xl md:text-3xl text-white">
              Collaborate and Innovate with ANDES
            </p>
          </div>
        </section>

        <section className="py-16 px-[5%] bg-white">
          <div className="max-w-7xl mx-auto flex md:flex-row flex-col justify-between gap-12 items-start">
            <div className="relative overflow-hidden w-94 h-64 rounded-2xl shadow-lg mt-8">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80"
                alt="Business professional"
                className=" object-cover w-94 h-64"
              />
            </div>

            <div className="w-full  md:py-10 ">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Empowering Global Collaboration
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Join us in fostering a robust sharing economy that benefits
                communities worldwide. At ANDES, we are committed to
                transparency, integrity, and innovation.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 px-[5%] bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Common Scams to Be Aware Of
              </h2>

              <div className="space-y-8">
                <div className="bg-white rounded-xl p-8 shadow-md">
                  <h3 className="text-xl font-semibold text-cyan-600 mb-3">
                    1. Impersonation of Influencer Popularity
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Scammers use the popularity and influence of well-known
                    individuals to promote fraudulent investment schemes, often
                    asking for a non-refundable deposit.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-md">
                  <h3 className="text-xl font-semibold text-cyan-600 mb-3">
                    2. Fake Investment Platforms
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    (Forex, Bitcoin, Cryptocurrency) → Scammers use social media
                    or WhatsApp to lure victims with promises of high returns.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-md">
                  <h3 className="text-xl font-semibold text-cyan-600 mb-3">
                    3. Online Shopping Scams and Phishing Sites
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    They create fake websites to deceive consumers, charge for
                    products that were never delivered or steal bank details.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-md">
                  <h3 className="text-xl font-semibold text-cyan-600 mb-3">
                    4. "Get Paid to Review a Movie" Scams
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    These scams claim to hire individuals to boost the ratings
                    of a movie and require an upfront deposit.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                After analysis, we can identify the common features of all these
                scams:
              </h3>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-red-500 text-2xl mt-1">✕</span>
                  <p className="text-gray-700">
                    No real industry support; they promise extremely high
                    returns and guaranteed compensation for losses.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-500 text-2xl mt-1">✕</span>
                  <p className="text-gray-700">
                    Lack of transparency in revenue sources.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-500 text-2xl mt-1">✕</span>
                  <p className="text-gray-700">
                    Heavy reliance on word-of-mouth promotion and exaggerated
                    promises.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-500 text-2xl mt-1">✕</span>
                  <p className="text-gray-700">
                    Unregulated financial transactions.
                  </p>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                In contrast, ANDES is completely different:
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-2xl mt-1">✓</span>
                  <p className="text-gray-700">
                    Backed by real assets: shared bike infrastructure. We do not
                    promise high returns.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-2xl mt-1">✓</span>
                  <p className="text-gray-700">
                    Revenue comes from the real rental market.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-2xl mt-1">✓</span>
                  <p className="text-gray-700">
                    Clear and well-defined development plan.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-2xl mt-1">✓</span>
                  <p className="text-gray-700">
                    All business operations are transparent, official and
                    verifiable.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-8 mb-16 rounded-r-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Special reminder:
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Scammers often impersonate legitimate companies to deceive
                people. Criminals may use ANDES's growing brand awareness for
                illegal purposes.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Fraudulent activities involving imitation, counterfeiting or
                misuse of the ANDES name are increasingly likely to occur.
              </p>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                How to Join ANDES Safely
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-white p-6 rounded-xl shadow-md">
                  <span className="text-green-500 text-2xl mt-1">✓</span>
                  <p className="text-gray-700">
                    Only register through official recommendations or authorized
                    channels.
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-white p-6 rounded-xl shadow-md">
                  <span className="text-green-500 text-2xl mt-1">✓</span>
                  <p className="text-gray-700">
                    Reject any offers that promise abnormally high returns or
                    unauthorized promotions.
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-white p-6 rounded-xl shadow-md">
                  <span className="text-green-500 text-2xl mt-1">✓</span>
                  <p className="text-gray-700">
                    If you have any questions or concerns, contact official
                    channels immediately.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-8 rounded-2xl mb-16">
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>ANDES Sharing Technology Co., Ltd.</strong> is
                registered in Hong Kong and the United Kingdom and is duly
                authorized as a Money Service Business (MSB) by the US Financial
                Crimes Enforcement Network (FinCEN).
              </p>
              <p className="text-gray-700 leading-relaxed">
                The MSB Registration Search webpage is updated weekly and
                includes entities officially registered as MSBs.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg mb-16">
              <ol className="space-y-3 text-gray-700 list-decimal list-inside">
                <li className="text-cyan-600 font-medium">
                  Remittance services
                </li>
                <li className="text-cyan-600 font-medium">
                  Currency exchange services
                </li>
                <li className="text-cyan-600 font-medium">Check cashing</li>
                <li className="text-cyan-600 font-medium">
                  Issuance or sale of prepaid cards, traveler's checks, money
                  orders, etc.
                </li>
                <li className="text-cyan-600 font-medium">
                  Cryptocurrency-related services
                </li>
              </ol>
              <p className="text-gray-600 mt-6 leading-relaxed">
                Investment services are provided by ANDES Shared Technology Co.,
                Ltd., headquartered in Hong Kong and the UK.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-8 rounded-r-xl mb-16">
              <p className="text-gray-700 leading-relaxed mb-4">
                All official documents, licenses and registrations related to
                ANDES can be freely verified through official channels.
              </p>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Commitment:
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Joining the ANDES bike-sharing program means that you have
                confidence in the potential and development prospects of the
                industry.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We are committed to positioning the ANDES brand as a market
                leader and creating jobs in the region.
              </p>
            </div>

            <div className="bg-gray-100 p-8 rounded-2xl">
              <p className="text-gray-700 leading-relaxed mb-4 font-semibold">
                Thank you for taking the time to read this article.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Raising risk awareness may not make you rich immediately, but it
                can protect your assets and personal safety.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Risk prevention is a long-term investment that provides lasting
                peace of mind.
              </p>
            </div>
          </div>
        </section>

        <Footer/>
      </main>
    </div>
  );
}
