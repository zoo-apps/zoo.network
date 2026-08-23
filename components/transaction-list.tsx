'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { formatHash, timeAgo, formatAddress } from '@/lib/utils'
import { Activity, ArrowRight, Check, X } from 'lucide-react'

interface Transaction {
  hash: string
  from: string
  to: string
  value: number
  gas: number
  gasPrice: number
  timestamp: number
  status: 'success' | 'failed' | 'pending'
  method?: string
  blockNumber: number
}

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Live transactions from the Zoo primary network (chain 200200), pulled from
    // the most recent blocks. No mock data — a quiet chain simply shows few or none.
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
        const nums = Array.from({ length: Math.min(15, tip + 1) }, (_, i) => tip - i)
        const blocks = await Promise.all(nums.map((n) => call('eth_getBlockByNumber', ['0x' + n.toString(16), true])))
        if (!alive) return
        const txs: Transaction[] = []
        for (const b of blocks.filter(Boolean)) {
          const ts = parseInt(b.timestamp, 16) * 1000
          for (const t of b.transactions || []) {
            txs.push({
              hash: t.hash,
              from: t.from,
              to: t.to || '',
              value: parseInt(t.value, 16) / 1e18,
              gas: parseInt(t.gas, 16),
              gasPrice: t.gasPrice ? parseInt(t.gasPrice, 16) / 1e9 : 0,
              timestamp: ts,
              status: 'success',
              method: t.input && t.input !== '0x' ? 'Contract call' : 'Transfer',
              blockNumber: parseInt(t.blockNumber, 16),
            })
            if (txs.length >= 10) break
          }
          if (txs.length >= 10) break
        }
        setTransactions(txs)
        setLoading(false)
      } catch {
        if (alive) setLoading(false)
      }
    }
    load()
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
          <div className="text-center text-muted-foreground">Loading transactions...</div>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />
      case 'failed':
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-yellow-600 animate-pulse" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default' as const
      case 'failed':
        return 'destructive' as const
      default:
        return 'secondary' as const
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Latest Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.hash}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  {getStatusIcon(tx.status)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/tx/${tx.hash}`}
                      className="font-medium hover:text-primary"
                    >
                      {formatHash(tx.hash, 10)}
                    </Link>
                    <Badge variant={getStatusVariant(tx.status)} className="text-xs">
                      {tx.status}
                    </Badge>
                    {tx.method && (
                      <Badge variant="outline" className="text-xs">
                        {tx.method}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Link href={`/address/${tx.from}`} className="hover:text-primary">
                      {formatAddress(tx.from)}
                    </Link>
                    <ArrowRight className="h-3 w-3" />
                    <Link href={`/address/${tx.to}`} className="hover:text-primary">
                      {formatAddress(tx.to)}
                    </Link>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{tx.value.toFixed(4)} ZOO</div>
                <div className="text-sm text-muted-foreground">
                  {timeAgo(tx.timestamp)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Block #{tx.blockNumber}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link href="/transactions" className="text-primary hover:underline">
            View all transactions →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}