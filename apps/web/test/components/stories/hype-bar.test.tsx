import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HypeBar } from '../../../components/stories/hype-bar';

describe('HypeBar', () => {
  it('renders with correct hype level labels', () => {
    const testCases = [
      { value: 10, expectedLabel: 'Low' },
      { value: 30, expectedLabel: 'Mild' },
      { value: 50, expectedLabel: 'Moderate' },
      { value: 70, expectedLabel: 'High' },
      { value: 90, expectedLabel: 'Extreme' },
    ];

    testCases.forEach(({ value, expectedLabel }) => {
      const { unmount } = render(<HypeBar value={value} />);
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
      unmount();
    });
  });

  it('applies correct color classes based on hype level', () => {
    const testCases = [
      { value: 10, expectedClass: 'bg-muted' },
      { value: 30, expectedClass: 'bg-yellow-400' },
      { value: 50, expectedClass: 'bg-orange-400' },
      { value: 70, expectedClass: 'bg-red-400' },
      { value: 90, expectedClass: 'bg-red-600' },
    ];

    testCases.forEach(({ value, expectedClass }) => {
      const { unmount } = render(<HypeBar value={value} />);

      const progressBar = document.querySelector('.h-full');
      expect(progressBar).toHaveClass(expectedClass);
      unmount();
    });
  });

  it('applies correct width style to progress bar', () => {
    render(<HypeBar value={60} />);

    const progressBar = document.querySelector('.h-full');
    expect(progressBar).toHaveStyle({ width: '60%' });
  });

  it('clamps width style to 0-100 range', () => {
    const { rerender } = render(<HypeBar value={150} />);

    let progressBar = document.querySelector('.h-full');
    expect(progressBar).toHaveStyle({ width: '100%' });

    rerender(<HypeBar value={-25} />);
    progressBar = document.querySelector('.h-full');
    expect(progressBar).toHaveStyle({ width: '0%' });
  });

  it('handles boundary values correctly', () => {
    const boundaryTests = [
      { value: 19, expectedLabel: 'Low', expectedClass: 'bg-muted' },
      { value: 20, expectedLabel: 'Mild', expectedClass: 'bg-yellow-400' },
      { value: 39, expectedLabel: 'Mild', expectedClass: 'bg-yellow-400' },
      { value: 40, expectedLabel: 'Moderate', expectedClass: 'bg-orange-400' },
      { value: 59, expectedLabel: 'Moderate', expectedClass: 'bg-orange-400' },
      { value: 60, expectedLabel: 'High', expectedClass: 'bg-red-400' },
      { value: 79, expectedLabel: 'High', expectedClass: 'bg-red-400' },
      { value: 80, expectedLabel: 'Extreme', expectedClass: 'bg-red-600' },
    ];

    boundaryTests.forEach(({ value, expectedLabel, expectedClass }) => {
      const { unmount } = render(<HypeBar value={value} />);

      expect(screen.getByText(expectedLabel)).toBeInTheDocument();

      const progressBar = document.querySelector('.h-full');
      expect(progressBar).toHaveClass(expectedClass);

      unmount();
    });
  });

  it('applies custom className when provided', () => {
    render(<HypeBar value={50} className="custom-hype-class" />);

    const container = document.querySelector('.custom-hype-class');
    expect(container).toBeInTheDocument();
  });

  it('has correct accessibility structure', () => {
    render(<HypeBar value={75} />);

    // Check for progress bar container
    const progressContainer = document.querySelector('.relative.h-1.flex-1');
    expect(progressContainer).toBeInTheDocument();

    // Check for hype level text
    const hypeText = screen.getByText('High');
    expect(hypeText).toHaveClass('text-xs', 'text-muted-foreground');
  });

  it('handles zero value correctly', () => {
    render(<HypeBar value={0} />);

    expect(screen.getByText('Low')).toBeInTheDocument();

    const progressBar = document.querySelector('.h-full');
    expect(progressBar).toHaveStyle({ width: '0%' });
    expect(progressBar).toHaveClass('bg-muted');
  });

  it('handles 100% value correctly', () => {
    render(<HypeBar value={100} />);

    expect(screen.getByText('Extreme')).toBeInTheDocument();

    const progressBar = document.querySelector('.h-full');
    expect(progressBar).toHaveStyle({ width: '100%' });
    expect(progressBar).toHaveClass('bg-red-600');
  });
});
