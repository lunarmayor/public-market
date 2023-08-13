const useReatimeActivity = ({ types, sources }) => {
  const marketplaceChain = useMarketplaceChain()
  const [activity, setActivity] = useState<any>([])
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(false) // New loading state

  const { data } = useSearchActivities({
    types: types as any,
    limit: 20,
    sources: sources,
    sortBy: 'timestamp',
  })

  const { sendMessage, lastMessage, readyState } = useWebSocket(
    `${marketplaceChain?.wsBaseUrl}?api_key=15e44d1b-0636-5fdc-879b-515700ca5027`,
    {},
    !!marketplaceChain?.wsBaseUrl
  )

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      sendMessage(
        JSON.stringify({
          type: 'subscribe',
          event: 'sale.created',
        })
      )

      return () => {
        sendMessage(
          JSON.stringify({
            type: 'unsubscribe',
            event: 'sale.created',
          })
        )
      }
    }
  }, [readyState === ReadyState.OPEN])

  useEffect(() => {
    setActivity([])
  }, [sources, types, marketplaceChain.routePrefix])

  useEffect(() => {
    if (
      lastMessage &&
      lastMessage.data &&
      typeof lastMessage.data === 'string'
    ) {
      let data = JSON.parse(lastMessage.data)

      if (
        data.event === 'sale.created' &&
        !!data.data &&
        data.data.orderKind !== 'mint'
      ) {
        // @ts-ignore
        setQueue((prevQueue) => [
          convertObject(data.data, data.data.orderKind),
          ...prevQueue,
        ])
      }
    }
  }, [lastMessage])

  const fetchMetaData = useCallback(async () => {
    if (queue.length > 0 && !loading) {
      // Check if loading is false before starting fetch
      setLoading(true) // Set loading to true before fetch starts

      let result = await fetch(
        `${marketplaceChain.reservoirBaseUrl}/tokens/v6?${queue
          .map((sale) => {
            return `tokens=${sale.contract}:${sale.token.id}`
          })
          .join('&')}`
      ).then((res) => res.json())

      const { tokens } = result

      let salesData = queue.map((sale) => {
        const token = tokens.find((token) => {
          return (
            token.token.tokenId === sale.token.id &&
            token.token.contract == sale.contract
          )
        })

        return {
          ...sale,
          token: {
            ...sale.token,
            id: token?.token?.tokenId,
            name: token?.token?.name,
            image: token?.token?.image,
          },
        }
      })
      setActivity((prevActivity) => [...salesData, ...prevActivity])
      setQueue([])
      setLoading(false) // Set loading to false after fetch ends
    }
  }, [queue, loading])

  useEffect(() => {
    fetchMetaData()
    const timerId = setInterval(fetchMetaData, 1000)
    return () => clearInterval(timerId)
  }, [fetchMetaData])

  return {
    data: [...activity, ...data],
    socketStatus: readyState,
  }
}
