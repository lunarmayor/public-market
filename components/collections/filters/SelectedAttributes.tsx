import { clearAllAttributes, removeParam } from 'utils/router'
import { useRouter } from 'next/router'
import { FC, useEffect, useState } from 'react'
import { Button, Flex, Text } from 'components/primitives'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClose } from '@fortawesome/free-solid-svg-icons'

type Attribute = {
  key: string
  value: string
}[]

const SelectedAttributes: FC = () => {
  const router = useRouter()

  const [filters, setFilters] = useState<Attribute>([])

  useEffect(() => {
    let filters = [] as Attribute

    // Extract all queries of attribute type
    // and convert into token format
    Object.keys({ ...router.query }).map((key) => {
      if (
        key.startsWith('attributes[') &&
        key.endsWith(']') &&
        router.query[key] !== ''
      ) {
        if (Array.isArray(router.query[key])) {
          let values = router.query[key] as string[]
          values.forEach((value) => {
            filters.push({ key: key.slice(11, -1), value: value })
          })
        } else {
          filters.push({
            key: key.slice(11, -1),
            value: router.query[key] as string,
          })
        }
      }
    })

    setFilters(filters)
  }, [router.query])

  if (filters.length === 0) return null

  return (
    <Flex wrap="wrap" align="center">
      {filters.map(({ key, value }) => (
        <Button
          key={key + value}
          onClick={() => {
            removeParam(router, `attributes[${key}]`, value)
          }}
          color="gray3"
          css={{ mr: '$3', mb: '24px' }}
          size="small"
        >
          <Text style="body1" css={{ color: '$gray12' }}>
            {key}:
          </Text>
          <Text style="subtitle1">{value}</Text>
          <Text css={{ color: '$gray9' }}>
            <FontAwesomeIcon icon={faClose} width="16" height="16" />
          </Text>
        </Button>
      ))}

      {filters.length > 1 && (
        <Button
          onClick={() => {
            clearAllAttributes(router)
          }}
          color="ghost"
          css={{
            color: '$primary11',
            fontWeight: 500,
            mb: '24px',
            px: '$4',
          }}
        >
          Clear all
        </Button>
      )}

      {filters.length && (
        <Button
          onClick={() => {}}
          color="ghost"
          css={{ color: '$primary11', fontWeight: 500, mb: '24px', px: '$4' }}
        >
          Bid on {filters.length} {filters.length > 1 ? 'Traits' : 'Trait'}
        </Button>
      )}
    </Flex>
  )
}

export default SelectedAttributes
