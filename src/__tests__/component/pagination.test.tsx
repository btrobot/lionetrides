import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/shared/pagination';

describe('Pagination', () => {
  it('renders page info', () => {
    render(<Pagination page={1} totalPages={5} total={50} onPageChange={() => {}} />);
    expect(screen.getByText(/共 50 条/)).toBeDefined();
    expect(screen.getByText(/第 1/)).toBeDefined();
  });

  it('disables previous button on first page', () => {
    render(<Pagination page={1} totalPages={5} total={50} onPageChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    const prevBtn = buttons[0];
    expect(prevBtn.disabled).toBe(true);
  });

  it('enables next button when not on last page', () => {
    render(<Pagination page={1} totalPages={5} total={50} onPageChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons[buttons.length - 1];
    expect(nextBtn.disabled).toBe(false);
  });

  it('disables next button on last page', () => {
    render(<Pagination page={5} totalPages={5} total={50} onPageChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons[buttons.length - 1];
    expect(nextBtn.disabled).toBe(true);
  });

  it('enables previous button when not on first page', () => {
    render(<Pagination page={3} totalPages={5} total={50} onPageChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    const prevBtn = buttons[0];
    expect(prevBtn.disabled).toBe(false);
  });

  it('calls onPageChange when clicking a page number', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={5} total={50} onPageChange={onPageChange} />);
    const pageBtn = screen.getByText('2');
    fireEvent.click(pageBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('renders ellipsis when many pages', () => {
    render(<Pagination page={1} totalPages={20} total={200} onPageChange={() => {}} />);
    const ellipsis = screen.getAllByText('...');
    expect(ellipsis.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render when totalPages is 0', () => {
    const { container } = render(<Pagination page={0} totalPages={0} total={0} onPageChange={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  it('does not render when totalPages is 1', () => {
    const { container } = render(<Pagination page={1} totalPages={1} total={10} onPageChange={() => {}} />);
    expect(container.innerHTML).toBe('');
  });
});