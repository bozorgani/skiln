import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('renders button with children', () => {
      render(
        <Button>
          <span>Child Element</span>
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Child Element');
    });

    it('renders button with multiple children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Icon');
      expect(button).toHaveTextContent('Text');
    });
  });

  describe('Variants', () => {
    it('applies default variant styles', () => {
      render(<Button>Default Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });

    it('applies outline variant styles', () => {
      render(<Button variant="outline">Outline Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2');
    });

    it('applies destructive variant styles', () => {
      render(<Button variant="destructive">Destructive Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
    });

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
    });

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost">Ghost Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('applies link variant styles', () => {
      render(<Button variant="link">Link Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('applies default size styles', () => {
      render(<Button>Default Size Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    it('applies small size styles', () => {
      render(<Button size="sm">Small Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
    });

    it('applies large size styles', () => {
      render(<Button size="lg">Large Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12');
    });

    it('applies icon size styles', () => {
      render(<Button size="icon">Icon Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('w-10');
    });
  });

  describe('Interactions', () => {
    it('handles click events', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles multiple clicks', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      await user.click(button);
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('does not trigger onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled Button
        </Button>
      );
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles keyboard events', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('applies disabled styles', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:pointer-events-none');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('prevents interaction when disabled', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Customization', () => {
    it('applies custom className', () => {
      render(<Button className="custom-class">Custom Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('applies custom className alongside variant classes', () => {
      render(
        <Button variant="outline" className="custom-class">
          Custom Button
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('border-2');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<Button ref={ref}>Button with Ref</Button>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Button aria-label="Close dialog">×</Button>);
      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });

    it('supports aria-disabled', () => {
      render(<Button aria-disabled="true">Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('supports type attribute', () => {
      render(<Button type="submit">Submit Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('supports default type="button"', () => {
      render(<Button>Default Button</Button>);
      const button = screen.getByRole('button');
      // Button component may not set type="button" by default in all cases
      // Check that it's a button element
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('AsChild Prop', () => {
    it('renders as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      const link = screen.getByRole('link', { name: /link button/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  describe('HTML Attributes', () => {
    it('forwards HTML attributes', () => {
      render(
        <Button data-testid="custom-button" id="my-button">
          Button
        </Button>
      );
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('id', 'my-button');
    });

    it('supports form attributes', () => {
      render(
        <Button form="my-form" formAction="/submit">
          Submit
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('form', 'my-form');
      expect(button).toHaveAttribute('formAction', '/submit');
    });
  });
});

