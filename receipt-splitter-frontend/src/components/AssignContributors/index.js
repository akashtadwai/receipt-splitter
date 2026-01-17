import React from 'react';
import ContributorItem from './ContributorItem';

const AssignContributors = ({
    itemSplits,
    personsList,
    toggleContributor,
    toggleCustomAmounts,
    handleCustomAmountChange,
    validateCustomAmounts,
    toggleAllContributors,
    goToStep,
    calculateSplit,
    setError
}) => {
    // Group items by receipt
    const receiptIndices = [...new Set(itemSplits.map(item => item.receiptIndex))].filter(i => i !== undefined);
    const hasMultipleReceipts = receiptIndices.length > 1;

    // Helper to render items for a specific receipt or all if single receipt
    const renderItemsSection = (items, label, colorScheme) => {
        if (items.length === 0) return null;

        if (hasMultipleReceipts) {
            // Group by receipt
            return receiptIndices.map(receiptIdx => {
                const receiptItems = items.filter(item => item.receiptIndex === receiptIdx);
                if (receiptItems.length === 0) return null;

                return (
                    <div key={`${label}-receipt-${receiptIdx}`} className="mb-4">
                        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 font-semibold text-base px-3 py-1.5 rounded-full mb-3">
                            📄 Receipt {receiptIdx + 1}
                        </div>
                        {receiptItems.map((item) => {
                            const itemIndex = itemSplits.findIndex(i => i === item);
                            return (
                                <ContributorItem
                                    key={itemIndex}
                                    item={item}
                                    itemIndex={itemIndex}
                                    personsList={personsList}
                                    toggleContributor={toggleContributor}
                                    toggleCustomAmounts={toggleCustomAmounts}
                                    handleCustomAmountChange={handleCustomAmountChange}
                                    validateCustomAmounts={validateCustomAmounts}
                                    toggleAllContributors={toggleAllContributors}
                                    colorScheme={colorScheme}
                                    itemType={label}
                                />
                            );
                        })}
                    </div>
                );
            });
        } else {
            // Single receipt - no grouping needed
            return items.map((item) => {
                const itemIndex = itemSplits.findIndex(i => i === item);
                return (
                    <ContributorItem
                        key={itemIndex}
                        item={item}
                        itemIndex={itemIndex}
                        personsList={personsList}
                        toggleContributor={toggleContributor}
                        toggleCustomAmounts={toggleCustomAmounts}
                        handleCustomAmountChange={handleCustomAmountChange}
                        validateCustomAmounts={validateCustomAmounts}
                        toggleAllContributors={toggleAllContributors}
                        colorScheme={colorScheme}
                        itemType={label}
                    />
                );
            });
        }
    };

    const itemsWithItems = itemSplits.filter(item => item.isItem);
    const itemsWithTaxes = itemSplits.filter(item => item.isTax);
    const itemsWithDiscount = itemSplits.filter(item => item.isDiscount);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-indigo-800">Assign Contributors</h2>
            <p className="text-indigo-600">Select who contributed to each item and tax</p>

            <div className="space-y-6">
                {/* Regular items section */}
                {itemsWithItems.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-indigo-700">Items</h3>
                        {renderItemsSection(itemsWithItems, "Item", "indigo")}
                    </div>
                )}

                {/* Taxes section */}
                {itemsWithTaxes.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-amber-700">Taxes & Fees</h3>
                        {renderItemsSection(itemsWithTaxes, "Tax", "amber")}
                    </div>
                )}

                {/* Discount section */}
                {itemsWithDiscount.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-green-700">Discounts</h3>
                        {renderItemsSection(itemsWithDiscount, "Discount", "green")}
                    </div>
                )}
            </div>

            <div className="flex justify-between mt-6">
                <button
                    onClick={() => goToStep(2)}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                    Back
                </button>
                <button
                    onClick={calculateSplit}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                    Calculate Split
                </button>
            </div>
        </div>
    );
};

export default AssignContributors;
