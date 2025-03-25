import React from 'react';

const ItemsEditor = ({ editedItems, editingPrices, handlePriceChange, handleNameChange }) => {
    return (
        <>
            {editedItems.map((item, index) => (
                <div key={index} className="p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex justify-between items-center">
                    {editingPrices ? (
                        <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleNameChange(index, e.target.value)}
                            className="flex-1 p-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    ) : (
                        <p className="font-medium text-indigo-900">{item.name}</p>
                    )}
                    {editingPrices ? (
                        <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handlePriceChange(index, e.target.value)}
                            className="w-24 p-1 text-right border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                    ) : (
                        <p className="text-right text-indigo-800">₹{item.price.toFixed(2)}</p>
                    )}
                </div>
            ))}
        </>
    );
};

export default ItemsEditor;
