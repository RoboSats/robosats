import {
  createContext,
  type Dispatch,
  useEffect,
  useReducer,
  useState,
  type SetStateAction,
  useMemo,
  useContext,
} from 'react';

import {
  type Book,
  Robot,
  Coordinator,
  type Exchange,
  type Order,
  type PublicOrder,
  type Limits,
  defaultExchange,
  type Federation,
  type LimitList,
} from '../models';

import { apiClient } from '../services/api';
import { systemClient } from '../services/System';
import { federationLottery, hexToBase91, validateTokenEntropy } from '../utils';
import { sha256 } from 'js-sha256';

import defaultFederation from '../../static/federation.json';
import { updateExchangeInfo } from '../models/Exchange.model';
import { compareUpdateLimit } from '../models/Limit.model';
import { getEndpoint } from '../models/Coordinator.model';
import { AppContext, UseAppStoreType } from './AppContext';
import { GarageContext, UseGarageStoreType } from './GarageContext';

// Refresh delays (ms) according to Order status
const statusToDelay = [
  3000, // 'Waiting for maker bond'
  35000, // 'Public'
  180000, // 'Paused'
  3000, // 'Waiting for taker bond'
  999999, // 'Cancelled'
  999999, // 'Expired'
  8000, // 'Waiting for trade collateral and buyer invoice'
  8000, // 'Waiting only for seller trade collateral'
  8000, // 'Waiting only for buyer invoice'
  10000, // 'Sending fiat - In chatroom'
  10000, // 'Fiat sent - In chatroom'
  100000, // 'In dispute'
  999999, // 'Collaboratively cancelled'
  10000, // 'Sending satoshis to buyer'
  60000, // 'Sucessful trade'
  30000, // 'Failed lightning network routing'
  300000, // 'Wait for dispute resolution'
  300000, // 'Maker lost dispute'
  300000, // 'Taker lost dispute'
];

export interface fetchRobotProps {
  coordinator?: Coordinator;
  newKeys?: { encPrivKey: string; pubKey: string };
  newToken?: string;
  slot?: number;
  isRefresh?: boolean;
}

const initialFederation: Federation = Object.entries(defaultFederation).reduce(
  (acc, [key, value]) => {
    acc[key] = new Coordinator(value);
    return acc;
  },
  {},
);

export interface ActionFederation {
  type:
    | 'reset'
    | 'enable'
    | 'disable'
    | 'updateBook'
    | 'updateLimits'
    | 'updateInfo'
    | 'updateRobot';
  payload: any; // TODO
}

const reduceFederation = (state: Federation, action: ActionFederation): Federation => {
  switch (action.type) {
    case 'reset':
      return initialFederation;
    case 'enable':
      return {
        ...state,
        [action.payload.shortAlias]: {
          ...state[action.payload.shortAlias],
          enabled: true,
        },
      };
    case 'disable':
      return {
        ...state,
        [action.payload.shortAlias]: {
          ...state[action.payload.shortAlias],
          enabled: false,
          info: undefined,
          orders: [],
          limits: undefined,
        },
      };
    case 'updateBook':
      return {
        ...state,
        [action.payload.shortAlias]: {
          ...state[action.payload.shortAlias],
          book: action.payload.book,
          loadingBook: action.payload.loadingBook,
        },
      };
    case 'updateLimits':
      return {
        ...state,
        [action.payload.shortAlias]: {
          ...state[action.payload.shortAlias],
          limits: action.payload.limits,
          loadingLimits: action.payload.loadingLimits,
        },
      };
    case 'updateInfo':
      return {
        ...state,
        [action.payload.shortAlias]: {
          ...state[action.payload.shortAlias],
          info: action.payload.info,
          loadingInfo: action.payload.loadingInfo,
        },
      };
    case 'updateRobot':
      return {
        ...state,
        [action.payload.shortAlias]: {
          ...state[action.payload.shortAlias],
          robot: action.payload.robot,
          loadingRobot: action.payload.loadingRobot,
        },
      };
    default:
      throw new Error(`Unhandled action type: ${String(action.type)}`);
  }
};

const totalCoordinators = Object.keys(initialFederation).length;

const initialBook: Book = {
  orders: [],
  loading: true,
  loadedCoordinators: 0,
  totalCoordinators,
};

const initialLimits: Limits = {
  list: [],
  loading: true,
  loadedCoordinators: 0,
  totalCoordinators,
};

const initialExchange: Exchange = { ...defaultExchange, totalCoordinators };

export interface CurrentOrder {
  shortAlias: string | null;
  id: number | null;
}

export interface UseFederationStoreType {
  book: Book;
  setBook: Dispatch<SetStateAction<Book>>;
  federation: Federation;
  dispatchFederation: Dispatch<ActionFederation>;
  sortedCoordinators: string[];
  fetchCoordinatorInfo: (coordinator: Coordinator) => Promise<void>;
  fetchFederationBook: () => void;
  limits: Limits;
  setLimits: Dispatch<SetStateAction<Limits>>;
  fetchFederationLimits: () => void;
  fetchFederationRobot: (props: fetchRobotProps) => void;
  exchange: Exchange;
  setExchange: Dispatch<SetStateAction<Exchange>>;
  focusedCoordinator: string;
  setFocusedCoordinator: Dispatch<SetStateAction<string>>;
  order?: Order;
  setOrder: Dispatch<SetStateAction<Order>>;
  clearOrder: () => void;
  badOrder?: string;
  setBadOrder: Dispatch<SetStateAction<string>>;
  currentOrder: CurrentOrder;
  setCurrentOrder: Dispatch<SetStateAction<CurrentOrder>>;
  setDelay: Dispatch<SetStateAction<number>>;
}

export const initialAppContext: UseFederationStoreType = {
  book: initialBook,
  setBook: () => {},
  federation: initialFederation,
  dispatchFederation: () => {},
  sortedCoordinators: [],
  fetchCoordinatorInfo: async () => {},
  fetchFederationBook: () => {},
  limits: initialLimits,
  setLimits: () => {},
  fetchFederationLimits: () => {},
  fetchFederationRobot: () => {},
  exchange: initialExchange,
  setExchange: () => {},
  focusedCoordinator: '',
  setFocusedCoordinator: () => {},
  order: undefined,
  setOrder: () => {},
  clearOrder: () => {},
  badOrder: undefined,
  setBadOrder: () => {},
  currentOrder: { shortAlias: null, id: null },
  setCurrentOrder: () => {},
  setDelay: () => {},
};

export const FederationContext = createContext<UseFederationStoreType>(initialAppContext);

export const useFederationStore = (): UseFederationStoreType => {
  const { settings, page, origin, hostUrl, open, torStatus } =
    useContext<UseAppStoreType>(AppContext);
  const { setMaker, garage, robotUpdatedAt } = useContext<UseGarageStoreType>(GarageContext);

  // All federation data structured
  const [book, setBook] = useState<Book>(initialAppContext.book);
  const [limits, setLimits] = useState<Limits>(initialAppContext.limits);
  const [exchange, setExchange] = useState<Exchange>(initialAppContext.exchange);
  const [federation, dispatchFederation] = useReducer(
    reduceFederation,
    initialAppContext.federation,
  );
  const sortedCoordinators = useMemo(() => {
    const sortedCoordinators = federationLottery(federation);
    setMaker((maker) => {
      return { ...maker, coordinator: sortedCoordinators[0] };
    }); // default MakerForm coordinator is decided via sorted lottery
    return sortedCoordinators;
  }, []);

  const [focusedCoordinator, setFocusedCoordinator] = useState<string>(sortedCoordinators[0]);

  const [delay, setDelay] = useState<number>(60000);
  const [timer, setTimer] = useState<NodeJS.Timer | undefined>(() =>
    setInterval(() => null, delay),
  );
  const [order, setOrder] = useState<Order>();
  const [badOrder, setBadOrder] = useState<string>();
  const [currentOrder, setCurrentOrder] = useState<CurrentOrder>(initialAppContext.currentOrder);

  useEffect(() => {
    // On bitcoin network change we reset book, limits and federation info and fetch everything again
    reset();
  }, [settings.network]);

  const reset = () => {
    setBook(initialBook);
    setLimits(initialLimits);
    dispatchFederation({ type: 'reset' });
    fetchFederationBook();
    fetchFederationInfo();
    fetchFederationLimits();
  };

  // fetch Limits
  const fetchCoordinatorLimits = async (coordinator: Coordinator): Promise<void> => {
    const { url, basePath } = getEndpoint({
      network: settings.network,
      coordinator,
      origin,
      selfHosted: settings.selfhostedClient,
      hostUrl,
    });
    const limits = await apiClient
      .get(url, `${basePath}/api/limits/`)
      .then((data) => {
        return data;
      })
      .catch(() => {
        return undefined;
      });
    dispatchFederation({
      type: 'updateLimits',
      payload: { shortAlias: coordinator.shortAlias, limits, loadingLimits: false },
    });
  };

  const fetchFederationLimits = function (): void {
    Object.entries(federation).map(([shortAlias, coordinator]) => {
      if (coordinator.enabled === true) {
        // set limitLoading=true
        dispatchFederation({
          type: 'updateLimits',
          payload: { shortAlias, limits: coordinator.limits, loadingLimits: true },
        });
        // fetch new limits
        void fetchCoordinatorLimits(coordinator);
      }
      return null; // Object.entries() expect a return
    });
  };

  // fetch Books
  const fetchCoordinatorBook = async (coordinator: Coordinator): Promise<void> => {
    const { url, basePath } = getEndpoint({
      network: settings.network,
      coordinator,
      origin,
      selfHosted: settings.selfhostedClient,
      hostUrl,
    });

    const book = await apiClient
      .get(url, `${basePath}/api/book/`)
      .then((data: PublicOrder[]) => {
        return data.not_found !== undefined ? [] : data;
      })
      .catch(() => {
        return [];
      });
    dispatchFederation({
      type: 'updateBook',
      payload: { shortAlias: coordinator.shortAlias, book, loadingBook: false },
    });
  };

  const fetchFederationBook = function (): void {
    Object.entries(federation).map(([shortAlias, coordinator]) => {
      if (coordinator.enabled === true) {
        dispatchFederation({
          type: 'updateBook',
          payload: { shortAlias, book: coordinator.book, loadingBook: true },
        });
        void fetchCoordinatorBook(coordinator);
      }
      return null; // Object.entries() expect a return
    });
  };

  // fetch Info
  const fetchCoordinatorInfo = async (coordinator: Coordinator): Promise<void> => {
    // Set loading true
    dispatchFederation({
      type: 'updateInfo',
      payload: { shortAlias: coordinator.shortAlias, info: coordinator.info, loadingInfo: true },
    });
    // fetch and dispatch
    const { url, basePath } = getEndpoint({
      network: settings.network,
      coordinator,
      origin,
      selfHosted: settings.selfhostedClient,
      hostUrl,
    });

    const info = await apiClient
      .get(url, `${basePath}/api/info/`)
      .then((data) => {
        return data;
      })
      .catch(() => {
        return undefined;
      });
    dispatchFederation({
      type: 'updateInfo',
      payload: { shortAlias: coordinator.shortAlias, info, loadingInfo: false },
    });
  };

  const fetchFederationInfo = function (): void {
    Object.entries(federation).map(([shortAlias, coordinator]) => {
      if (coordinator.enabled === true) {
        dispatchFederation({
          type: 'updateInfo',
          payload: { shortAlias, info: coordinator.info, loadingInfo: true },
        });
        void fetchCoordinatorInfo(coordinator);
      }
      return null; // Object.entries() expect a return
    });
  };

  const updateBook = (): void => {
    setBook((book) => {
      return { ...book, loading: true, loadedCoordinators: 0 };
    });
    let orders: PublicOrder[] = book.orders;
    let loadedCoordinators: number = 0;
    let totalCoordinators: number = 0;

    sortedCoordinators.map((shortAlias: string) => {
      if (federation[shortAlias]?.enabled === true) {
        totalCoordinators = totalCoordinators + 1;
        if (!federation[shortAlias].loadingBook) {
          const existingOrders = orders.filter(
            (order) => order.coordinatorShortAlias !== shortAlias,
          );
          const newOrders: PublicOrder[] = federation[shortAlias].book.map((order) => ({
            ...order,
            coordinatorShortAlias: shortAlias,
          }));
          orders = [...existingOrders, ...newOrders];
          // orders.push.apply(existingOrders, newOrders);
          loadedCoordinators = loadedCoordinators + 1;
        }
      }
      const loading = loadedCoordinators !== totalCoordinators;
      setBook({ orders, loading, loadedCoordinators, totalCoordinators });
      return null; // Object.values() expects a return
    });
  };

  const updateLimits = (): void => {
    const newLimits: LimitList | never[] = [];
    setLimits((limits) => {
      return { ...limits, loadedCoordinators: 0 };
    });
    Object.entries(federation).map(([shortAlias, coordinator]) => {
      if (coordinator.limits !== undefined) {
        for (const currency in coordinator.limits) {
          newLimits[currency] = compareUpdateLimit(
            newLimits[currency],
            coordinator.limits[currency],
          );
        }
        setLimits((limits) => {
          return {
            ...limits,
            list: newLimits,
            loading: true,
            loadedCoordinators: limits.loadedCoordinators + 1,
          };
        });
      }
      return null; // Object.entries expects a return
    });
    setLimits((limits) => {
      return { ...limits, loading: false };
    });
  };

  const updateExchange = (): void => {
    const onlineCoordinators = Object.keys(federation).reduce((count, shortAlias): number => {
      if (!federation[shortAlias]?.loadingInfo && federation[shortAlias]?.info !== undefined) {
        return count + 1;
      } else {
        return count;
      }
    }, 0);
    const totalCoordinators = Object.keys(federation).reduce((count, shortAlias) => {
      return federation[shortAlias]?.enabled === true ? count + 1 : count;
    }, 0);
    setExchange({ info: updateExchangeInfo(federation), onlineCoordinators, totalCoordinators });
  };

  useEffect(() => {
    updateBook();
    updateLimits();
    updateExchange();
  }, [federation]);

  useEffect(() => {
    if (open.exchange) {
      fetchFederationInfo();
    }
  }, [open.exchange, torStatus]);

  // Fetch current order at load and in a loop
  useEffect(() => {
    if (currentOrder.id != null && (page === 'order' || (order === badOrder) === undefined)) {
      fetchOrder();
    }
  }, [currentOrder, page]);

  useEffect(() => {
    clearInterval(timer);
    setTimer(setInterval(fetchOrder, delay));
    return () => {
      clearInterval(timer);
    };
  }, [delay, currentOrder, page, badOrder]);

  const orderReceived = function (data: any): void {
    if (data.bad_request !== undefined) {
      setBadOrder(data.bad_request);
      setDelay(99999999);
      setOrder(undefined);
    } else {
      setDelay(
        data.status >= 0 && data.status <= 18
          ? page === 'order'
            ? statusToDelay[data.status]
            : statusToDelay[data.status] * 5
          : 99999999,
      );
      setOrder(data);
      setBadOrder(undefined);
    }
  };

  const fetchOrder = function (): void {
    if (currentOrder.shortAlias != null && currentOrder.id != null) {
      const { url, basePath } = getEndpoint({
        network: settings.network,
        coordinator: federation[currentOrder.shortAlias],
        origin,
        selfHosted: settings.selfhostedClient,
        hostUrl,
      });
      const auth = {
        tokenSHA256: garage.getRobot().tokenSHA256,
        keys: {
          pubKey: garage.getRobot().pubKey?.split('\n').join('\\'),
          encPrivKey: garage.getRobot().encPrivKey?.split('\n').join('\\'),
        },
      };

      void apiClient
        .get(url, `${basePath}/api/order/?order_id=${currentOrder.id}`, auth)
        .then(orderReceived)
        .catch(orderReceived);
    }
  };

  const clearOrder = function (): void {
    setOrder(undefined);
    setBadOrder(undefined);
  };

  const fetchCoordinatorRobot = function ({
    coordinator,
    newToken,
    newKeys,
    slot,
    isRefresh = false,
  }: fetchRobotProps): void {
    const { url, basePath } = getEndpoint({
      network: settings.network,
      coordinator,
      origin,
      selfHosted: settings.selfhostedClient,
      hostUrl,
    });

    const token = newToken ?? garage.getRobot().token ?? '';

    const { hasEnoughEntropy, bitsEntropy, shannonEntropy } = validateTokenEntropy(token);

    if (!hasEnoughEntropy) {
      return;
    }

    const tokenSHA256 = hexToBase91(sha256(token));
    const targetSlot = slot ?? garage.currentSlot;
    const encPrivKey = newKeys?.encPrivKey ?? garage.getRobot().encPrivKey ?? '';
    const pubKey = newKeys?.pubKey ?? garage.getRobot().pubKey ?? '';

    // On first authenticated requests, pubkey and privkey are needed in header cookies
    const auth = {
      tokenSHA256,
      keys: {
        pubKey: pubKey.split('\n').join('\\'),
        encPrivKey: encPrivKey.split('\n').join('\\'),
      },
    };

    if (!isRefresh && coordinator) {
      const newRobot = coordinator.robot;

      dispatchFederation({
        type: 'updateRobot',
        payload: { shortAlias: coordinator.shortAlias, robot: newRobot, loadingRobot: false },
      });
      if (newRobot) garage.updateRobot(newRobot);
    }

    apiClient
      .get(url, `${basePath}/api/robot/`, auth)
      .then((data: any) => {
        const newRobot = {
          nickname: data.nickname,
          token,
          tokenSHA256,
          loading: false,
          activeOrderId: data.active_order_id ?? null,
          lastOrderId: data.last_order_id ?? null,
          earnedRewards: data.earned_rewards ?? 0,
          stealthInvoices: data.wants_stealth,
          tgEnabled: data.tg_enabled,
          tgBotName: data.tg_bot_name,
          tgToken: data.tg_token,
          found: data?.found,
          last_login: data.last_login,
          bitsEntropy,
          shannonEntropy,
          pubKey: data.public_key,
          encPrivKey: data.encrypted_private_key,
          copiedToken: Boolean(data.found),
        };
        if (currentOrder.id == null) {
          setCurrentOrder({
            id:
              data.active_order_id !== undefined
                ? data.active_order_id
                : data.last_order_id !== undefined
                ? data.last_order_id
                : null,
            shortAlias: coordinator?.shortAlias,
          });
        }

        garage.updateRobot(newRobot, targetSlot);
        garage.currentSlot = targetSlot;

        dispatchFederation({
          type: 'updateRobot',
          payload: { shortAlias: coordinator.shortAlias, robot: newRobot, loadingRobot: false },
        });
      })
      .finally(() => {
        systemClient.deleteCookie('public_key');
        systemClient.deleteCookie('encrypted_private_key');
      });
  };

  const fetchFederationRobot = function (props: fetchRobotProps): void {
    if (!props?.isRefresh) garage.updateRobot({ avatarLoaded: false });

    Object.entries(federation).map(([shortAlias, coordinator]) => {
      if (coordinator.enabled === true) {
        dispatchFederation({
          type: 'updateRobot',
          payload: { shortAlias, robot: coordinator.robot, loadingRobot: true },
        });
        fetchCoordinatorRobot({ ...props, coordinator });
      }
      return null; // Object.entries expects a return
    });
  };

  useEffect(() => {
    if (open.profile && garage.getRobot().avatarLoaded) {
      fetchFederationRobot({ isRefresh: true }); // refresh/update existing robot
    } else if (
      !garage.getRobot().avatarLoaded &&
      garage.getRobot().token !== undefined &&
      garage.getRobot().encPrivKey !== undefined &&
      garage.getRobot().pubKey !== undefined
    ) {
      fetchFederationRobot({}); // create new robot with existing token and keys (on network and coordinator change)
    }
  }, [open.profile, hostUrl, robotUpdatedAt]);

  return {
    book,
    setBook,
    federation,
    dispatchFederation,
    sortedCoordinators,
    fetchCoordinatorInfo,
    fetchFederationBook,
    limits,
    setLimits,
    fetchFederationLimits,
    clearOrder,
    fetchFederationRobot,
    exchange,
    setExchange,
    focusedCoordinator,
    setFocusedCoordinator,
    order,
    setOrder,
    badOrder,
    setBadOrder,
    setDelay,
    currentOrder,
    setCurrentOrder,
  };
};
