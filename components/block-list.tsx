'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { formatHash, timeAgo, formatNumber } from '@/lib/utils'
import { Blocks } from 'lucide-react'

interface Block {
  number: number
  hash: string
  timestamp: number
  miner: string
  transactions: number
  gasUsed: number
  gasLimit: number
  reward: number
}

export function BlockList() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Live blocks from the Zoo primary network (chain 200200). No mock data.
    const C = 'https://api.zoo.ngo/v1/bc/C/rpc'
    const call = (method: string, params: unknown[]) =>
      fetch(C, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      })
        .then((r) => r.json())
        .then((j) => j.result)
    let alive = true
    const load = async () => {
      try {
        const tip = parseInt(await call('eth_blockNumber', []), 16)
        if (!Number.isFinite(tip)) return
        const nums = Array.from({ length: Math.min(10, tip + 1) }, (_, i) => tip - i)
        const raw = await Promise.all(nums.map((n) => call('eth_getBlockByNumber', ['0x' + n.toString(16), false])))
        if (!alive) return
        setBlocks(
          raw.filter(Boolean).map((b) => ({
            number: parseInt(b.number, 16),
            hash: b.hash,
            timestamp: parseInt(b.timestamp, 16) * 1000,
            miner: b.miner,
            transactions: Array.isArray(b.transactions) ? b.transactions.length : 0,
            gasUsed: parseInt(b.gasUsed, 16),
            gasLimit: parseInt(b.gasLimit, 16),
            reward: 0,
          })),
        )
        setLoading(false)
      } catch {
        if (alive) setLoading(false)
      }
    }
    load()
    // Poll for new tips. The chain can be quiet — the list simply won't change
    // when no block is produced, which is the honest state.
    const interval = setInterval(load, 12000)
    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading blocks...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Blocks className="h-5 w-5" />
          Latest Blocks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {blocks.map((block) => (
            <div
              key={block.number}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                  <Blocks className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/block/${block.number}`}
                      className="font-medium hover:text-primary"
                    >
                      Block #{block.number}
                    </Link>
                    <Badge variant="secondary" className="text-xs">
                      {timeAgo(block.timestamp)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Hash: {formatHash(block.hash)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Validator: <Link href={`/address/${block.miner}`} className="hover:text-primary">
                      {formatHash(block.miner, 8)}
                    </Link>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{block.transactions} txns</div>
                <div className="text-sm text-muted-foreground">
                  {((block.gasUsed / block.gasLimit) * 100).toFixed(1)}% gas used
                </div>
                <div className="text-sm text-green-600">
                  {block.reward.toFixed(4)} ZOO
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link href="/blocks" className="text-primary hover:underline">
            View all blocks →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}