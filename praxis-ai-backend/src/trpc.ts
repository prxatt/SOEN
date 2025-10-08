import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from './context';
import type { AppRouter } from './routers';

// Create tRPC handler for Hono
export const createTRPCHandler = (router: AppRouter) => {
  return async (c: any) => {
    const response = await fetchRequestHandler({
      endpoint: '/trpc',
      req: c.req.raw,
      router,
      createContext: ({ req }) => createTRPCContext(req),
      onError:
        process.env.NODE_ENV === 'development'
          ? ({ path, error }) => {
              console.error(
                `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
              );
            }
          : undefined,
    });

    return response;
  };
};
