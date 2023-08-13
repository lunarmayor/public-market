import { GetStaticProps, InferGetStaticPropsType, NextPage } from 'next'
import {
  Text,
  Flex,
  Box,
  Select,
  ToggleGroup,
  ToggleGroupItem,
} from 'components/primitives'
import Layout from 'components/Layout'
import {
  ComponentPropsWithoutRef,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useMediaQuery } from 'react-responsive'
import { useMarketplaceChain, useMounted } from 'hooks'
import { paths } from '@reservoir0x/reservoir-sdk'
import { useCollections } from '@reservoir0x/reservoir-kit-ui'
import { NORMALIZE_ROYALTIES } from '../_app'
import supportedChains from 'utils/chains'
import { CollectionRankingsTable } from 'components/rankings/CollectionRankingsTable'
import { useIntersectionObserver } from 'usehooks-ts'
import LoadingSpinner from 'components/common/LoadingSpinner'
import CollectionsTimeDropdown, {
  CollectionsSortingOption,
} from 'components/common/CollectionsTimeDropdown'
import ChainToggle from 'components/common/ChainToggle'
import { Head } from 'components/Head'
import { ChainContext } from 'context/ChainContextProvider'
import { useRouter } from 'next/router'

import useSWR from 'swr'
import { start } from 'repl'
import { setHttpClientAndAgentOptions } from 'next/dist/server/config'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBoltLightning } from '@fortawesome/free-solid-svg-icons'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

function objectToQueryParams(obj) {
  const queryParams = []

  for (const key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] !== null) {
      const value = encodeURIComponent(obj[key])
      queryParams.push(`${encodeURIComponent(key)}=${value}`)
    }
  }

  return queryParams.join('&')
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const useTrendingCollections = ({ type, startTime }: any) => {
  const queryParams = objectToQueryParams({
    fillType: type,
    startTime: startTime || 1686167875,
    limit: 10,
  })

  const { data, error, isLoading } = useSWR(
    'http://localhost:3000/collections/top-selling/v1?' + queryParams,
    fetcher
  )

  return {
    data: data?.collections || [],
  }
}

const timeOptions = [
  { key: '5m', minsAgo: 5 },
  { key: '10m', minsAgo: 10 },
  { key: '30m', minsAgo: 30 },
  { key: '1hr', minsAgo: 60 },
  {
    key: '3hr',
    minsAgo: 60 * 3,
  },
  {
    key: '6hr',
    minsAgo: 60 * 6,
  },
  {
    key: '24hr',
    minsAgo: 60 * 24,
  },
  {
    key: '1w',
    minsAgo: 60 * 24 * 7,
  },
]

const IndexPage: NextPage<any> = ({ ssr }) => {
  const router = useRouter()
  const [startTime, setStartTime] = useState(
    Math.floor((Date.now() - 10 * 60 * 1000) / 1000)
  )

  const [timeRange, setTimeRange] = useState(timeOptions[0].key)
  const [type, setType] = useState('mint')

  const { data } = useTrendingCollections({
    type,
    startTime: startTime,
  })
  console.log(sata)

  useEffect(() => {
    let option = timeOptions.find((t) => t.key == timeRange)
    setStartTime(Math.floor((Date.now() - option?.minsAgo * 60 * 1000) / 1000))
  }, [timeRange])

  return (
    <Layout>
      <Head />
      <Box css={{ p: '$5' }}>
        <Flex css={{ mb: '$4', gap: '$4' }} align="center">
          <FontAwesomeIcon icon={faBoltLightning} size="2x"></FontAwesomeIcon>
          <Text style="h3" as="h3">
            Trending Collections
          </Text>
        </Flex>

        <Flex css={{ mb: '$5' }} justify="between">
          <ToggleGroup type="single" value={type}>
            {['any', 'mint', 'sale'].map((option) => (
              <ToggleGroupItem
                value={option}
                onClick={() => {
                  setType(option)
                }}
              >
                {option}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ToggleGroup type="single" value={timeRange}>
            {timeOptions.map((option) => (
              <ToggleGroupItem
                onClick={() => {
                  setTimeRange(option.key)
                }}
                value={option.key}
              >
                {option.key}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Flex>

        {data.map((collection, i) => (
          <Flex css={{ mb: '$5', gap: '$4' }}>
            <Text style="h4" css={{ opacity: 0.7, width: 40 }}>
              {i + 1}
            </Text>
            <Box css={{ flex: 1 }}>
              <Flex justify="between" css={{ flex: 1 }}>
                <Flex css={{ gap: '$4' }} align="center">
                  {collection.image ? (
                    <img
                      src={collection.image}
                      style={{ width: 60, height: 60, borderRadius: 8 }}
                    />
                  ) : (
                    <Box
                      css={{
                        width: 60,
                        height: 60,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.1)',
                      }}
                    />
                  )}
                  <Box>
                    <Text style="h5">{collection.name}</Text>
                    <Text style="body1" as="p">
                      <span style={{ fontWeight: 600 }}>
                        {collection.count.toLocaleString()}
                      </span>{' '}
                      {type == 'mint' ? 'mints' : 'sales'}
                    </Text>
                  </Box>
                </Flex>
              </Flex>
              <Flex css={{ gap: '$4', mt: '$4' }}>
                {(collection?.recentSales || []).map((item) => (
                  <Box css={{ width: 180 }}>
                    {item.tokenImage || collection.image ? (
                      <img
                        src={item.tokenImage || collection.image}
                        style={{ width: 180, height: 180, borderRadius: 8 }}
                      />
                    ) : (
                      <Box
                        css={{
                          width: 180,
                          height: 180,
                          borderRadius: 8,
                          background: 'rgba(255,255,255,0.1)',
                        }}
                      />
                    )}
                    <Box css={{ width: '100%' }}>
                      <Text
                        style="body1"
                        as="p"
                        ellipsify
                        css={{ marginTop: '$3', maxWidth: '100%' }}
                      >
                        {item.tokenName || '#' + item.tokenId}
                      </Text>
                    </Box>
                    <Text color="subtle" style="body2">
                      {dayjs.unix(item.timestamp).fromNow()}
                    </Text>
                  </Box>
                ))}
              </Flex>
              <hr
                style={{
                  marginTop: 24,
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            </Box>
          </Flex>
        ))}
      </Box>
    </Layout>
  )
}
export default IndexPage
