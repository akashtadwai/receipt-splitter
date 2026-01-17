import React from 'react';

const PersonsInput = ({
    persons,
    setPersons,
    setPersonsList,
    setStep,
    goToStep,
    editingPrices,
    receiptData,
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

        // Combine all items and taxes from all receipts
        const updatedSplits = [];

        receiptData.forEach((data, receiptIndex) => {
            // Add items from this receipt
            data.items.forEach(item => {
                const price = item.price === '' ? 0 : parseFloat(item.price) || 0;
                updatedSplits.push({
                    item_name: item.name,
                    price: price,
                    contributors: Object.fromEntries(
                        newPersonsList.map(person => [person, price / newPersonsList.length])
                    ),
                    useCustomAmounts: false,
                    isItem: true,
                    receiptIndex
                });
            });

            // Add taxes from this receipt
            data.taxes.forEach(tax => {
                const amount = tax.amount === '' ? 0 : parseFloat(tax.amount) || 0;
                updatedSplits.push({
                    item_name: `${tax.name} (Tax/Fee)`,
                    price: amount,
                    contributors: Object.fromEntries(
                        newPersonsList.map(person => [person, amount / newPersonsList.length])
                    ),
                    useCustomAmounts: false,
                    isTax: true,
                    receiptIndex
                });
            });

            // Add per-receipt discount if applicable
            if ((data.discountType === 'percentage' && parseFloat(data.discountValue) > 0) ||
                (data.discountType === 'absolute' && parseFloat(data.discountValue) > 0)) {

                const originalTotal = data.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) +
                    data.taxes.reduce((sum, tax) => sum + (parseFloat(tax.amount) || 0), 0);

                let discountAmount = 0;
                if (data.discountType === 'percentage') {
                    discountAmount = originalTotal * (parseFloat(data.discountValue) / 100);
                } else {
                    discountAmount = parseFloat(data.discountValue);
                }

                updatedSplits.push({
                    item_name: `Discount ${receiptData.length > 1 ? `(Receipt ${receiptIndex + 1})` : ''} ${data.discountType === 'percentage' ? `(${data.discountValue}%)` : ''}`.trim(),
                    price: -discountAmount,
                    contributors: Object.fromEntries(
                        newPersonsList.map(person => [person, -discountAmount / newPersonsList.length])
                    ),
                    useCustomAmounts: false,
                    isDiscount: true,
                    receiptIndex
                });
            }
        });

        setItemSplits(updatedSplits);
        setStep(3);
    };

    const hasEdits = editingPrices && receiptData.some(data =>
        data.discountType !== 'none' ||
        data.items.some(item => item.price === '' || item.name === '')
    );

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

            {hasEdits && (
                <p className="mt-2 text-amber-600 text-sm">
                    ⚠️ You've edited the receipt(s). Make sure your totals look correct before continuing.
                </p>
            )}
        </div>
    );
};

export default PersonsInput;
