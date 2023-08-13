import {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from 'next'
import {
  Text,
  Flex,
  Box,
  FormatCrypto,
  Button,
  FormatCryptoCurrency,
} from 'components/primitives'
import Layout from 'components/Layout'
import { paths } from '@reservoir0x/reservoir-sdk'
import { useContext, useEffect, useMemo, useState } from 'react'
import { Footer } from 'components/home/Footer'
import { useMediaQuery } from 'react-responsive'
import { useMarketplaceChain, useMounted } from 'hooks'
import supportedChains from 'utils/chains'
import { Head } from 'components/Head'
import { ChainContext } from 'context/ChainContextProvider'
import { Dropdown, DropdownMenuItem } from 'components/primitives/Dropdown'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'

import Img from 'components/primitives/Img'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useRouter } from 'next/router'
import { ChainStats } from 'components/home/ChainStats'
import useTopSellingCollections from 'hooks/useTopSellingCollections'
import { CollectionTopSellingTable } from 'components/home/CollectionTopSellingTable'
import { FillTypeToggle } from 'components/home/FillTypeToggle'
import { TimeFilterToggle } from 'components/home/TimeFilterToggle'
import ReactMarkdown from 'react-markdown'
import fetcher from 'utils/fetcher'
import { styled } from 'stitches.config'

import { useTheme } from 'next-themes'
import next from 'next/types'

const StyledImage = styled('img', {})

type Props = InferGetStaticPropsType<typeof getStaticProps>

const mintStartTime = Math.floor(new Date().getTime() / 1000) - 60 * 6 * 60

const IndexPage: NextPage<Props> = ({ ssr }) => {
  const isSSR = typeof window === 'undefined'
  const isMounted = useMounted()
  const isSmallDevice = useMediaQuery({ maxWidth: 905 }) && isMounted
  const marketplaceChain = useMarketplaceChain()
  const router = useRouter()
  const [fillType, setFillType] = useState<'mint' | 'sale' | 'any'>('sale')
  const [minutesFilter, setMinutesFilter] = useState<number>(1440)

  // not sure if there is a better way to fix this
  const { theme: nextTheme } = useTheme()
  const [theme, setTheme] = useState<string | null>(null)
  useEffect(() => {
    if (nextTheme) {
      setTheme(nextTheme)
    }
  }, [nextTheme])

  const { chain, switchCurrentChain } = useContext(ChainContext)

  const startTime = useMemo(() => {
    const now = new Date()
    const timestamp = Math.floor(now.getTime() / 1000)
    return timestamp - minutesFilter * 60
  }, [minutesFilter])

  const {
    data: topSellingCollectionsData,
    collections: collectionsData,
    isValidating,
  } = useTopSellingCollections(
    {
      startTime,
      fillType,
      limit: 8,
      includeRecentSales: true,
    },
    {
      revalidateOnMount: true,
      refreshInterval: 300000,
      fallbackData: [
        ssr.topSellingCollections[marketplaceChain.id].collections,
      ],
    },
    chain?.id
  )

  const { data: topSellingMintsData, collections: mintsData } =
    useTopSellingCollections(
      {
        startTime: mintStartTime,
        fillType: 'mint',
        limit: 4,
        includeRecentSales: true,
      },
      {
        revalidateOnMount: true,
        refreshInterval: 300000,
      },
      chain?.id
    )

  const [topSellingCollections, setTopSellingCollections] =
    useState<ReturnType<typeof useTopSellingCollections>['data']>()
  const [collections, setCollections] =
    useState<ReturnType<typeof useTopSellingCollections>['collections']>(
      collectionsData
    )

  useEffect(() => {
    if (!isValidating) {
      setTopSellingCollections(topSellingCollectionsData)
      setCollections(collectionsData)
    }
  }, [isValidating])

  const topCollection = topSellingCollections?.collections?.[5]

  return (
    <Layout>
      <Head />
      <Box
        css={{
          p: 24,
          height: '100%',
          '@bp800': {
            px: '$5',
          },
          '@xl': {
            px: '$6',
          },
        }}
      >
        <Flex>
          <Flex
            css={{
              minHeight: 540,
              flex: 1,
              overflow: 'hidden',
              position: 'relative',
              gap: '$5',
              p: '$4',
              display: 'none',
              '@md': {
                p: '$5',
                gap: '$4',
                flexDirection: 'column',
                display: 'flex',
              },
              '@lg': {
                flexDirection: 'row',
                p: '$5',
                gap: '$5',
                mt: '$4',
              },
              '@xl': {
                p: '$6',
                gap: '$6',
              },

              mb: '$6',
              maxWidth: 1820,
              mx: 'auto',
              borderRadius: 16,
              //background: '$gray3',
              backgroundSize: 'cover',
              background:
                theme === 'light'
                  ? `url(${topCollection?.banner?.replace('w=500', 'w=4500')}) `
                  : '$gray3',
            }}
          >
            <Box
              css={{
                position: 'absolute',
                top: 0,
                display: theme === 'light' ? 'block' : 'none',
                zIndex: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backdropFilter: 'blur(20px)',
                background: 'rgba(255, 255, 255, 0.9)',
              }}
            />

            {topSellingCollections?.collections &&
              topSellingCollections.collections.length &&
              topCollection && (
                <>
                  <Box
                    css={{
                      flex: 2,
                      position: 'relative',
                      zIndex: 5,
                      '@xl': {
                        flex: 3,
                      },
                    }}
                  >
                    <StyledImage
                      src={topCollection?.banner?.replace('w=500', 'w=4500')}
                      css={{
                        width: '100%',
                        borderRadius: 8,
                        height: 320,
                        '@lg': {
                          height: 540,
                        },
                        objectFit: 'cover',
                      }}
                    />
                    <Box
                      css={{
                        position: 'absolute',
                        left: '$4',
                        '@lg': {
                          top: '$4',
                        },
                        bottom: '$4',
                      }}
                    >
                      <Img
                        alt="collection image"
                        width={100}
                        height={100}
                        style={{
                          display: 'block',
                          borderRadius: 8,
                          border: '2px solid rgba(255,255,255,0.6)',
                        }}
                        src={topCollection?.image}
                      />
                    </Box>
                  </Box>
                  <Box css={{ flex: 2, zIndex: 4 }}>
                    <Flex direction="column" css={{ height: '100%' }}>
                      <Box css={{ flex: 1 }}>
                        <Text style="h3" css={{ mt: '$3', mb: '$2' }} as="h3">
                          {topCollection.name}
                        </Text>

                        <Text
                          style="body1"
                          as="p"
                          css={{
                            maxWidth: 720,
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          <ReactMarkdown
                            children={topCollection?.description || ''}
                          />
                        </Text>

                        <Flex css={{ mt: '$4' }}>
                          <Box css={{ mr: '$5' }}>
                            <Text style="subtitle2" color="subtle">
                              FLOOR
                            </Text>
                            <FormatCryptoCurrency
                              css={{ mt: '$1' }}
                              amount={
                                topCollection?.floorAsk?.price?.amount
                                  ?.native ?? 0
                              }
                              textStyle={'h4'}
                              logoHeight={24}
                              address={
                                topCollection?.floorAsk?.price?.currency
                                  ?.contract
                              }
                            />
                          </Box>

                          <Box css={{ mr: '$4' }}>
                            <Text style="subtitle2" color="subtle">
                              24H SALES
                            </Text>
                            <Text style="h4" as="h4" css={{ mt: 2 }}>
                              {topCollection.count?.toLocaleString()}
                            </Text>
                          </Box>
                        </Flex>
                        <Box
                          css={{
                            display: 'none',
                            '@lg': {
                              display: 'block',
                            },
                          }}
                        >
                          <Text
                            style="subtitle2"
                            color="subtle"
                            as="p"
                            css={{ mt: '$4' }}
                          >
                            RECENT SALES
                          </Text>
                          <Flex
                            css={{
                              mt: '$2',
                              gap: '$3',
                            }}
                          >
                            {topCollection?.recentSales
                              ?.slice(0, 3)
                              ?.map((sale) => (
                                <Box css={{ flex: 1, aspectRatio: '1/1' }}>
                                  <img
                                    style={{ borderRadius: 4 }}
                                    src={
                                      sale?.token?.image || topCollection.image
                                    }
                                  />
                                </Box>
                              ))}
                            <Box css={{ flex: 1 }} />
                            <Box css={{ flex: 1 }} />
                          </Flex>
                        </Box>
                      </Box>
                      <Flex css={{ gap: '$4', mt: '$5' }}>
                        <Button size="large" css={{ background: 'black' }}>
                          Collect for{' '}
                          <FormatCryptoCurrency
                            amount={
                              topCollection?.floorAsk?.price?.amount?.native
                            }
                            textStyle={'h6'}
                            logoHeight={16}
                            css={{ color: 'white' }}
                            address={
                              topCollection?.floorAsk?.price?.currency?.contract
                            }
                          />
                        </Button>
                        <Button color="gray4" size="large">
                          Explore Collecion
                        </Button>
                      </Flex>
                    </Flex>
                  </Box>
                </>
              )}
          </Flex>
        </Flex>
        <Text style="h4" as="h4" css={{ mb: '$4' }}>
          Trending Collections
        </Text>
        <Box
          css={{
            mb: '$6',
            display: 'grid',
            gap: '$4',
            gridTemplateColumns: 'repeat(1, 1fr)',
            '@sm': {
              gridTemplateColumns: 'repeat(2, 1fr)',
            },

            '@lg': {
              gridTemplateColumns: 'repeat(4, 1fr)',
            },
          }}
        >
          {topSellingCollections?.collections &&
            topSellingCollections.collections.length &&
            topSellingCollections.collections.slice(1, 5).map((collection) => {
              return (
                <Box
                  css={{
                    borderRadius: 12,

                    background: '$neutralBgSubtle',
                    $$shadowColor: '$colors$panelShadow',
                    boxShadow: '0 0px 12px 0px $$shadowColor',

                    overflow: 'hidden',
                    position: 'relative',
                    p: '$3',
                  }}
                >
                  <Box css={{ zIndex: 2, position: 'relative' }}>
                    <Box css={{ position: 'relative' }}>
                      {collection?.banner?.length ||
                      collection.recentSales?.[0].token?.image?.length ? (
                        <img
                          src={
                            collection?.banner?.replace('w=500', 'w=1200') ??
                            collection.recentSales?.[0].token?.image
                          }
                          style={{
                            width: '100%',
                            borderRadius: 8,
                            height: 250,
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Box
                          css={{
                            width: '100%',
                            borderRadius: 8,
                            height: 250,
                            background: '$gray3',
                          }}
                        />
                      )}
                      <Img
                        src={collection?.image}
                        width={72}
                        height={72}
                        css={{
                          width: 72,
                          height: 72,
                          border: '2px solid rgba(255,255,255,0.6)',
                          position: 'absolute',
                          bottom: '$3',
                          left: '$3',
                          borderRadius: 8,
                        }}
                      />
                    </Box>
                    <Flex css={{ my: '$4' }} justify="between" align="center">
                      <Text
                        style="h5"
                        as="h5"
                        ellipsify
                        css={{ flex: 1, mr: '$3' }}
                      >
                        {collection?.name}
                      </Text>

                      <Flex css={{ gap: '$3' }} align="center">
                        <Text style="subtitle2" color="subtle">
                          24H SALES
                        </Text>
                        <Text style="h5" as="h5">
                          {collection.count?.toLocaleString()}
                        </Text>
                      </Flex>
                    </Flex>
                    <Button css={{ width: '100%', textAlign: 'center' }}>
                      <Flex justify="center" css={{ width: '100%' }}>
                        <Text style="h6" css={{ color: 'white' }}>
                          Collect for{' '}
                          {collection?.floorAsk?.price?.amount?.native} ETH
                        </Text>
                      </Flex>
                    </Button>
                  </Box>
                </Box>
              )
            })}
        </Box>

        <Text style="h4" as="h4" css={{ mb: '$4' }}>
          Trending Mints
        </Text>
        <Box
          css={{
            mb: '$6',
            display: 'grid',
            gap: '$4',
            gridTemplateColumns: 'repeat(1, 1fr)',
            '@sm': {
              gridTemplateColumns: 'repeat(2, 1fr)',
            },

            '@lg': {
              gridTemplateColumns: 'repeat(4, 1fr)',
            },
          }}
        >
          {topSellingMintsData?.collections &&
            topSellingMintsData.collections.length &&
            topSellingMintsData.collections.slice(0, 4).map((collection) => {
              return (
                <Box
                  css={{
                    borderRadius: 12,

                    background: '$neutralBgSubtle',
                    $$shadowColor: '$colors$panelShadow',
                    boxShadow: '0 0px 12px 0px $$shadowColor',

                    overflow: 'hidden',
                    position: 'relative',
                    p: '$3',
                  }}
                >
                  <Box css={{ zIndex: 2, position: 'relative' }}>
                    <Box css={{ position: 'relative' }}>
                      {collection?.banner?.length ||
                      collection.recentSales?.[0].token?.image ? (
                        <img
                          src={
                            collection?.banner?.replace('w=500', 'w=1200') ??
                            collection.recentSales?.[4].token?.image
                          }
                          style={{
                            width: '100%',
                            borderRadius: 8,
                            height: 250,
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Box
                          css={{
                            width: '100%',
                            borderRadius: 8,
                            height: 250,
                            background: '$gray3',
                          }}
                        />
                      )}
                      <Img
                        src={collection?.image}
                        width={72}
                        height={72}
                        css={{
                          width: 72,
                          height: 72,
                          border: '2px solid rgba(255,255,255,0.6)',
                          position: 'absolute',
                          bottom: '$3',
                          left: '$3',
                          borderRadius: 8,
                        }}
                      />
                    </Box>
                    <Flex css={{ my: '$4' }} justify="between" align="center">
                      <Text
                        style="h5"
                        as="h5"
                        ellipsify
                        css={{ flex: 1, mr: '$3' }}
                      >
                        {collection?.name}
                      </Text>

                      <Flex css={{ gap: '$2' }} align="center">
                        <Text style="subtitle2" color="subtle">
                          24H SALES
                        </Text>
                        <Text style="h5" as="h5">
                          {collection.count?.toLocaleString()}
                        </Text>
                      </Flex>
                    </Flex>
                    <Button css={{ width: '100%', textAlign: 'center' }}>
                      <Flex justify="center" css={{ width: '100%' }}>
                        <Text style="h6" css={{ color: 'white' }}>
                          Mint
                        </Text>
                      </Flex>
                    </Button>
                  </Box>
                </Box>
              )
            })}
        </Box>
        <Footer />
      </Box>
    </Layout>
  )
}

type TopSellingCollectionsSchema =
  paths['/collections/top-selling/v1']['get']['responses']['200']['schema']

type ChainTopSellingCollections = Record<string, TopSellingCollectionsSchema>

type CollectionSchema =
  paths['/collections/v5']['get']['responses']['200']['schema']
type ChainCollections = Record<string, CollectionSchema>

export const getStaticProps: GetStaticProps<{
  ssr: {
    topSellingCollections: ChainTopSellingCollections
  }
}> = async () => {
  const now = new Date()
  const timestamp = Math.floor(now.getTime() / 1000)
  const startTime = timestamp - 1440 * 60 // 24hrs ago

  let topSellingCollectionsQuery: paths['/collections/top-selling/v1']['get']['parameters']['query'] =
    {
      startTime: startTime,
      fillType: 'sale',
      limit: 20,
      includeRecentSales: true,
    }

  const promises: ReturnType<typeof fetcher>[] = []
  supportedChains.forEach((chain) => {
    const query = { ...topSellingCollectionsQuery }

    promises.push(
      fetcher(`${chain.reservoirBaseUrl}/collections/top-selling/v1`, query, {
        headers: {
          'x-api-key': chain.apiKey || '',
        },
      })
    )
  })
  const responses = await Promise.allSettled(promises)
  const topSellingCollections: ChainTopSellingCollections = {}
  responses.forEach((response, i) => {
    if (response.status === 'fulfilled') {
      topSellingCollections[supportedChains[i].id] = response.value.data
    }
  })

  return {
    props: { ssr: { topSellingCollections } },
    revalidate: 5,
  }
}

export default IndexPage
