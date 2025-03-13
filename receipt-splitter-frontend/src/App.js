import React, { useState } from 'react';
import './App.css';

function App() {
  const API_URL = process.env.REACT_APP_API_URL || '';
  console.log("API_URL ",API_URL)
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

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Create a URL for the image preview
      const imageUrl = URL.createObjectURL(selectedFile);
      setImagePreview(imageUrl);
    }
  };

  const loadDemoData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch mock data from backend
      const response = await fetch(`${API_URL}/mock-receipt`);
      if (!response.ok) {
        throw new Error('Failed to load demo data');
      }

      const data = await response.json();
      setReceipt(data);

      // Set demo image preview
      setImagePreview('/images/demo-receipt.jpeg');

      // Initialize edited items and taxes with the OCR results
      setEditedItems(data.ocr_contents.items.map(item => ({ ...item })));
      setEditedTaxes(data.ocr_contents.total_order_bill_details.taxes.map(tax => ({ ...tax })));

      // Initialize item splits with regular items
      const initialSplits = data.ocr_contents.items.map(item => ({
        item_name: item.name,
        price: item.price,
        contributors: {},
        useCustomAmounts: false,
        isItem: true
      }));

      // Add tax items to splits if they exist
      const taxSplits = data.ocr_contents.total_order_bill_details.taxes
        ? data.ocr_contents.total_order_bill_details.taxes.map(tax => ({
          item_name: `${tax.name} (Tax/Fee)`,
          price: tax.amount,
          contributors: {},
          useCustomAmounts: false,
          isTax: true
        }))
        : [];

      // Combine regular items and taxes
      setItemSplits([...initialSplits, ...taxSplits]);
      setStep(2);
    } catch (err) {
      setError('Error loading demo: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadReceipt = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      // Send to backend for OCR processing
      const response = await fetch(`${API_URL}/process-receipt`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error processing receipt');
      }
      const data = await response.json();
      setReceipt(data);

      // Initialize edited items and taxes with the OCR results
      setEditedItems(data.ocr_contents.items.map(item => ({ ...item })));
      setEditedTaxes(data.ocr_contents.total_order_bill_details.taxes
        ? data.ocr_contents.total_order_bill_details.taxes.map(tax => ({ ...tax }))
        : []);

      // Initialize item splits
      const initialSplits = data.ocr_contents.items.map(item => ({
        item_name: item.name,
        price: item.price,
        contributors: {},
        useCustomAmounts: false,
        isItem: true
      }));

      // Add tax items to splits if they exist
      const taxSplits = data.ocr_contents.total_order_bill_details.taxes
        ? data.ocr_contents.total_order_bill_details.taxes.map(tax => ({
          item_name: `${tax.name} (Tax/Fee)`,
          price: tax.amount,
          contributors: {},
          useCustomAmounts: false,
          isTax: true
        }))
        : [];

      // Combine regular items and taxes
      setItemSplits([...initialSplits, ...taxSplits]);
      setStep(2);
    } catch (err) {
      setError('Error processing receipt: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

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

      const requestData = {
        items: itemSplits.map(({ item_name, price, contributors }) => ({
          item_name,
          price,
          contributors
        })),
        persons: personsList,
        // Include the final total after edits and discount
        receipt_total: calculatedTotal
      };

      const response = await fetch(`${API_URL}/calculate-split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error('Failed to calculate split');
      }

      const data = await response.json();
      setResults(data);
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

  // Navigation functions for back/forward
  const goToStep = (targetStep) => {
    if (targetStep >= 1 && targetStep <= 4) {
      setStep(targetStep);
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">Receipt Splitter</h1>

        {/* Steps indicator */}
        <div className="flex justify-center mb-8">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold cursor-pointer ${step === num ? 'bg-indigo-600 text-white' :
                    step > num ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                onClick={() => num < step && goToStep(num)} // Only allow going back, not forward
              >
                {step > num ? '✓' : num}
              </div>
              {num < 4 && <div className={`h-1 w-10 ${step > num ? 'bg-green-500' : 'bg-gray-200'}`}></div>}
            </div>
          ))}
        </div>

        {/* Step 1: Upload receipt */}
        {step === 1 && (
          <div className="space-y-6 p-5 border border-indigo-100 rounded-lg bg-indigo-50">
            <h2 className="text-xl font-bold text-indigo-800">Upload Receipt</h2>
            <div className="border-2 border-dashed border-indigo-300 rounded-lg p-6 bg-white text-center hover:border-indigo-500 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <svg className="w-12 h-12 mx-auto text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-indigo-700 font-medium">Click to select receipt image</p>
                  <p className="text-indigo-400 text-sm">{file ? file.name : "No file selected"}</p>
                </div>
              </label>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={uploadReceipt}
                disabled={!file || isLoading}
                className={`flex-1 py-3 rounded-lg font-medium ${!file || isLoading ? 'bg-gray-300 text-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  } transition-colors`}
              >
                {isLoading ? 'Processing...' : 'Process Receipt'}
              </button>

              {/* Demo Button */}
              <button
                onClick={loadDemoData}
                disabled={isLoading}
                className="flex-1 py-3 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Show Demo
              </button>
            </div>

            <div className="text-sm text-center text-gray-500 mt-2">
              <p>Demo uses sample data for an Instamart grocery order</p>
            </div>
          </div>
        )}

        {/* Step 2: Receipt items and persons */}
        {step === 2 && receipt && (
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
                    {editingPrices ? 'Done Editing' : 'Edit Prices'}
                  </button>
                </div>

                <div className="space-y-2">
                  {editedItems.map((item, index) => (
                    <div key={index} className="p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex justify-between items-center">
                      <p className="font-medium text-indigo-900">{item.name}</p>
                      {editingPrices ? (
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handlePriceChange(index, e.target.value)}
                          className="w-24 p-1 text-right border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      ) : (
                        <p className="text-right text-indigo-800">₹{item.price.toFixed(2)}</p>
                      )}
                    </div>
                  ))}

                  {/* Display taxes section with editing capability */}
                  {(editedTaxes.length > 0 || editingPrices) && (
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
                  )}

                  {/* Discount section */}
                  {(
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Apply Discount</h4>
                      <div className="flex items-center space-x-4">
                        <select
                          value={discountType}
                          onChange={(e) => setDiscountType(e.target.value)}
                          className="p-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="none">No Discount</option>
                          <option value="percentage">Percentage</option>
                          <option value="absolute">Absolute Amount</option>
                        </select>

                        {discountType !== 'none' && (
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              max={discountType === 'percentage' ? "100" : undefined}
                              step="0.01"
                              value={discountValue}
                              onChange={(e) => setDiscountValue(e.target.value)}
                              className="w-24 p-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                            <span className="ml-2 text-green-800">
                              {discountType === 'percentage' ? '%' : '₹'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
          </div>
        )}

        {/* Step 3: Assign contributors */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-indigo-800">Assign Contributors</h2>
            <p className="text-indigo-600">Select who contributed to each item and tax</p>

            <div className="space-y-6">
              {/* Regular items section */}
              {itemSplits.filter(item => item.isItem).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-indigo-700">Items</h3>
                  {itemSplits.filter(item => item.isItem).map((item, originalIndex) => {
                    const itemIndex = itemSplits.findIndex(i => i === item);
                    return (
                      <div key={itemIndex} className="p-4 border border-indigo-200 rounded-lg bg-indigo-50 mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-indigo-900">{item.item_name}</h3>
                          <p className="text-indigo-800 font-medium">₹{item.price.toFixed(2)}</p>
                        </div>

                        <div className="flex items-center mb-3">
                          <label className="flex items-center text-indigo-800">
                            <input
                              type="checkbox"
                              checked={item.useCustomAmounts}
                              onChange={() => toggleCustomAmounts(itemIndex)}
                              className="mr-2 h-4 w-4 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500"
                            />
                            Use custom amounts
                          </label>
                        </div>

                        <div className="space-y-2">
                          {personsList.map((person) => (
                            <div key={person} className="flex items-center justify-between bg-white p-2 rounded-lg">
                              <label className="flex items-center flex-1">
                                <input
                                  type="checkbox"
                                  checked={item.contributors.hasOwnProperty(person)}
                                  onChange={() => toggleContributor(itemIndex, person)}
                                  className="mr-2 h-4 w-4 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-indigo-900">{person}</span>
                              </label>
                              {item.useCustomAmounts && item.contributors.hasOwnProperty(person) && (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.contributors[person]}
                                  onChange={(e) => handleCustomAmountChange(itemIndex, person, e.target.value)}
                                  className="w-24 p-1 border border-indigo-200 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              )}
                              {!item.useCustomAmounts && item.contributors.hasOwnProperty(person) && (
                                <span className="text-indigo-600">₹{item.contributors[person].toFixed(2)}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {item.useCustomAmounts && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-indigo-800">Total assigned:</span>
                              <span className={`font-medium ${validateCustomAmounts(itemIndex) ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{Object.values(item.contributors)
                                  .reduce((sum, amount) => {
                                    const numAmount = amount === '' ? 0 : parseFloat(amount) || 0;
                                    return sum + numAmount;
                                  }, 0)
                                  .toFixed(2)} / ₹{item.price.toFixed(2)}
                              </span>
                            </div>
                            {!validateCustomAmounts(itemIndex) && (
                              <div className="flex justify-between text-sm">
                                <span className="text-indigo-800">Remaining to allocate:</span>
                                <span className="font-medium text-amber-600">
                                  ₹{(item.price - Object.values(item.contributors)
                                    .reduce((sum, amount) => {
                                      const numAmount = amount === '' ? 0 : parseFloat(amount) || 0;
                                      return sum + numAmount;
                                    }, 0))
                                    .toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Taxes section */}
              {itemSplits.filter(item => item.isTax).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-amber-700">Taxes & Fees</h3>
                  {itemSplits.filter(item => item.isTax).map((item, originalIndex) => {
                    const itemIndex = itemSplits.findIndex(i => i === item);
                    return (
                      <div key={itemIndex} className="p-4 border border-amber-200 rounded-lg bg-amber-50 mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-amber-900">{item.item_name}</h3>
                          <p className="text-amber-800 font-medium">₹{item.price.toFixed(2)}</p>
                        </div>

                        <div className="flex items-center mb-3">
                          <label className="flex items-center text-amber-800">
                            <input
                              type="checkbox"
                              checked={item.useCustomAmounts}
                              onChange={() => toggleCustomAmounts(itemIndex)}
                              className="mr-2 h-4 w-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                            />
                            Use custom amounts
                          </label>
                        </div>

                        <div className="space-y-2">
                          {personsList.map((person) => (
                            <div key={person} className="flex items-center justify-between bg-white p-2 rounded-lg">
                              <label className="flex items-center flex-1">
                                <input
                                  type="checkbox"
                                  checked={item.contributors.hasOwnProperty(person)}
                                  onChange={() => toggleContributor(itemIndex, person)}
                                  className="mr-2 h-4 w-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                                />
                                <span className="text-amber-900">{person}</span>
                              </label>
                              {item.useCustomAmounts && item.contributors.hasOwnProperty(person) && (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.contributors[person]}
                                  onChange={(e) => handleCustomAmountChange(itemIndex, person, e.target.value)}
                                  className="w-24 p-1 border border-amber-200 rounded focus:ring-amber-500 focus:border-amber-500"
                                />
                              )}
                              {!item.useCustomAmounts && item.contributors.hasOwnProperty(person) && (
                                <span className="text-amber-600">₹{item.contributors[person].toFixed(2)}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {item.useCustomAmounts && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-amber-800">Total assigned:</span>
                              <span className={`font-medium ${validateCustomAmounts(itemIndex) ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{Object.values(item.contributors)
                                  .reduce((sum, amount) => {
                                    const numAmount = amount === '' ? 0 : parseFloat(amount) || 0;
                                    return sum + numAmount;
                                  }, 0)
                                  .toFixed(2)} / ₹{item.price.toFixed(2)}
                              </span>
                            </div>
                            {!validateCustomAmounts(itemIndex) && (
                              <div className="flex justify-between text-sm">
                                <span className="text-amber-800">Remaining to allocate:</span>
                                <span className="font-medium text-amber-600">
                                  ₹{(item.price - Object.values(item.contributors)
                                    .reduce((sum, amount) => {
                                      const numAmount = amount === '' ? 0 : parseFloat(amount) || 0;
                                      return sum + numAmount;
                                    }, 0))
                                    .toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Discount section (if a discount was applied) */}
              {itemSplits.filter(item => item.isDiscount).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-green-700">Discount</h3>
                  {itemSplits.filter(item => item.isDiscount).map((item, originalIndex) => {
                    const itemIndex = itemSplits.findIndex(i => i === item);
                    return (
                      <div key={itemIndex} className="p-4 border border-green-200 rounded-lg bg-green-50 mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-green-900">{item.item_name}</h3>
                          <p className="text-green-800 font-medium">₹{item.price.toFixed(2)}</p>
                        </div>

                        <div className="flex items-center mb-3">
                          <label className="flex items-center text-green-800">
                            <input
                              type="checkbox"
                              checked={item.useCustomAmounts}
                              onChange={() => toggleCustomAmounts(itemIndex)}
                              className="mr-2 h-4 w-4 text-green-600 border-green-300 rounded focus:ring-green-500"
                            />
                            Use custom amounts
                          </label>
                        </div>

                        <div className="space-y-2">
                          {personsList.map((person) => (
                            <div key={person} className="flex items-center justify-between bg-white p-2 rounded-lg">
                              <label className="flex items-center flex-1">
                                <input
                                  type="checkbox"
                                  checked={item.contributors.hasOwnProperty(person)}
                                  onChange={() => toggleContributor(itemIndex, person)}
                                  className="mr-2 h-4 w-4 text-green-600 border-green-300 rounded focus:ring-green-500"
                                />
                                <span className="text-green-900">{person}</span>
                              </label>
                              {item.useCustomAmounts && item.contributors.hasOwnProperty(person) && (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.contributors[person]}
                                  onChange={(e) => handleCustomAmountChange(itemIndex, person, e.target.value)}
                                  className="w-24 p-1 border border-green-200 rounded focus:ring-green-500 focus:border-green-500"
                                />
                              )}
                              {!item.useCustomAmounts && item.contributors.hasOwnProperty(person) && (
                                <span className="text-green-600">₹{item.contributors[person].toFixed(2)}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {item.useCustomAmounts && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-800">Total assigned:</span>
                              <span className={`font-medium ${validateCustomAmounts(itemIndex) ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{Object.values(item.contributors)
                                  .reduce((sum, amount) => {
                                    const numAmount = amount === '' ? 0 : parseFloat(amount) || 0;
                                    return sum + numAmount;
                                  }, 0)
                                  .toFixed(2)} / ₹{item.price.toFixed(2)}
                              </span>
                            </div>
                            {!validateCustomAmounts(itemIndex) && (
                              <div className="flex justify-between text-sm">
                                <span className="text-green-800">Remaining to allocate:</span>
                                <span className="font-medium text-amber-600">
                                  ₹{(item.price - Object.values(item.contributors)
                                    .reduce((sum, amount) => {
                                      const numAmount = amount === '' ? 0 : parseFloat(amount) || 0;
                                      return sum + numAmount;
                                    }, 0))
                                    .toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
        )}

        {/* Step 4: Results */}
        {step === 4 && results && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-indigo-800">Payment Breakdown</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.breakdown.map((item, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg shadow-md">
                  <p className="text-xl font-bold">{item.person}</p>
                  <p className="text-3xl font-bold mt-2">₹{item.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => goToStep(3)}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={resetApp}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Start New Split
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Loading spinner */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-center text-indigo-800 font-medium">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
