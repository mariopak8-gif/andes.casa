import Link from 'next/link';
import React from 'react'

const Navigation = () => {
    const links = [{
        name: 'Home',
        href: '/'
    }, {
        name: 'About Us',
        href: '/about'
    }, {
        name: 'Anti-fraud',
        href: '/anti-fraud'
    }, {
        name: 'Occupation',
        href: '/occupation'
    }, {
        name: 'Joining process',
        href: '/joining'
    }];
    return (
        <nav className="fixed top-0 left-0 right-0 flex justify-between items-center px-[5%] py-6 bg-gradient-to-b from-white/95 to-white/85 backdrop-blur-lg z-50 shadow-md">
            <div className="font-playfair text-3xl font-bold text-cyan-500 tracking-widest">
                ANDES
            </div>
            <ul className="hidden md:flex gap-10 list-none">
                {
                    links.map((item, index) => (
                        < li key={index} >
                            <Link
                                href={item.href}
                                className="text-gray-800 font-medium text-sm relative hover:text-cyan-500 transition-colors duration-300 
                                after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyan-500 
                                after:transition-all after:duration-300 hover:after:w-full"
                            >
                                {item.name}
                            </Link>
                        </li >
                    ))
                }
            </ul>
        </nav>
    )
}

export default Navigation


