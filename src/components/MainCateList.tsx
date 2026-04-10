import React, {useEffect, useMemo, useRef, useState} from 'react';
import axios from 'axios';

interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
}

const MainCateList: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/products');
                const sortedProducts = res.data.sort(
                    (a: Product, b: Product) =>
                        new Date(b._id).getTime() - new Date(a._id).getTime()
                );
                setProducts(sortedProducts.slice(0, 3));
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };
        fetchProducts();
    }, []);
    useEffect(() => {
        const sectionNode = sectionRef.current;
        if (!sectionNode) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {threshold: 0.2}
        );
        observer.observe(sectionNode);
        return () => observer.disconnect();
    }, []);
    const cardLabels = useMemo(
        () => ['For Warmer Days', 'For Cooler Moments', 'For Layering'],
        []
    );
    const rotations = useMemo(() => ['md:-rotate-6', 'md:rotate-0', 'md:rotate-6'], []);
    const getDesktopEnterClass = (index: number) => {
        if (!isVisible) {
            if (index === 1) return 'md:translate-x-0 md:scale-95 md:opacity-0';
            if (index === 0) return 'md:translate-x-[115%] md:scale-95 md:opacity-0';
            return 'md:-translate-x-[115%] md:scale-95 md:opacity-0';
        }
        return 'md:translate-x-0 md:scale-100 md:opacity-100';
    };
    const getDelay = (index: number) => {
        if (index === 1) return '0ms';
        return '220ms';
    };
    return (
        <div ref={sectionRef} className="pb-5 px-4">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-10 items-center">
                {products.map((product, index) => (
                    <article
                        key={product._id}
                        className={`group relative bg-white p-4 h-fit transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] border
                          ${rotations[index] ?? 'md:rotate-0'}
                          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}
                          ${getDesktopEnterClass(index)}
                        `}
                        style={{transitionDelay: getDelay(index)}}
                    >
                        <div className={`overflow-hidden border border-neutral-200 bg-white ${index === 1 ? 'h-[500px]' : 'h-[360px]'}`}>
                            <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                        <h3 className="pt-5 pb-3 text-center text-3xl text-neutral-800">
                            {cardLabels[index] ?? product.name}
                        </h3>
                    </article>
                ))}
            </div>
        </div>
    );
};

export default MainCateList;
