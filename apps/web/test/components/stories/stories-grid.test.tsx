import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StoriesGrid } from '../../../components/stories/stories-grid';
import { createMockStories, createMockStory } from '../../utils';

// Mock the StoryCard component since we're testing the grid layout, not the card itself
vi.mock('../../../components/stories/story-card', () => ({
  StoryCard: ({ story, variant, showHype, showImage, showTimestamp }: any) => (
    <div 
      data-testid={`story-card-${story.id}`}
      data-variant={variant}
      data-show-hype={showHype}
      data-show-image={showImage}
      data-show-timestamp={showTimestamp}
    >
      {story.title}
    </div>
  ),
}));

describe('StoriesGrid', () => {
  it('renders empty grid when no stories provided', () => {
    render(<StoriesGrid stories={[]} />);
    
    const grid = document.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid?.children).toHaveLength(0);
  });

  it('renders single story in grid', () => {
    const stories = createMockStories(1);
    render(<StoriesGrid stories={stories} />);
    
    expect(screen.getByTestId('story-card-test-story-0')).toBeInTheDocument();
    expect(screen.getByText('Test Story 1')).toBeInTheDocument();
  });

  it('renders multiple stories in grid', () => {
    const stories = createMockStories(3);
    render(<StoriesGrid stories={stories} />);
    
    expect(screen.getByTestId('story-card-test-story-0')).toBeInTheDocument();
    expect(screen.getByTestId('story-card-test-story-1')).toBeInTheDocument();
    expect(screen.getByTestId('story-card-test-story-2')).toBeInTheDocument();
  });

  it('applies default grid classes', () => {
    const stories = createMockStories(2);
    render(<StoriesGrid stories={stories} />);
    
    const grid = document.querySelector('.grid');
    expect(grid).toHaveClass(
      'grid',
      'grid-cols-1',
      'gap-4',
      'sm:grid-cols-2',
      'md:grid-cols-2',
      'lg:grid-cols-3',
      'xl:grid-cols-3'
    );
  });

  it('applies custom column configuration', () => {
    const stories = createMockStories(2);
    const customColumns = { sm: 1, md: 3, lg: 4, xl: 5 };
    
    render(<StoriesGrid stories={stories} columns={customColumns} />);
    
    const grid = document.querySelector('.grid');
    expect(grid).toHaveClass(
      'sm:grid-cols-1',
      'md:grid-cols-3',
      'lg:grid-cols-4',
      'xl:grid-cols-5'
    );
  });

  it('applies custom className', () => {
    const stories = createMockStories(1);
    render(<StoriesGrid stories={stories} className="custom-grid-class" />);
    
    const grid = document.querySelector('.grid');
    expect(grid).toHaveClass('custom-grid-class');
  });

  it('passes variant prop to StoryCard components', () => {
    const stories = createMockStories(2);
    render(<StoriesGrid stories={stories} variant="compact" />);
    
    const cards = screen.getAllByTestId(/story-card-/);
    cards.forEach(card => {
      expect(card).toHaveAttribute('data-variant', 'compact');
    });
  });

  it('passes showHype prop to StoryCard components', () => {
    const stories = createMockStories(2);
    render(<StoriesGrid stories={stories} showHype={true} />);
    
    const cards = screen.getAllByTestId(/story-card-/);
    cards.forEach(card => {
      expect(card).toHaveAttribute('data-show-hype', 'true');
    });
  });

  it('passes showImage prop to StoryCard components', () => {
    const stories = createMockStories(2);
    render(<StoriesGrid stories={stories} showImage={false} />);
    
    const cards = screen.getAllByTestId(/story-card-/);
    cards.forEach(card => {
      expect(card).toHaveAttribute('data-show-image', 'false');
    });
  });

  it('passes showTimestamp prop to StoryCard components', () => {
    const stories = createMockStories(2);
    render(<StoriesGrid stories={stories} showTimestamp={false} />);
    
    const cards = screen.getAllByTestId(/story-card-/);
    cards.forEach(card => {
      expect(card).toHaveAttribute('data-show-timestamp', 'false');
    });
  });

  it('uses default props when not specified', () => {
    const stories = createMockStories(1);
    render(<StoriesGrid stories={stories} />);
    
    const card = screen.getByTestId('story-card-test-story-0');
    expect(card).toHaveAttribute('data-variant', 'default');
    expect(card).toHaveAttribute('data-show-hype', 'false');
    expect(card).toHaveAttribute('data-show-image', 'true');
    expect(card).toHaveAttribute('data-show-timestamp', 'true');
  });

  it('handles partial column configuration', () => {
    const stories = createMockStories(1);
    const partialColumns = { md: 4, xl: 6 };
    
    render(<StoriesGrid stories={stories} columns={partialColumns} />);
    
    const grid = document.querySelector('.grid');
    expect(grid).toHaveClass('md:grid-cols-4', 'xl:grid-cols-6');
    // Should not have sm or lg classes when not specified
    expect(grid?.className).not.toMatch(/sm:grid-cols-/);
    expect(grid?.className).not.toMatch(/lg:grid-cols-/);
  });

  it('renders stories with unique keys', () => {
    const stories = [
      createMockStory({ id: 'story-1', title: 'First Story' }),
      createMockStory({ id: 'story-2', title: 'Second Story' }),
      createMockStory({ id: 'story-3', title: 'Third Story' }),
    ];
    
    render(<StoriesGrid stories={stories} />);
    
    expect(screen.getByTestId('story-card-story-1')).toBeInTheDocument();
    expect(screen.getByTestId('story-card-story-2')).toBeInTheDocument();
    expect(screen.getByTestId('story-card-story-3')).toBeInTheDocument();
  });

  it('handles large number of stories', () => {
    const stories = createMockStories(20);
    render(<StoriesGrid stories={stories} />);
    
    const cards = screen.getAllByTestId(/story-card-/);
    expect(cards).toHaveLength(20);
  });

  it('maintains grid structure with mixed content', () => {
    const stories = [
      createMockStory({ id: 'short', title: 'Short' }),
      createMockStory({ id: 'long', title: 'Very Long Story Title That Might Wrap' }),
      createMockStory({ id: 'medium', title: 'Medium Length Title' }),
    ];
    
    render(<StoriesGrid stories={stories} />);
    
    const grid = document.querySelector('.grid');
    expect(grid).toHaveClass('grid', 'gap-4');
    expect(grid?.children).toHaveLength(3);
  });
});
