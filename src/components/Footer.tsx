import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-[#000] text-white p-5">
            <div className="max-w-xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between">
                    <div className="md:span-col-1">
                        <p className="text-white font-semibold text-2xl mb-5">LunaReact</p>
                        <div className="text-gray-400">contact me</div>
                    </div>
                    <div className="md:span-col-1 p-4 text-white">B</div>
                    <div className="md:span-col-1 p-4 text-white">C</div>
                    <div className="md:span-col-1 p-4 text-white">D</div>
                </div>
                <p className="text-center mt-5">&copy; 2024 LunaReact. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer; 