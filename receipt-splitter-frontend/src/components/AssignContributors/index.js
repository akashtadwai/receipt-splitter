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
                        {itemsWithItems.map((item) => {
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
                                    colorScheme="indigo"
                                    itemType="Item"
                                />

                            );
                        })}
                    </div>
                )}

                {/* Taxes section */}
                {itemsWithTaxes.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-amber-700">Taxes & Fees</h3>
                        {itemsWithTaxes.map((item) => {
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
                                    colorScheme="amber"
                                    itemType="Tax"
                                />

                            );
                        })}
                    </div>
                )}

                {/* Discount section (if a discount was applied) */}
                {itemsWithDiscount.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-green-700">Discount</h3>
                        {itemsWithDiscount.map((item) => {
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
                                    colorScheme="green"
                                    itemType="Discount"
                                />
                            );
                        })}
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
