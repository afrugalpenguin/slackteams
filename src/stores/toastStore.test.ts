import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore, toast } from './toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should add a toast', () => {
    toast.success('Test message');

    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].type).toBe('success');
    expect(state.toasts[0].message).toBe('Test message');
  });

  it('should add different toast types', () => {
    toast.success('Success');
    toast.error('Error');
    toast.warning('Warning');
    toast.info('Info');

    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(4);
    expect(state.toasts.map(t => t.type)).toEqual(['success', 'error', 'warning', 'info']);
  });

  it('should remove a toast by id', () => {
    toast.success('Test');
    const state = useToastStore.getState();
    const toastId = state.toasts[0].id;

    useToastStore.getState().removeToast(toastId);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('should auto-remove toast after duration', async () => {
    toast.success('Auto remove', 1000);

    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(1000);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('should generate unique ids for each toast', () => {
    toast.success('First');
    toast.success('Second');
    toast.success('Third');

    const state = useToastStore.getState();
    const ids = state.toasts.map(t => t.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(3);
  });
});
