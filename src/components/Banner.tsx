import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const images = [
    "https://cdn2.mageplaza.com/services/case_study/southland/Banner.webp",
    "https://cdn2.mageplaza.com/services/case_study/peter-stevens/Banner.webp",
    "https://cdn2.mageplaza.com/services/case_study/bean-bag-r-us/banner.webp",
    "https://cdn2.mageplaza.com/services/case_study/ducati-melbourne/Banner.webp"
];

const loopImages = [...images, images[0]];

const Banner = () => {
    const [index, setIndex] = useState(0);
    const [enableTransition, setEnableTransition] = useState(true);
    const intervalRef = useRef(null);

    useEffect(() => {
        images.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    }, []);

    useEffect(() => {
        const start = () => {
            if (intervalRef.current) return;
            intervalRef.current = setInterval(() => {
                setIndex((prev) => prev + 1);
            }, 4000);
        };

        const stop = () => {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        };

        const handleVisibility = () => {
            if (document.hidden) {
                stop();
            } else {
                setEnableTransition(false);
                setIndex((prev) => prev % images.length);
                requestAnimationFrame(() => {
                    setEnableTransition(true);
                });
                start();
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);
        start();

        return () => {
            stop();
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);

    useEffect(() => {
        if (!enableTransition) {
            requestAnimationFrame(() => {
                setEnableTransition(true);
            });
        }
    }, [enableTransition]);

    return (
        <section className="relative h-screen w-full overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="flex h-full"
                    animate={{ x: `-${index * 100}%` }}
                    transition={
                        enableTransition
                            ? { duration: 0.8, ease: "easeInOut" }
                            : { duration: 0 }
                    }
                    onAnimationComplete={() => {
                        if (index === images.length) {
                            setEnableTransition(false);
                            setIndex(0);
                        }
                    }}
                >
                    {loopImages.map((img, i) => (
                        <div key={i} className="min-w-full h-full bg-gray-900">
                            <img
                                src={img}
                                alt="banner"
                                loading="eager"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                </motion.div>
            </div>

            <div className="absolute inset-0 bg-black/40"></div>

            <div className="relative z-10 container mx-auto h-full flex items-center px-4">
                <div className="max-w-xl">
                    <motion.h1
                        initial={{ y: 60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="text-white text-5xl md:text-7xl font-bold !leading-tight italic"
                    >
                        Timeless Style, <br /> Effortless You
                    </motion.h1>

                    <motion.p
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-4 text-white/80 italic"
                    >
                        New Collection 2026 – Crafted for Modern Women
                    </motion.p>

                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-6 flex gap-4"
                    >
                        <a href="/products"
                            className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition">
                            Shop Now
                        </a>

                        <a href="/about-us"
                            className="border border-white px-6 py-3 rounded-full text-white hover:bg-white hover:text-black transition">
                            Learn More
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Banner;
