// @ts-nocheck
import { render } from '@testing-library/svelte';
import { fireEvent, waitFor } from '@testing-library/dom';
import { describe, it, expect, vi } from 'vitest';
import DiscountRateInput from '../../routes/strategy/components/DiscountRateInput.svelte';

vi.mock('$lib/strategy/data', () => ({
  getRecommendedDiscountRate: vi.fn().mockResolvedValue(0.038), // 3.8%
}));

describe('DiscountRateInput', () => {
  it('renders preset buttons and updates on fetch', async () => {
    const onDiscountRateChange = vi.fn();
    const { getByLabelText, getByText } = render(DiscountRateInput, {
      discountRatePercent: 2.5,
      onDiscountRateChange,
      disableFetch: true,
    });

    await waitFor(() =>
      expect(getByText(/20-year Treasury rate/)).toBeTruthy()
    );

    // Click a preset button
    const preset = getByText(/US Stock 10y expected/);
    await fireEvent.click(preset);
    expect(onDiscountRateChange).toHaveBeenCalledWith(3.5);

    // Input manual value
    const input = getByLabelText('Discount Rate (Real %):') as any;
    await fireEvent.input(input, { target: { value: '4.2' } });
    expect(onDiscountRateChange).toHaveBeenCalledWith(4.2);
  });

  it('validates invalid values', async () => {
    const onValidityChange = vi.fn();
    const { getByLabelText, findByText } = render(DiscountRateInput, {
      discountRatePercent: 2.5,
      onValidityChange,
      disableFetch: true,
    });

    const input = getByLabelText('Discount Rate (Real %):') as any;
    await fireEvent.input(input, { target: { value: '-1' } });
    await findByText(/cannot be less than 0%/i);
    // We should have at least one false state after the initial true
    expect(onValidityChange.mock.calls.map((c) => c[0])).toContain(false);

    await fireEvent.input(input, { target: { value: '51' } });
    await findByText(/cannot exceed 50%/i);
    // Still contains false (may have multiple false calls)
    expect(onValidityChange.mock.calls.map((c) => c[0])).toContain(false);

    await fireEvent.input(input, { target: { value: '5' } });
    await waitFor(() =>
      expect(onValidityChange).toHaveBeenLastCalledWith(true)
    );
  });
});
