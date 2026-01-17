import { useState } from 'react';

const useReceiptCalculator = () => {
    // Multi-receipt state - arrays instead of single values
    const [files, setFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [receipts, setReceipts] = useState([]);

    // Per-receipt data: { items: [], taxes: [], discountType: 'none', discountValue: 0 }
    const [receiptData, setReceiptData] = useState([]);

    // Shared state
    const [persons, setPersons] = useState('');
    const [personsList, setPersonsList] = useState([]);
    const [itemSplits, setItemSplits] = useState([]);
    const [results, setResults] = useState(null);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingPrices, setEditingPrices] = useState(false);

    // Calculate total for a single receipt
    const calculateReceiptTotal = (receiptIndex) => {
        const data = receiptData[receiptIndex];
        if (!data) return 0;

        const itemsTotal = data.items.reduce((sum, item) => {
            const price = item.price === '' ? 0 : parseFloat(item.price) || 0;
            return sum + price;
        }, 0);

        const taxesTotal = data.taxes.reduce((sum, tax) => {
            const amount = tax.amount === '' ? 0 : parseFloat(tax.amount) || 0;
            return sum + amount;
        }, 0);

        let total = itemsTotal + taxesTotal;

        // Apply per-receipt discount
        if (data.discountType === 'percentage' && data.discountValue) {
            total = total * (1 - (parseFloat(data.discountValue) / 100));
        } else if (data.discountType === 'absolute' && data.discountValue) {
            total = total - parseFloat(data.discountValue);
        }

        return Math.max(total, 0);
    };

    // Calculate combined total across all receipts
    const calculateCurrentTotal = () => {
        return receiptData.reduce((sum, _, index) => sum + calculateReceiptTotal(index), 0);
    };

    // Get all items across all receipts (for split calculation)
    const getAllItems = () => {
        return receiptData.flatMap((data, receiptIndex) =>
            data.items.map(item => ({
                ...item,
                receiptIndex // Track which receipt this item belongs to
            }))
        );
    };

    // Get all taxes across all receipts
    const getAllTaxes = () => {
        return receiptData.flatMap((data, receiptIndex) =>
            data.taxes.map(tax => ({
                ...tax,
                receiptIndex
            }))
        );
    };

    // Update item price for a specific receipt
    const handlePriceChange = (receiptIndex, itemIndex, newPrice) => {
        setReceiptData(prev => {
            const updated = [...prev];
            const items = [...updated[receiptIndex].items];
            items[itemIndex] = {
                ...items[itemIndex],
                price: newPrice === '' ? '' : (parseFloat(newPrice) || 0)
            };
            updated[receiptIndex] = { ...updated[receiptIndex], items };
            return updated;
        });
    };

    // Update item name for a specific receipt
    const handleNameChange = (receiptIndex, itemIndex, newName) => {
        setReceiptData(prev => {
            const updated = [...prev];
            const items = [...updated[receiptIndex].items];
            items[itemIndex] = { ...items[itemIndex], name: newName };
            updated[receiptIndex] = { ...updated[receiptIndex], items };
            return updated;
        });
    };

    // Update tax amount for a specific receipt
    const handleTaxChange = (receiptIndex, taxIndex, newAmount) => {
        setReceiptData(prev => {
            const updated = [...prev];
            const taxes = [...updated[receiptIndex].taxes];
            taxes[taxIndex] = {
                ...taxes[taxIndex],
                amount: newAmount === '' ? '' : (parseFloat(newAmount) || 0)
            };
            updated[receiptIndex] = { ...updated[receiptIndex], taxes };
            return updated;
        });
    };

    // Update tax name for a specific receipt
    const handleTaxNameChange = (receiptIndex, taxIndex, newName) => {
        setReceiptData(prev => {
            const updated = [...prev];
            const taxes = [...updated[receiptIndex].taxes];
            taxes[taxIndex] = { ...taxes[taxIndex], name: newName };
            updated[receiptIndex] = { ...updated[receiptIndex], taxes };
            return updated;
        });
    };

    // Add a new tax to a specific receipt
    const addNewTax = (receiptIndex) => {
        setReceiptData(prev => {
            const updated = [...prev];
            updated[receiptIndex] = {
                ...updated[receiptIndex],
                taxes: [...updated[receiptIndex].taxes, { name: "New Tax/Fee", amount: 0 }]
            };
            return updated;
        });
    };

    // Remove a tax from a specific receipt
    const removeTax = (receiptIndex, taxIndex) => {
        setReceiptData(prev => {
            const updated = [...prev];
            const taxes = [...updated[receiptIndex].taxes];
            taxes.splice(taxIndex, 1);
            updated[receiptIndex] = { ...updated[receiptIndex], taxes };
            return updated;
        });
    };

    // Update discount for a specific receipt
    const setReceiptDiscount = (receiptIndex, discountType, discountValue) => {
        setReceiptData(prev => {
            const updated = [...prev];
            updated[receiptIndex] = { ...updated[receiptIndex], discountType, discountValue };
            return updated;
        });
    };

    // Remove a receipt
    const removeReceipt = (receiptIndex) => {
        setFiles(prev => prev.filter((_, i) => i !== receiptIndex));
        setImagePreviews(prev => {
            const removed = prev[receiptIndex];
            if (removed && removed.startsWith('blob:')) {
                URL.revokeObjectURL(removed);
            }
            return prev.filter((_, i) => i !== receiptIndex);
        });
        setReceipts(prev => prev.filter((_, i) => i !== receiptIndex));
        setReceiptData(prev => prev.filter((_, i) => i !== receiptIndex));
    };

    const toggleContributor = (itemIndex, person) => {
        const updatedSplits = [...itemSplits];
        const item = updatedSplits[itemIndex];
        if (!item.useCustomAmounts) {
            const newContributors = { ...item.contributors };
            if (newContributors[person]) {
                delete newContributors[person];
                const remainingContributors = Object.keys(newContributors).length;
                if (remainingContributors > 0) {
                    const newShare = item.price / remainingContributors;
                    Object.keys(newContributors).forEach(p => {
                        newContributors[p] = newShare;
                    });
                }
            } else {
                const contributorCount = Object.keys(newContributors).length + 1;
                newContributors[person] = item.price / contributorCount;
                Object.keys(newContributors).forEach(p => {
                    newContributors[p] = item.price / contributorCount;
                });
            }
            updatedSplits[itemIndex].contributors = newContributors;
        } else {
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
                const numAmount = amount === '' ? 0 : parseFloat(amount) || 0;
                return sum + numAmount;
            }, 0);
        return Math.abs(total - item.price) < 0.01;
    };

    const toggleAllContributors = (itemIndex) => {
        const updatedSplits = [...itemSplits];
        const item = updatedSplits[itemIndex];
        const allSelected = personsList.every(person => item.contributors.hasOwnProperty(person));

        if (allSelected) {
            updatedSplits[itemIndex].contributors = {};
        } else {
            if (!item.useCustomAmounts) {
                const newContributors = {};
                personsList.forEach(person => {
                    newContributors[person] = item.price / personsList.length;
                });
                updatedSplits[itemIndex].contributors = newContributors;
            } else {
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

        const totalContributions = items.reduce((sum, item) => {
            return sum + Object.values(item.contributors).reduce((itemSum, amount) => itemSum + amount, 0);
        }, 0);

        const discountFactor = receipt_total / totalContributions;

        items.forEach(item => {
            Object.entries(item.contributors).forEach(([person, amount]) => {
                if (person in person_totals) {
                    person_totals[person] += amount * discountFactor;
                }
            });
        });

        const breakdown = Object.entries(person_totals).map(([person, amount]) => ({
            person: person,
            amount: Math.round(amount * 100) / 100
        }));

        return { breakdown };
    };

    const calculateSplit = async () => {
        const itemsWithNoContributors = itemSplits
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => Object.keys(item.contributors).length === 0);

        if (itemsWithNoContributors.length > 0) {
            setError(`"${itemsWithNoContributors[0].item.item_name}" has no contributors.`);
            return;
        }

        const invalidItems = itemSplits
            .map((item, index) => ({ item, index }))
            .filter(({ item, index }) => item.useCustomAmounts && !validateCustomAmounts(index));

        if (invalidItems.length > 0) {
            setError(`"${invalidItems[0].item.item_name}" has invalid split amounts.`);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const calculatedTotal = calculateCurrentTotal();
            const itemsForCalculation = itemSplits.map(({ item_name, price, contributors }) => ({
                item_name,
                price,
                contributors
            }));
            const result = calculatePersonTotals(itemsForCalculation, personsList, calculatedTotal);
            setResults(result);
            setStep(4);
        } catch (err) {
            setError('Error calculating split: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const resetApp = () => {
        imagePreviews.forEach(preview => {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        });

        setFiles([]);
        setImagePreviews([]);
        setReceipts([]);
        setReceiptData([]);
        setPersons('');
        setPersonsList([]);
        setItemSplits([]);
        setResults(null);
        setStep(1);
        setIsLoading(false);
        setError('');
        setEditingPrices(false);
    };

    const goToStep = (targetStep) => {
        if (targetStep >= 1 && targetStep <= 4) {
            setStep(targetStep);
            setError('');
        }
    };

    // Initialize itemSplits from all receipts (called when moving to step 3)
    const initializeItemSplits = () => {
        const allItems = [];

        receiptData.forEach((data, receiptIndex) => {
            // Add regular items
            data.items.forEach(item => {
                allItems.push({
                    item_name: item.name,
                    price: parseFloat(item.price) || 0,
                    contributors: {},
                    useCustomAmounts: false,
                    isItem: true,
                    receiptIndex
                });
            });

            // Add taxes
            data.taxes.forEach(tax => {
                allItems.push({
                    item_name: `${tax.name} (Tax/Fee)`,
                    price: parseFloat(tax.amount) || 0,
                    contributors: {},
                    useCustomAmounts: false,
                    isTax: true,
                    receiptIndex
                });
            });
        });

        setItemSplits(allItems);
    };

    return {
        // Multi-receipt state
        files, setFiles,
        imagePreviews, setImagePreviews,
        receipts, setReceipts,
        receiptData, setReceiptData,

        // Shared state
        persons, setPersons,
        personsList, setPersonsList,
        itemSplits, setItemSplits,
        results,
        step, setStep,
        isLoading, setIsLoading,
        error, setError,
        editingPrices, setEditingPrices,

        // Calculations
        calculateReceiptTotal,
        calculateCurrentTotal,
        getAllItems,
        getAllTaxes,

        // Per-receipt actions
        handlePriceChange,
        handleNameChange,
        handleTaxChange,
        handleTaxNameChange,
        addNewTax,
        removeTax,
        setReceiptDiscount,
        removeReceipt,

        // Split actions
        toggleContributor,
        toggleCustomAmounts,
        handleCustomAmountChange,
        validateCustomAmounts,
        toggleAllContributors,
        calculateSplit,
        initializeItemSplits,

        // Navigation
        resetApp,
        goToStep
    };
};

export default useReceiptCalculator;
