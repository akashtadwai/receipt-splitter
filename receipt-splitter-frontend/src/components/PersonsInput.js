import React from 'react';

const PersonsInput = ({
    persons,
    setPersons,
    setPersonsList,
    setStep,
    goToStep,
    editingPrices,
    receipt,
    editedItems,
    editedTaxes,
    discountType,
    discountValue,
    setError,
    setItemSplits
}) => {
    const addPersons = () => {
        if (!persons.trim()) {
            setError('Please enter at least one person');
            return;
        }
        const newPersonsList = persons.split(',').map(p => p.trim()).filter(p => p);
        if (newPersonsList.length === 0) {
            setError('Please enter valid names separated by commas');
            return;
        }
        setPersonsList(newPersonsList);

        // Use edited prices and taxes if in editing mode
        const updatedSplits = [];

        // Add items with potentially edited prices
        editedItems.forEach(item => {
            const price = item.price === '' ? 0 : parseFloat(item.price) || 0;
            updatedSplits.push({
                item_name: item.name,
                price: price,
                contributors: Object.fromEntries(
                    newPersonsList.map(person => [person, price / newPersonsList.length])
                ),
                useCustomAmounts: false,
                isItem: true
            });
        });

        // Add taxes with potentially edited amounts
        editedTaxes.forEach(tax => {
            const amount = tax.amount === '' ? 0 : parseFloat(tax.amount) || 0;
            updatedSplits.push({
                item_name: `${tax.name} (Tax/Fee)`,
                price: amount,
                contributors: Object.fromEntries(
                    newPersonsList.map(person => [person, amount / newPersonsList.length])
                ),
                useCustomAmounts: false,
                isTax: true
            });
        });

        // If there's a discount applied, add it as a negative item
        if ((discountType === 'percentage' && parseFloat(discountValue) > 0) ||
            (discountType === 'absolute' && parseFloat(discountValue) > 0)) {
            const originalTotal = editedItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) +
                editedTaxes.reduce((sum, tax) => sum + (parseFloat(tax.amount) || 0), 0);

            let discountAmount = 0;
            if (discountType === 'percentage') {
                discountAmount = originalTotal * (parseFloat(discountValue) / 100);
            } else {
                discountAmount = parseFloat(discountValue);
            }

            updatedSplits.push({
                item_name: `Discount ${discountType === 'percentage' ? `(${discountValue}%)` : ''}`,
                price: -discountAmount,
                contributors: Object.fromEntries(
                    newPersonsList.map(person => [person, -discountAmount / newPersonsList.length])
                ),
                useCustomAmounts: false,
                isDiscount: true
            });
        }

        setItemSplits(updatedSplits);
        setStep(3);
    };

    return (
        <div className="mt-6 p-5 border border-indigo-200 rounded-lg bg-indigo-50">
            <h3 className="text-lg font-semibold mb-2 text-indigo-800">Who's splitting this bill?</h3>
            <p className="text-sm text-indigo-600 mb-2">Enter names separated by commas</p>
            <input
                type="text"
                value={persons}
                onChange={(e) => setPersons(e.target.value)}
                placeholder="e.g. Sachin, Rohit, Kohli"
                className="w-full p-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <div className="flex justify-between mt-3">
                <button
                    onClick={() => goToStep(1)}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                    Back
                </button>
                <button
                    onClick={addPersons}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                    Continue
                </button>
            </div>

            {editingPrices && (
                editedItems.some((item, i) =>
                    item.price !== receipt.ocr_contents.items[i].price ||
                    (item.price === '' && receipt.ocr_contents.items[i].price !== 0)
                ) ||
                editedTaxes.length !== receipt.ocr_contents.total_order_bill_details.taxes.length ||
                editedTaxes.some((tax, i) =>
                    i < receipt.ocr_contents.total_order_bill_details.taxes.length &&
                    (tax.amount !== receipt.ocr_contents.total_order_bill_details.taxes[i].amount ||
                        tax.name !== receipt.ocr_contents.total_order_bill_details.taxes[i].name)
                ) ||
                discountType !== 'none'
            ) && (
                    <p className="mt-2 text-amber-600 text-sm">
                        ⚠️ You've edited the receipt. Make sure your total looks correct before continuing.
                    </p>
                )}
        </div>
    );
};

export default PersonsInput;
