import React from 'react';
import { act, render } from '@testing-library/react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import QRCodeScanner from './QRCodeScanner';

jest.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: jest.fn()
}));

describe('QRCodeScanner', () => {
  it('stops the scanner controls when the component unmounts', async () => {
    const controls = { stop: jest.fn() };
    BrowserMultiFormatReader.mockImplementation(() => ({
      decodeFromVideoDevice: jest.fn(() => Promise.resolve(controls))
    }));

    let view;
    await act(async () => {
      view = render(<QRCodeScanner onDetected={jest.fn()} />);
      await Promise.resolve();
    });

    view.unmount();

    expect(controls.stop).toHaveBeenCalledTimes(1);
  });
});
