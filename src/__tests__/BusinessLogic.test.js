import { describe, it, expect, beforeEach } from 'vitest';

// Simulate the logic we use in DataContext
// In a real app we might extract "Logic" to a pure function to test easier without Context mocking.
// For this prototype, I'll test the Logic Functions directly if I extract them, 
// or I will test a simulated version of the rules.

const checkSpaceAvailability = (space, horseId) => {
    if (space.status === 'occupied' && space.horseId !== horseId) return false;
    if (space.status === 'maintenance') return false;
    return true;
};

const calculateBalance = (finances) => {
    const income = finances.filter(f => f.type === 'income').reduce((acc, c) => acc + c.amount, 0);
    const expense = finances.filter(f => f.type === 'expense').reduce((acc, c) => acc + c.amount, 0);
    return income - expense;
};

describe('Business Rules', () => {

    describe('Space Assignment', () => {
        it('should allow assigning to an available space', () => {
            const space = { status: 'available', horseId: null };
            expect(checkSpaceAvailability(space, 'h1')).toBe(true);
        });

        it('should NOT allow assigning to an occupied space', () => {
            const space = { status: 'occupied', horseId: 'other-horse' };
            expect(checkSpaceAvailability(space, 'h1')).toBe(false);
        });

        it('should NOT allow assigning to a space in maintenance', () => {
            const space = { status: 'maintenance', horseId: null };
            expect(checkSpaceAvailability(space, 'h1')).toBe(false);
        });
    });

    describe('Finance Calculations', () => {
        it('should calculate positive balance correctly', () => {
            const transactions = [
                { type: 'income', amount: 1000 },
                { type: 'expense', amount: 200 }
            ];
            expect(calculateBalance(transactions)).toBe(800);
        });

        it('should calculate negative balance (loss) correctly', () => {
            const transactions = [
                { type: 'income', amount: 100 },
                { type: 'expense', amount: 500 }
            ];
            expect(calculateBalance(transactions)).toBe(-400);
        });
    });

});
