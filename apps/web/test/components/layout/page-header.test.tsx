import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from '../../../components/layout/page-header';

describe('PageHeader', () => {
  it('renders title correctly', () => {
    render(<PageHeader title="Test Page Title" />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Test Page Title');
    expect(heading).toHaveClass('text-3xl', 'font-bold');
  });

  it('renders without description when not provided', () => {
    render(<PageHeader title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <PageHeader
        title="Test Title"
        description="This is a test description for the page"
      />
    );

    const description = screen.getByText(
      'This is a test description for the page'
    );
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('mt-2', 'text-muted-foreground');
  });

  it('renders without children when not provided', () => {
    render(<PageHeader title="Test Title" />);

    // Should not have the actions container
    expect(
      document.querySelector('.flex.items-center.gap-2')
    ).not.toBeInTheDocument();
  });

  it('renders children in actions area when provided', () => {
    render(
      <PageHeader title="Test Title">
        <button>Action Button</button>
        <span>Action Text</span>
      </PageHeader>
    );

    expect(screen.getByText('Action Button')).toBeInTheDocument();
    expect(screen.getByText('Action Text')).toBeInTheDocument();

    const actionsContainer = document.querySelector('.flex.items-center.gap-2');
    expect(actionsContainer).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<PageHeader title="Test Title" className="custom-header-class" />);

    const header = document.querySelector('.custom-header-class');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('mb-8'); // Should still have default classes
  });

  it('has correct responsive layout structure', () => {
    render(<PageHeader title="Test Title" />);

    const layoutContainer = document.querySelector(
      '.flex.flex-col.gap-4.sm\\:flex-row.sm\\:items-center.sm\\:justify-between'
    );
    expect(layoutContainer).toBeInTheDocument();
  });

  it('renders complete header with all props', () => {
    render(
      <PageHeader
        title="Complete Header"
        description="Full description text"
        className="custom-class"
      >
        <button>Primary Action</button>
        <button>Secondary Action</button>
      </PageHeader>
    );

    // Check all elements are present
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Complete Header'
    );
    expect(screen.getByText('Full description text')).toBeInTheDocument();
    expect(screen.getByText('Primary Action')).toBeInTheDocument();
    expect(screen.getByText('Secondary Action')).toBeInTheDocument();

    // Check structure
    const header = document.querySelector('.custom-class');
    expect(header).toBeInTheDocument();
  });

  it('handles empty string description', () => {
    render(<PageHeader title="Test Title" description="" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    // Empty description should not render the paragraph
    expect(document.querySelector('p')).not.toBeInTheDocument();
  });

  it('handles long titles gracefully', () => {
    const longTitle =
      'This is a very long page title that might wrap to multiple lines in smaller viewports';
    render(<PageHeader title={longTitle} />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(longTitle);
  });

  it('handles long descriptions gracefully', () => {
    const longDescription =
      'This is a very long description that provides detailed information about the page content and might span multiple lines depending on the viewport size and content length.';
    render(<PageHeader title="Test Title" description={longDescription} />);

    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it('maintains proper semantic structure', () => {
    render(
      <PageHeader
        title="Semantic Test"
        description="Description for semantic test"
      >
        <button>Action</button>
      </PageHeader>
    );

    // Should have proper heading hierarchy
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();

    // Description should be a paragraph
    const description = screen.getByText('Description for semantic test');
    expect(description.tagName).toBe('P');

    // Actions should be in a container
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('applies default margin bottom class', () => {
    render(<PageHeader title="Test Title" />);

    const header = document.querySelector('.mb-8');
    expect(header).toBeInTheDocument();
  });

  it('combines custom className with default classes', () => {
    render(<PageHeader title="Test Title" className="extra-spacing" />);

    const header = document.querySelector('.mb-8.extra-spacing');
    expect(header).toBeInTheDocument();
  });

  it('handles React elements as children', () => {
    const CustomComponent = () => <span>Custom Component</span>;

    render(
      <PageHeader title="Test Title">
        <CustomComponent />
        <div>Div Element</div>
      </PageHeader>
    );

    expect(screen.getByText('Custom Component')).toBeInTheDocument();
    expect(screen.getByText('Div Element')).toBeInTheDocument();
  });
});
