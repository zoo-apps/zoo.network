'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Blocks, Users, Globe } from 'lucide-react'
import { BlockList } from '@/components/block-list'
import { TransactionList } from '@/components/transaction-list'
import { SearchBar } from '@/components/search-bar'

export default function HomePage() {
  const [networkStats, setNetworkStats] = useState({
    blockHeight: 0,
    gasGwei: 0,
    chainId: 0,
    validators: 0,
    loading: true,
  })

  useEffect(() => {
    // Live from the Zoo primary network (chain 200200) — no simulated values.
    // Only figures a single node can answer are shown; totals that need an
    // indexer live on the dedicated explorer, not faked here.
    const C = 'https://api.zoo.ngo/v1/bc/C/rpc'
    const P = 'https://api.zoo.ngo/v1/bc/P'
    const call = (url: string, method: string, params: unknown = []) =>
      fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      })
        .then((r) => r.json())
        .then((j) => j.result)
    Promise.all([
      call(C, 'eth_blockNumber'),
      call(C, 'eth_gasPrice'),
      call(C, 'eth_chainId'),
      call(P, 'platform.getCurrentValidators', {}),
    ])
      .then(([bn, gp, cid, v]) =>
        setNetworkStats({
          blockHeight: bn ? parseInt(bn, 16) : 0,
          gasGwei: gp ? Math.round(parseInt(gp, 16) / 1e9) : 0,
          chainId: cid ? parseInt(cid, 16) : 0,
          validators: v && v.validators ? v.validators.length : 0,
          loading: false,
        }),
      )
      .catch(() => setNetworkStats((s) => ({ ...s, loading: false })))
  }, [])

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold tracking-tight">Zoo Network Explorer</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Explore blocks, transactions, and accounts on the Zoo Network -
          The decentralized AI blockchain infrastructure
        </p>
        <SearchBar />
      </div>

      {/* Network Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Block Height</CardTitle>
            <Blocks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.loading ? '—' : networkStats.blockHeight.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">live C-Chain tip</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chain ID</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.loading ? '—' : networkStats.chainId.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Zoo primary network</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Price</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.loading ? '—' : `${networkStats.gasGwei} Gwei`}</div>
            <p className="text-xs text-muted-foreground">current base fee</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.loading ? '—' : networkStats.validators.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">securing the primary network</p>
          </CardContent>
        </Card>
      </div>


      {/* Latest Blocks and Transactions */}
      <Tabs defaultValue="blocks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="blocks">Latest Blocks</TabsTrigger>
          <TabsTrigger value="transactions">Latest Transactions</TabsTrigger>
          <TabsTrigger value="validators">Validators</TabsTrigger>
        </TabsList>
        <TabsContent value="blocks" className="space-y-4">
          <BlockList />
        </TabsContent>
        <TabsContent value="transactions" className="space-y-4">
          <TransactionList />
        </TabsContent>
        <TabsContent value="validators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Validators</CardTitle>
              <CardDescription>
                {networkStats.validators} validators securing the network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">Validator list coming soon...</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}