import { fireEvent, render } from '@testing-library/react-native';
import { Button, Empty, Field } from '@/components/ui';

describe('native UI primitives', () => {
  it('submits a native button', () => { const press = jest.fn(); const view = render(<Button onPress={press}>Save</Button>); fireEvent.press(view.getByRole('button')); expect(press).toHaveBeenCalledTimes(1); });
  it('edits a native field', () => { const change = jest.fn(); const view = render(<Field label="Email" value="" onChangeText={change}/>); fireEvent.changeText(view.getByLabelText('Email'), 'viewer@example.com'); expect(change).toHaveBeenCalledWith('viewer@example.com'); });
  it('renders an empty state', () => { const view = render(<Empty title="Nothing here"/>); expect(view.getByText('Nothing here')).toBeTruthy(); });
});
