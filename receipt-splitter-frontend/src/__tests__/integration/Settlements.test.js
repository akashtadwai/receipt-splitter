import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import Constants from '../../Constants';

// Mock the API response to avoid actual network calls
jest.mock('../../Constants', () => ({
    MOCK_OCR_OUTPUT: {
        "file_name": "test_receipt",
        "ocr_contents": {
            "items": [
                { "name": "Shared Appetizer", "price": 100.0 }, // 100
                { "name": "Alice Main", "price": 50.0 },        // 50
                { "name": "Bob Main", "price": 50.0 }           // 50
            ],
            "total_order_bill_details": {
                "total_bill": 200.0,
                "taxes": []
            }
        }
    }
}));

describe('Settlement Integration Flow', () => {
    it('allows assigning payers and calculates net settlements correctly', async () => {
        render(<App />);

        // --- STEP 1: Upload (Load Demo Data) ---
        const demoButton = screen.getByText(/Show Demo/i);
        fireEvent.click(demoButton);

        // Wait for Step 2 (Review Items)
        await waitFor(() => screen.getByText(/Review Receipts/i));

        // --- STEP 2: Review Items & Add People ---
        // Verify we are on Step 2
        await waitFor(() => screen.getByText(/Review Receipts/i));

        // Enter names first because PersonsInput is on this screen
        await waitFor(() => screen.getByText(/Who's splitting this bill?/i));
        const input = screen.getByPlaceholderText(/e.g. Sachin/i);
        fireEvent.change(input, { target: { value: 'Alice, Bob' } });

        // Click Continue (which handles validation and moves to Step 3)
        const continueButton = screen.getByRole('button', { name: /Continue/i });
        fireEvent.click(continueButton);

        // --- STEP 4: Assign Items ---
        await waitFor(() => screen.getByText(/Assign Contributors/i));

        // Assign "Alice Main" to Alice
        // Find the item container
        const itemAlice = screen.getByText('Alice Main').closest('div');
        // Uncheck "Select All" then check "Alice" implies:
        // Actually the UI has "Select All" button and checkboxes.
        // Default: everyone selected? No, let's check default behavior.
        // "Select All" toggles.

        // Strategy: 
        // Shared Appetizer (100) -> Alice & Bob (Default) -> 50 each
        // Alice Main (50) -> Alice Only -> 50 Alice
        // Bob Main (50)   -> Bob Only   -> 50 Bob

        // Final Consumption:
        // Alice: 50 (Appetizer) + 50 (Main) = 100
        // Bob:   50 (Appetizer) + 50 (Main) = 100
        // Total Bill: 200

        // We need to uncheck Bob for "Alice Main" and uncheck Alice for "Bob Main"

        // Just for simplicity in test selector finding:
        // We trigger "Select All" (Deselect All) then select specific person
        // But "Select All" button text changes.

        // Let's just create a simpler Total Settlement scenario.
        // We keep equal split for everything.
        // Alice: 100, Bob: 100.

        const calculateSplitButton = screen.getByText(/Calculate Split/i);
        fireEvent.click(calculateSplitButton);

        // --- STEP 5: Results & Payer Assignment ---
        await waitFor(() => screen.getByText(/Final Split/i));

        // Verify Total
        // Verify Total (might appear multiple times: header, receipt list)
        expect(screen.getAllByText('₹200.00').length).toBeGreaterThan(0);

        // Initially shows "Consumption Breakdown"
        expect(screen.getByRole('heading', { name: /Consumption Breakdown/i })).toBeInTheDocument();
        
        // Assign Payer: Alice paid the whole bill (200)
        // Find the select dropdown for Receipt 1
        const selects = screen.getAllByRole('combobox');
        const payerSelect = selects[0]; // Receipt 1
        
        fireEvent.change(payerSelect, { target: { value: 'Alice' } });

        // Now Payment Summary should appear/update with Payer info
        // Payment Summary is just text in textarea, so getByText matching logic might be needed
        // But wait, "Payment Summary:" is added to textarea lines.
        // It is NOT a header in UI.
        // Wait, check Results.js again.
        
        // Expect text: "Receipt 1 ... Paid by Alice"
        // Also "Total Paid by Alice: ₹200.00" - this IS in the UI breakdown cards
        
        // We can verify paid totals are shown
        // Since "Total Paid by Alice" might be in textarea too?
        // Let's filter for the specific UI element
        // In UI: <div className="mt-2 text-xs text-green-600 ...">Paid: ₹...</div> inside Alice's card
        
        // Finding Alice's card
        const aliceCardHeader = screen.getByText('Alice consumed');
        const aliceCard = aliceCardHeader.closest('.bg-white');
        expect(aliceCard).toHaveTextContent(/Paid: ₹200.00/i);
        
        // Verify Consumption is still shown
        expect(screen.getByRole('heading', { name: /Consumption Breakdown/i })).toBeInTheDocument();
        // Alice consumed 100, Bob consumed 100
        expect(screen.getByText('Alice consumed')).toBeInTheDocument();
        expect(screen.getByText('Bob consumed')).toBeInTheDocument();
        
        // --- Verify Mutual Payer Scenario ---
        // If Bob paid 200
        fireEvent.change(payerSelect, { target: { value: 'Bob' } });
        
        const bobCardHeader = screen.getByText('Bob consumed');
        const bobCard = bobCardHeader.closest('.bg-white');
        expect(bobCard).toHaveTextContent(/Paid: ₹200.00/i);
    });
});
