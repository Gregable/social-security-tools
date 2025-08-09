// @ts-nocheck
import { render } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/dom';
import { describe, it, expect, vi } from 'vitest';
import RecipientInputs from '../../routes/strategy/components/RecipientInputs.svelte';
import { makeRecipients } from '../utils/recipients';

describe('RecipientInputs', () => {
  it('updates name and PIA and triggers onUpdate', async () => {
    const recipients = makeRecipients();
    const onUpdate = vi.fn();
    const { getAllByLabelText } = render(RecipientInputs, {
      recipients,
      piaValues: [1000, 500],
      birthdateInputs: ['1965-03-15', '1965-03-15'],
      onUpdate,
    });

    const nameInput = getAllByLabelText('Name:')[0] as any;
    await fireEvent.input(nameInput, { target: { value: 'NewName' } });
    expect(onUpdate).toHaveBeenCalled();

    const piaInput = getAllByLabelText(/Primary Insurance Amount/)[0] as any;
    await fireEvent.input(piaInput, { target: { value: '1500' } });
    expect(onUpdate).toHaveBeenCalledTimes(2);
  });

  it('validates PIA extremes', async () => {
    const recipients = makeRecipients();
    const onUpdate = vi.fn();
    const { getAllByLabelText, findByText } = render(RecipientInputs, {
      recipients,
      piaValues: [1000, 500],
      birthdateInputs: ['1965-03-15', '1965-03-15'],
      onUpdate,
    });

    const piaInput = getAllByLabelText(/Primary Insurance Amount/)[0] as any;
    await fireEvent.input(piaInput, { target: { value: '-10' } });
    await findByText(/non-negative/);

    await fireEvent.input(piaInput, { target: { value: '12000' } });
    await findByText(/unusually high/);
  });
});
