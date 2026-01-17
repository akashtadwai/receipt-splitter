import React from 'react';
import StepsIndicator from './components/StepsIndicator';
import ReceiptUpload from './components/ReceiptUpload';
import ReceiptItems from './components/ReceiptItems';
import PersonsInput from './components/PersonsInput';
import AssignContributors from './components/AssignContributors';
import Results from './components/Results';
import ErrorMessage from './components/common/ErrorMessage';
import LoadingSpinner from './components/common/LoadingSpinner';
import Footer from './components/common/Footer';
import useReceiptCalculator from './components/hooks/useReceiptCalculator';

function App() {
  const {
    // Multi-receipt state
    files, setFiles,
    imagePreviews, setImagePreviews,
    setReceipts,
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

    // Navigation
    resetApp,
    goToStep
  } = useReceiptCalculator();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">Receipt Splitter</h1>

        <StepsIndicator currentStep={step} goToStep={goToStep} />

        {step === 1 && (
          <ReceiptUpload
            files={files}
            setFiles={setFiles}
            imagePreviews={imagePreviews}
            setImagePreviews={setImagePreviews}
            setReceipts={setReceipts}
            setReceiptData={setReceiptData}
            setStep={setStep}
            setError={setError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}

        {step === 2 && receiptData.length > 0 && (
          <>
            <ReceiptItems
              imagePreviews={imagePreviews}
              receiptData={receiptData}
              editingPrices={editingPrices}
              setEditingPrices={setEditingPrices}
              calculateReceiptTotal={calculateReceiptTotal}
              calculateCurrentTotal={calculateCurrentTotal}
              handlePriceChange={handlePriceChange}
              handleNameChange={handleNameChange}
              handleTaxChange={handleTaxChange}
              handleTaxNameChange={handleTaxNameChange}
              addNewTax={addNewTax}
              removeTax={removeTax}
              setReceiptDiscount={setReceiptDiscount}
              removeReceipt={removeReceipt}
            />

            <PersonsInput
              persons={persons}
              setPersons={setPersons}
              setPersonsList={setPersonsList}
              setStep={setStep}
              goToStep={goToStep}
              editingPrices={editingPrices}
              receiptData={receiptData}
              setError={setError}
              setItemSplits={setItemSplits}
            />
          </>
        )}

        {step === 3 && (
          <AssignContributors
            itemSplits={itemSplits}
            personsList={personsList}
            toggleContributor={toggleContributor}
            toggleCustomAmounts={toggleCustomAmounts}
            handleCustomAmountChange={handleCustomAmountChange}
            validateCustomAmounts={validateCustomAmounts}
            toggleAllContributors={toggleAllContributors}
            goToStep={goToStep}
            calculateSplit={calculateSplit}
            setError={setError}
          />
        )}

        {step === 4 && results && (
          <Results
            results={results}
            goToStep={goToStep}
            resetApp={resetApp}
            itemSplits={itemSplits}
            calculateCurrentTotal={calculateCurrentTotal}
          />
        )}

        <ErrorMessage message={error} />
        <LoadingSpinner isLoading={isLoading} />
      </div>

      <Footer />
    </div>
  );
}

export default App;
