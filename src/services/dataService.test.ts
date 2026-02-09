import { describe, it, expect, vi } from 'vitest';
import { dataService } from './dataService';
import { supabase } from '@/lib/supabase';
import { SheetData } from '@/types';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            insert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockResolvedValue({ error: null }),
            delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null })
            }),
            select: vi.fn().mockReturnValue({
                or: vi.fn(),
                eq: vi.fn(),
                order: vi.fn(),
                limit: vi.fn() // Chain mocks needed for getSheets
            })
        }))
    }
}));

describe('dataService', () => {
    it('should add a sheet successfully', async () => {
        const mockSheet = { id: 'test-123', supervisorName: 'Test SV' } as unknown as SheetData;
        const result = await dataService.addSheet(mockSheet);
        expect(result).toEqual({ error: null });
        expect(supabase.from).toHaveBeenCalledWith('sheets');
    });

    it('should delete a sheet successfully', async () => {
        const result = await dataService.deleteSheet('test-123');
        expect(result).toEqual({ error: null });
    });
});
