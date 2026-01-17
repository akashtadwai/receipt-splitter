import React from 'react';
import ItemsEditor from './ItemsEditor';
import TaxesEditor from './TaxesEditor';
import DiscountEditor from './DiscountEditor';

const ReceiptCard = ({
    receiptIndex,
    imagePreview,
    items,
    taxes,
    discountType,
    discountValue,
    editingPrices,
    calculateReceiptTotal,
    handlePriceChange,
    handleNameChange,
    handleTaxChange,
    handleTaxNameChange,
    addNewTax,
    removeTax,
    setReceiptDiscount,
    removeReceipt,
    totalReceipts
}) => {
    return (
        <div className="flex-shrink-0 w-full md:w-[400px] border border-indigo-200 rounded-lg bg-white p-4 space-y-4">
            {/* Header with receipt number and remove button */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-indigo-700">
                    Receipt {receiptIndex + 1}
                </h3>
                {totalReceipts > 1 && (
                    <button
                        onClick={() => removeReceipt(receiptIndex)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                        Remove
                    </button>
                )}
            </div>

            {/* Receipt image */}
            {imagePreview && (
                <img
                    src={imagePreview}
                    alt={`Receipt ${receiptIndex + 1}`}
                    className="w-full max-h-[300px] object-contain border rounded-lg"
                />
            )}

            {/* Items */}
            <div className="space-y-2">
                <h4 className="font-medium text-indigo-600">Items</h4>
                <ItemsEditor
                    editedItems={items}
                    editingPrices={editingPrices}
                    handlePriceChange={(itemIndex, newPrice) => handlePriceChange(receiptIndex, itemIndex, newPrice)}
                    handleNameChange={(itemIndex, newName) => handleNameChange(receiptIndex, itemIndex, newName)}
                />
            </div>

            {/* Taxes */}
            <div className="space-y-2">
                <TaxesEditor
                    editedTaxes={taxes}
                    editingPrices={editingPrices}
                    handleTaxChange={(taxIndex, newAmount) => handleTaxChange(receiptIndex, taxIndex, newAmount)}
                    handleTaxNameChange={(taxIndex, newName) => handleTaxNameChange(receiptIndex, taxIndex, newName)}
                    addNewTax={() => addNewTax(receiptIndex)}
                    removeTax={(taxIndex) => removeTax(receiptIndex, taxIndex)}
                />
            </div>

            {/* Discount */}
            <DiscountEditor
                discountType={discountType}
                setDiscountType={(type) => setReceiptDiscount(receiptIndex, type, discountValue)}
                discountValue={discountValue}
                setDiscountValue={(value) => setReceiptDiscount(receiptIndex, discountType, value)}
            />

            {/* Receipt Total */}
            <div className="p-3 bg-indigo-100 rounded-lg">
                <div className="flex justify-between items-center">
                    <span className="font-medium text-indigo-800">Subtotal</span>
                    <span className="font-bold text-indigo-900">₹{calculateReceiptTotal(receiptIndex).toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default ReceiptCard;
