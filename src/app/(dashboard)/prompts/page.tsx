"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

function PromptsManagerPageContent() {
  const params = useSearchParams()
  const initialType = params.get('type') || 'extract'
  const initialId = params.get('id') || ''
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState(initialType)
  const [list, setList] = useState<any[]>([])
  const [editId, setEditId] = useState(initialId)
  const [editName, setEditName] = useState('')
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    const fetchList = async () => {
      const res = await fetch(`/api/prompts?type=${type}&keyword=${encodeURIComponent(keyword)}`)
      const data = await res.json()
      if (data.success) {
        setList(data.data || [])
        const cur = (data.data || []).find((x: any) => x.id === editId) || (data.data || [])[0] || null
        if (cur) {
          setEditId(cur.id)
          setEditName(cur.name)
          setEditContent(cur.content)
        }
      }
    }
    fetchList()
  }, [type, keyword])

  const save = async () => {
    if (!editId) return
    await fetch(`/api/prompts/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName, content: editContent }) })
    const res = await fetch(`/api/prompts?type=${type}&keyword=${encodeURIComponent(keyword)}`)
    const data = await res.json()
    if (data.success) setList(data.data || [])
  }

  const setActive = async () => {
    await fetch('/api/prompts/active', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword, extractId: type === 'extract' ? editId : undefined, aggregateId: type === 'aggregate' ? editId : undefined, briefId: type === 'brief' ? editId : undefined }) })
    alert('已设为当前')
  }

  return (
    <div className="page-container space-y-6 py-6">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>提示词管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="extract">素材抽取</SelectItem>
                <SelectItem value="aggregate">聚合诊断</SelectItem>
                <SelectItem value="brief">写作提纲</SelectItem>
              </SelectContent>
            </Select>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="关键词（可留空，显示全局模板）" className="h-10 rounded-lg border border-input bg-background px-3 text-sm flex-1 min-w-[240px]" />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>模板列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {list.map((p) => (
                <div key={p.id} className={`p-3 border rounded-lg flex items-center justify-between ${editId === p.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="text-sm">
                    <div className="font-medium">{p.name} <Badge variant="outline">{p.version}</Badge></div>
                    <div className="text-muted-foreground line-clamp-2">{p.content}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditId(p.id); setEditName(p.name); setEditContent(p.content) }}>编辑</Button>
                    <Button size="sm" variant="outline" onClick={async () => { await fetch(`/api/prompts/${p.id}`, { method: 'DELETE' }); const res = await fetch(`/api/prompts?type=${type}&keyword=${encodeURIComponent(keyword)}`); const data = await res.json(); if (data.success) setList(data.data || []) }}>删除</Button>
                    <Button size="sm" variant="outline" onClick={async () => { await fetch('/api/prompts/active', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword, extractId: type === 'extract' ? p.id : undefined, aggregateId: type === 'aggregate' ? p.id : undefined, briefId: type === 'brief' ? p.id : undefined }) }); }}>设为当前</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>编辑模板</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <input className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" value={editName} onChange={(e) => setEditName(e.target.value)} />
              <textarea className="w-full min-h-[300px] rounded-lg border border-input bg-background px-3 py-2 text-sm" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={setActive}>设为当前</Button>
              <Button onClick={save}>保存</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PromptsManagerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">加载中...</div>}>
      <PromptsManagerPageContent />
    </Suspense>
  )
}

