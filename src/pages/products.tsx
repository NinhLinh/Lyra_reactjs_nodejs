import React from 'react';
import ProductList from '../components/ProductList';

const Products: React.FC = () => {
    return (
        <section className="">
            <div className="lg:max-w-6xl mx-auto py-[90px] md:py-[100px] px-4">
                <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-6 mt-5 md:mt-10">
                  Product List
                </h1>
                <ProductList/>
            </div>
        </section>
    );
};

export default Products;

