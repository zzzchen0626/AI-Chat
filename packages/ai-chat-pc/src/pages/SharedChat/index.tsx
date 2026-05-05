import { HomeOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons'
import { Bubble } from '@ant-design/x'
import { Button, Result, Spin } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { sessionApi } from '@pc/apis/session'
import { renderMessageContent } from '@pc/utils'

import type { MessageProps } from '@pc/store/useChatStore'
import type { ChatSession } from '@pc/types/session'
import type { GetProp } from 'antd'

function SharedChat() {
  const { shareId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conversation, setConversation] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<MessageProps[]>([])

  useEffect(() => {
    const fetchSharedChat = async () => {
      if (!shareId) {
        setError('无效的分享链接')
        setLoading(false)
        return
      }

      try {
        const { data } = await sessionApi.getSharedChat(shareId)
        setConversation(data.conversation)
        setMessages(
          data.messages.map((msg) => ({
            content: [{ type: 'text', content: msg.content }],
            role: msg.role
          }))
        )
      } catch (err) {
        console.error(err)
        setError('获取分享会话失败')
      } finally {
        setLoading(false)
      }
    }

    fetchSharedChat()
  }, [shareId])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (error || !conversation) {
    return (
      <Result
        status="404"
        title="404"
        subTitle={error || '找不到分享的会话'}
        extra={
          <Link to="/">
            <Button type="primary" icon={<HomeOutlined />}>
              返回首页
            </Button>
          </Link>
        }
      />
    )
  }

  const rolesAsObject: GetProp<typeof Bubble.List, 'roles'> = {
    ai: {
      placement: 'start',
      avatar: { icon: <UserOutlined />, style: { background: '#fde3cf' } },
      style: {
        maxWidth: 600
      }
    },
    user: {
      placement: 'end',
      avatar: { icon: <UserOutlined />, style: { background: '#87d068' } }
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{conversation.title}</h1>
          <div className="flex space-x-2">
            <Link to="/">
              <Button icon={<HomeOutlined />}>返回首页</Button>
            </Link>
            <Link to="/conversation">
              <Button type="primary" icon={<MessageOutlined />}>
                开始新对话
              </Button>
            </Link>
          </div>
        </div>

        <div className="border-t pt-4">
          <Bubble.List
            className="chat-bubble-list"
            style={{
              width: '100%',
              overflowY: 'auto',
              paddingInline: 16
            }}
            roles={rolesAsObject}
            items={messages.map((message, index) => {
              const isAI = message.role === 'system'

              return {
                key: index,
                role: isAI ? 'ai' : 'user',
                content: renderMessageContent(message.content)
              }
            })}
          />
        </div>

        <div className="mt-6 text-center text-gray-500">
          <p>这是一个分享的会话，你无法在此回复</p>
        </div>
      </div>
    </div>
  )
}

export default SharedChat
