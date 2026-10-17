/// <reference types="jest" />
import React from 'react';
import { ListItemButton } from '@mui/material';
import RobotInfo from '.';
import { signCleartextMessage } from '../../pgp';
import { GarageContext } from '../../contexts/GarageContext';
import { AppContext } from '../../contexts/AppContext';
import type { Coordinator } from '../../models';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
  useEffect: jest.fn(),
  useContext: jest.fn(),
}));
jest.mock('../../pgp', () => ({ signCleartextMessage: jest.fn() }));
jest.mock('../../contexts/GarageContext', () => ({ GarageContext: {} }));
jest.mock('../../contexts/AppContext', () => ({ AppContext: {} }));
jest.mock('../../contexts/FederationContext', () => ({ FederationContext: {} }));
jest.mock('../Dialogs', () => ({ EnableTelegramDialog: 'EnableTelegramDialog' }));
jest.mock('../Icons', () => ({ UserNinjaIcon: 'UserNinjaIcon' }));
jest.mock('../RobotAvatar', () => 'RobotAvatar');
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values: Record<string, unknown> = {}) =>
      key.replace(/{{(\w+)}}/g, (_match, name: string) => String(values[name])),
  }),
}));
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useTheme: () => ({ palette: { success: { main: 'green' } } }),
}));

type Element = React.ReactElement<Record<string, unknown>>;
const elements = (node: unknown): Element[] => {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!React.isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...Object.values(node.props).flatMap(elements)];
};

const robot = {
  token: 'fixture-token',
  encPrivKey: 'fixture-key',
  earnedRewards: 10000,
  loading: false,
  fetchReward: jest.fn(),
};
const coordinator = { shortAlias: 'test', mainnet: {} } as Coordinator;
const signing = jest.mocked(signCleartextMessage);
let states: unknown[];
let cursor: number;
let tree: Element[];

const render = (): void => {
  cursor = 0;
  tree = elements(RobotInfo({ coordinator, onClose: jest.fn() }));
};
const find = (predicate: (element: Element) => boolean): Element => {
  const element = tree.find(predicate);
  if (!element) throw new Error('Element not found');
  return element;
};
const field = (label: string): Element => find(({ props }) => props.label === label);
const change = (element: Element, value: string): void => {
  (element.props.onChange as (e: { target: { value: string } }) => void)({ target: { value } });
  render();
};
const settle = async (): Promise<void> => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
  render();
};
const submit = async (valid = true): Promise<void> => {
  const form = find(({ type }) => type === 'form');
  (form.props.onSubmit as (e: object) => void)({
    preventDefault: jest.fn(),
    currentTarget: { reportValidity: () => valid },
  });
  await settle();
};
const submitButton = (): Element => find(({ props }) => props.type === 'submit');

beforeEach(() => {
  jest.clearAllMocks();
  robot.earnedRewards = 10000;
  states = [];
  jest.spyOn(React, 'useState').mockImplementation(((initial: unknown) => {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], (value: unknown) => (states[index] = value)];
  }) as typeof React.useState);
  jest.spyOn(React, 'useEffect').mockImplementation((effect) => {
    effect();
  });
  jest.spyOn(React, 'useContext').mockImplementation(((context: React.Context<unknown>) => {
    if (context === GarageContext)
      return { garage: { getSlot: () => ({ getRobot: () => robot }) } };
    if (context === AppContext) return { setOpen: jest.fn(), navigateToPage: jest.fn() };
    return { federation: {} };
  }) as typeof React.useContext);
  signing.mockResolvedValue('signed-fixture');
  robot.fetchReward.mockResolvedValue({ successful_withdrawal: true });
  render();
  render();
  (find(({ props }) => props.children === 'Claim').props.onClick as () => void)();
  render();
  change(field('Invoice for 9990 Sats'), 'fixture-invoice');
});

afterEach(() => jest.restoreAllMocks());

it('uses native required integer/range validation and does not sign an invalid form', async () => {
  const budget = field('Routing Budget (PPM)');
  expect(budget.props.required).toBe(true);
  expect(budget.props.type).toBe('number');
  expect(budget.props.slotProps).toEqual({ htmlInput: { min: 0, max: 10000, step: 1 } });
  expect(find(({ type }) => type === 'form').props.noValidate).toBeUndefined();
  expect(submitButton().props.onClick).toBeUndefined();
  change(budget, '');
  expect(field('Routing Budget (PPM)').props.value).toBe('');
  await submit(false);
  expect(signing).not.toHaveBeenCalled();
  expect(robot.fetchReward).not.toHaveBeenCalled();
});

it.each([
  ['0', 'Invoice for 10000 Sats', 0],
  ['1000', 'Invoice for 9990 Sats', 1000],
  ['10000', 'Invoice for 9900 Sats', 10000],
])('sends budget %s and displays its matching invoice amount', async (budget, label, ppm) => {
  change(field('Routing Budget (PPM)'), budget);
  expect(field(label)).toBeDefined();
  await submit();
  expect(signing).toHaveBeenCalledWith('fixture-invoice', 'fixture-key', 'fixture-token');
  expect(robot.fetchReward).toHaveBeenCalledWith({}, 'signed-fixture', ppm);
  expect(tree.some(({ type }) => type === 'form')).toBe(false);
});

it.each(['signing', 'request'])(
  'shows a retryable error and releases loading after %s rejects',
  async (stage) => {
    if (stage === 'signing') signing.mockRejectedValue(new Error('fixture rejection'));
    else robot.fetchReward.mockRejectedValue(new Error('fixture rejection'));
    await submit();
    expect(field('Invoice for 9990 Sats').props.helperText).toBe(
      'Could not claim rewards. Try again.',
    );
    expect(submitButton().props.disabled).toBe(false);
    signing.mockResolvedValue('signed-fixture');
    robot.fetchReward.mockResolvedValue({ successful_withdrawal: true });
    await submit();
    expect(tree.some(({ type }) => type === 'form')).toBe(false);
  },
);

it.each([{}, null, { successful_withdrawal: false }])(
  'shows a fallback error for unhelpful response %p',
  async (data) => {
    robot.fetchReward.mockResolvedValue(data);
    await submit();
    expect(field('Invoice for 9990 Sats').props.helperText).toBe(
      'Could not claim rewards. Try again.',
    );
    expect(submitButton().props.disabled).toBe(false);
  },
);

it('preserves the server invoice error', async () => {
  robot.fetchReward.mockResolvedValue({ bad_invoice: 'Invoice amount mismatch' });
  await submit();
  expect(field('Invoice for 9990 Sats').props.helperText).toBe('Invoice amount mismatch');
});

it('blocks another submission while signing and keeps the close escape path', async () => {
  let resolveSigning: (value: string) => void = () => {};
  signing.mockImplementation(() => new Promise((resolve) => (resolveSigning = resolve)));
  await submit();
  expect(submitButton().props.disabled).toBe(true);
  expect(field('Routing Budget (PPM)').props.disabled).toBe(true);
  expect(field('Invoice for 9990 Sats').props.disabled).toBe(true);
  await submit();
  expect(signing).toHaveBeenCalledTimes(1);
  (find(({ props }) => props.children === 'Back').props.onClick as () => void)();
  render();
  expect(tree.some(({ type }) => type === 'form')).toBe(false);
  resolveSigning('signed-fixture');
  await settle();
  expect(robot.fetchReward).toHaveBeenCalledTimes(1);
});

it('clears a late response error when opening a new claim', async () => {
  let resolveRequest: (value: { bad_invoice: string }) => void = () => {};
  robot.fetchReward.mockImplementation(() => new Promise((resolve) => (resolveRequest = resolve)));
  await submit();
  (find(({ props }) => props.children === 'Back').props.onClick as () => void)();
  render();
  resolveRequest({ bad_invoice: 'Previous claim error' });
  await settle();
  expect(tree.some(({ type }) => type === 'form')).toBe(false);
  (find(({ props }) => props.children === 'Claim').props.onClick as () => void)();
  render();
  expect(field('Invoice for 9990 Sats').props.helperText).toBe('');
  expect(field('Invoice for 9990 Sats').props.value).toBe('');
  expect(field('Routing Budget (PPM)').props.disabled).toBe(false);
});

it('blocks reopening Claim while pending and clears the error before the next claim', async () => {
  let resolveRequest: (value: { bad_invoice: string }) => void = () => {};
  robot.fetchReward.mockImplementation(() => new Promise((resolve) => (resolveRequest = resolve)));
  await submit();
  (find(({ props }) => props.children === 'Back').props.onClick as () => void)();
  render();
  (find(({ type }) => type === ListItemButton).props.onClick as () => void)();
  render();
  const claim = find(({ props }) => props.children === 'Claim');
  expect(claim.props.disabled).toBe(true);
  if (!claim.props.disabled) (claim.props.onClick as () => void)();
  render();
  expect(tree.some(({ type }) => type === 'form')).toBe(false);
  expect(robot.fetchReward).toHaveBeenCalledTimes(1);
  resolveRequest({ bad_invoice: 'Previous claim error' });
  await settle();
  const nextClaim = find(({ props }) => props.children === 'Claim');
  expect(nextClaim.props.disabled).toBe(false);
  (nextClaim.props.onClick as () => void)();
  render();
  expect(field('Invoice for 9990 Sats').props.helperText).toBe('');
  expect(field('Invoice for 9990 Sats').props.value).toBe('');
  expect(field('Routing Budget (PPM)').props.disabled).toBe(false);
});

it('starts a fresh claim after success leaves new rewards', async () => {
  robot.fetchReward.mockImplementation(async () => {
    robot.earnedRewards = 100;
    return { successful_withdrawal: true, earned_rewards: 100 };
  });
  await submit();
  const claim = find(({ props }) => props.children === 'Claim');
  expect(claim.props.disabled).toBe(false);
  (claim.props.onClick as () => void)();
  render();
  expect(field('Invoice for 99 Sats').props.value).toBe('');
  expect(field('Invoice for 99 Sats').props.helperText).toBe('');
  expect(tree.some(({ props }) => props.children === 'There it goes!')).toBe(false);
});
