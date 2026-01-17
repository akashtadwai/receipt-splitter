import React from 'react';
import { render, screen } from '@testing-library/react';
import App from 'src/App';

describe('App', () => {
  it('renders step 1 with upload UI', () => {
    render(<App />);

    expect(screen.getByText('Receipt Splitter')).toBeInTheDocument();
    expect(screen.getByText('Upload Receipts')).toBeInTheDocument();
    expect(screen.getByText(/Process.*Receipt/)).toBeInTheDocument();
    expect(screen.getByText('Show Demo')).toBeInTheDocument();
  });

  it('shows step indicators', () => {
    render(<App />);

    // All 4 step numbers should be visible
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders footer with credits', () => {
    render(<App />);

    expect(screen.getByText(/Powered by Claude & Mistral AI/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://github.com/akashtadwai/receipt-splitter');
  });
});
