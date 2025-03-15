import React from 'react';
import ItemsEditor from './ItemsEditor';
import TaxesEditor from './TaxesEditor';
import DiscountEditor from './DiscountEditor';

const ReceiptItems = ({
    imagePreview,
    editingPrices,
    setEditingPrices,
    editedItems,
    setEditedItems,
    editedTaxes,
    setEditedTaxes,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    calculateCurrentTotal,
    handlePriceChange,
    handleTaxChange,
    handleTaxNameChange,
    addNewTax,
    removeTax
}) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-indigo-800">Receipt Items</h2>

            {/* Two column layout with image and items */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Receipt image column */}
                <div className="w-full md:w-1/2">
                    <h3 className="text-lg font-semibold mb-2 text-indigo-700">Original Receipt</h3>
                    {imagePreview && (
                        <img
                            src={imagePreview}
                            alt="Receipt"
                            className="max-w-full border rounded-lg shadow-sm"
                            style={{ maxHeight: '500px', objectFit: 'contain' }}
                        />
                    )}
                </div>

                {/* Extracted items and taxes column */}
                <div className="w-full md:w-1/2">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-indigo-700">Extracted Items</h3>
                        <button
                            onClick={() => setEditingPrices(!editingPrices)}
                            className={`text-sm px-3 py-1 rounded font-medium ${editingPrices
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                }`}
                        >
                            {editingPrices ? 'Reset to Original' : 'Edit Prices'}
                        </button>
                    </div>

                    <div className="space-y-2">
                        <ItemsEditor
                            editedItems={editedItems}
                            editingPrices={editingPrices}
                            handlePriceChange={handlePriceChange}
                        />

                        <TaxesEditor
                            editedTaxes={editedTaxes}
                            editingPrices={editingPrices}
                            handleTaxChange={handleTaxChange}
                            handleTaxNameChange={handleTaxNameChange}
                            addNewTax={addNewTax}
                            removeTax={removeTax}
                        />

                        <DiscountEditor
                            discountType={discountType}
                            setDiscountType={setDiscountType}
                            discountValue={discountValue}
                            setDiscountValue={setDiscountValue}
                        />

                        <div className="p-3 bg-indigo-200 rounded-lg">
                            <p className="font-bold text-indigo-900">Total</p>
                            <p className="text-right font-bold text-indigo-900">
                                ₹{calculateCurrentTotal().toFixed(2)}
                            </p>

                            {discountType !== 'none' && parseFloat(discountValue) > 0 && (
                                <div className="mt-1 text-xs text-right text-green-700">
                                    <p>Original: ₹{(editedItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) +
                                        editedTaxes.reduce((sum, tax) => sum + (parseFloat(tax.amount) || 0), 0)).toFixed(2)}</p>
                                    <p>Discount: {discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {editingPrices && (
                        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                            <p>✏️ Edit the prices above to correct any OCR errors before proceeding.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReceiptItems;
