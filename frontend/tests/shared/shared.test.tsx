import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { apiRequest, clearSession, getStoredUser, getToken, saveSession } from '@/shared/api';
import {
  APP_VERSION,
  CATEGORIES,
  DELIVERY,
  LOW_STOCK_THRESHOLD,
  STORE,
  fallbackProductImage,
  landingImages,
} from '@/shared/config';
import * as lib from '@/shared/lib';
import { errorMessage } from '@/shared/lib/errors';
import { CATALOG_SECTION_ID, scrollToCatalog } from '@/shared/lib/scroll';
import { BuildBadge } from '@/shared/ui/BuildBadge';
import { Modal } from '@/shared/ui/Modal';
import { QuantityStepper } from '@/shared/ui/QuantityStepper';
import { SideDrawer } from '@/shared/ui/SideDrawer';
import { ToastContainer, ToastProvider, useToast } from '@/shared/ui/toast';
import { fail, mockApi } from '../helpers';

describe('shared/api/client', () => {
  it('adds JSON headers and no token for guests', async () => {
    const calls = mockApi({ 'GET /thing': { value: 1 } });
    await expect(apiRequest('/thing')).resolves.toEqual({ value: 1 });
    expect(calls[0].headers['Content-Type']).toBe('application/json');
    expect(calls[0].headers.Authorization).toBeUndefined();
  });

  it('sends the saved token', async () => {
    saveSession('abc', {});
    const calls = mockApi();
    await apiRequest('/thing');
    expect(calls[0].headers.Authorization).toBe('Bearer abc');
  });

  it('throws the server message, or a default', async () => {
    mockApi({ 'GET /a': fail(400, 'Cart is empty'), 'GET /b': { __status: 500 } });
    await expect(apiRequest('/a')).rejects.toThrow('Cart is empty');
    await expect(apiRequest('/b')).rejects.toThrow('Request failed');
  });

  it('explains network failures and timeouts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(apiRequest('/a')).rejects.toThrow('Cannot reach the server');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('x', 'AbortError')));
    await expect(apiRequest('/a')).rejects.toThrow('Server took too long');
  });
});

describe('shared/api/session', () => {
  it('saves, reads and clears the session', () => {
    saveSession('t', { name: 'Asha', role: 'customer' });
    expect(getToken()).toBe('t');
    expect(getStoredUser()).toEqual({ name: 'Asha', role: 'customer' });
    clearSession();
    expect(getToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it('treats broken or blocked storage as no session', () => {
    localStorage.setItem('sns_user', '{not json');
    expect(getStoredUser()).toBeNull();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getToken()).toBeNull();
  });
});

describe('shared/config', () => {
  it('exposes store rules', () => {
    expect(STORE.pincode).toMatch(/^\d{6}$/);
    expect(DELIVERY.fee).toBeLessThan(DELIVERY.freeThreshold);
    expect(LOW_STOCK_THRESHOLD).toBeGreaterThan(0);
    expect(CATEGORIES[0]).toBe('All Products');
    expect(fallbackProductImage).toBe(landingImages.hero);
  });

  it('has a version made of three numbers', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('shared/lib', () => {
  it('errorMessage prefers the error text', () => {
    expect(errorMessage(new Error('bad'), 'fallback')).toBe('bad');
    expect(errorMessage('oops', 'fallback')).toBe('fallback');
    expect(lib.errorMessage).toBe(errorMessage);
  });

  it('scrollToCatalog scrolls only when the catalog exists', () => {
    expect(() => scrollToCatalog()).not.toThrow();
    const el = document.createElement('div');
    el.id = CATALOG_SECTION_ID;
    el.scrollIntoView = vi.fn();
    document.body.append(el);
    scrollToCatalog();
    expect(el.scrollIntoView).toHaveBeenCalled();
    el.remove();
  });
});

describe('shared/ui', () => {
  it('BuildBadge shows the version', () => {
    render(<BuildBadge />);
    expect(screen.getByTestId('app-version').textContent).toBe(`Version ${APP_VERSION}`);
  });

  it('Modal closes on Escape and backdrop, not on inner clicks', () => {
    const onClose = vi.fn();
    render(<Modal label="Box" onClose={onClose}>inside</Modal>);
    fireEvent.mouseDown(screen.getByText('inside'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('SideDrawer closes from its buttons and Escape', () => {
    const onClose = vi.fn();
    render(<SideDrawer label="Menu" onClose={onClose}>links</SideDrawer>);
    screen.getAllByRole('button', { name: 'Close Menu' }).forEach((button) => fireEvent.click(button));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('QuantityStepper shows the count and reports both buttons', () => {
    const down = vi.fn();
    const up = vi.fn();
    render(<QuantityStepper quantity={3} itemName="Rice" onDecrement={down} onIncrement={up} />);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease Rice' }));
    fireEvent.click(screen.getByRole('button', { name: 'Increase Rice' }));
    expect(screen.getByText('3')).toBeTruthy();
    expect(down).toHaveBeenCalledOnce();
    expect(up).toHaveBeenCalledOnce();
  });
});

describe('shared/ui/toast', () => {
  const Trigger = () => {
    const { addToast } = useToast();
    return <button onClick={() => addToast('Saved', 'success')}>go</button>;
  };
  const tree = (
    <ToastProvider>
      <Trigger />
      <ToastContainer />
    </ToastProvider>
  );

  it('shows a message that can be dismissed', () => {
    render(tree);
    fireEvent.click(screen.getByText('go'));
    expect(screen.getByText('Saved')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('removes a message by itself', () => {
    vi.useFakeTimers();
    render(tree);
    fireEvent.click(screen.getByText('go'));
    act(() => void vi.advanceTimersByTime(4000));
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('must be used inside its provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useToast())).toThrow('ToastProvider');
  });
});
