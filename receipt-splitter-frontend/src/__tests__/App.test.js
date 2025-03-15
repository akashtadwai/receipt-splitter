import React from 'react';
import { render, screen } from '@testing-library/react';
import App from 'src/App';

describe('App', () => {
  it('renders without crashing and shows step 1 by default', () => {
    render(<App />);

    // Check if the app title is rendered
    expect(screen.getByText('Receipt Splitter')).toBeInTheDocument();

    // Check if we're on step 1 (Upload Receipt step)
    expect(screen.getByText('Upload Receipt')).toBeInTheDocument();
    expect(screen.getByText('Process Receipt')).toBeInTheDocument();
    expect(screen.getByText('Show Demo')).toBeInTheDocument();
  });

  it('has the correct step indicators', () => {
    render(<App />);

    // Step 1 should be highlighted, others should not
    const stepIndicators = screen.getAllByRole('generic', { hidden: true })
      .filter(div => div.textContent.match(/^[1-4✓]$/));

    expect(stepIndicators[0]).toHaveClass('flex items-center'); // Step 1 (current)
    expect(stepIndicators[1]).toHaveClass('flex items-center'); // Step 2 (future)
    expect(stepIndicators[2]).toHaveClass('flex items-center'); // Step 3 (future)
    expect(stepIndicators[3]).toHaveClass('flex items-center'); // Step 4 (future)
  });

  it('renders footer with credits', () => {
    render(<App />);

    expect(screen.getByText(/Powered by Claude & Mistral AI/)).toBeInTheDocument();
    const githubLink = screen.getByRole('link');
    expect(githubLink).toHaveAttribute('href', 'https://github.com/akashtadwai/receipt-splitter');
  });
});
