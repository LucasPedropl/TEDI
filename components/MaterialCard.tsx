
import React from 'react';
import { Link } from 'react-router-dom';
import { Material } from '../types';

interface MaterialCardProps {
  material: Material;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 overflow-hidden transform hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-tedi-light p-3 rounded-xl flex-shrink-0 text-white font-bold text-xs uppercase">
            {material.type.slice(0,3)}
          </div>
          <span className="text-xs font-bold px-2 py-1 rounded border bg-gray-100 text-gray-800 border-gray-200">
            {material.format}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-tedi-dark leading-tight mb-3 group-hover:text-tedi-light transition-colors">
            {material.title}
        </h3>
        
        <p className="text-gray-600 mb-6 line-clamp-3 text-sm leading-relaxed">
            {material.description}
        </p>
        
        <div className="flex items-center text-xs text-gray-500 mt-auto border-t pt-4">
             <span className="truncate font-semibold">Autor: {material.author}</span>
        </div>
      </div>
      
      <div className="p-6 pt-0 mt-auto">
        <Link 
          to={`/material/${material.id}`}
          className="w-full text-center block bg-tedi-light hover:bg-tedi-dark text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-sm"
        >
          {material.cta}
        </Link>
      </div>
    </div>
  );
};

export default MaterialCard;
