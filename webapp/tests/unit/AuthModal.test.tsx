import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthModal from '@/components/ui/AuthModal';

// Mock matchMedia required by Radix UI / Dialog
window.matchMedia = window.matchMedia || function() {
    return {
        matches: false,
        addListener: function() {},
        removeListener: function() {}
    };
};

// Mock Next.js Navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })
}));

// Mock Supabase to prevent env var crashes
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn()
    }
  }))
}));

describe('AuthModal Onboarding Consensus', () => {
  it('prevents signup if legal terms are not accepted', async () => {
    // Render AuthModal with mock handlers
    const onCloseMock = vi.fn();
    const onSuccessMock = vi.fn();
    render(<AuthModal onClose={onCloseMock} onSuccess={onSuccessMock} />);
    
    // Switch to Sign Up
    const toggleSignUp = screen.getByText(/Non hai un account\? Registrati ora/i);
    fireEvent.click(toggleSignUp);

    // Form fields
    const emailInput = screen.getByPlaceholderText('tuonome@studio.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /Registrati/i });

    fireEvent.change(emailInput, { target: { value: 'test@lexai.it' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Try to click Sign up without checking the checkbox
    fireEvent.click(submitBtn);

    // Expecting error message
    const errorMsg = await screen.findByText(/obbligatorio accettare/i);
    expect(errorMsg).toBeVisible();
    
    // Checking the box should remove the error (or allow submission in a real e2e)
  });
});
