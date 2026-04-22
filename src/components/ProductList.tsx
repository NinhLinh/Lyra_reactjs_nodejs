import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {useCart} from '../context/CartContext';
import {FiCheck, FiPlus, FiSearch} from 'react-icons/fi';
import Pagination from './Pagination';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());

  const itemsPerPage = 8;
  const {addToCart} = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/products");
        setProducts(res.data);
        setFilteredProducts(res.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    setFilteredProducts(filtered);
    setPage(1);
  }, [search, products]);

  const paginatedProducts = filteredProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setAddedProducts(prev => new Set(prev).add(product._id));
    setTimeout(() => {
      setAddedProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product._id);
        return newSet;
      });
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans bg-[#FDFDFD]">
      <div className="relative mb-12">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"/>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-6 lg:gap-y-12">
        {paginatedProducts.map(product => (
          <div key={product._id} className="group flex flex-col">
            <div className="relative aspect-[3/4] mb-3 overflow-hidden rounded-xl lg:rounded-2xl bg-gray-100">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div
                className="absolute inset-x-0 bottom-0 p-2 lg:p-4 transition-transform duration-300 translate-y-0 lg:translate-y-full lg:group-hover:translate-y-0">
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={addedProducts.has(product._id)}
                  className={`w-full py-2 lg:py-3 rounded-lg lg:rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 backdrop-blur-md transition-all active:scale-95 ${
                    addedProducts.has(product._id)
                      ? 'bg-black text-white'
                      : 'bg-white/90 text-gray-900 lg:hover:bg-black/50 lg:hover:text-white'
                  }`}
                >
                  {addedProducts.has(product._id) ? (
                    <>
                      <FiCheck className="text-base lg:text-xl"/>
                      <span className="text-xs lg:text-sm">Added</span>
                    </>
                  ) : (
                    <>
                      <FiPlus className="text-sm lg:text-base"/>
                      <span className="text-xs lg:text-sm">Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col flex-grow px-1">
              <span className="text-[9px] lg:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Premium Collection
              </span>
              <h2
                className="text-sm lg:text-base font-semibold text-gray-800 group-hover:text-black transition-colors line-clamp-1">
                {product.name}
              </h2>
              <p className="text-base lg:text-lg font-black text-gray-900 mt-0.5">
                ${product.price.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center mt-16 gap-2">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          variant="compact"
        />
      </div>
    </div>
  );
};

export default ProductList;
