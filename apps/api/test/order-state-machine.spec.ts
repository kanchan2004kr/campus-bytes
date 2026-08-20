import {
  OrderStatus,
  canTransition,
  isCancellableByStudent,
  isTerminal,
} from '@campus-bytes/types';

describe('Order state machine', () => {
  it('allows the happy path forward transitions', () => {
    expect(canTransition(OrderStatus.PLACED, OrderStatus.ACCEPTED)).toBe(true);
    expect(canTransition(OrderStatus.ACCEPTED, OrderStatus.PREPARING)).toBe(true);
    expect(canTransition(OrderStatus.PREPARING, OrderStatus.READY)).toBe(true);
    expect(canTransition(OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY)).toBe(true);
    expect(canTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED)).toBe(true);
  });

  it('rejects skipping states (e.g. PLACED → DELIVERED)', () => {
    expect(canTransition(OrderStatus.PLACED, OrderStatus.DELIVERED)).toBe(false);
    expect(canTransition(OrderStatus.PLACED, OrderStatus.READY)).toBe(false);
    expect(canTransition(OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY)).toBe(false);
  });

  it('rejects backward transitions', () => {
    expect(canTransition(OrderStatus.READY, OrderStatus.PREPARING)).toBe(false);
    expect(canTransition(OrderStatus.DELIVERED, OrderStatus.READY)).toBe(false);
  });

  it('permits reject/cancel only from PLACED', () => {
    expect(canTransition(OrderStatus.PLACED, OrderStatus.REJECTED)).toBe(true);
    expect(canTransition(OrderStatus.PLACED, OrderStatus.CANCELLED)).toBe(true);
    expect(canTransition(OrderStatus.PREPARING, OrderStatus.CANCELLED)).toBe(false);
  });

  it('marks terminal states and student-cancellability correctly', () => {
    expect(isTerminal(OrderStatus.DELIVERED)).toBe(true);
    expect(isTerminal(OrderStatus.REJECTED)).toBe(true);
    expect(isTerminal(OrderStatus.PLACED)).toBe(false);
    expect(isCancellableByStudent(OrderStatus.PLACED)).toBe(true);
    expect(isCancellableByStudent(OrderStatus.ACCEPTED)).toBe(false);
  });
});
