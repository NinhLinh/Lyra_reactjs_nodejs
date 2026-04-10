import React from 'react';
import Banner from '../components/Banner';
import MainCateList from '../components/MainCateList';

const Home: React.FC = () => {
    return (
        <>
            <Banner />
            <div className="flex-grow container mx-auto mt-6 md:mt-[80px]">
                <h2 className="text-3xl md:text-6xl text-center tracking-tight text-gray-900 mb-6 md:mb-10">
                    Lyra Fashion Stores
                </h2>
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1">
                        <MainCateList />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Home;

