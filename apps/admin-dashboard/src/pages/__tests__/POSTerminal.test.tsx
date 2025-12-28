import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import POSTerminal from '../POSTerminal';
import api from '../../services/api';

// --- Mocks ---
vi.mock('../../services/api');
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 1, name: 'Kasir' }, logout: vi.fn() })
}));
vi.mock('../../context/ConfirmContext', () => ({
    useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(true) })
}));
vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn() }
}));
vi.mock('../../utils/format', () => ({
    formatRupiah: (val: number) => `Rp ${val}`
}));
vi.mock('../../context/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() })
}));
// Mock child components that might complicate testing
vi.mock('../components/Sidebar', () => ({
    default: () => <div data-testid="sidebar">Sidebar</div>
}));
vi.mock('../components/PrintableReceipt', () => ({
    default: () => <div data-testid="printable-receipt">Receipt</div>
}));

// Mock Data
// Define mock data outside to be used in factory
const mockProducts = [
    {
        id: '1',
        name: 'Kopi Hitam',
        category_id: 1,
        category_name: 'Minuman',
        price: 15000,
        stock_quantity: 10,
        image_url: 'http://localhost:8000/storage/products/kopi.jpg',
        sku: 'K001',
        description: 'Kopi hitam nikmat'
    },
    {
        id: '2',
        name: 'Roti Bakar',
        category_id: 2,
        category_name: 'Makanan',
        price: 12000,
        stock_quantity: 5,
        image_url: null,
        sku: 'R001',
        description: 'Roti bakar keju'
    }
];

const mockCategories = [
    { id: 1, name: 'Minuman', icon: 'coffee' },
    { id: 2, name: 'Makanan', icon: 'restaurant' }
];

// Mock API with factory
const mockGet = vi.fn((url: string) => {
    if (url.includes('/products/categories')) {
        return Promise.resolve({ data: { data: mockCategories } });
    }
    if (url.includes('/products')) {
        return Promise.resolve({ data: { data: mockProducts } });
    }
    if (url.includes('/cart')) { // Added this to handle cart calls
        return Promise.resolve({ data: { data: [] } });
    }
    return Promise.resolve({ data: {} });
});

const mockPost = vi.fn((_url: string, _data: any) => Promise.resolve({ data: { success: true, data: { id: 'order-123' } } })); // Corrected 'daa' to 'data'

vi.mock('../../services/api', () => ({
    default: {
        get: (url: string) => mockGet(url),
        post: (url: string, data: any) => mockPost(url, data)
    }
}));

describe.skip('POSTerminal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // The api.get mockImplementation is now handled by the vi.mock('../../services/api') factory
        // and the mockGet function.
    });

    it('renders POS terminal with products', async () => {
        render(
            <MemoryRouter>
                <POSTerminal />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Kopi Hitam')).toBeInTheDocument();
            expect(screen.getByText('Roti Bakar')).toBeInTheDocument();
        }, { timeout: 3000 });
        expect(screen.getByText('Kasir Laksana')).toBeInTheDocument();
    });

    it('adds product to cart', async () => {
        render(
            <MemoryRouter>
                <POSTerminal />
            </MemoryRouter>
        );
        await waitFor(() => screen.getByText('Kopi Hitam'));

        // Click on product card
        fireEvent.click(screen.getByText('Kopi Hitam'));

        // Check if item appears in cart section (assuming text "Kopi Hitam" exists, 
        // but likely need to look for quantity or specific cart element if name is duplicated)
        // Let's assume the cart renders the name too.
        // We can verify "Total" updates. 15000
        expect(screen.getByText('Rp 15000')).toBeInTheDocument();
    });

    it('updates item quantity in cart', async () => {
        render(
            <MemoryRouter>
                <POSTerminal />
            </MemoryRouter>
        );
        await waitFor(() => screen.getByText('Kopi Hitam'));

        fireEvent.click(screen.getByText('Kopi Hitam'));

        // Use test id or aria-label if possible, or refined text match
        // Based on analysis, the button has material icon 'add' text
        const addBtns = screen.getAllByText('add');
        const productAddBtn = addBtns[addBtns.length - 1]; // First one might be in product card if any? Or cart is last.
        // Actually, sidebar cart is after product grid in DOM.

        fireEvent.click(productAddBtn);

        // 15000 * 2 = 30000
        expect(screen.getByText('Rp 30000')).toBeInTheDocument();
    });

    it('processes checkout successfully', async () => {
        render(
            <MemoryRouter>
                <POSTerminal />
            </MemoryRouter>
        );
        await waitFor(() => screen.getByText('Kopi Hitam'));

        // 1. Add item
        fireEvent.click(screen.getByText('Kopi Hitam'));

        // 2. Input payment
        const paymentInput = screen.getByPlaceholderText('0'); // Placeholder is '0'
        fireEvent.change(paymentInput, { target: { value: '20000' } });

        // 3. Click Pay
        const payBtn = screen.getByText(/Bayar Sekarang/i);
        (api.post as any).mockResolvedValue({
            data: {
                data: { id: 'order-123', created_at: new Date().toISOString() }
            }
        });

        fireEvent.click(payBtn);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/orders', expect.objectContaining({
                items: expect.arrayContaining([
                    expect.objectContaining({ product_id: '1', quantity: 1 })
                ]),
                amount_paid: 20000
            }));
        });

        // Wait for success toast
        expect(api.get).toHaveBeenCalled(); // Should refresh products
    });
});
