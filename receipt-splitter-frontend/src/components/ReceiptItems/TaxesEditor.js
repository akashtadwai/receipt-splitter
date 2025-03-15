import React from 'react';

const TaxesEditor = ({
    editedTaxes,
    editingPrices,
    handleTaxChange,
    handleTaxNameChange,
    addNewTax,
    removeTax
}) => {
    if (editedTaxes.length === 0 && !editingPrices) {
        return null;
    }

    return (
        <div className="mt-4">
            <h4 className="text-md font-semibold mb-2 text-amber-700 flex justify-between items-center">
                <span>Taxes & Fees</span>
                {editingPrices && (
                    <button
                        onClick={addNewTax}
                        className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200 hover:bg-amber-100"
                    >
                        + Add Tax
                    </button>
                )}
            </h4>

            {editedTaxes.map((tax, index) => (
                <div key={index} className="p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors flex justify-between items-center">
                    {editingPrices ? (
                        <div className="flex-1 flex items-center gap-2">
                            <input
                                type="text"
                                value={tax.name}
                                onChange={(e) => handleTaxNameChange(index, e.target.value)}
                                className="flex-1 p-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                            <button
                                onClick={() => removeTax(index)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <p className="font-medium text-amber-900">{tax.name}</p>
                    )}

                    {editingPrices ? (
                        <input
                            type="number"
                            step="0.01"
                            value={tax.amount}
                            onChange={(e) => handleTaxChange(index, e.target.value)}
                            className="w-24 p-1 text-right border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                    ) : (
                        <p className="text-right text-amber-800">₹{tax.amount.toFixed(2)}</p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default TaxesEditor;
