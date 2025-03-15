import React from 'react';

const DiscountEditor = ({
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue
}) => {
    return (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Apply Discount</h4>
            <div className="flex items-center space-x-4">
                <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="p-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                    <option value="none">No Discount</option>
                    <option value="percentage">Percentage</option>
                    <option value="absolute">Absolute Amount</option>
                </select>

                {discountType !== 'none' && (
                    <div className="flex items-center">
                        <input
                            type="number"
                            min="0"
                            max={discountType === 'percentage' ? "100" : undefined}
                            step="0.01"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            className="w-24 p-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <span className="ml-2 text-green-800">
                            {discountType === 'percentage' ? '%' : '₹'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiscountEditor;
