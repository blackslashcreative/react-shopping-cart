import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from "@testing-library/user-event";
import Products from './Components/products';

test('restock products', async () => {
  const { getByText, findByText } = render(<Products/>);

  const button = getByText("ReStock Products");
  //console.log(`mybutton: ${button}`);
  userEvent.click(button); 
  await screen.findByText(/Pink Lady/i);
});