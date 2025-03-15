import React from 'react';

const ItemsEditor = ({ editedItems, editingPrices, handlePriceChange }) => {
    return (
        <>
            {editedItems.map((item, index) => (
                <div key={index} className="p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex justify-between items-center">
                    <p className="font-medium text-indigo-900">{item.name}</p>
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
