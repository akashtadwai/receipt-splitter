import React from 'react';
import ReceiptCard from './ReceiptCard';

const ReceiptItems = ({
    imagePreviews,
    receiptData,
    editingPrices,
    setEditingPrices,
    calculateReceiptTotal,
    calculateCurrentTotal,
    handlePriceChange,
    handleNameChange,
    handleTaxChange,
    handleTaxNameChange,
    addNewTax,
    removeTax,
    setReceiptDiscount,
    removeReceipt
}) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-indigo-800">
                    Review Receipts ({receiptData.length})
                </h2>
                <button
                    onClick={() => setEditingPrices(!editingPrices)}
                    className={`text-sm px-3 py-1 rounded font-medium ${editingPrices
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                        }`}
                >
                    {editingPrices ? 'Done Editing' : 'Edit Prices/Names'}
                </button>
            </div>

            {editingPrices && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    ✏️ Edit prices and names to correct any OCR errors before proceeding.
                </div>
            )}

            {/* Horizontal scrollable receipt cards */}
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-2 px-2">
                {receiptData.map((data, index) => (
                    <ReceiptCard
                        key={index}
                        receiptIndex={index}
                        imagePreview={imagePreviews[index]}
                        items={data.items}
                        taxes={data.taxes}
                        discountType={data.discountType}
                        discountValue={data.discountValue}
                        editingPrices={editingPrices}
                        calculateReceiptTotal={calculateReceiptTotal}
                        handlePriceChange={handlePriceChange}
                        handleNameChange={handleNameChange}
                        handleTaxChange={handleTaxChange}
                        handleTaxNameChange={handleTaxNameChange}
                        addNewTax={addNewTax}
                        removeTax={removeTax}
                        setReceiptDiscount={setReceiptDiscount}
                        removeReceipt={removeReceipt}
                        totalReceipts={receiptData.length}
                    />
                ))}
            </div>

            {/* Combined Total */}
            <div className="p-4 bg-indigo-200 rounded-lg">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-900 text-lg">Combined Total</span>
                    <span className="font-bold text-indigo-900 text-xl">₹{calculateCurrentTotal().toFixed(2)}</span>
                </div>
                {receiptData.length > 1 && (
                    <p className="text-sm text-indigo-700 mt-1">
                        Total from {receiptData.length} receipts
                    </p>
                )}
            </div>
        </div>
    );
};

export default ReceiptItems;
