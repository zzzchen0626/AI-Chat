import { ArrowDownOutlined, UserOutlined } from '@ant-design/icons'
import { Bubble } from '@ant-design/x'
import { Button } from 'antd'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Virtuoso } from 'react-virtuoso'

import { useChatStore, useConversationStore } from '@pc/store'

import { allMessageContent } from './content'

import type { MessageContent } from '@pc/types/chat'
import type { GetProp } from 'antd'
import type { VirtuosoHandle } from 'react-virtuoso'

import './bubble.css'
import 'highlight.js/styles/github.css'

const AT_BOTTOM_THRESHOLD = 100

export const ChatBubble = () => {
  const [isAtBottom, setIsAtBottom] = useState(true)
  const virtuosoRef = useRef<VirtuosoHandle | null>(null)
  const { messages } = useChatStore()
  const { selectedId } = useConversationStore()

  const rolesAsObject: GetProp<typeof Bubble.List, 'roles'> = useMemo(
    () => ({
      system: {
        placement: 'start',
        avatar: { icon: <UserOutlined />, style: { background: '#fde3cf' } },
        variant: 'borderless',
        style: {
          maxWidth: '100%',
          marginBottom: 16
        }
      },
      user: {
        placement: 'end',
        avatar: { icon: <UserOutlined />, style: { background: '#87d068' } },
        style: {
          marginBottom: 16
        }
      },
      file: {
        placement: 'end',
        variant: 'borderless',
        style: {
          marginBottom: 16
        }
      },
      image: {
        placement: 'end',
        variant: 'borderless',
        style: {
          marginBottom: 16
        }
      }
    }),
    []
  )

  const chatMessage = selectedId ? messages.get(selectedId) : []

  const scrollToBottom = useCallback(() => {
    const index = (chatMessage?.length ?? 0) - 1

    if (index < 0) {
      return
    }

    virtuosoRef.current?.scrollToIndex({
      index,
      align: 'end',
      behavior: 'smooth'
    })
  }, [chatMessage?.length])

  const renderMessageContent = useCallback((content: MessageContent[]) => {
    if (!content || content.length === 0) {
      return null
    }

    return content.map((item, index) => {
      return (
        <div key={index}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {allMessageContent[item.type as keyof typeof allMessageContent](item as any)}
        </div>
      )
    })
  }, [])

  return (
    <div
      className="chat-bubble-wrapper"
      style={{
        // height: '100%',
        // width: '50vw',
        // overflowY: 'auto' ,// 确保可以滚动但滚动条被CSS隐藏
        paddingBottom: '10%'
      }}>
      {!isAtBottom && (
        <Button
          className="chat-bubble-scroll-bottom"
          shape="circle"
          style={{
            background: '#fff',
            color: '#000',
            borderColor: '#e5e5e5'
          }}
          onClick={scrollToBottom}>
          <ArrowDownOutlined />
        </Button>
      )}

      <Virtuoso
        ref={virtuosoRef}
        className="chat-bubble-list"
        style={{
          height: '100%',
          width: '50vw',
          overflowY: 'auto' // 确保可以滚动但滚动条被CSS隐藏
          // paddingBottom: '25%'
        }}
        data={chatMessage || []}
        atBottomThreshold={AT_BOTTOM_THRESHOLD}
        atBottomStateChange={setIsAtBottom}
        followOutput={(atBottom) => (atBottom ? 'smooth' : false)}
        components={{
          Footer: () => <div style={{ height: 20 }} />
        }}
        itemContent={(_, message) => (
          <Bubble // Bubble 只负责消息样式ui布局
            placement={rolesAsObject[message.role]?.placement}
            avatar={rolesAsObject[message.role]?.avatar}
            variant={rolesAsObject[message.role]?.variant}
            style={rolesAsObject[message.role]?.style}
            content={renderMessageContent(message.content)}
          />
        )}
      />
    </div>
  )
}
