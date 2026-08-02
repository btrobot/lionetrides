import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnimatedSection from '@/components/shared/animated-section';

describe('AnimatedSection', () => {
  beforeEach(() => {
    // Mock IntersectionObserver - DON'T call callback synchronously (real IO doesn't)
    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }

    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: MockIntersectionObserver,
    });
  });

  it('renders children', () => {
    render(<AnimatedSection><div>Test Content</div></AnimatedSection>);
    expect(screen.getByText('Test Content')).toBeDefined();
  });

  it('starts invisible', () => {
    const { container } = render(<AnimatedSection><div>Animated</div></AnimatedSection>);
    const section = container.firstChild as HTMLElement;
    expect(section.className).toContain('opacity-0');
  });

  it('applies custom className', () => {
    render(<AnimatedSection className="custom-class"><div>Custom</div></AnimatedSection>);
    const wrapper = screen.getByText('Custom').parentElement;
    expect(wrapper?.className).toContain('custom-class');
  });

  it('accepts custom animation delay', () => {
    const { container } = render(<AnimatedSection delay={300}><div>Delayed</div></AnimatedSection>);
    const section = container.firstChild as HTMLElement;
    expect(section.className).toContain('opacity-0');
    expect(section.className).toContain('transition-all');
  });

  it('uses default values when no props provided', () => {
    const { container } = render(<AnimatedSection><div>Default</div></AnimatedSection>);
    const section = container.firstChild as HTMLElement;
    expect(section.className).toContain('opacity-0');
    expect(section.className).toContain('transition-all');
  });

  it('renders multiple children', () => {
    render(
      <AnimatedSection>
        <span>First</span>
        <span>Second</span>
      </AnimatedSection>
    );
    expect(screen.getByText('First')).toBeDefined();
    expect(screen.getByText('Second')).toBeDefined();
  });
});