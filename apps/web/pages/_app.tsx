import { EventCollectionProvider } from "next-collect/client";
import { DefaultSeo } from "next-seo";
import Head from "next/head";
import superjson from "superjson";

import "@calcom/embed-core/src/embed-iframe";
import LicenseRequired from "@ee/components/LicenseRequired";

import AppProviders, { AppProps } from "@lib/app-providers";
import { seoConfig } from "@lib/config/next-seo.config";
import useTheme from "@lib/hooks/useTheme";

import I18nLanguageHandler from "@components/I18nLanguageHandler";

import type { AppRouter } from "@server/routers/_app";
import { httpBatchLink } from "@trpc/client/links/httpBatchLink";
import { httpLink } from "@trpc/client/links/httpLink";
import { loggerLink } from "@trpc/client/links/loggerLink";
import { splitLink } from "@trpc/client/links/splitLink";
import { withTRPC } from "@trpc/next";
import type { TRPCClientErrorLike } from "@trpc/react";
import { Maybe } from "@trpc/server";

import { ContractsProvider } from "../contexts/contractsContext";
import "../styles/fonts.css";
import "../styles/globals.css";

function MyApp(props: AppProps) {
  const { Component, pageProps, err, router } = props;
  let pageStatus = "200";
  const { Theme } = useTheme("light");

  if (router.pathname === "/404") {
    pageStatus = "404";
  } else if (router.pathname === "/500") {
    pageStatus = "500";
  }
  return (
    <EventCollectionProvider options={{ apiPath: "/api/collect-events" }}>
      <ContractsProvider>
        <AppProviders {...props}>
          <DefaultSeo {...seoConfig.defaultNextSeo} />
          <I18nLanguageHandler />
          <Head>
            <script dangerouslySetInnerHTML={{ __html: `window.CalComPageStatus = '${pageStatus}'` }} />
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          </Head>
          <Theme />
          {Component.requiresLicense ? (
            <LicenseRequired>
              <Component {...pageProps} err={err} />
            </LicenseRequired>
          ) : (
            <Component {...pageProps} err={err} />
          )}
        </AppProviders>
      </ContractsProvider>
    </EventCollectionProvider>
  );
}

export default withTRPC<AppRouter>({
  config() {
    const url =
      typeof window !== "undefined"
        ? "/api/trpc"
        : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/api/trpc`
        : `http://${process.env.NEXT_PUBLIC_WEBAPP_URL}/api/trpc`;

    /**
     * If you want to use SSR, you need to use the server's full URL
     * @link https://trpc.io/docs/ssr
     */
    return {
      /**
       * @link https://trpc.io/docs/links
       */
      links: [
        // adds pretty logs to your console in development and logs errors in production
        loggerLink({
          enabled: (opts) =>
            !!process.env.NEXT_PUBLIC_DEBUG || (opts.direction === "down" && opts.result instanceof Error),
        }),
        splitLink({
          // check for context property `skipBatch`
          condition: (op) => {
            return op.context.skipBatch === true;
          },
          // when condition is true, use normal request
          true: httpLink({ url }),
          // when condition is false, use batching
          false: httpBatchLink({
            url,
            /** @link https://github.com/trpc/trpc/issues/2008 */
            // maxBatchSize: 7
          }),
        }),
      ],
      /**
       * @link https://react-query.tanstack.com/reference/QueryClient
       */
      queryClientConfig: {
        defaultOptions: {
          queries: {
            /**
             * 1s should be enough to just keep identical query waterfalls low
             * @example if one page components uses a query that is also used further down the tree
             */
            staleTime: 1000,
            /**
             * Retry `useQuery()` calls depending on this function
             */
            retry(failureCount, _err) {
              const err = _err as never as Maybe<TRPCClientErrorLike<AppRouter>>;
              const code = err?.data?.code;
              if (code === "BAD_REQUEST" || code === "FORBIDDEN" || code === "UNAUTHORIZED") {
                // if input data is wrong or you're not authorized there's no point retrying a query
                return false;
              }
              const MAX_QUERY_RETRIES = 3;
              return failureCount < MAX_QUERY_RETRIES;
            },
          },
        },
      },
      /**
       * @link https://trpc.io/docs/data-transformers
       */
      transformer: superjson,
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: false,
})(MyApp);
