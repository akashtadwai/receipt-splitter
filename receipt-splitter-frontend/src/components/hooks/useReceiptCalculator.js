import { useState } from 'react';

const useReceiptCalculator = () => {
    const API_URL = process.env.REACT_APP_API_URL || '';
    const [receipt, setReceipt] = useState(null);
    const [persons, setPersons] = useState('');
    const [personsList, setPersonsList] = useState([]);
    const [itemSplits, setItemSplits] = useState([]);
    const [results, setResults] = useState(null);
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [imagePreview, setImagePreview] = useState(null);

    // Editing state
    const [editingPrices, setEditingPrices] = useState(false);
    const [editedItems, setEditedItems] = useState([]);
    const [editedTaxes, setEditedTaxes] = useState([]);

    // Discount state
    const [discountType, setDiscountType] = useState('none'); // 'none', 'percentage', 'absolute'
    const [discountValue, setDiscountValue] = useState(0);

    // Calculate current total after edits and discount
    const calculateCurrentTotal = () => {
        const itemsTotal = editedItems.reduce((sum, item) => {
            const price = item.price === '' ? 0 : parseFloat(item.price) || 0;
            return sum + price;
        }, 0);

        const taxesTotal = editedTaxes.reduce((sum, tax) => {
            const amount = tax.amount === '' ? 0 : parseFloat(tax.amount) || 0;
            return sum + amount;
        }, 0);

        let total = itemsTotal + taxesTotal;

        // Apply discount if any
        if (discountType === 'percentage' && discountValue) {
            total = total * (1 - (parseFloat(discountValue) / 100));
        } else if (discountType === 'absolute' && discountValue) {
            total = total - parseFloat(discountValue);
        }

        // Ensure total is not negative
        return Math.max(total, 0);
    };

    // Update item price
    const handlePriceChange = (index, newPrice) => {
        const updatedItems = [...editedItems];
        if (newPrice === '') {
            updatedItems[index].price = '';
        } else {
            updatedItems[index].price = parseFloat(newPrice) || 0;
        }
        setEditedItems(updatedItems);
    };

    // Update tax amount
    const handleTaxChange = (index, newAmount) => {
        const updatedTaxes = [...editedTaxes];
        if (newAmount === '') {
            updatedTaxes[index].amount = '';
        } else {
            updatedTaxes[index].amount = parseFloat(newAmount) || 0;
        }
        setEditedTaxes(updatedTaxes);
    };

    // Add a new tax
    const addNewTax = () => {
        const newTax = {
            name: "New Tax/Fee",
            amount: 0
        };
        setEditedTaxes([...editedTaxes, newTax]);
    };

    // Update tax name
    const handleTaxNameChange = (index, newName) => {
        const updatedTaxes = [...editedTaxes];
        updatedTaxes[index].name = newName;
        setEditedTaxes(updatedTaxes);
    };

    // Remove a tax
    const removeTax = (index) => {
        const updatedTaxes = [...editedTaxes];
        updatedTaxes.splice(index, 1);
        setEditedTaxes(updatedTaxes);
    };

    const toggleContributor = (itemIndex, person) => {
        const updatedSplits = [...itemSplits];
        const item = updatedSplits[itemIndex];
        if (!item.useCustomAmounts) {
            const newContributors = { ...item.contributors };
            if (newContributors[person]) {
                // Remove person from contributors
                delete newContributors[person];
                // Add this block to recalculate shares after removing a person
                const remainingContributors = Object.keys(newContributors).length;
                if (remainingContributors > 0) {
                    const newShare = item.price / remainingContributors;
                    Object.keys(newContributors).forEach(p => {
                        newContributors[p] = newShare;
                    });
                }
            } else {
                // Add person to contributors
                const contributorCount = Object.keys(newContributors).length + 1;
                newContributors[person] = item.price / contributorCount;
                // Recalculate equal shares
                Object.keys(newContributors).forEach(p => {
                    newContributors[p] = item.price / contributorCount;
                });
            }
            updatedSplits[itemIndex].contributors = newContributors;
        } else {
            // For custom amounts, just toggle inclusion (set to 0 if adding)
            if (item.contributors[person] !== undefined) {
                const newContributors = { ...item.contributors };
                delete newContributors[person];
                updatedSplits[itemIndex].contributors = newContributors;
            } else {
                updatedSplits[itemIndex].contributors = {
                    ...item.contributors,
                    [person]: 0
                };
            }
        }
        setItemSplits(updatedSplits);
    };

    const toggleCustomAmounts = (itemIndex) => {
        const updatedSplits = [...itemSplits];
        const item = updatedSplits[itemIndex];
        const useCustom = !item.useCustomAmounts;
        updatedSplits[itemIndex].useCustomAmounts = useCustom;
        if (!useCustom) {
            // Switch back to equal splitting
            const contributors = Object.keys(item.contributors);
            const contributorCount = contributors.length;
            if (contributorCount > 0) {
                const equalShare = item.price / contributorCount;
                const newContributors = {};
                contributors.forEach(person => {
                    newContributors[person] = equalShare;
                });
                updatedSplits[itemIndex].contributors = newContributors;
            }
        }
        setItemSplits(updatedSplits);
    };

    const handleCustomAmountChange = (itemIndex, person, amount) => {
        const updatedSplits = [...itemSplits];
        // Allow empty string during editing
        if (amount === '') {
            updatedSplits[itemIndex].contributors[person] = '';
        } else {
            updatedSplits[itemIndex].contributors[person] = parseFloat(amount) || 0;
        }
        setItemSplits(updatedSplits);
    };

    const validateCustomAmounts = (itemIndex) => {
        const item = itemSplits[itemIndex];
        if (!item.useCustomAmounts) return true;
        const total = Object.values(item.contributors)
            .reduce((sum, amount) => {
                // Convert empty strings or non-numeric values to 0
                const numAmount = amount === '' ? 0 : parseFloat(amount) || 0;
                return sum + numAmount;
            }, 0);
        return Math.abs(total - item.price) < 0.01; // Allow for small rounding errors
    };

    const toggleAllContributors = (itemIndex) => {
        const updatedSplits = [...itemSplits];
        const item = updatedSplits[itemIndex];

        // Check if all persons are already contributors
        const allSelected = personsList.every(person => item.contributors.hasOwnProperty(person));

        if (allSelected) {
            // If all are selected, deselect all
            updatedSplits[itemIndex].contributors = {};
        } else {
            // If not all selected, select all
            if (!item.useCustomAmounts) {
                // For equal splitting
                const newContributors = {};
                personsList.forEach(person => {
                    newContributors[person] = item.price / personsList.length;
                });
                updatedSplits[itemIndex].contributors = newContributors;
            } else {
                // For custom amounts
                const newContributors = {};
                personsList.forEach(person => {
                    newContributors[person] = 0;
                });
                updatedSplits[itemIndex].contributors = newContributors;
            }
        }

        setItemSplits(updatedSplits);
    };

    const calculatePersonTotals = (items, persons, receipt_total) => {
        const person_totals = {};
        persons.forEach(person => {
            person_totals[person] = 0.0;
        });

        // Calculate the total amount of contributions
        const totalContributions = items.reduce((sum, item) => {
            return sum + Object.values(item.contributors).reduce((itemSum, amount) => itemSum + amount, 0);
        }, 0);

        // Calculate the discount factor
        const discountFactor = receipt_total / totalContributions;

        // Add item costs based on contributions and apply discount
        items.forEach(item => {
            Object.entries(item.contributors).forEach(([person, amount]) => {
                if (person in person_totals) {
                    person_totals[person] += amount * discountFactor;
                }
            });
        });

        // Format the response with rounding (same as backend)
        const breakdown = Object.entries(person_totals).map(([person, amount]) => ({
            person: person,
            amount: Math.round(amount * 100) / 100 // Round to 2 decimal places
        }));

        return {
            breakdown: breakdown,
        };
    };

    const calculateSplit = async () => {
        // First, check if any item has no contributors
        const itemsWithNoContributors = itemSplits
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => Object.keys(item.contributors).length === 0);

        if (itemsWithNoContributors.length > 0) {
            setError(`"${itemsWithNoContributors[0].item.item_name}" has no contributors. At least one person must be selected for each item.`);
            return;
        }

        // Then check for valid custom amounts
        const invalidItems = itemSplits
            .map((item, index) => ({ item, index }))
            .filter(({ item, index }) => item.useCustomAmounts && !validateCustomAmounts(index));

        if (invalidItems.length > 0) {
            setError(`"${invalidItems[0].item.item_name}" has invalid split amounts. Total must equal ${invalidItems[0].item.price.toFixed(2)}`);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Calculate the total based on edited values and discount
            const calculatedTotal = calculateCurrentTotal();

            const itemsForCalculation = itemSplits.map(({ item_name, price, contributors }) => ({
                item_name,
                price,
                contributors
            }));
            const result = calculatePersonTotals(
                itemsForCalculation,
                personsList,
                calculatedTotal
            );

            setResults(result);
            setStep(4);
        } catch (err) {
            setError('Error calculating split: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const resetApp = () => {
        // Revoke the object URL to avoid memory leaks
        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }

        setReceipt(null);
        setPersons('');
        setPersonsList([]);
        setItemSplits([]);
        setResults(null);
        setStep(1);
        setFile(null);
        setImagePreview(null);
        setError('');
        setEditingPrices(false);
        setEditedItems([]);
        setEditedTaxes([]);
        setDiscountType('none');
        setDiscountValue(0);
    };

    const goToStep = (targetStep) => {
        if (targetStep >= 1 && targetStep <= 4) {
            setStep(targetStep);
            setError('');
        }
    };

    return {
        receipt,
        setReceipt,
        persons,
        setPersons,
        personsList,
        setPersonsList,
        itemSplits,
        setItemSplits,
        results,
        step,
        setStep,
        file,
        setFile,
        isLoading,
        setIsLoading,
        error,
        setError,
        imagePreview,
        setImagePreview,
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
        removeTax,
        toggleContributor,
        toggleCustomAmounts,
        handleCustomAmountChange,
        validateCustomAmounts,
        toggleAllContributors,
        calculateSplit,
        resetApp,
        goToStep,
        API_URL
    };
};

export default useReceiptCalculator;
