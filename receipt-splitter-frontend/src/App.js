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
    goToStep
  } = useReceiptCalculator();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">Receipt Splitter</h1>

        <StepsIndicator currentStep={step} goToStep={goToStep} />

        {step === 1 && (
          <ReceiptUpload
            setReceipt={setReceipt}
            setEditedItems={setEditedItems}
            setEditedTaxes={setEditedTaxes}
            setItemSplits={setItemSplits}
            setStep={setStep}
            setError={setError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            file={file}
            setFile={setFile}
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
          />
        )}

        {step === 2 && receipt && (
          <>
            <ReceiptItems
              imagePreview={imagePreview}
              editingPrices={editingPrices}
              setEditingPrices={setEditingPrices}
              editedItems={editedItems}
              setEditedItems={setEditedItems}
              editedTaxes={editedTaxes}
              setEditedTaxes={setEditedTaxes}
              discountType={discountType}
              setDiscountType={setDiscountType}
              discountValue={discountValue}
              setDiscountValue={setDiscountValue}
              calculateCurrentTotal={calculateCurrentTotal}
              handlePriceChange={handlePriceChange}
              handleTaxChange={handleTaxChange}
              handleTaxNameChange={handleTaxNameChange}
              addNewTax={addNewTax}
              removeTax={removeTax}
            />

            <PersonsInput
              persons={persons}
              setPersons={setPersons}
              setPersonsList={setPersonsList}
              setStep={setStep}
              goToStep={goToStep}
              editingPrices={editingPrices}
              receipt={receipt}
              editedItems={editedItems}
              editedTaxes={editedTaxes}
              discountType={discountType}
              discountValue={discountValue}
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
      {// also add total bill in step-4 results so that they are copy pastable in the end
      }
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
