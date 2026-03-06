'use client'

import Footer from '@/components/Footer';
import Link from 'next/link'

export default function Page() {
    return (
        <div className="w-full">
            <main className="font-montserrat text-gray-800 overflow-x-hidden bg-white">

            {/* Hero Section */}
            <section className="relative pt-24 pb-0 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
                <div className="absolute inset-0">
                    <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80" alt="Person on scooter" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-400/70 to-gray-300/90" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-br from-green-700 to-green-800" style={{ clipPath: 'polygon(0 30%, 100% 0, 100% 100%, 0 100%)' }} />

                <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-32">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">JOIN OUR JOURNEY</h1>
                    <p className="text-2xl md:text-3xl text-white">Collaborate and Innovate with ANDES</p>
                </div>
            </section>

            {/* Why Join Andes Section */}
            <section className="py-20 px-[5%] bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" alt="ANDES team members in blue uniforms" className="w-full h-auto object-cover" />
                        </div>

                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Why join Andes?</h2>
                            <p className="text-lg text-gray-600 leading-relaxed mb-4">Joining Andes Shared Scooter Company Limited means being part of innovative mobility solutions and driving the green revolution in urban transport. Here, you'll work with a group of passionate professionals to shape the way we travel in the cities of the future.</p>
                            <p className="text-lg text-gray-600 leading-relaxed mb-4">We offer a dynamic and supportive work environment that provides space for professional development and growth. We encourage innovative thinking and collaboration, and are committed to creating a positive workplace culture.</p>
                            <p className="text-lg text-gray-600 leading-relaxed">Whether you're a recent graduate or an experienced professional, Andes is the ideal place to contribute to building more livable and sustainable communities.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* People Walking Section */}
            <section className="py-12 px-[5%] bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="relative overflow-hidden rounded-2xl shadow-xl">
                        <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80" alt="Team collaboration" className="w-full h-64 object-cover" />
                    </div>
                </div>
            </section>

            {/* Join Us Today Section */}
            <section className="py-20 px-[5%] bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="relative overflow-hidden rounded-2xl shadow-2xl order-2 lg:order-1">
                            <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80" alt="Large team gathering on field" className="w-full h-auto object-cover" />
                        </div>

                        <div className="order-1 lg:order-2">
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Join us today</h2>
                            <p className="text-lg text-gray-600 leading-relaxed">Learn more about our openings here.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Photo Banner */}
            <section className="py-12 px-[5%] bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="relative overflow-hidden rounded-2xl shadow-xl">
                        <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80" alt="Team photo on grass" className="w-full h-80 object-cover" />
                    </div>
                </div>
            </section>

            {/* Teamwork Section */}
            <section className="py-20 px-[5%] bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                            <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80" alt="ANDES soccer team with banner" className="w-full h-auto object-cover" />
                        </div>

                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Teamwork</h2>
                            <p className="text-lg text-gray-600 leading-relaxed">At Andes, we champion a team culture of open communication, mutual respect, and mutually beneficial collaboration. Through interdepartmental cooperation, we bring together multiple perspectives and creativity to achieve the company's long-term goals.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Grid Section */}
            <section className="py-20 px-[5%] bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16">Our Core Values</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Innovation</h3>
                            <p className="text-gray-600 leading-relaxed">We constantly push boundaries and embrace new ideas to transform urban mobility.</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Collaboration</h3>
                            <p className="text-gray-600 leading-relaxed">Together we achieve more through open communication and mutual support.</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Sustainability</h3>
                            <p className="text-gray-600 leading-relaxed">We're committed to creating eco-friendly solutions for a greener future.</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Growth</h3>
                            <p className="text-gray-600 leading-relaxed">We invest in our people and provide opportunities for professional development.</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Community</h3>
                            <p className="text-gray-600 leading-relaxed">We build strong relationships and make positive impacts in local communities.</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Integrity</h3>
                            <p className="text-gray-600 leading-relaxed">We operate with transparency, honesty, and ethical business practices.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-[5%] bg-gradient-to-br from-cyan-500 to-blue-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Make a Difference?</h2>
                    <p className="text-xl text-white mb-10 leading-relaxed">Join our team and help shape the future of urban mobility. Explore career opportunities at ANDES today.</p>
                    <a href="#apply" className="inline-block px-12 py-4 bg-white text-cyan-600 font-semibold text-lg rounded-full hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1">View Open Positions</a>
                </div>
            </section>

            {/* Footer */}
            <Footer/>
        </main>
        </div>
    );
}